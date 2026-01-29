-- Migration: Backfill license_id for existing images
-- This migration updates all images to have the same license_id as their uploader
-- This ensures shared license access works for images uploaded before the feature was implemented

-- Update images to inherit license_id from their uploader
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL
AND i.license_id IS NULL;

-- Verify the migration
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM images i
  JOIN users u ON i.user_id = u.id
  WHERE u.license_id IS NOT NULL 
  AND i.license_id IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Migration verification failed: % images still missing license_id', missing_count;
  ELSE
    RAISE NOTICE 'Migration successful: All images now have correct license_id';
  END IF;
END $$;
