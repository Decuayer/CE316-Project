import { statusConfig, type ResultStatus } from '@/lib/mockData';

interface StatusBadgeProps {
  status: ResultStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c =
    (statusConfig as Record<string, { color: string; bg: string; label: string }>)[status] ?? {
      color: 'var(--text-muted)',
      bg: 'var(--bg-tertiary)',
      label: status,
    };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        color: c.color,
        background: c.bg,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {c.label}
    </span>
  );
}
