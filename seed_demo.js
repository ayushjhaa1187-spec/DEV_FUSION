const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoUser() {
  const email = 'judge@skillbridge.edu';
  const password = 'skillbridge2026';
  const fullName = 'SkillBridge Judge';
  const username = 'judge_sb';

  console.log(`Checking for demo user: ${email}...`);

  // 1. Create User in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in Auth.');
    } else {
      console.error('Auth error:', authError.message);
      return;
    }
  }

  // 2. Get User ID
  const { data: userList } = await supabase.auth.admin.listUsers();
  const user = userList.users.find(u => u.email === email);
  if (!user) {
    console.error('Failed to find user after creation');
    return;
  }

  console.log(`User ID: ${user.id}`);

  // 3. Upsert Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: email,
      full_name: fullName,
      username: username,
      role: 'admin',
      reputation_points: 500,
      onboarded: true,
      college: 'SkillBridge Institute',
      branch: 'Computer Science',
      semester: 6
    });

  if (profileError) {
    console.error('Profile error:', profileError.message);
  } else {
    console.log('Profile created/updated with ADMIN role.');
  }

  // 4. Create Mentor Profile (so they appearing in mentor directory)
  const { error: mentorError } = await supabase
    .from('mentor_profiles')
    .upsert({
      id: user.id,
      specialty: 'Full Stack Development & System Design',
      bio: 'Technical Judge for SkillBridge. Expert in Next.js and Supabase.',
      price_per_session: 0,
      rating: 5.0,
      sessions_completed: 42,
      availability_type: 'flexible'
    });

  if (mentorError) {
    console.error('Mentor profile error:', mentorError.message);
  } else {
    console.log('Mentor profile created.');
  }

  console.log('Demo user seeding complete!');
}

seedDemoUser();
