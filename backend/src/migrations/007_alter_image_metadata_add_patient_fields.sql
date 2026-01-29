-- Migration: Add missing patient and study fields to image_metadata table
-- This adds columns needed for DICOM metadata storage

-- Add missing patient fields
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS patient_birth_date DATE,
ADD COLUMN IF NOT EXISTS patient_sex VARCHAR(10),
ADD COLUMN IF NOT EXISTS patient_age VARCHAR(10);

-- Add missing study fields
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS study_time TIME,
ADD COLUMN IF NOT EXISTS study_instance_uid VARCHAR(255);

-- Add missing series fields
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS series_description TEXT,
ADD COLUMN IF NOT EXISTS series_number INTEGER;

-- Add missing institution fields
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS referring_physician VARCHAR(255);

-- Add missing image fields
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS image_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_time TIME;

-- Add metadata source field
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS metadata_source VARCHAR(20) DEFAULT 'manual';

-- Add timestamps if they don't exist
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have default metadata_source
UPDATE image_metadata 
SET metadata_source = 'manual' 
WHERE metadata_source IS NULL;
