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
