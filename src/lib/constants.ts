export const COURSE_DATA: Record<string, any> = {
  'dsa-mastery': {
    title: 'Data Structures & Algorithms Mastery',
    instructor: 'Abdul Bari',
    rating: 4.9,
    students: 12400,
    duration: '45 Hours',
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2128&auto=format&fit=crop',
    description: 'A comprehensive deep-dive into every critical data structure and algorithm concept needed for cracking product-based company interviews and university examinations.',
    outcomes: ['Solve any array/tree/graph problem with confidence', 'Understand time and space complexity intuitively', 'Implement all core sorting & searching algorithms', 'Ace placement rounds at FAANG-tier companies'],
    playlist: 'PL2_aWCzGMAwI3W_JlcBbtYTQAn7-tc6Yx',
    modules: [
      { id: 1, title: 'Arrays & Hashing', duration: '3.5 hrs', free: true },
      { id: 2, title: 'Two Pointers & Sliding Window', duration: '2 hrs', free: true },
      { id: 3, title: 'Stack & Queue Deep Dive', duration: '2.5 hrs', free: false },
      { id: 4, title: 'Binary Search Mastery', duration: '3 hrs', free: false },
      { id: 5, title: 'Trees — BFS & DFS', duration: '4 hrs', free: false },
      { id: 6, title: 'Graphs & Traversals', duration: '4.5 hrs', free: false },
      { id: 7, title: 'Dynamic Programming', duration: '6 hrs', free: false },
    ]
  },
  'system-design': {
    title: 'Advanced System Design for Scale',
    instructor: 'Gaurav Sen',
    rating: 4.8,
    students: 8900,
    duration: '22 Hours',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    description: 'Design distributed systems at the scale of millions. From load balancers to consistent hashing, master every component of modern system architecture.',
    outcomes: ['Design Twitter, YouTube, WhatsApp from scratch', 'Understand CAP theorem in production context', 'Implement caching strategies for high traffic', 'Navigate system design interviews with confidence'],
    playlist: 'PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX',
    modules: [
      { id: 1, title: 'Scalability Principles', duration: '2 hrs', free: true },
      { id: 2, title: 'Load Balancing Strategies', duration: '1.5 hrs', free: true },
      { id: 3, title: 'Database Sharding', duration: '2 hrs', free: false },
      { id: 4, title: 'Caching & CDNs', duration: '2.5 hrs', free: false },
      { id: 5, title: 'Message Queues', duration: '2 hrs', free: false },
    ]
  },
  'os-internals': {
    title: 'Operating Systems: Internal Perspective',
    instructor: 'Gate Smashers',
    rating: 4.7,
    students: 15000,
    duration: '18 Hours',
    image: 'https://images.unsplash.com/photo-1518433278981-1127cc584102?q=80&w=2128&auto=format&fit=crop',
    description: 'Dive deep into OS internals — process scheduling, memory management, deadlocks, and file systems — with exam-oriented conceptual reinforcement.',
    outcomes: ['Master CPU scheduling algorithms', 'Understand virtual memory & paging', 'Solve deadlock detection & prevention problems', 'Ace GATE and university OS exams'],
    playlist: 'PLmXKhU9FNesSFvj6gASuWmQd23Ul5omtD',
    modules: [
      { id: 1, title: 'Processes & Threads', duration: '2 hrs', free: true },
      { id: 2, title: 'CPU Scheduling Algorithms', duration: '2.5 hrs', free: true },
      { id: 3, title: 'Memory Management', duration: '3 hrs', free: false },
      { id: 4, title: 'Virtual Memory & Paging', duration: '2.5 hrs', free: false },
      { id: 5, title: 'Deadlocks', duration: '2 hrs', free: false },
      { id: 6, title: 'File Systems', duration: '2 hrs', free: false },
    ]
  }
};
