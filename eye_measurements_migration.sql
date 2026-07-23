-- 1. Add visit_id column to eye_measurements
ALTER TABLE eye_measurements 
ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id) ON DELETE CASCADE;

-- 2. Add index for fast querying by visit
CREATE INDEX IF NOT EXISTS idx_eye_measurements_visit_id ON eye_measurements(visit_id);

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
