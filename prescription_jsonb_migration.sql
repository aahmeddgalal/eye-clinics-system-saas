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
