-- Add license_id column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='license_id') THEN
    ALTER TABLE users ADD COLUMN license_id UUID REFERENCES ambulance_licenses(id);
  END IF;
END $$;

-- Add ambulance_role column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ambulance_role') THEN
    ALTER TABLE users ADD COLUMN ambulance_role VARCHAR(50);
  END IF;
END $$;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_license_id ON users(license_id);
CREATE INDEX IF NOT EXISTS idx_users_ambulance_role ON users(ambulance_role);

-- Add check constraint for valid ambulance_role values
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_ambulance_role') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_ambulance_role 
        CHECK (ambulance_role IS NULL OR ambulance_role IN ('operator', 'doctor', 'supervisor', 'admin'));
  END IF;
END $$;
