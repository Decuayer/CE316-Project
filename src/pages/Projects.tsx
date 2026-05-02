import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { cardStyle } from '@/components/shared/StatCard';
import { PROJECTS } from '@/lib/mockData';

export default function Projects() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filtered = PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Projects</h1>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Icon name="plus" size={16} color="#fff" /> New Project
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          <Icon name="search" size={16} color="var(--text-muted)" />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Language', 'Configuration', 'Students', 'Date', 'Status', ''].map((h) => (
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
            {filtered.map((p) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LangDot lang={p.language} />
                    <span style={{ textTransform: 'capitalize' }}>{p.language}</span>
                  </div>
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                >
                  {p.configName}
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                  }}
                >
                  {p.submissionsCount}
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                >
                  {p.createdAt}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      color: p.status === 'evaluated' ? 'var(--green)' : 'var(--orange)',
                      background:
                        p.status === 'evaluated' ? 'var(--green-dim)' : 'var(--orange-dim)',
                    }}
                  >
                    {p.status === 'evaluated' ? 'Evaluated' : 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Icon name="chevron" size={16} color="var(--text-muted)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
