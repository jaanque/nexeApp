-- Drop the points_needed column from items table as it is no longer used.
-- Points are now calculated dynamically from price_euros (x10).

ALTER TABLE items DROP COLUMN points_needed;
