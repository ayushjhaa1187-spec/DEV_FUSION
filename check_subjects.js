const { createClient } = require('@supabase/supabase-js');
const url = 'https://xrbkoizxipphccxszbrj.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4YXBwaGNjeHN6YnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTQ2NjUsImV4cCI6MjA5MTMzMDY2NX0.tcyldQupH5OF9-PvMcZTBisudjvRefVHqZZRZpWEews';
const roleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4YXBwaGNjeHN6YnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1NDY2NSwiZXhwIjoyMDkxMzMwNjY1fQ.6dYZXHh4-MJleXyF0S3SEhsEOJvFLXvZc_jAwn4TOaE';

const anonClient = createClient(url, anonKey);
const adminClient = createClient(url, roleKey);

async function run() {
  console.log("Anon Result:", await anonClient.from('subjects').select('*'));
  console.log("Admin Result:", await adminClient.from('subjects').select('*'));
}
run();
