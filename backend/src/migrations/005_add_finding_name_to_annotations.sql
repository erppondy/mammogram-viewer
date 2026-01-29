-- Add finding_name column to annotations table
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS finding_name VARCHAR(255);

-- Add index for finding_name for faster queries
CREATE INDEX IF NOT EXISTS idx_annotations_finding_name ON annotations(finding_name);
