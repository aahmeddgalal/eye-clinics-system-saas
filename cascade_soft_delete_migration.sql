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
