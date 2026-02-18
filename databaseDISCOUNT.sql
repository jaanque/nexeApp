-- Add discount_percentage column to menu_items table
ALTER TABLE menu_items
ADD COLUMN discount_percentage INTEGER DEFAULT 0;
