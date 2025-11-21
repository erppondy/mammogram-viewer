-- Add role column with default 'user' (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Add status column with default 'pending' (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
  END IF;
END $$;

-- Add approval tracking columns (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='approved_by') THEN
    ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='approved_at') THEN
    ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='rejection_reason') THEN
    ALTER TABLE users ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Create indexes on role and status for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add check constraints for valid values (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('user', 'super_admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_status') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('pending', 'approved', 'rejected', 'deactivated'));
  END IF;
END $$;

-- Update existing users to 'approved' status (backward compatibility)
UPDATE users SET status = 'approved' WHERE status = 'pending';
