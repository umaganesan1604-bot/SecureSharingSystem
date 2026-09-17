import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtitle = '' }) {
  const colorMap = {
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      text: '#818cf8',
      border: 'rgba(99, 102, 241, 0.25)',
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      text: '#22d3ee',
      border: 'rgba(6, 182, 212, 0.25)',
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    purple: {
      bg: 'rgba(168, 85, 247, 0.12)',
      text: '#c084fc',
      border: 'rgba(168, 85, 247, 0.25)',
    },
    rose: {
      bg: 'rgba(239, 68, 68, 0.12)',
      text: '#f87171',
      border: 'rgba(239, 68, 68, 0.25)',
    }
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-panel" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: currentTheme.bg,
            border: `1px solid ${currentTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentTheme.text
          }}>
            <Icon size={19} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1 }}>
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
