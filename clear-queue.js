require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function clear() {
  console.log('Clearing todays_queue...');
  const { error } = await supabase.from('todays_queue').delete().not('id', 'is', null);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Done!');
  }
}

clear();
