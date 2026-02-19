-- Add description column to marketing_banners table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_banners' AND column_name = 'description') THEN
        ALTER TABLE marketing_banners ADD COLUMN description TEXT;
    END IF;
END $$;

-- Update existing banners with generic description
UPDATE marketing_banners
SET description = 'Descubre las mejores ofertas de la semana en nuestra selección de productos destacados. ¡No te lo pierdas!'
WHERE description IS NULL OR description = '';

-- Example insert if table is empty (optional, just for reference)
-- INSERT INTO marketing_banners (image_url, title, subtitle, description, active, display_order)
-- VALUES ('https://example.com/banner.jpg', 'Gran Venta', 'Liquidación', 'Aprovecha descuentos de hasta el 50% en toda la tienda.', true, 1);
