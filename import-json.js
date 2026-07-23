require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const migrationDir = path.join(__dirname, 'migration_json');

function readJSON(filename) {
  const filepath = path.join(migrationDir, filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return [];
}

async function insertInBatches(tableName, data, batchSize = 500) {
  if (!data || data.length === 0) return;
  console.log(`Inserting ${data.length} records into [${tableName}] in batches of ${batchSize}...`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).insert(chunk);
    
    if (error) {
      console.error(`Error inserting into ${tableName} at index ${i}:`, error.message);
      // Depending on constraints, some might fail if already exists. But DB should be empty.
    }
    if (i % 5000 === 0 && i > 0) {
      console.log(` - Progress: ${i} / ${data.length} (${tableName})`);
    }
  }
  console.log(`Done inserting into [${tableName}].`);
}

async function runImport() {
  console.log('Loading JSON files...');
  
  const patients = readJSON('patients.json');
  const visits = readJSON('visits.json');
  const diseases = readJSON('diseases.json');
  const visitDiseases = readJSON('visit_diseases.json');
  const medications = readJSON('medications.json');
  const prescriptions = readJSON('prescriptions.json');
  const eyeMeasurements = readJSON('eye_measurements.json');

  console.log('Starting Supabase Import. Please wait...');

  // Order of insertion is critical to satisfy Foreign Key constraints.
  // 1. Independent entities
  await insertInBatches('patients', patients);
  await insertInBatches('diseases', diseases);
  await insertInBatches('medications', medications);

  // 2. First-level dependencies (depend on patients)
  await insertInBatches('visits', visits);

  // 3. Second-level dependencies (depend on visits, diseases, medications)
  await insertInBatches('visit_diseases', visitDiseases);
  await insertInBatches('prescriptions', prescriptions);
  await insertInBatches('eye_measurements', eyeMeasurements);

  console.log('Import successfully completed!');
}

runImport().catch(console.error);
