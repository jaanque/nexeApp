-- Rename price column to points_needed in menu_items table
ALTER TABLE menu_items
RENAME COLUMN price TO points_needed;
