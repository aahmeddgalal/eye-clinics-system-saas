-- =========================================================================
-- EYE CLINICS SYSTEM - INITIAL SAAS SCHEMA
-- Run this script in the Supabase SQL Editor
-- This is a clean, consolidated schema containing all tables, indexes, 
-- functions, triggers, and security policies.
-- =========================================================================

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- 2. TABLES
-- ==========================================

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    normalized_name TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    address TEXT,
    marital_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Visits Table
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Prescriptions Table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    doctor_notes TEXT,
    medications_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Medications Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Diseases Table
CREATE TABLE diseases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Visit Diseases (Junction Table)
CREATE TABLE visit_diseases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    disease_id UUID NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Eye Measurements Table
CREATE TABLE eye_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    right_sph NUMERIC,
    right_cyl NUMERIC,
    right_axis NUMERIC,
    left_sph NUMERIC,
    left_cyl NUMERIC,
    left_axis NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Attachments Table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Today's Queue Table
CREATE TABLE todays_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'waiting', -- Options: waiting, in_progress, completed, cancelled
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Announcements Table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Patient Notes Table
CREATE TABLE patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

-- Patients
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_normalized_name ON patients(normalized_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_full_name_trgm ON patients USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_patients_phone_trgm ON patients USING gin (phone gin_trgm_ops);

-- Visits & Prescriptions
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);

-- Other Heavy Lookups
CREATE INDEX idx_eye_measurements_patient_id ON eye_measurements(patient_id);
CREATE INDEX idx_eye_measurements_visit_id ON eye_measurements(visit_id);
CREATE INDEX idx_attachments_visit_id ON attachments(visit_id);
CREATE INDEX idx_visit_diseases_visit_id ON visit_diseases(visit_id);

-- Queue
CREATE INDEX idx_todays_queue_scheduled_date ON todays_queue(scheduled_date);

-- ==========================================
-- 4. FUNCTIONS & TRIGGERS
-- ==========================================

-- A. Updated_At Auto Updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eye_measurements_updated_at BEFORE UPDATE ON eye_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_notes_updated_at BEFORE UPDATE ON patient_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- B. Arabic Name Normalizer
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

CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name = normalize_arabic_name(NEW.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_patient_name BEFORE INSERT OR UPDATE OF full_name ON patients FOR EACH ROW EXECUTE FUNCTION set_normalized_name();

-- C. Soft Delete Cascading
CREATE OR REPLACE FUNCTION cascade_patient_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- If patient is being soft-deleted
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE visits SET deleted_at = NEW.deleted_at WHERE patient_id = NEW.id AND deleted_at IS NULL;
    UPDATE prescriptions SET deleted_at = NEW.deleted_at WHERE patient_id = NEW.id AND deleted_at IS NULL;
    UPDATE attachments SET deleted_at = NEW.deleted_at WHERE patient_id = NEW.id AND deleted_at IS NULL;
  END IF;
  
  -- If patient is being restored
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE visits SET deleted_at = NULL WHERE patient_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE prescriptions SET deleted_at = NULL WHERE patient_id = NEW.id AND deleted_at = OLD.deleted_at;
    UPDATE attachments SET deleted_at = NULL WHERE patient_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cascade_patient_soft_delete AFTER UPDATE OF deleted_at ON patients FOR EACH ROW EXECUTE FUNCTION cascade_patient_soft_delete();

CREATE OR REPLACE FUNCTION cascade_visit_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE prescriptions SET deleted_at = NEW.deleted_at WHERE visit_id = NEW.id AND deleted_at IS NULL;
  END IF;
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE prescriptions SET deleted_at = NULL WHERE visit_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cascade_visit_soft_delete AFTER UPDATE OF deleted_at ON visits FOR EACH ROW EXECUTE FUNCTION cascade_visit_soft_delete();


-- ==========================================
-- 5. RPC (REMOTE PROCEDURE CALLS)
-- ==========================================

-- Trash Cleanup (Hard Delete records > 7 days)
CREATE OR REPLACE FUNCTION cleanup_trash() RETURNS void AS $$
BEGIN
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

-- Create Full Visit Action
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be authenticated to perform this action.';
    END IF;

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

GRANT EXECUTE ON FUNCTION create_full_visit(jsonb) TO authenticated;

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==========================================

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

-- Policies
DO $$
DECLARE
    t_name text;
    p_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['patients', 'visits', 'prescriptions', 'medications', 'diseases', 'visit_diseases', 'eye_measurements', 'attachments', 'todays_queue', 'announcements', 'patient_notes'])
    LOOP
        p_name := 'Enable full access for authenticated users on ' || t_name;
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = t_name AND policyname = p_name
        ) THEN
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true)', p_name, t_name);
        END IF;
    END LOOP;
END
$$;

-- ==========================================
-- 7. STORAGE SECURITY (If using Supabase Storage)
-- ==========================================

-- Note: Storage policies require the "storage.buckets" and "storage.objects" tables.
-- The below assumes the bucket "patient-files" has already been created. 
-- Uncomment if you want to enforce these directly via SQL here:

/*
UPDATE storage.buckets SET public = false WHERE id = 'patient-files';
DROP POLICY IF EXISTS "Allow public to view files" ON storage.objects;
CREATE POLICY "Allow authenticated to view files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'patient-files');
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'patient-files');
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'patient-files');
*/

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
