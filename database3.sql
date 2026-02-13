-- Add latitude and longitude columns to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);

-- Update existing restaurants with Mexico City coordinates
UPDATE restaurants
SET latitude = 19.432608, longitude = -99.133209
WHERE name = 'Burger King';

UPDATE restaurants
SET latitude = 19.435200, longitude = -99.141000
WHERE name = 'Sushi Master';

UPDATE restaurants
SET latitude = 19.429000, longitude = -99.130000
WHERE name = 'Pizza Hut';

UPDATE restaurants
SET latitude = 19.440000, longitude = -99.135000
WHERE name = 'Taco Bell';

UPDATE restaurants
SET latitude = 19.425000, longitude = -99.138000
WHERE name = 'Indian Spice';

UPDATE restaurants
SET latitude = 19.438000, longitude = -99.145000
WHERE name = 'Healthy Greens';

-- In case these restaurants don't exist (e.g. fresh DB), we can insert them or rely on database.sql running first.
-- Assuming database.sql ran, these updates will work.
