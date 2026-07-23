const fs = require('fs');
const path = require('path');

const actionsFiles = [
  'src/app/dashboard/announcements/actions.js',
  'src/app/dashboard/attachments/actions.js',
  'src/app/dashboard/diseases/actions.js',
  'src/app/dashboard/medications/actions.js',
  'src/app/dashboard/patients/actions.js',
  'src/app/dashboard/queue/actions.js',
  'src/app/dashboard/search/actions.js',
  'src/app/dashboard/trash/actions.js',
  'src/app/dashboard/visits/actions.js'
];

actionsFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace import
  content = content.replace(
    /import\s+{\s*createClient\s*}\s+from\s+['"]@\/utils\/supabase\/server['"]/g,
    "import { createClient, requireAuth } from '@/utils/supabase/server'"
  );

  // Replace const supabase = await createClient() inside actions
  // Only replace inside functions exported, but actually replacing all occurrences inside action functions is safer
  // A simple regex might be tricky if it's used differently, but let's assume it's always `const supabase = await createClient()`
  content = content.replace(
    /const\s+supabase\s*=\s*await\s+createClient\(\)/g,
    "const { supabase } = await requireAuth()"
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Fixed', file);
});
