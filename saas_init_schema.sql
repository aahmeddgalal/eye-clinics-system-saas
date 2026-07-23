-- =========================================================================
-- FILE: database_schema.sql
-- =========================================================================

-- Run this script in the Supabase SQL Editor

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    address TEXT,
    marital_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Visits Table
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Prescriptions Table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Medications Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4.1 Prescription Medications (Junction Table for M:N)
CREATE TABLE prescription_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Diseases Table
CREATE TABLE diseases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5.1 Visit Diseases (Junction Table for M:N)
CREATE TABLE visit_diseases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    disease_id UUID NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. Eye Measurements Table
CREATE TABLE eye_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    right_sph NUMERIC,
    right_cyl NUMERIC,
    right_axis NUMERIC,
    left_sph NUMERIC,
    left_cyl NUMERIC,
    left_axis NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. Attachments Table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. Todays Queue Table
CREATE TABLE todays_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'waiting', -- Options: waiting, in_progress, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 9. Announcements Table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);


-- ==========================================
-- INDEXES FOR PERFORMANCE & SCALABILITY
-- ==========================================

-- Patient lookups
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);

-- Visit & Prescription lookups
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);

-- Other heavy FK lookups
CREATE INDEX idx_eye_measurements_patient_id ON eye_measurements(patient_id);
CREATE INDEX idx_attachments_patient_id ON attachments(patient_id);

-- Queue Management
CREATE INDEX idx_todays_queue_patient_id ON todays_queue(patient_id);
CREATE INDEX idx_todays_queue_scheduled_date ON todays_queue(scheduled_date);
CREATE INDEX idx_todays_queue_status ON todays_queue(status);

-- Junction tables lookups
CREATE INDEX idx_prescription_med_prescription_id ON prescription_medications(prescription_id);
CREATE INDEX idx_visit_diseases_visit_id ON visit_diseases(visit_id);


-- ==========================================
-- SUPABASE ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Essential for Supabase applications. Secures data at the DB level.
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE eye_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Update according to your actual Auth strategy, e.g., restricting to specific roles)
CREATE POLICY "Enable full access for authenticated users" ON patients FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON visits FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON prescriptions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON medications FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON prescription_medications FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON diseases FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON visit_diseases FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON eye_measurements FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON attachments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON todays_queue FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable full access for authenticated users" ON announcements FOR ALL TO authenticated USING (true);

-- Notify postgrest to reload the schema cache so changes show up in the API immediately
NOTIFY pgrst, 'reload schema';


-- Announcements Table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(utc::text, now()) NOT NULL
);

-- =========================================================================
-- FILE: patient_notes_migration.sql
-- =========================================================================

CREATE TABLE patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================================================
-- FILE: prescription_jsonb_migration.sql
-- =========================================================================

-- =========================================================================
-- PRESCRIPTIONS JSONB STORAGE REFACTOR MIGRATION
-- =========================================================================

-- 1. Add the new JSONB column to the prescriptions table
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medications_data JSONB DEFAULT '[]'::jsonb;

-- 2. Automatically backfill historical prescription data into the new JSONB format
-- This aggregates all records from the prescription_medications junction table
-- and the medications catalog into a self-contained snapshot array.
UPDATE prescriptions p
SET medications_data = COALESCE((
    SELECT jsonb_agg(
        jsonb_build_object(
            'medication_id', pm.medication_id,
            'name', m.name,
            'dosage', pm.dosage,
            'frequency', pm.frequency,
            'duration', pm.duration,
            'instructions', pm.frequency -- mapping frequency to instructions for compatibility
        )
    )
    FROM prescription_medications pm
    JOIN medications m ON m.id = pm.medication_id
    WHERE pm.prescription_id = p.id
), '[]'::jsonb);

-- NOTE: The prescription_medications table is now obsolete, but we keep it here 
-- temporarily just in case you want to verify data integrity before dropping it.
-- You can run the following line in the future once you are fully satisfied:
-- DROP TABLE prescription_medications CASCADE;

-- =========================================================================
-- FILE: architecture_migration.sql
-- =========================================================================

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

-- =========================================================================
-- FILE: rpc_create_visit_migration.sql
-- =========================================================================

-- 1. Add visit_id to attachments
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id) ON DELETE CASCADE;

-- 2. Create the RPC function for full visit creation
CREATE OR REPLACE FUNCTION create_full_visit(payload jsonb)
RETURNS jsonb AS $$
DECLARE
    v_patient_id uuid;
    v_visit_id uuid;
    
    v_diagnosis text;
    v_notes text;
    v_doctor_notes text;
    
    v_diseases jsonb;
    v_medications jsonb;
    v_eye_measurements jsonb;
    v_attachment_ids jsonb;
    
    v_disease_id uuid;
    v_att_id uuid;
BEGIN
    -- Extract values from payload
    v_patient_id := (payload->>'patient_id')::uuid;
    v_diagnosis := payload->>'diagnosis';
    v_notes := payload->>'notes';
    v_doctor_notes := payload->>'doctor_notes';
    
    v_diseases := payload->'diseases';
    v_medications := payload->'medications';
    v_eye_measurements := payload->'eye_measurements';
    v_attachment_ids := payload->'attachment_ids';

    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'patient_id is required';
    END IF;

    -- 1. Insert Visit
    INSERT INTO visits (patient_id, diagnosis, notes, visit_date)
    VALUES (v_patient_id, v_diagnosis, v_notes, NOW())
    RETURNING id INTO v_visit_id;

    -- 2. Insert Diseases
    IF v_diseases IS NOT NULL AND jsonb_typeof(v_diseases) = 'array' AND jsonb_array_length(v_diseases) > 0 THEN
        FOR i IN 0 .. jsonb_array_length(v_diseases) - 1 LOOP
            v_disease_id := (v_diseases->>i)::uuid;
            INSERT INTO visit_diseases (visit_id, disease_id)
            VALUES (v_visit_id, v_disease_id);
        END LOOP;
    END IF;

    -- 3. Insert Prescription
    IF v_medications IS NOT NULL AND jsonb_typeof(v_medications) = 'array' AND jsonb_array_length(v_medications) > 0 THEN
        INSERT INTO prescriptions (patient_id, visit_id, doctor_notes, medications_data)
        VALUES (v_patient_id, v_visit_id, v_doctor_notes, v_medications);
    END IF;

    -- 4. Insert Eye Measurements
    IF v_eye_measurements IS NOT NULL AND jsonb_typeof(v_eye_measurements) = 'object' THEN
        INSERT INTO eye_measurements (
            patient_id, visit_id, 
            right_sph, right_cyl, right_axis, 
            left_sph, left_cyl, left_axis
        ) VALUES (
            v_patient_id, v_visit_id,
            (v_eye_measurements->>'right_sph')::numeric,
            (v_eye_measurements->>'right_cyl')::numeric,
            (v_eye_measurements->>'right_axis')::numeric,
            (v_eye_measurements->>'left_sph')::numeric,
            (v_eye_measurements->>'left_cyl')::numeric,
            (v_eye_measurements->>'left_axis')::numeric
        );
    END IF;

    -- 5. Link Attachments
    IF v_attachment_ids IS NOT NULL AND jsonb_typeof(v_attachment_ids) = 'array' AND jsonb_array_length(v_attachment_ids) > 0 THEN
        FOR i IN 0 .. jsonb_array_length(v_attachment_ids) - 1 LOOP
            v_att_id := (v_attachment_ids->>i)::uuid;
            UPDATE attachments SET visit_id = v_visit_id WHERE id = v_att_id;
        END LOOP;
    END IF;

    -- 6. Update Today's Queue
    UPDATE todays_queue 
    SET status = 'completed', completed_at = NOW()
    WHERE patient_id = v_patient_id AND scheduled_date >= CURRENT_DATE::timestamp;

    IF NOT FOUND THEN
        INSERT INTO todays_queue (patient_id, scheduled_date, status, completed_at)
        VALUES (v_patient_id, NOW(), 'completed', NOW());
    END IF;

    RETURN jsonb_build_object('success', true, 'visit_id', v_visit_id);

EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception so Supabase correctly reports it as an error and rolls back the transaction
        RAISE EXCEPTION 'Failed to create visit: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose to authenticated users
GRANT EXECUTE ON FUNCTION create_full_visit(jsonb) TO authenticated;

-- =========================================================================
-- FILE: eye_measurements_migration.sql
-- =========================================================================

-- 1. Add visit_id column to eye_measurements
ALTER TABLE eye_measurements 
ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id) ON DELETE CASCADE;

-- 2. Add index for fast querying by visit
CREATE INDEX IF NOT EXISTS idx_eye_measurements_visit_id ON eye_measurements(visit_id);

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- FILE: migration_add_description_to_attachments.sql
-- =========================================================================

-- Add description column to attachments
ALTER TABLE attachments ADD COLUMN description TEXT;

-- =========================================================================
-- FILE: migration_add_visit_id_to_notes.sql
-- =========================================================================

-- Add visit_id column to patient_notes
ALTER TABLE patient_notes ADD COLUMN visit_id UUID REFERENCES visits(id) ON DELETE CASCADE;

-- =========================================================================
-- FILE: announcements_dates_migration.sql
-- =========================================================================

ALTER TABLE announcements ADD COLUMN start_date TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN end_date TIMESTAMPTZ;

-- =========================================================================
-- FILE: soft_delete_migration.sql
-- =========================================================================

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

-- =========================================================================
-- FILE: qa_fixes_migration.sql
-- =========================================================================

-- QA Audit Fixes Migration
-- Run this script in the Supabase SQL Editor

-- 1. Add deleted_at column to tables that were missed in previous migrations
ALTER TABLE eye_measurements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE visit_diseases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Add updated_at column to primary tables for Optimistic Concurrency Control
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE visits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE eye_measurements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE patient_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 3. Create a trigger function to automatically update the updated_at column on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Apply the trigger to all relevant tables
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visits_updated_at ON visits;
CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eye_measurements_updated_at ON eye_measurements;
CREATE TRIGGER update_eye_measurements_updated_at
    BEFORE UPDATE ON eye_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_notes_updated_at ON patient_notes;
CREATE TRIGGER update_patient_notes_updated_at
    BEFORE UPDATE ON patient_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- FILE: cascade_soft_delete_migration.sql
-- =========================================================================

-- Create trigger function for cascading patient soft delete
CREATE OR REPLACE FUNCTION cascade_patient_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- If patient is being soft-deleted
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE visits SET deleted_at = NEW.deleted_at WHERE patient_id = NEW.id AND deleted_at IS NULL;
    UPDATE prescriptions SET deleted_at = NEW.deleted_at WHERE patient_id = NEW.id AND deleted_at IS NULL;
    UPDATE attachments SET deleted_at = NEW.deleted_at WHERE patient_id = NEW.id AND deleted_at IS NULL;
    -- Note: todays_queue does not have deleted_at in the original schema, but we added status 'cancelled', so maybe we just leave it or add deleted_at.
    -- Wait, does todays_queue have deleted_at?
  END IF;
  
  -- If patient is being restored
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restore only things that were deleted at the exact same time
    UPDATE visits SET deleted_at = NULL WHERE patient_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE prescriptions SET deleted_at = NULL WHERE patient_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE attachments SET deleted_at = NULL WHERE patient_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cascade_patient_soft_delete ON patients;
CREATE TRIGGER trigger_cascade_patient_soft_delete
AFTER UPDATE OF deleted_at ON patients
FOR EACH ROW
EXECUTE FUNCTION cascade_patient_soft_delete();

-- Create trigger function for cascading visit soft delete
CREATE OR REPLACE FUNCTION cascade_visit_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- If visit is being soft-deleted
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE prescriptions SET deleted_at = NEW.deleted_at WHERE visit_id = NEW.id AND deleted_at IS NULL;
    -- UPDATE attachments SET deleted_at = NEW.deleted_at WHERE visit_id = NEW.id AND deleted_at IS NULL; -- if attachments have visit_id
  END IF;
  
  -- If visit is being restored
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE prescriptions SET deleted_at = NULL WHERE visit_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cascade_visit_soft_delete ON visits;
CREATE TRIGGER trigger_cascade_visit_soft_delete
AFTER UPDATE OF deleted_at ON visits
FOR EACH ROW
EXECUTE FUNCTION cascade_visit_soft_delete();

-- Note: Ensure postgrest schema is reloaded
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- FILE: fix_patient_notes_rls.sql
-- =========================================================================

-- Enable RLS for patient_notes if not already enabled
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- Add policy to allow full access to authenticated users (matching the rest of the schema)
CREATE POLICY "Enable full access for authenticated users on patient_notes" 
ON patient_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add policy to allow full access to anon users (if your app operates without strict auth)
CREATE POLICY "Enable full access for anon users on patient_notes" 
ON patient_notes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- FILE: search_index_migration.sql
-- =========================================================================

-- Enable pg_trgm extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for ILIKE queries on full_name and phone
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm ON patients USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_phone_trgm ON patients USING gin (phone gin_trgm_ops);

-- Note: Ensure postgrest schema is reloaded
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- FILE: fix_hard_delete_rls_migration.sql
-- =========================================================================

-- =========================================================================
-- FIX HARD DELETE RLS MIGRATION
-- Run this script in the Supabase SQL Editor
-- Purpose: Upgrade the background cleanup_trash function to use SECURITY DEFINER 
-- so it can bypass RLS restrictions and perform a true hard delete.
-- =========================================================================

CREATE OR REPLACE FUNCTION cleanup_trash() RETURNS void AS $$
BEGIN
  -- Perform hard deletes on all items that have been in the trash for > 7 days
  DELETE FROM patients WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM visits WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM prescriptions WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM attachments WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM diseases WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM medications WHERE deleted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- FILE: fix_rpc_security_migration.sql
-- =========================================================================

-- =========================================================================
-- SECURE RPC MIGRATION
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- 1. SECURE create_full_visit RPC
CREATE OR REPLACE FUNCTION create_full_visit(payload jsonb)
RETURNS jsonb AS $$
DECLARE
    v_patient_id uuid;
    v_visit_id uuid;
    
    v_diagnosis text;
    v_notes text;
    v_doctor_notes text;
    
    v_diseases jsonb;
    v_medications jsonb;
    v_eye_measurements jsonb;
    v_attachment_ids jsonb;
    
    v_disease_id uuid;
    v_att_id uuid;
BEGIN
    -- SECURITY CHECK: Prevent anonymous public access
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be authenticated to perform this action.';
    END IF;

    -- Extract values from payload
    v_patient_id := (payload->>'patient_id')::uuid;
    v_diagnosis := payload->>'diagnosis';
    v_notes := payload->>'notes';
    v_doctor_notes := payload->>'doctor_notes';
    
    v_diseases := payload->'diseases';
    v_medications := payload->'medications';
    v_eye_measurements := payload->'eye_measurements';
    v_attachment_ids := payload->'attachment_ids';

    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'patient_id is required';
    END IF;

    -- 1. Insert Visit
    INSERT INTO visits (patient_id, diagnosis, notes, visit_date)
    VALUES (v_patient_id, v_diagnosis, v_notes, NOW())
    RETURNING id INTO v_visit_id;

    -- 2. Insert Diseases
    IF v_diseases IS NOT NULL AND jsonb_typeof(v_diseases) = 'array' AND jsonb_array_length(v_diseases) > 0 THEN
        FOR i IN 0 .. jsonb_array_length(v_diseases) - 1 LOOP
            v_disease_id := (v_diseases->>i)::uuid;
            INSERT INTO visit_diseases (visit_id, disease_id)
            VALUES (v_visit_id, v_disease_id);
        END LOOP;
    END IF;

    -- 3. Insert Prescription
    IF v_medications IS NOT NULL AND jsonb_typeof(v_medications) = 'array' AND jsonb_array_length(v_medications) > 0 THEN
        INSERT INTO prescriptions (patient_id, visit_id, doctor_notes, medications_data)
        VALUES (v_patient_id, v_visit_id, v_doctor_notes, v_medications);
    END IF;

    -- 4. Insert Eye Measurements
    IF v_eye_measurements IS NOT NULL AND jsonb_typeof(v_eye_measurements) = 'object' THEN
        INSERT INTO eye_measurements (
            patient_id, visit_id, 
            right_sph, right_cyl, right_axis, 
            left_sph, left_cyl, left_axis
        ) VALUES (
            v_patient_id, v_visit_id,
            (v_eye_measurements->>'right_sph')::numeric,
            (v_eye_measurements->>'right_cyl')::numeric,
            (v_eye_measurements->>'right_axis')::numeric,
            (v_eye_measurements->>'left_sph')::numeric,
            (v_eye_measurements->>'left_cyl')::numeric,
            (v_eye_measurements->>'left_axis')::numeric
        );
    END IF;

    -- 5. Link Attachments
    IF v_attachment_ids IS NOT NULL AND jsonb_typeof(v_attachment_ids) = 'array' AND jsonb_array_length(v_attachment_ids) > 0 THEN
        FOR i IN 0 .. jsonb_array_length(v_attachment_ids) - 1 LOOP
            v_att_id := (v_attachment_ids->>i)::uuid;
            UPDATE attachments SET visit_id = v_visit_id WHERE id = v_att_id;
        END LOOP;
    END IF;

    -- 6. Update Today's Queue
    UPDATE todays_queue 
    SET status = 'completed', completed_at = NOW()
    WHERE patient_id = v_patient_id AND scheduled_date >= CURRENT_DATE::timestamp;

    IF NOT FOUND THEN
        INSERT INTO todays_queue (patient_id, scheduled_date, status, completed_at)
        VALUES (v_patient_id, NOW(), 'completed', NOW());
    END IF;

    RETURN jsonb_build_object('success', true, 'visit_id', v_visit_id);

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create visit: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. SECURE cleanup_trash RPC
CREATE OR REPLACE FUNCTION cleanup_trash() RETURNS void AS $$
BEGIN
  -- SECURITY CHECK: Prevent anonymous public access
  IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: You must be authenticated to perform this action.';
  END IF;

  DELETE FROM patients WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM visits WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM prescriptions WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM attachments WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM diseases WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM medications WHERE deleted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- FILE: fix_storage_security_migration.sql
-- =========================================================================

-- =========================================================================
-- SECURE STORAGE MIGRATION
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- 1. Make the patient-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'patient-files';

-- 2. Drop the public SELECT policy
DROP POLICY IF EXISTS "Allow public to view files" ON storage.objects;

-- 3. Create an authenticated SELECT policy
CREATE POLICY "Allow authenticated to view files"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'patient-files');

-- 4. Ensure INSERT policy is still restricted to authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-files');

-- 5. Ensure DELETE policy is still restricted to authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-files');

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- FILE: security_audit_fixes_migration.sql
-- =========================================================================

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

