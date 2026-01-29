-- Migration: Create image_metadata table for storing patient information
-- This table stores patient metadata extracted from DICOM files or entered manually

CREATE TABLE IF NOT EXISTS image_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  
  -- Patient Information
  patient_name VARCHAR(255),
  patient_id VARCHAR(100),
  patient_birth_date DATE,
  patient_sex VARCHAR(10),
  patient_age VARCHAR(10),
  
  -- Study Information
  study_date DATE,
  study_time TIME,
  study_description TEXT,
  study_instance_uid VARCHAR(255),
  
  -- Series Information
  series_description TEXT,
  series_number INTEGER,
  modality VARCHAR(20),
  
  -- Institution Information
  institution_name VARCHAR(255),
  referring_physician VARCHAR(255),
  
  -- Image Information
  image_type VARCHAR(100),
  acquisition_date DATE,
  acquisition_time TIME,
  
  -- Metadata source
  metadata_source VARCHAR(20) DEFAULT 'manual', -- 'dicom' or 'manual'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one metadata record per image
  UNIQUE(image_id)
);

-- Create indexes for common queries
CREATE INDEX idx_image_metadata_image_id ON image_metadata(image_id);
CREATE INDEX idx_image_metadata_patient_name ON image_metadata(patient_name);
CREATE INDEX idx_image_metadata_patient_id ON image_metadata(patient_id);
CREATE INDEX idx_image_metadata_study_date ON image_metadata(study_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_metadata_updated_at
  BEFORE UPDATE ON image_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_image_metadata_updated_at();
