'use client';

import React from 'react';

interface ReputationBadgeProps {
  points: number;
}

export default function ReputationBadge({ points }: ReputationBadgeProps) {
  // Rank logic
  const getRank = (pts: number) => {
    if (pts >= 1000) return { name: 'Sage', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    if (pts >= 500)  return { name: 'Scholar', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    if (pts >= 100)  return { name: 'Mentor', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
    return { name: 'Learner', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
  };

  const rank = getRank(points);

  return (
    <div 
      className="sb-rep-badge" 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        background: rank.bg,
        border: `1px solid ${rank.color}33`,
        color: rank.color,
        fontSize: '0.85rem',
        fontWeight: 600,
        boxShadow: `0 4px 12px ${rank.color}1a`
      }}
    >
      <span style={{ fontSize: '1rem' }}>🏆</span>
      <span>{points} pts</span>
      <span 
        style={{ 
          opacity: 0.6, 
          marginLeft: '4px', 
          borderLeft: `1px solid ${rank.color}44`,
          paddingLeft: '8px' 
        }}
      >
        {rank.name}
      </span>
    </div>
  );
}
