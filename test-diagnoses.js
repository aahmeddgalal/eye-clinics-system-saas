require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function testQuery() {
  const { data: visits, error } = await supabase
    .from('visits')
    .select(`
      id,
      visit_diseases (
        disease_id,
        diseases ( name )
      )
    `)
    .limit(5);
    
  console.log('Error:', error);
  console.log('Visits:', JSON.stringify(visits, null, 2));
}

testQuery();
