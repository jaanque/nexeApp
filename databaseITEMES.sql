-- Clean up existing data (optional, but good for a fresh start with new item types)
-- TRUNCATE TABLE items CASCADE;
-- TRUNCATE TABLE categories CASCADE;

-- Update Categories to Non-Food (Generic Retail)
-- Assuming IDs 1-5 exist, or we insert new ones.
-- Best to UPSERT or Update existing to preserve FKs if possible, or just insert new ones.
-- Here we will update existing IDs to avoid breaking FKs if we don't truncate.

UPDATE categories SET name = 'Tecnología', emoji = '📱', color = '#3B82F6' WHERE id = 1;
UPDATE categories SET name = 'Hogar', emoji = '🏠', color = '#10B981' WHERE id = 2;
UPDATE categories SET name = 'Moda', emoji = '👕', color = '#F59E0B' WHERE id = 3;
UPDATE categories SET name = 'Deporte', emoji = '⚽', color = '#EF4444' WHERE id = 4;
UPDATE categories SET name = 'Juguetes', emoji = '🧸', color = '#8B5CF6' WHERE id = 5;

-- Insert if they don't exist (Handling up to 5)
INSERT INTO categories (id, name, emoji, color) VALUES
(1, 'Tecnología', '📱', '#3B82F6'),
(2, 'Hogar', '🏠', '#10B981'),
(3, 'Moda', '👕', '#F59E0B'),
(4, 'Deporte', '⚽', '#EF4444'),
(5, 'Juguetes', '🧸', '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

-- Update Locales (Restaurants) to Generic Stores
UPDATE locales SET name = 'NEXE Tech Store', cuisine_type = 'Tecnología' WHERE id = 1;
UPDATE locales SET name = 'Hogar & Co.', cuisine_type = 'Hogar' WHERE id = 2;
UPDATE locales SET name = 'Moda Urbana', cuisine_type = 'Ropa' WHERE id = 3;

-- Update Items to be Generic Products
-- We update existing items to be relevant to the new categories.

-- Tech Items
UPDATE items SET
    name = 'Auriculares Noise Cancelling',
    description = 'Auriculares inalámbricos con cancelación de ruido activa y 30 horas de batería.',
    category_id = 1,
    image_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    price_euros = 89.99,
    discount_percentage = 15,
    points_needed = 900
WHERE id = 1;

UPDATE items SET
    name = 'Smartwatch Series 5',
    description = 'Reloj inteligente con monitor de ritmo cardíaco y GPS integrado.',
    category_id = 1,
    image_url = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
    price_euros = 199.50,
    discount_percentage = 10,
    points_needed = 2000
WHERE id = 2;

-- Home Items
UPDATE items SET
    name = 'Cafetera Espresso Automática',
    description = 'Cafetera de alta presión para un café perfecto cada mañana.',
    category_id = 2,
    image_url = 'https://images.unsplash.com/photo-1517093157507-62f922757538?q=80&w=1000&auto=format&fit=crop',
    price_euros = 120.00,
    discount_percentage = 20,
    points_needed = 1200
WHERE id = 3;

UPDATE items SET
    name = 'Lámpara de Escritorio LED',
    description = 'Lámpara moderna con carga inalámbrica para móvil integrada.',
    category_id = 2,
    image_url = 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1000&auto=format&fit=crop',
    price_euros = 35.00,
    discount_percentage = 0,
    points_needed = 350
WHERE id = 4;

-- Fashion Items
UPDATE items SET
    name = 'Mochila Urbana Impermeable',
    description = 'Mochila resistente al agua con compartimento para portátil de 15 pulgadas.',
    category_id = 3,
    image_url = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
    price_euros = 45.99,
    discount_percentage = 5,
    points_needed = 460
WHERE id = 5;

UPDATE items SET
    name = 'Zapatillas Running Pro',
    description = 'Zapatillas ligeras con amortiguación extra para maratones.',
    category_id = 4,
    image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    price_euros = 75.00,
    discount_percentage = 25,
    points_needed = 750
WHERE id = 6;

-- Ensure all items have a valid locale (store)
UPDATE items SET restaurant_id = 1 WHERE restaurant_id IS NULL;

-- Create more dummy items if needed
INSERT INTO items (restaurant_id, category_id, name, description, price_euros, discount_percentage, points_needed, image_url)
VALUES
(1, 1, 'Trípode de Carbono', 'Trípode ligero y resistente para fotografía profesional.', 110.40, 8, 1100, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop'),
(2, 2, 'Hervidor de Agua Retro', 'Hervidor eléctrico con diseño vintage y apagado automático.', 35.00, 0, 350, 'https://images.unsplash.com/photo-1517093157507-62f922757538?q=80&w=1000&auto=format&fit=crop'),
(3, 5, 'Set de Construcción Bloques', 'Juego de 500 piezas para construir ciudades imaginarias.', 29.99, 10, 300, 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=1000&auto=format&fit=crop')
ON CONFLICT DO NOTHING;
