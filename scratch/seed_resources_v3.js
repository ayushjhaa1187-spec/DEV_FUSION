const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrbkoizxipphccxszbrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4aXBwaGNjeHN6YnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1NDY2NSwiZXhwIjoyMDkxMzMwNjY1fQ.6dYZXHh4-MJleXyF0S3SEhsEOJvFLXvZc_jAwn4TOaE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Contributor: ayushjhaa1187
const CONTRIBUTOR_ID = 'bd1baa6a-ccb3-443f-80b4-7025c6194c81';

const resources = [
  {
    title: "DSA Mastery Roadmap",
    description: "A complete guide to mastering Data Structures and Algorithms for FAANG interviews. Covers Arrays to Dynamic Programming.",
    subject_id: "1c07d977-0eeb-4bfa-baa2-b1df5b15bdb2", // DSA
    file_url: "https://www.geeksforgeeks.org/complete-roadmap-to-learn-dsa-from-scratch/",
    file_type: "PDF",
    uploader_id: CONTRIBUTOR_ID
  },
  {
    title: "Operating Systems Deep Dive",
    description: "Lecture notes on process synchronization, deadlocks, and memory management policies. Essential for OS exams.",
    subject_id: "b51cc189-3997-41aa-89f1-68a41ed00375", // OS
    file_url: "https://www.tutorialspoint.com/operating_system/index.htm",
    file_type: "PDF",
    uploader_id: CONTRIBUTOR_ID
  },
  {
    title: "SQL Performance Tuning",
    description: "Advanced techniques for optimizing database queries, understanding execution plans, and indexing strategies.",
    subject_id: "cdfdefe2-d776-4ff4-93aa-c57b3a503eb4", // DBMS
    file_url: "https://use-the-index-luke.com/",
    file_type: "PDF",
    uploader_id: CONTRIBUTOR_ID
  },
  {
    title: "Computer Networks Protocols",
    description: "Visualization of TCP/IP handshakes, HTTP/3, and DNS resolution flows.",
    subject_id: "cdfdefe2-d776-4ff4-93aa-c57b3a503eb4", // Networks
    file_url: "https://www.netacad.com/",
    file_type: "PDF",
    uploader_id: CONTRIBUTOR_ID
  },
  {
    title: "Machine Learning Primer",
    description: "Introductory notes on supervised vs unsupervised learning, bias-variance tradeoff, and neural network basics.",
    subject_id: "f0f63791-fbd6-4ff3-a64f-03cfc9634100", // ML
    file_url: "https://scikit-learn.org/stable/tutorial/basic/tutorial.html",
    file_type: "PDF",
    uploader_id: CONTRIBUTOR_ID
  }
];

async function seed() {
  console.log('Seeding resources...');
  const { data, error } = await supabase.from('resources').insert(resources);
  if (error) console.error('Error seeding resources:', error.message);
  else console.log('Successfully seeded resources!');
}

seed();
