-- Create marketing_banners table
CREATE TABLE IF NOT EXISTS public.marketing_banners (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    deep_link TEXT,
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.marketing_banners ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users
CREATE POLICY "Allow public read access on marketing_banners" ON public.marketing_banners
FOR SELECT USING (true);

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES public.restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users
CREATE POLICY "Allow public read access on promotions" ON public.promotions
FOR SELECT USING (true);

-- Insert sample data for marketing_banners
INSERT INTO public.marketing_banners (image_url, title, subtitle, deep_link, active, display_order)
VALUES
    ('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop', 'Descuento de Bienvenida', '50% OFF en tu primer pedido', '/restaurant/1', TRUE, 1),
    ('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop', 'Pizza Night', '2x1 en todas las pizzas', '/category/2', TRUE, 2),
    ('https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1000&auto=format&fit=crop', 'Sabor Fresco', 'Descubre nuestras ensaladas', '/category/3', TRUE, 3);
