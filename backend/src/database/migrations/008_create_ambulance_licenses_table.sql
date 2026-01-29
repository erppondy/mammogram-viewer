-- Create ambulance_licenses table
CREATE TABLE IF NOT EXISTS ambulance_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key VARCHAR(50) UNIQUE NOT NULL,
    ambulance_name VARCHAR(255) NOT NULL,
    ambulance_contact_email VARCHAR(255) NOT NULL,
    ambulance_contact_phone VARCHAR(50),
    ambulance_address TEXT,
    
    -- License parameters
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    upload_quota INTEGER NOT NULL DEFAULT 1000,
    uploads_used INTEGER DEFAULT 0,
    
    -- Dates
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ambulance_licenses_license_key ON ambulance_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_ambulance_licenses_status ON ambulance_licenses(status);
CREATE INDEX IF NOT EXISTS idx_ambulance_licenses_expires_at ON ambulance_licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_ambulance_licenses_ambulance_name ON ambulance_licenses(ambulance_name);

-- Add check constraint for valid status values
ALTER TABLE ambulance_licenses ADD CONSTRAINT chk_ambulance_licenses_status 
    CHECK (status IN ('active', 'expired', 'revoked'));

-- Add check constraint for non-negative quota values
ALTER TABLE ambulance_licenses ADD CONSTRAINT chk_ambulance_licenses_upload_quota 
    CHECK (upload_quota >= 0);

ALTER TABLE ambulance_licenses ADD CONSTRAINT chk_ambulance_licenses_uploads_used 
    CHECK (uploads_used >= 0);
