-- 1. Update Categories
-- Replacing food categories with retail categories as requested.
UPDATE categories SET name = 'Tecnología', emoji = '💻' WHERE name IN ('Hamburguesas', 'American', 'Burgers');
UPDATE categories SET name = 'Hogar', emoji = '🛋️' WHERE name IN ('Pizza', 'Italian');
UPDATE categories SET name = 'Moda', emoji = '👟' WHERE name IN ('Sushi', 'Japanese');
UPDATE categories SET name = 'Juguetes', emoji = '🧸' WHERE name IN ('Asiática', 'Asian', 'Café & Postres', 'Dessert', 'Cafe');

-- 2. Update Marketing Banner
-- "50% OFF en tu primer pedido" with product collage background.
UPDATE marketing_banners
SET
    title = '50% OFF en tu primer pedido',
    image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop',
    subtitle = 'Liquidación Total',
    description = 'Aprovecha descuentos de hasta el 50% en toda la tienda. ¡Solo por tiempo limitado!'
WHERE active = true;

-- If no active banner exists, insert one.
INSERT INTO marketing_banners (image_url, title, subtitle, description, active, display_order)
SELECT 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop', '50% OFF en tu primer pedido', 'Liquidación Total', 'Aprovecha descuentos de hasta el 50% en toda la tienda.', true, 1
WHERE NOT EXISTS (SELECT 1 FROM marketing_banners WHERE active = true);

-- 3. Update Locales Images (Stores)
-- Changing food images to retail storefronts/shelves.

-- Tech Store
UPDATE locales SET
    image_url = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1000&auto=format&fit=crop', -- Electronic store vibe
    cuisine_type = 'Tecnología' -- Updating type to match category
WHERE id = 1 OR cuisine_type IN ('Hamburguesas', 'American', 'Tecnología');

-- Home Store
UPDATE locales SET
    image_url = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1000&auto=format&fit=crop', -- Home decor store
    cuisine_type = 'Hogar'
WHERE id = 2 OR cuisine_type IN ('Pizza', 'Italian', 'Hogar');

-- Fashion Store
UPDATE locales SET
    image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop', -- Clothing store
    cuisine_type = 'Moda'
WHERE id = 3 OR cuisine_type IN ('Sushi', 'Japanese', 'Moda');

-- Toy/General Store
UPDATE locales SET
    image_url = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop', -- Toys/Gifts
    cuisine_type = 'Juguetes'
WHERE cuisine_type IN ('Asiática', 'Asian', 'Café & Postres', 'Juguetes');
