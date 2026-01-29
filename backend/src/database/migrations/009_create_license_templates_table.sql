-- Create license_templates table
CREATE TABLE IF NOT EXISTS license_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Default parameters
    default_duration_days INTEGER NOT NULL DEFAULT 365,
    default_upload_quota INTEGER NOT NULL DEFAULT 1000,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_license_templates_template_name ON license_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_license_templates_is_active ON license_templates(is_active);

-- Add check constraint for positive duration and quota values
ALTER TABLE license_templates ADD CONSTRAINT chk_license_templates_default_duration_days 
    CHECK (default_duration_days > 0);

ALTER TABLE license_templates ADD CONSTRAINT chk_license_templates_default_upload_quota 
    CHECK (default_upload_quota > 0);
