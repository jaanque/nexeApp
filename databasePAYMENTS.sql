
-- Create Stripe Customer ID in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create Orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- pending, paid, failed
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_payment_intent_id TEXT
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own orders
CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create Payment Attempts table to log all attempts
CREATE TABLE IF NOT EXISTS payment_attempts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    payment_intent_id TEXT,
    amount DECIMAL(10, 2),
    status TEXT, -- succeeded, requires_payment_method, canceled, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- Enable RLS on payment_attempts
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own payment attempts (via order relation)
CREATE POLICY "Users can view their own payment attempts" ON payment_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payment_attempts.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Policy for service_role (Edge Functions) to manage everything
-- (Implicitly allowed, but good to be aware)
