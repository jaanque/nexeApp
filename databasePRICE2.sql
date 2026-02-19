-- Ensure price_euros has 2 decimal precision
ALTER TABLE items
ALTER COLUMN price_euros TYPE DECIMAL(10, 2);
