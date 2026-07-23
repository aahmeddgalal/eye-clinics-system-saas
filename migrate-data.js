const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const tablesDir = path.join(__dirname, 'tables');

function readCSV(filename) {
  const content = fs.readFileSync(path.join(tablesDir, filename), 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true, bom: true });
}

function parseNum(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

async function migrate() {
  console.log('Loading CSVs...');
  const patientsCsv = readCSV('Patient.csv');
  const visitsCsv = readCSV('Visit.csv');
  const patientMedicinesCsv = readCSV('PatientMedicines.csv');
  const medicinesCsv = readCSV('Medicines.csv');
  const durationTypeCsv = readCSV('DurationType.csv');
  const relationToMealCsv = readCSV('RelationToMeal.csv');
  const diagnosisCsv = readCSV('Diagnosis.csv');
  const ipdCsv = readCSV('PatientGlassIPD.csv');
  const odCsv = readCSV('PatientGlassOD.csv');
  const osCsv = readCSV('PatientGlassOS.csv');

  console.log('Processing lookups...');
  const durationMap = Object.fromEntries(durationTypeCsv.map(d => [d.ID, d.Name]));
  const mealMap = Object.fromEntries(relationToMealCsv.map(m => [m.ID, m.Name.trim()]));
  const medicineMap = Object.fromEntries(medicinesCsv.map(m => [m.ID, m.Name]));
  const diagnosisMap = Object.fromEntries(diagnosisCsv.map(d => [d.ID, d.Name]));

  const ipdMap = Object.fromEntries(ipdCsv.map(m => [m.VisitID, m]));
  const odMap = Object.fromEntries(odCsv.map(m => [m.VisitID, m]));
  const osMap = Object.fromEntries(osCsv.map(m => [m.VisitID, m]));

  console.log('Inserting medications to catalog...');
  const newMedicationsMap = {}; 
  for (const med of medicinesCsv) {
    const { data: medData, error: medError } = await supabase.from('medications').insert({
      name: med.Name,
      active_ingredient: med.Concentration || null
    }).select('id').single();
    if (!medError && medData) {
      newMedicationsMap[med.ID] = medData.id;
    }
  }

  console.log('Calculating patient registration dates...');
  const patientFirstVisitDate = {};
  visitsCsv.forEach(v => {
    const date = new Date(v.VisitDate);
    if (!patientFirstVisitDate[v.PatientID] || date < patientFirstVisitDate[v.PatientID]) {
      patientFirstVisitDate[v.PatientID] = date;
    }
  });

  const oldToNewPatientMap = {};

  console.log(`Migrating ${patientsCsv.length} patients...`);
  for (const p of patientsCsv) {
    const createdAt = patientFirstVisitDate[p.ID] || new Date();
    
    // Notes mapping
    const notesParts = [
      p.Job ? `العمل: ${p.Job}` : null,
      p.Hypertension === '1' ? 'ضغط دم' : null,
      p.DM === '1' ? 'سكر' : null,
      p.MHOthers ? `أخرى: ${p.MHOthers}` : null,
      p.Medication ? `أدوية: ${p.Medication}` : null,
      p.AllergiesOthers ? `حساسية: ${p.AllergiesOthers}` : null
    ].filter(Boolean);

    const payload = {
      full_name: p.Name,
      age: parseNum(p.Age),
      gender: p.Sex === '1' ? 'male' : 'female',
      phone: p.Mobile || p.Telephone || null,
      address: p.Address || null,
      marital_status: p.MaritalStatus === '1' ? 'married' : 'single',
      notes: notesParts.join(' | ') || null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString()
    };

    const { data, error } = await supabase.from('patients').insert(payload).select('id').single();
    if (error) {
      console.error(`Error inserting patient ${p.ID}:`, error.message);
    } else {
      oldToNewPatientMap[p.ID] = data.id;
    }
  }

  console.log(`Migrating ${visitsCsv.length} visits, measurements, and prescriptions...`);
  let visitCount = 0;
  for (const v of visitsCsv) {
    const newPatientId = oldToNewPatientMap[v.PatientID];
    if (!newPatientId) continue;

    const visitDate = new Date(v.VisitDate).toISOString();
    
    // Create Visit
    const { data: visitData, error: visitError } = await supabase.from('visits').insert({
      patient_id: newPatientId,
      visit_date: visitDate,
      diagnosis: v.ComplaintData || diagnosisMap[v.DiagnosisID] || 'زيارة سابقة',
      created_at: visitDate,
      updated_at: visitDate
    }).select('id').single();

    if (visitError) {
      console.error(`Error inserting visit ${v.ID}:`, visitError.message);
      continue;
    }
    const newVisitId = visitData.id;
    visitCount++;
    if (visitCount % 1000 === 0) console.log(`Migrated ${visitCount} visits...`);

    // Create Diagnosis Link if exists
    if (v.DiagnosisID && diagnosisMap[v.DiagnosisID]) {
      const diagName = diagnosisMap[v.DiagnosisID];
      let { data: disData } = await supabase.from('diseases').select('id').eq('name', diagName).maybeSingle();
      if (!disData) {
        const { data: newDis } = await supabase.from('diseases').insert({ name: diagName }).select('id').single();
        disData = newDis;
      }
      if (disData) {
        await supabase.from('visit_diseases').insert({
          visit_id: newVisitId,
          disease_id: disData.id
        });
      }
    }

    // Create Prescriptions
    const medsForVisit = patientMedicinesCsv.filter(rx => rx.VisitID === v.ID);
    if (medsForVisit.length > 0) {
      const medications_data = medsForVisit.map(rx => {
        let dosage = rx.Dose || '';
        let duration = rx.Duration && rx.Duration !== '0' ? `${rx.Duration} ${durationMap[rx.DurationTypeID] || ''}`.trim() : '';
        let frequency = mealMap[rx.RelationToMealID] || '';
        return {
          medication_id: newMedicationsMap[rx.MedicineID] || null,
          name: medicineMap[rx.MedicineID] || `Unknown Med ${rx.MedicineID}`,
          dosage,
          frequency,
          duration
        };
      });

      await supabase.from('prescriptions').insert({
        patient_id: newPatientId,
        visit_id: newVisitId,
        medications_data: medications_data,
        created_at: visitDate,
        updated_at: visitDate
      });
    }

    // Create Eye Measurements
    const ipd = ipdMap[v.ID] || {};
    const od = odMap[v.ID] || {};
    const os = osMap[v.ID] || {};

    const hasMeasurements = Object.keys(ipd).length || Object.keys(od).length || Object.keys(os).length;
    if (hasMeasurements) {
      await supabase.from('eye_measurements').insert({
        patient_id: newPatientId,
        visit_id: newVisitId,
        right_sph: parseNum(od.S),
        right_cyl: parseNum(od.c),
        right_axis: parseNum(od.A),
        right_add: parseNum(od._Add),
        left_sph: parseNum(os.S),
        left_cyl: parseNum(os.c),
        left_axis: parseNum(os.A),
        left_add: parseNum(os._Add),
        ipd_distance: parseNum(ipd.Distance),
        ipd_near: parseNum(ipd.Near),
        created_at: visitDate,
        updated_at: visitDate
      });
    }
  }

  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
