-- Soft Delete Migration
-- Add deleted_at column to primary tables
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE diseases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create RPC function to automatically permanently delete records in the trash older than 7 days
CREATE OR REPLACE FUNCTION cleanup_trash() RETURNS void AS $$
BEGIN
  DELETE FROM patients WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM visits WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM prescriptions WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM attachments WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM diseases WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM medications WHERE deleted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;