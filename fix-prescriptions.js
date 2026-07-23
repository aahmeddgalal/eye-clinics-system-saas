require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function fix() {
  console.log('Truncating prescriptions table...');
  await supabase.from('prescriptions').delete().not('id', 'is', null);

  console.log('Loading updated prescriptions.json...');
  const rx = JSON.parse(fs.readFileSync('./migration_json/prescriptions.json', 'utf8'));

  console.log(`Inserting ${rx.length} records in batches of 500...`);
  for (let i = 0; i < rx.length; i += 500) {
    const chunk = rx.slice(i, i + 500);
    const { error } = await supabase.from('prescriptions').insert(chunk);
    if (error) {
      console.error('Error inserting chunk at index', i, error);
    }
    if (i % 5000 === 0 && i > 0) console.log(` - Progress: ${i}`);
  }
  console.log('Done inserting fixed prescriptions!');
}

fix().catch(console.error);
