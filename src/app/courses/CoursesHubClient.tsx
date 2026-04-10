'use client';

import React, { useState } from 'react';
import { Clock, Star, Search } from 'lucide-react';
import Link from 'next/link';
import styles from './courses.module.css';

const courses = [
  {
    id: 'dsa-mastery',
    title: 'Data Structures & Algorithms Mastery',
    instructor: 'Abdul Bari',
    duration: '45 Hours',
    rating: 4.9,
    students: 12400,
    tags: ['Computer Science', 'Placement'],
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2128&auto=format&fit=crop'
  },
  {
    id: 'system-design',
    title: 'Advanced System Design for Scale',
    instructor: 'Gaurav Sen',
    duration: '22 Hours',
    rating: 4.8,
    students: 8900,
    tags: ['Architecture', 'Scaling'],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
  },
  {
    id: 'os-internals',
    title: 'Operating Systems: Internal Perspective',
    instructor: 'Gate Smashers',
    duration: '38 Hours',
    rating: 4.7,
    students: 15000,
    tags: ['Core CS', 'University'],
    image: 'https://images.unsplash.com/photo-1518433278981-1127cc584102?q=80&w=2128&auto=format&fit=crop'
  },
];

const CATEGORIES = ['All', 'Core CS', 'Development', 'Placement'];

export default function CoursesHubClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCategory === 'All' || c.tags.includes(activeCategory);
    return matchSearch && matchCat;
  });

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.badge}>Curated Learning</div>
        <h1 className={styles.title}>Educational Vault</h1>
        <p className={styles.subtitle}>
          Master core engineering concepts with curated multi-module video courses delivered by specialized academics.
        </p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search lectures, masters, or subjects..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterTabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`${styles.filterTab} ${activeCategory === cat ? styles.filterTabActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`} className={styles.card}>
            <img src={course.image} alt={course.title} className={styles.cardImage} />
            <div className={styles.cardBody}>
              <div className={styles.cardTags}>
                {course.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              <h3 className={styles.cardTitle}>{course.title}</h3>
              <p className={styles.cardInstructor}>By {course.instructor}</p>
              <div className={styles.cardMeta}>
                {course.duration && (
                  <span className={styles.metaItem}>
                    <Clock size={13} /> {course.duration}
                  </span>
                )}
                <span className={styles.metaItem}>
                  <Star size={13} className={styles.metaStar} /> {course.rating}
                </span>
                <span className={styles.metaItem}>
                  {course.students.toLocaleString()} students
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.ctaSection}>
        <h3 className={styles.ctaTitle}>Want to teach?</h3>
        <p className={styles.ctaText}>
          The best way to learn is to teach. Join our mentor network and build your academic influence.
        </p>
        <span className={styles.ctaBadge}>Educator Dashboard Coming Soon</span>
      </div>
    </main>
  );
}
