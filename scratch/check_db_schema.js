const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrbkoizxipphccxszbrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4aXBwaGNjeHN6YnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1NDY2NSwiZXhwIjoyMDkxMzMwNjY1fQ.6dYZXHh4-MJleXyF0S3SEhsEOJvFLXvZc_jAwn4TOaE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- Checking Subscriptions Table ---');
  const { data: subData, error: subError } = await supabase.from('subscriptions').select('*').limit(1);
  if (subError) console.error('Subscriptions Error:', subError.message);
  else console.log('Subscriptions Columns:', Object.keys(subData[0] || {}));

  console.log('\n--- Checking Resources Table ---');
  const { data: resData, error: resError } = await supabase.from('resources').select('*').limit(1);
  if (resError) console.error('Resources Error:', resError.message);
  else console.log('Resources Count:', resData.length);

  console.log('\n--- Checking Mentor Applications Table ---');
  const { data: mentData, error: mentError } = await supabase.from('mentor_applications').select('*').limit(1);
  if (mentError) console.error('Mentor Apps Error:', mentError.message);
  else console.log('Mentor Apps Columns:', Object.keys(mentData[0] || {}));
  
  console.log('\n--- Checking Subjects Table ---');
  const { data: subjData, error: subjError } = await supabase.from('subjects').select('*');
  if (subjError) console.error('Subjects Error:', subjError.message);
  else console.log('Subjects:', subjData.map(s => s.name));
}

checkSchema();
