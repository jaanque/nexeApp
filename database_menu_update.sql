-- Modify Menu Items Table
-- Add category_id column to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS category_id BIGINT;

-- Add Foreign Key Constraint for menu_items
ALTER TABLE menu_items
ADD CONSTRAINT fk_menu_item_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE SET NULL;

-- Optional: Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- Migration Note:
-- This assumes the 'categories' table already exists.
-- You might want to update existing menu items based on string category or other logic if applicable.
