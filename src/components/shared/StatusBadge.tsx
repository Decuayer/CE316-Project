import type { StudentStatus } from '@shared/types';

const statusConfig: Record<StudentStatus, { color: string; bg: string; label: string }> = {
  pass:           { color: 'var(--green)',  bg: 'var(--green-dim)',  label: 'Pass' },
  fail:           { color: 'var(--red)',    bg: 'var(--red-dim)',    label: 'Fail' },
  compile_error:  { color: 'var(--orange)', bg: 'var(--orange-dim)', label: 'Compile Error' },
  runtime_error:  { color: 'var(--red)',    bg: 'var(--red-dim)',    label: 'Runtime Error' },
  timeout:        { color: 'var(--purple)', bg: 'var(--purple-dim)', label: 'Timeout' },
  missing_source: { color: 'var(--orange)', bg: 'var(--orange-dim)', label: 'Missing Source' },
  zip_error:      { color: 'var(--red)',    bg: 'var(--red-dim)',    label: 'ZIP Error' },
};

interface StatusBadgeProps {
  status: StudentStatus | string;
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
