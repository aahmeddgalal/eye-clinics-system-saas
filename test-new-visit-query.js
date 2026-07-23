require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function testQuery() {
  const { data: patients, error: pErr } = await supabase.from('patients').select('id, full_name').limit(1);
  if (pErr) {
    console.error('P_ERR', pErr);
    return;
  }
  const id = patients[0].id;
  console.log('Testing with patient ID:', id);

  const [patientRes, diseasesRes, medicationsRes] = await Promise.all([
    supabase.from('patients').select('id, full_name').eq('id', id).is('deleted_at', null).single(),
    supabase.from('diseases').select('*').is('deleted_at', null).order('name'),
    supabase.from('medications').select('*').is('deleted_at', null).order('name')
  ])

  console.log('PatientRes Error:', patientRes.error);
  console.log('PatientRes Data:', patientRes.data);
  console.log('DiseasesRes Error:', diseasesRes.error);
  console.log('MedicationsRes Error:', medicationsRes.error);
}

testQuery();
