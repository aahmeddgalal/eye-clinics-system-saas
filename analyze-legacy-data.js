const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const tablesDir = path.join(__dirname, 'tables');

function readCSV(filename) {
  try {
    const content = fs.readFileSync(path.join(tablesDir, filename), 'utf-8');
    return parse(content, { columns: true, skip_empty_lines: true, bom: true });
  } catch (e) {
    console.error('Error reading', filename, e.message);
    return [];
  }
}

function runAnalysis() {
  const patients = readCSV('Patient.csv');
  const visits = readCSV('Visit.csv');
  const rx = readCSV('PatientMedicines.csv');
  const medicines = readCSV('Medicines.csv');
  const durationTypes = readCSV('DurationType.csv');
  const meals = readCSV('RelationToMeal.csv');
  const dx = readCSV('Diagnosis.csv');
  const ipd = readCSV('PatientGlassIPD.csv');
  const od = readCSV('PatientGlassOD.csv');
  const os = readCSV('PatientGlassOS.csv');

  console.log(`Loaded ${patients.length} patients, ${visits.length} visits.`);
  
  const report = {
    totalPatients: patients.length,
    totalVisits: visits.length,
    totalMedicines: medicines.length,
    anomalies: {
      futureDates: 0,
      missingPatients: 0,
      missingVisits: 0,
      orphanMeasurements: 0,
      duplicateMeasurements: 0
    }
  };

  const patientIds = new Set(patients.map(p => p.ID));
  const visitIds = new Set(visits.map(v => v.ID));

  const now = new Date();

  // Validate visits
  visits.forEach(v => {
    if (!patientIds.has(v.PatientID)) {
      report.anomalies.missingPatients++;
    }
    const d = new Date(v.VisitDate);
    if (d > now) {
      report.anomalies.futureDates++;
    }
  });

  // Validate measurements
  const checkMeasurements = (arr) => {
    const seen = new Set();
    arr.forEach(m => {
      if (!visitIds.has(m.VisitID)) report.anomalies.orphanMeasurements++;
      if (seen.has(m.VisitID)) report.anomalies.duplicateMeasurements++;
      seen.add(m.VisitID);
    });
  };
  checkMeasurements(ipd);
  checkMeasurements(od);
  checkMeasurements(os);

  console.log(JSON.stringify(report, null, 2));
}

runAnalysis();
