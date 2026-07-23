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
