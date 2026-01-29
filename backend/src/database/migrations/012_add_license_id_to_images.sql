-- Add license_id column to images table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='images' AND column_name='license_id') THEN
    ALTER TABLE images ADD COLUMN license_id UUID REFERENCES ambulance_licenses(id);
  END IF;
END $$;

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_images_license_id ON images(license_id);
