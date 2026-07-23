require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function fix() {
  console.log('Fetching all prescriptions...');
  let allData = [];
  let start = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase.from('prescriptions').select('*').range(start, start + limit - 1);
    if (error) { console.error(error); return; }
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    start += limit;
  }
  
  console.log(`Fetched ${allData.length} prescriptions.`);
  
  const toUpsert = [];
  for (const rx of allData) {
    if (rx.medications_data && Array.isArray(rx.medications_data)) {
      let changed = false;
      const newData = rx.medications_data.map(med => {
        if (med.medicine_name || med.dose) {
          changed = true;
          const mapped = { ...med, name: med.medicine_name, dosage: med.dose };
          delete mapped.medicine_name;
          delete mapped.dose;
          return mapped;
        }
        return med;
      });
      if (changed) {
        toUpsert.push({ ...rx, medications_data: newData });
      }
    }
  }

  console.log(`Found ${toUpsert.length} prescriptions to update.`);
  for (let i = 0; i < toUpsert.length; i += 500) {
    const chunk = toUpsert.slice(i, i + 500);
    const { error } = await supabase.from('prescriptions').upsert(chunk);
    if (error) {
      console.error('Error upserting chunk at index', i, error);
    }
    if (i % 5000 === 0 && i > 0) console.log(` - Progress: ${i}`);
  }
  console.log('Done fixing prescriptions!');
}

fix().catch(console.error);
