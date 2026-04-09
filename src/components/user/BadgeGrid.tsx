'use client';

import { ALL_BADGES } from '@/lib/reputation';
import styles from './BadgeGrid.module.css';
import { Lock, Award, CheckCircle2 } from 'lucide-react';

interface BadgeGridProps {
  points: number;
}

export default function BadgeGrid({ points }: BadgeGridProps) {
  return (
    <div className={styles.grid}>
      {ALL_BADGES.map((badge) => {
        const isUnlocked = points >= badge.requirement_points;
        const progress = Math.min(100, (points / badge.requirement_points) * 100);

        return (
          <div 
            key={badge.id} 
            className={`${styles.badgeCard} glass ${isUnlocked ? styles.unlocked : styles.locked}`}
          >
            <div className={styles.iconBox}>
              {isUnlocked ? (
                <span className={styles.icon}>{badge.icon}</span>
              ) : (
                <Lock className={styles.lockIcon} size={24} />
              )}
            </div>
            
            <div className={styles.badgeInfo}>
              <h4 className={styles.badgeName}>{badge.name}</h4>
              <p className={styles.badgeDesc}>{badge.description}</p>
              
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>
                    {isUnlocked ? 'Requirement Met' : `${points} / ${badge.requirement_points} pts`}
                  </span>
                  {isUnlocked && <CheckCircle2 size={14} className={styles.check} />}
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            </div>

            {isUnlocked && (
              <div className={styles.awardBanner}>
                <Award size={14} /> Earned
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
