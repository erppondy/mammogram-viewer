-- Create annotations table
CREATE TABLE IF NOT EXISTS annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    annotation_type VARCHAR(50) NOT NULL, -- circle, rectangle, arrow, freehand, text, measurement
    coordinates JSONB NOT NULL, -- {x, y, width, height, points: [], radius, etc}
    color VARCHAR(20) DEFAULT '#ff0000',
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    category VARCHAR(100), -- calcification, mass, asymmetry, distortion, etc
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_annotations_image_id ON annotations(image_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);
CREATE INDEX idx_annotations_created_at ON annotations(created_at);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(255),
    patient_id VARCHAR(100),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    image_ids JSONB NOT NULL, -- Array of image IDs included in report
    radiologist_id UUID NOT NULL REFERENCES users(id),
    findings JSONB, -- Structured findings data
    diagnosis TEXT,
    recommendations TEXT,
    bi_rads_score INTEGER CHECK (bi_rads_score >= 0 AND bi_rads_score <= 6),
    report_template_id UUID,
    status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, signed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP,
    signature_data TEXT -- Digital signature
);

-- Create index for reports
CREATE INDEX idx_reports_patient_id ON reports(patient_id);
CREATE INDEX idx_reports_radiologist_id ON reports(radiologist_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Create report_images junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS report_images (
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, image_id)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
