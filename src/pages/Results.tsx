import { useState } from 'react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';
import { PROJECTS, RESULTS, statusConfig, type ResultStatus } from '@/lib/mockData';

type Filter = 'ALL' | ResultStatus;

const filterOptions: Filter[] = [
  'ALL',
  'PASS',
  'FAIL',
  'COMPILE_ERROR',
  'RUNTIME_ERROR',
  'TIMEOUT',
];

export default function Results() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const filtered = filter === 'ALL' ? RESULTS : RESULTS.filter((r) => r.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Results</h1>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filterOptions.map((s) => {
          const active = filter === s;
          const label = s === 'ALL' ? 'All' : statusConfig[s as ResultStatus]?.label ?? s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ ...cardStyle, padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Student', 'Project', 'Status', 'Output'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const proj = PROJECTS.find((p) => p.id === r.projectId);
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                    }}
                  >
                    {r.studentId}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                    }}
                  >
                    {proj?.name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {r.outputMatched ? (
                      <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>
                        Matched
                      </span>
                    ) : (
                      <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>
                        Mismatch
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
