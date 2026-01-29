-- Create license_audit_log table
CREATE TABLE IF NOT EXISTS license_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES ambulance_licenses(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    
    -- Change details
    changed_by UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_license_audit_log_license_id ON license_audit_log(license_id);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_action ON license_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_created_at ON license_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_changed_by ON license_audit_log(changed_by);

-- Create GIN index for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_license_audit_log_old_values ON license_audit_log USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_new_values ON license_audit_log USING GIN (new_values);

-- Add check constraint for valid action values
ALTER TABLE license_audit_log ADD CONSTRAINT chk_license_audit_log_action 
    CHECK (action IN ('created', 'modified', 'revoked', 'extended', 'quota_updated', 'status_changed'));
