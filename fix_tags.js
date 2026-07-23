const fs = require('fs');
function fix(f) {
  let c = fs.readFileSync(f, 'utf8');
  let p = c.split('< suppressHydrationWarning');
  let out = p[0];
  for(let i=1; i<p.length; i++) {
    let peek = p[i].substring(0, 250);
    if(peek.includes('type="button"') || peek.includes('type="submit"')) {
      out += '<button suppressHydrationWarning' + p[i];
    } else if(peek.includes('rows={') || peek.includes('rows="')) {
      out += '<textarea suppressHydrationWarning' + p[i];
    } else {
      out += '<input suppressHydrationWarning' + p[i];
    }
  }
  fs.writeFileSync(f, out);
}
fix('src/components/visits/NewVisitForm.js');
fix('src/components/patients/PatientPrescriptionsList.js');
