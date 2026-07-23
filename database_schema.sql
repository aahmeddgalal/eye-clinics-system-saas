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
