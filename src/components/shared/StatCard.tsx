import { Icon, type IconName } from './Icon';

export const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 20,
  transition: 'border-color 0.15s',
};

interface StatCardProps {
  icon: IconName;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div
      style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: accent ?? 'var(--accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} color={accent ? 'var(--text-primary)' : 'var(--accent)'} />
        </div>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}
