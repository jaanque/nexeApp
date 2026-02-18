-- Add price_euros column to menu_items table
ALTER TABLE menu_items
ADD COLUMN price_euros DECIMAL(10, 2);
