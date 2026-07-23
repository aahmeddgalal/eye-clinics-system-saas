import { supabase } from './supabase';
import { db } from './database';

/**
 * Patient CRUD Operations
 * Examples of how to interact with the patients table in your Next.js App Router.
 * These can be used in Server Components, Server Actions, or Route Handlers.
 */

// 1. CREATE: Add a new patient
export async function createPatient(patientData) {
  // Example payload: { full_name: 'John Doe', age: 30, phone: '12345678' }
  const { data, error } = await db.insert('patients', patientData);
  
  if (error) {
    throw new Error(`Failed to create patient: ${error.message}`);
  }
  
  return data;
}

// 2. READ: Get all patients with basic sorting
export async function getPatients(sortBy = 'created_at', ascending = false) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order(sortBy, { ascending });
    
  if (error) {
    console.error('Failed to fetch patients:', error.message);
    return [];
  }
  
  return data;
}

// 2b. READ: Get a single patient by ID with their related data
export async function getPatientWithHistory(patientId) {
  // Demonstrates fetching related tables in a single query
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      visits (*),
      eye_measurements (*),
      attachments (*)
    `)
    .eq('id', patientId)
    .single();

  if (error) {
    console.error('Failed to fetch patient details:', error.message);
    return null;
  }
  
  return data;
}

// 3. UPDATE: Update patient information
export async function updatePatient(patientId, updateData) {
  const { data, error } = await db.update('patients', patientId, updateData);
  
  if (error) {
    throw new Error(`Failed to update patient: ${error.message}`);
  }
  
  return data;
}

// 4. DELETE: Remove a patient
export async function deletePatient(patientId) {
  const { error } = await db.remove('patients', patientId);
  
  if (error) {
    throw new Error(`Failed to delete patient: ${error.message}`);
  }
  
  return true;
}

// 5. SEARCH: Search patients by name
export async function searchPatientsByName(searchTerm) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .ilike('full_name', `%${searchTerm}%`)
    .order('full_name');
    
  if (error) {
    console.error('Failed to search patients:', error.message);
    return [];
  }
  
  return data;
}
