-- Update Categories to Generic Items
UPDATE categories SET name = 'Tecnología', emoji = '📱' WHERE name IN ('Hamburguesas', 'American', 'Burgers');
UPDATE categories SET name = 'Hogar', emoji = '🏠' WHERE name IN ('Pizza', 'Italian');
UPDATE categories SET name = 'Moda', emoji = '👗' WHERE name IN ('Sushi', 'Japanese');
UPDATE categories SET name = 'Deporte', emoji = '⚽' WHERE name IN ('Asiática', 'Asian');
UPDATE categories SET name = 'Belleza', emoji = '💄' WHERE name IN ('Mexicana', 'Mexican');
UPDATE categories SET name = 'Juguetes', emoji = '🧸' WHERE name IN ('Café & Postres', 'Dessert', 'Cafe');
UPDATE categories SET name = 'Libros', emoji = '📚' WHERE name IN ('Saludable', 'Healthy', 'Salads');
UPDATE categories SET name = 'Otros', emoji = '✨' WHERE name IN ('Bebidas', 'Drinks', 'Beverages');

-- Update Locales cuisine_type to match
UPDATE locales SET cuisine_type = 'Tecnología' WHERE cuisine_type IN ('Hamburguesas', 'American', 'Burgers');
UPDATE locales SET cuisine_type = 'Hogar' WHERE cuisine_type IN ('Pizza', 'Italian');
UPDATE locales SET cuisine_type = 'Moda' WHERE cuisine_type IN ('Sushi', 'Japanese');
UPDATE locales SET cuisine_type = 'Deporte' WHERE cuisine_type IN ('Asiática', 'Asian');
UPDATE locales SET cuisine_type = 'Belleza' WHERE cuisine_type IN ('Mexicana', 'Mexican');
UPDATE locales SET cuisine_type = 'Juguetes' WHERE cuisine_type IN ('Café & Postres', 'Dessert', 'Cafe');
UPDATE locales SET cuisine_type = 'Libros' WHERE cuisine_type IN ('Saludable', 'Healthy', 'Salads');
UPDATE locales SET cuisine_type = 'Otros' WHERE cuisine_type IN ('Bebidas', 'Drinks', 'Beverages');

-- Rename "Recompensa del Día" items if they sound like food (optional, heavily dependent on current data)
-- UPDATE items SET name = 'Smartphone X' WHERE name LIKE '%Burger%';
