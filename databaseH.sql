-- Add operating hours to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS opening_time TIME WITHOUT TIME ZONE DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS closing_time TIME WITHOUT TIME ZONE DEFAULT '22:00:00';

-- Set default hours for existing records to ensure functionality
UPDATE restaurants
SET opening_time = '09:00:00',
    closing_time = '22:00:00'
WHERE opening_time IS NULL;

-- Example query to check if a restaurant is open:
-- SELECT *,
--   (CURRENT_TIME BETWEEN opening_time AND closing_time) as is_open
-- FROM restaurants WHERE id = 1;
