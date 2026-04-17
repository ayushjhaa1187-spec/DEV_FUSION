const { createClient } = require('@supabase/supabase-js');

const url = 'https://xrbkoizxipphccxszbrj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4aXBwaGNjeHN6YnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1NDY2NSwiZXhwIjoyMDkxMzMwNjYxfQ.6dYZXHh4-MJleXyF0S3SEhsEOJvFLXvZc_jAwn4TOaE';

const supabase = createClient(url, key);

async function test() {
    console.log('Testing hardcoded service role key...');
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! Users found:', data.users.length);
    }
}

test();
