
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import Stripe from "https://esm.sh/stripe@14.10.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature")
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or secret", { status: 400 })
  }

  const body = await req.text()
  let event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`Received event: ${event.type}`)

  try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object
          const orderId = paymentIntent.metadata.order_id

          if (orderId) {
            console.log(`Payment succeeded for order ${orderId}`)
            const { error: updateError } = await supabase
              .from("orders")
              .update({ status: "paid" })
              .eq("id", orderId)

            if (updateError) console.error("Error updating order:", updateError)

            const { error: insertError } = await supabase
              .from("payment_attempts")
              .insert({
                order_id: parseInt(orderId),
                payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                status: "succeeded",
              })

            if (insertError) console.error("Error logging attempt:", insertError)
          } else {
              console.warn("No order_id found in metadata")
          }
          break
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object
          const orderId = paymentIntent.metadata.order_id

          if (orderId) {
            console.log(`Payment failed for order ${orderId}`)
             await supabase
              .from("orders")
              .update({ status: "failed" })
              .eq("id", orderId)

            await supabase
              .from("payment_attempts")
              .insert({
                order_id: parseInt(orderId),
                payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                status: "failed",
                error_message: paymentIntent.last_payment_error?.message || "Unknown error",
              })
          }
          break
        }
      }
  } catch (err) {
      console.error("Error processing webhook event:", err)
      return new Response("Internal Server Error", { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
