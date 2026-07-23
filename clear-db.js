require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearPatients() {
  console.log('Clearing all patients and their related data...');
  
  console.log('Clearing visit diseases...');
  await supabase.from('visit_diseases').delete().not('visit_id', 'is', null);
  
  console.log('Clearing eye measurements...');
  await supabase.from('eye_measurements').delete().not('id', 'is', null);
  
  console.log('Clearing prescriptions...');
  await supabase.from('prescriptions').delete().not('id', 'is', null);
  
  console.log('Clearing patient notes...');
  await supabase.from('patient_notes').delete().not('id', 'is', null);
  
  console.log('Clearing attachments...');
  await supabase.from('attachments').delete().not('id', 'is', null);

  console.log('Clearing visits...');
  await supabase.from('visits').delete().not('id', 'is', null);

  console.log('Clearing patients...');
  const { data, error } = await supabase.from('patients').delete().not('id', 'is', null);
  
  if (error) {
    console.error('Error clearing patients:', error.message);
  } else {
    console.log('Successfully cleared all patients.');
  }
}

clearPatients().catch(console.error);
