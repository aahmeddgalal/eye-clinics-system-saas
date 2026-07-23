const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');

const tablesDir = path.join(__dirname, 'tables');
const outputDir = path.join(__dirname, 'migration_json');

function readCSV(filename) {
  try {
    const content = fs.readFileSync(path.join(tablesDir, filename), 'utf-8');
    return parse(content, { columns: true, skip_empty_lines: true, bom: true });
  } catch (e) {
    console.error('Error reading', filename, e.message);
    return [];
  }
}

function parseNum(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function generateUUID() {
  return crypto.randomUUID();
}

async function run() {
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

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const report = {
    anomalies: {
      futureDatesCorrected: 0,
      orphanMeasurementsDiscarded: 0,
      visitsWithoutPatientsDiscarded: 0
    },
    logs: []
  };

  const now = new Date();
  
  // 1. Lookups
  const durationMap = Object.fromEntries(durationTypeCsv.map(d => [d.ID, d.Name]));
  const mealMap = Object.fromEntries(relationToMealCsv.map(m => [m.ID, m.Name.trim()]));
  const medicineMap = Object.fromEntries(medicinesCsv.map(m => [m.ID, m.Name]));
  const diagnosisMap = Object.fromEntries(diagnosisCsv.map(d => [d.ID, d.Name]));

  // 2. Pre-process Dates
  console.log('Validating dates...');
  const patientEarliestVisit = {};
  visitsCsv.forEach(v => {
    let d = new Date(v.VisitDate);
    if (d > now) {
      report.anomalies.futureDatesCorrected++;
      report.logs.push(`Corrected future date ${v.VisitDate} to ${now.toISOString()} for VisitID ${v.ID}`);
      d = now;
      v.VisitDate = d.toISOString();
    }
    if (!patientEarliestVisit[v.PatientID] || d < patientEarliestVisit[v.PatientID]) {
      patientEarliestVisit[v.PatientID] = d;
    }
  });

  // 3. Process Patients
  console.log('Processing Patients...');
  const patientsOut = [];
  const oldPatientIdToUUID = {};
  
  patientsCsv.forEach(p => {
    const uuid = generateUUID();
    oldPatientIdToUUID[p.ID] = uuid;

    const createdAt = patientEarliestVisit[p.ID] || now;

    const notesParts = [
      p.Job ? `العمل: ${p.Job}` : null,
      p.Hypertension === '1' ? 'ضغط دم' : null,
      p.DM === '1' ? 'سكر' : null,
      p.MHOthers ? `أخرى: ${p.MHOthers}` : null,
      p.Medication ? `أدوية: ${p.Medication}` : null,
      p.AllergiesOthers ? `حساسية: ${p.AllergiesOthers}` : null
    ].filter(Boolean);

    patientsOut.push({
      id: uuid,
      full_name: p.Name,
      age: parseNum(p.Age) !== null ? Math.round(parseNum(p.Age)) : null,
      gender: p.Sex === '1' ? 'Male' : (p.Sex === '0' ? 'Female' : null),
      phone: p.Mobile || p.Telephone || null,
      address: p.Address || null,
      marital_status: p.MaritalStatus === '1' ? 'Single' : (p.MaritalStatus === '0' ? 'Married' : null),
      notes: notesParts.join(' | ') || null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString()
    });
  });

  // 4. Process Visits & Diseases
  console.log('Processing Visits & Diseases...');
  const visitsOut = [];
  const oldVisitIdToUUID = {};
  const diseasesOut = [];
  const diseaseNameToUUID = {};
  const visitDiseasesOut = [];

  visitsCsv.forEach(v => {
    const patientUUID = oldPatientIdToUUID[v.PatientID];
    if (!patientUUID) {
      report.anomalies.visitsWithoutPatientsDiscarded++;
      report.logs.push(`Discarded VisitID ${v.ID} because PatientID ${v.PatientID} not found.`);
      return;
    }
    
    const visitUUID = generateUUID();
    oldVisitIdToUUID[v.ID] = visitUUID;
    const visitDate = new Date(v.VisitDate).toISOString();

    const diagnosisText = v.ComplaintData || diagnosisMap[v.DiagnosisID] || 'زيارة سابقة';

    visitsOut.push({
      id: visitUUID,
      patient_id: patientUUID,
      visit_date: visitDate,
      diagnosis: diagnosisText,
      created_at: visitDate,
      updated_at: visitDate
    });

    if (v.DiagnosisID && diagnosisMap[v.DiagnosisID]) {
      const diagName = diagnosisMap[v.DiagnosisID];
      if (!diseaseNameToUUID[diagName]) {
        const disUUID = generateUUID();
        diseaseNameToUUID[diagName] = disUUID;
        diseasesOut.push({
          id: disUUID,
          name: diagName,
          created_at: now.toISOString()
        });
      }
      visitDiseasesOut.push({
        visit_id: visitUUID,
        disease_id: diseaseNameToUUID[diagName]
      });
    }
  });

  // 5. Process Medications and Prescriptions
  console.log('Processing Prescriptions...');
  const medicationsOut = [];
  const oldMedIdToUUID = {};
  
  medicinesCsv.forEach(m => {
    const medUUID = generateUUID();
    oldMedIdToUUID[m.ID] = medUUID;
    medicationsOut.push({
      id: medUUID,
      name: m.Name,
      created_at: now.toISOString()
    });
  });

  const prescriptionsOut = [];
  const visitMeds = {};

  patientMedicinesCsv.forEach(rx => {
    const visitUUID = oldVisitIdToUUID[rx.VisitID];
    if (!visitUUID) return; // Visit was discarded or orphan

    if (!visitMeds[visitUUID]) visitMeds[visitUUID] = [];

    const medName = medicineMap[rx.MedicineID] || `Unknown Med ${rx.MedicineID}`;
    const dose = rx.Dose || '';
    const duration = rx.Duration && rx.Duration !== '0' ? `${rx.Duration} ${durationMap[rx.DurationTypeID] || ''}`.trim() : '';
    const frequency = mealMap[rx.RelationToMealID] || '';
    const medId = oldMedIdToUUID[rx.MedicineID] || null;

    visitMeds[visitUUID].push({
      medication_id: medId,
      name: medName,
      dosage: dose,
      frequency: frequency,
      duration: duration,
      relation_to_meal: frequency,
      instructions: ""
    });
  });

  for (const visitUUID of Object.keys(visitMeds)) {
    const medsData = visitMeds[visitUUID];
    const visitObj = visitsOut.find(v => v.id === visitUUID);
    
    if (visitObj) {
      prescriptionsOut.push({
        id: generateUUID(),
        patient_id: visitObj.patient_id,
        visit_id: visitUUID,
        medications_data: medsData,
        created_at: visitObj.visit_date,
        updated_at: visitObj.visit_date
      });
    }
  }

  // 6. Process Eye Measurements
  console.log('Processing Eye Measurements...');
  const eyeMeasurementsOut = [];
  const ipdMap = Object.fromEntries(ipdCsv.map(m => [m.VisitID, m]));
  const odMap = Object.fromEntries(odCsv.map(m => [m.VisitID, m]));
  const osMap = Object.fromEntries(osCsv.map(m => [m.VisitID, m]));
  
  const allMeasurementVisitIds = new Set([
    ...ipdCsv.map(m => m.VisitID),
    ...odCsv.map(m => m.VisitID),
    ...osCsv.map(m => m.VisitID)
  ]);

  allMeasurementVisitIds.forEach(oldVisitId => {
    const visitUUID = oldVisitIdToUUID[oldVisitId];
    if (!visitUUID) {
      report.anomalies.orphanMeasurementsDiscarded++;
      report.logs.push(`Discarded measurements for orphan VisitID ${oldVisitId}`);
      return;
    }
    
    const visitObj = visitsOut.find(v => v.id === visitUUID);
    const ipd = ipdMap[oldVisitId] || {};
    const od = odMap[oldVisitId] || {};
    const os = osMap[oldVisitId] || {};

    eyeMeasurementsOut.push({
      id: generateUUID(),
      patient_id: visitObj.patient_id,
      visit_id: visitUUID,
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
      created_at: visitObj.visit_date,
      updated_at: visitObj.visit_date
    });
  });

  // 7. Write to JSON
  console.log('Writing JSON files...');
  fs.writeFileSync(path.join(outputDir, 'patients.json'), JSON.stringify(patientsOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'visits.json'), JSON.stringify(visitsOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'diseases.json'), JSON.stringify(diseasesOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'visit_diseases.json'), JSON.stringify(visitDiseasesOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'medications.json'), JSON.stringify(medicationsOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'prescriptions.json'), JSON.stringify(prescriptionsOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'eye_measurements.json'), JSON.stringify(eyeMeasurementsOut, null, 2));
  fs.writeFileSync(path.join(outputDir, 'patient_notes.json'), JSON.stringify([], null, 2));
  fs.writeFileSync(path.join(outputDir, 'attachments.json'), JSON.stringify([], null, 2));
  fs.writeFileSync(path.join(outputDir, 'migration_report.json'), JSON.stringify(report, null, 2));

  console.log('JSON Generation Complete! Files are in `migration_json/`.');
}

run().catch(console.error);
