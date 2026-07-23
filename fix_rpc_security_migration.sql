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
