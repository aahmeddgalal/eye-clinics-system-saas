const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/trash/actions.js', 'utf8');
const lines = content.split(/\r?\n/);
let goodContent = lines.slice(0, 144).join('\n');

const goodEmpty = `

export async function emptyTrashAction() {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseAdmin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, adminKey)

  // 1. Delete all attachments files from storage
  const { data: attachments } = await supabaseAdmin.from('attachments').select('file_url').not('deleted_at', 'is', null)
  
  if (attachments && attachments.length > 0) {
    const filePaths = attachments
      .filter(a => a.file_url)
      .map(a => {
        const parts = a.file_url.split('patient-files/')
        return parts.length === 2 ? decodeURIComponent(parts[1]) : null
      })
      .filter(Boolean)
      
    if (filePaths.length > 0) {
      await supabaseAdmin.storage.from('patient-files').remove(filePaths)
    }
  }

  // 2. Delete rows from all tables (must respect foreign keys, so delete children first)
  const tables = ['attachments', 'patient_notes', 'eye_measurements', 'prescriptions', 'visit_diseases', 'visits', 'patients', 'diseases', 'medications']
  
  for (const table of tables) {
    await supabaseAdmin.from(table).delete().not('deleted_at', 'is', null)
  }

  revalidatePath('/dashboard/trash')
  revalidatePath('/dashboard')
  return { success: true }
}
`;

fs.writeFileSync('src/app/dashboard/trash/actions.js', goodContent + goodEmpty);
