-- Add color column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;

-- Update existing categories with specific colors
UPDATE categories SET color = '#FF3B30' WHERE name = 'Hamburguesas';
UPDATE categories SET color = '#FF9500' WHERE name = 'Pizza';
UPDATE categories SET color = '#FF2D55' WHERE name = 'Sushi';
UPDATE categories SET color = '#AF52DE' WHERE name = 'Asiática';
UPDATE categories SET color = '#FFCC00' WHERE name = 'Mexicana';
UPDATE categories SET color = '#5856D6' WHERE name = 'Café & Postres';
UPDATE categories SET color = '#34C759' WHERE name = 'Saludable';
UPDATE categories SET color = '#007AFF' WHERE name = 'Bebidas';

-- Note: New categories without a specified color will have NULL color,
-- which the application should handle by falling back to the color generator.
