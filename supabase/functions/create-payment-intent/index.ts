import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is missing');
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

    // Use the Authorization header to get the user context securely
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use Anon key to validate JWT
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }
    const user_id = user.id

    // Re-initialize Supabase with Service Role Key for admin tasks (like creating orders/profiles)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      SUPABASE_SERVICE_ROLE_KEY
    )

    let body;
    try {
        body = await req.json();
    } catch (e) {
        throw new Error('Invalid JSON body');
    }

    const { items } = body;

    if (!items || !items.length) {
      throw new Error('No items provided')
    }

    // 1. Calculate total amount from DB to prevent fraud
    let totalAmount = 0
    const itemIds = items.map((i: any) => i.id)
    const { data: dbItems, error: itemsError } = await supabaseAdmin
      .from('items')
      .select('id, price_euros')
      .in('id', itemIds)

    if (itemsError) throw itemsError

    items.forEach((item: any) => {
      const dbItem = dbItems?.find((i: any) => i.id === item.id)
      if (dbItem) {
        totalAmount += dbItem.price_euros * item.quantity
      }
    })

    const amountInCents = Math.round(totalAmount * 100)

    // 2. Get or Create Stripe Customer
    let customerId: string | null = null;

    // Check if user has a stripe_customer_id in profiles
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user_id)
        .maybeSingle() // Use maybeSingle to avoid error if 0 rows

    if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id
    } else {
        // Create new customer
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id)
        const email = userData.user?.email

        const customer = await stripe.customers.create({
            email: email,
            metadata: { supabase_uid: user_id }
        })
        customerId = customer.id

        // Update or Insert profile (upsert) to handle missing rows
        const { error: upsertError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: user_id, stripe_customer_id: customerId })

        if (upsertError) {
             console.error('Error updating profile with stripe_customer_id:', upsertError);
             // Proceed anyway, payment can still happen, but next time we might create a new customer
        }
    }

    // 3. Create Order Record
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            user_id: user_id,
            total_amount: totalAmount,
            status: 'pending'
        })
        .select()
        .single()

    if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(`Error creating order: ${orderError.message}`);
    }

    // 4. Create Ephemeral Key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId! },
      { apiVersion: '2023-10-16' }
    )

    // 5. Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: customerId!,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order.id,
      },
    })

    // 6. Update Order with PaymentIntent ID
    await supabaseAdmin
        .from('orders')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', order.id)

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        orderId: order.id,
        amount: totalAmount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('An error occurred:', error); // Log full error to Supabase logs
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
