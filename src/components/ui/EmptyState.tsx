import React from 'react';

interface EmptyStateProps {
  icon: string;        // emoji or icon name
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state" style={{
      textAlign: 'center',
      padding: 'var(--space-12) var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }}>
      <div className="empty-state-icon" style={{ fontSize: '3rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
