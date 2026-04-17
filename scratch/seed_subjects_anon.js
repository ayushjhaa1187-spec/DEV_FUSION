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

const subjects = [
    { name: 'Data Structures & Algorithms', code: 'DS101', description: 'Core computer science concepts' },
    { name: 'Operating Systems', code: 'CS302', description: 'Processes and memory management' },
    { name: 'Computer Networks', code: 'CN401', description: 'TCP/IP and routing' }
];

async function seed() {
    console.log('Attempting to seed subjects with ANON key...');
    const { data, error } = await supabase.from('subjects').insert(subjects).select();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Successfully seeded:', data.length, 'subjects');
    }
}

seed();
