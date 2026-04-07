import { getRank, getUnlockedBadges } from '@/lib/reputation';
import styles from './ReputationBadge.module.css';

interface ReputationBadgeProps {
  points: number;
  showBadges?: boolean;
}

export default function ReputationBadge({ points, showBadges = false }: ReputationBadgeProps) {
  const rank = getRank(points);
  const unlockedBadges = getUnlockedBadges(points);

  return (
    <div className={styles.badgeContainer}>
      <div className={styles.rankInfo}>
        <span className={styles.points}>{points} pts</span>
        <span className={styles.rankBadge}>{rank}</span>
      </div>
      {showBadges && unlockedBadges.length > 0 && (
        <div className={styles.badges}>
          {unlockedBadges.slice(0, 3).map(badge => (
            <span key={badge.id} title={badge.name} className={styles.badgeIcon}>
              {badge.icon}
            </span>
          ))}
          {unlockedBadges.length > 3 && (
            <span className={styles.moreBadges}>+{unlockedBadges.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
