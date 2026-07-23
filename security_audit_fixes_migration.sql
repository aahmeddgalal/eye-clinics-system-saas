-- =========================================================================
-- SECURITY AUDIT & FIXES MIGRATION
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- 1. Ensure RLS is enabled on ALL tables.
-- (If RLS is already enabled, this is a safe, idempotent operation)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE eye_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- 2. Revoke the dangerous anonymous access policy on patient_notes
-- This prevents unauthenticated public internet users from reading or writing patient notes.
DROP POLICY IF EXISTS "Enable full access for anon users on patient_notes" ON patient_notes;

-- 3. Ensure Authenticated Policies exist for all tables
-- We use DO blocks to safely create policies without errors if they already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'patient_notes' AND policyname = 'Enable full access for authenticated users on patient_notes'
    ) THEN
        CREATE POLICY "Enable full access for authenticated users on patient_notes" ON patient_notes FOR ALL TO authenticated USING (true);
    END IF;
END
$$;

-- Note: The rest of the tables had their authenticated policies created in database_schema.sql.
-- However, to be absolutely certain, we can recreate them if missing.
DO $$
DECLARE
    t_name text;
    p_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['patients', 'visits', 'prescriptions', 'medications', 'diseases', 'visit_diseases', 'eye_measurements', 'attachments', 'todays_queue', 'announcements'])
    LOOP
        p_name := 'Enable full access for authenticated users';
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = t_name AND policyname = p_name
        ) THEN
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true)', p_name, t_name);
        END IF;
    END LOOP;
END
$$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
