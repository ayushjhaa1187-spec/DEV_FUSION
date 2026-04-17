const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
lines.forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
    console.log('Inspecting user_role enum...');
    // We can't query pg_type easily via anon key if RLS/Permissions block it, but let's try a RPC or a raw query if possible (prob not)
    // Instead, let's try to find it in the migrations or assume based on what we saw.
    
    // Actually, let's just try to update a profile to 'organization' and see if it fails.
    // But we need service role for that.
    
    // Let's try to query public.subjects to see if everything is seeded.
    const { data: subjects } = await supabase.from('subjects').select('name');
    console.log('Subjects seeded:', subjects ? subjects.length : 'Error');
    if (subjects) subjects.slice(0, 5).forEach(s => console.log('- ', s.name));
}

test();
