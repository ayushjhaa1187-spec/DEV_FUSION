const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xrbkoizxipphccxszbrj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmtvaXp4aXBwaGNjeHN6YnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1NDY2NSwiZXhwIjoyMDkxMzMwNjY1fQ.6dYZXHh4-MJleXyF0S3SEhsEOJvFLXvZc_jAwn4TOaE'
);

const uploaderId = '2f223305-ed75-432d-8031-46d6ef2efc64'; // ayushjhaa1187_3722

const newResources = [
  {
    title: "System Design & Architecture",
    description: "Master the art of building scalable, high-availability distributed systems.",
    subject_id: "f0f63791-fbd6-4ff3-a64f-03cfc9634100", // Machine Learning (repurposed for Tech)
    uploader_id: uploaderId,
    file_url: "https://example.com/system-design.pdf",
    file_type: "PDF",
    resource_type: "note"
  },
  {
    title: "Fullstack React Handbook",
    description: "The complete guide to building production-ready apps with React and Next.js.",
    subject_id: "1c07d977-0eeb-4bfa-baa2-b1df5b15bdb2", // DSA (repurposed for CS)
    uploader_id: uploaderId,
    file_url: "https://example.com/react-fullstack.pdf",
    file_type: "PDF",
    resource_type: "note"
  },
  {
    title: "Cognitive Psychology Volume 1",
    description: "Detailed notes on memory, perception, and neural linguistic processing.",
    subject_id: "6afa70dd-cb10-4c01-ba02-f55fb8f789ab", // Psychology
    uploader_id: uploaderId,
    file_url: "https://example.com/psych-notes.pdf",
    file_type: "PDF",
    resource_type: "note"
  },
  {
    title: "Advanced Calculus for Engineers",
    description: "Multivariable calculus, double integrals, and practical vector applications.",
    subject_id: "9d3d60b4-779a-4021-8ae4-d4725615605a", // Calculus
    uploader_id: uploaderId,
    file_url: "https://example.com/calculus-adv.pdf",
    file_type: "PDF",
    resource_type: "note"
  },
  {
    title: "20th Century Global Conflicts",
    description: "Comprehensive timeline and analysis of world wars and political shifts.",
    subject_id: "accb4705-d4d6-4986-b9f4-3dd52a769555", // History
    uploader_id: uploaderId,
    file_url: "https://example.com/history-global.pdf",
    file_type: "PDF",
    resource_type: "note"
  },
  {
    title: "Network Security & Cryptography",
    description: "Protecting data in transit with TLS, SSL, and modern encryption standards.",
    subject_id: "cdfdefe2-d776-4ff4-93aa-c57b3a503eb4", // Networks
    uploader_id: uploaderId,
    file_url: "https://example.com/net-security.pdf",
    file_type: "PDF",
    resource_type: "note"
  },
  {
    title: "Kernel Architecture & Scheduling",
    description: "Deep dive into OS kernels, thread management, and process synchronization.",
    subject_id: "b51cc189-3997-41aa-89f1-68a41ed00375", // OS
    uploader_id: uploaderId,
    file_url: "https://example.com/kernel-internals.pdf",
    file_type: "PDF",
    resource_type: "note"
  }
];

async function seed() {
  const { data, error } = await supabase.from('resources').insert(newResources);
  if (error) {
    console.error('Seed Error:', error);
  } else {
    console.log('Successfully seeded 7 new resources with valid subject IDs!');
  }
}

seed();
