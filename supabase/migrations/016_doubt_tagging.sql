-- Add branch and semester to doubts for better tagging and filtering
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS semester INT CHECK (semester BETWEEN 1 AND 8);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_doubts_branch ON doubts(branch);
CREATE INDEX IF NOT EXISTS idx_doubts_semester ON doubts(semester);
