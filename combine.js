const fs = require('fs');
const path = require('path');

const order = [
    'database_schema.sql',
    'patient_notes_migration.sql',
    'prescription_jsonb_migration.sql',
    'architecture_migration.sql',
    'rpc_create_visit_migration.sql',
    'eye_measurements_migration.sql',
    'migration_add_description_to_attachments.sql',
    'migration_add_visit_id_to_notes.sql',
    'announcements_dates_migration.sql',
    'soft_delete_migration.sql',
    'qa_fixes_migration.sql',
    'cascade_soft_delete_migration.sql',
    'fix_patient_notes_rls.sql',
    'search_index_migration.sql',
    'fix_hard_delete_rls_migration.sql',
    'fix_rpc_security_migration.sql',
    'fix_storage_security_migration.sql',
    'security_audit_fixes_migration.sql'
];

let combined = '';

for (const file of order) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file);
        
        // Convert to string properly handling utf16le if present
        let str = '';
        if (content.length >= 2 && content[0] === 0xFF && content[1] === 0xFE) {
            str = content.toString('utf16le');
        } else {
            str = content.toString('utf8');
        }
        
        combined += `-- =========================================================================\n`;
        combined += `-- FILE: ${file}\n`;
        combined += `-- =========================================================================\n\n`;
        combined += str.trim();
        combined += '\n\n';
    } else {
        console.error(`Missing file: ${file}`);
    }
}

fs.writeFileSync('saas_init_schema.sql', combined, 'utf8');
console.log('Combined files into saas_init_schema.sql');
