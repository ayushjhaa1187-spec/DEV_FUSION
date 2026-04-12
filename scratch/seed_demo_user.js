const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Reading .env.local from:', envPath);
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedUser() {
  const email = 'judge@skillbridge.edu';
  const password = 'skillbridge2026';

  console.log(`Checking for user: ${email}...`);
  console.log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    let user = users.find(u => u.email === email);

    if (!user) {
      console.log('User not found. Creating...');
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Judge Account' }
      });

      if (error) {
        console.error('Error creating user:', error);
        return;
      }
      user = data.user;
      console.log('User created successfully!');
    } else {
      console.log('User already exists.');
      
      // Ensure password is correct
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password
      });
      if (updateError) console.error('Error updating password:', updateError);
      else console.log('Password synced.');
    }

    // Ensure profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      console.log('Profile missing. Creating...');
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: 'judge_demo',
          full_name: 'Judge Account',
          role: 'admin',
          reputation_points: 1000
        });
      if (insertError) console.error('Error creating profile:', insertError);
      else console.log('Profile created.');
    } else {
      console.log('Profile exists.');
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

seedUser();
