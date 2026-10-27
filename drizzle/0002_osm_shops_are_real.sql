-- Shops imported from OpenStreetMap are real businesses, not sample data.
-- Only workers, needs and placements created by demo mode stay is_demo.
UPDATE "enterprises" SET "is_demo" = false WHERE "source" = 'osm';
