-- =========================================================================
-- ARCHITECTURE ENHANCEMENT MIGRATION
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- 1. ATTACHMENTS TO VISITS
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id) ON DELETE CASCADE;

-- 2. IMPROVE TODAY'S QUEUE
ALTER TABLE todays_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE todays_queue ADD COLUMN IF NOT EXISTS completed_by TEXT;

-- 3. PATIENT NORMALIZATION
ALTER TABLE patients ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- Create function to normalize arabic text
CREATE OR REPLACE FUNCTION normalize_arabic_name(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized TEXT;
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    normalized := trim(lower(input_text));
    normalized := regexp_replace(normalized, '[أإآا]', 'ا', 'g');
    normalized := regexp_replace(normalized, '[ةه]', 'ه', 'g');
    normalized := regexp_replace(normalized, '[ىي]', 'ي', 'g');
    normalized := regexp_replace(normalized, '\s+', ' ', 'g');
    
    RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically normalize name on insert or update
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name = normalize_arabic_name(NEW.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_patient_name ON patients;
CREATE TRIGGER trigger_normalize_patient_name
    BEFORE INSERT OR UPDATE OF full_name ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_normalized_name();

-- Backfill existing data
UPDATE patients SET normalized_name = normalize_arabic_name(full_name) WHERE normalized_name IS NULL;

-- 4. MEDICATIONS TABLE IMPROVEMENT
ALTER TABLE medications ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. PRESCRIPTION ARCHITECTURE CLEANUP
-- Drop the legacy junction table since medications_data JSONB is now used
DROP TABLE IF EXISTS prescription_medications CASCADE;

-- 6. DATABASE INDEXES
-- Drop existing ones just in case to prevent errors
DROP INDEX IF EXISTS idx_patients_full_name;
DROP INDEX IF EXISTS idx_patients_normalized_name;
DROP INDEX IF EXISTS idx_patients_phone;
DROP INDEX IF EXISTS idx_visits_patient_id;
DROP INDEX IF EXISTS idx_prescriptions_patient_id;
DROP INDEX IF EXISTS idx_prescriptions_visit_id;
DROP INDEX IF EXISTS idx_eye_measurements_patient_id;
DROP INDEX IF EXISTS idx_attachments_visit_id;
DROP INDEX IF EXISTS idx_todays_queue_scheduled_date;

CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_normalized_name ON patients(normalized_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX idx_eye_measurements_patient_id ON eye_measurements(patient_id);
CREATE INDEX idx_attachments_visit_id ON attachments(visit_id);
CREATE INDEX idx_todays_queue_scheduled_date ON todays_queue(scheduled_date);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
