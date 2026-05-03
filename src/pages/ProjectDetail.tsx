import { useNavigate, useParams } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { StatCard, cardStyle } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CONFIGS, PROJECTS, RESULTS } from '@/lib/mockData';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const project = PROJECTS.find((p) => p.id === id);

  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
            width: 'fit-content',
          }}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Project not found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          The project you are looking for could not be located.
        </p>
      </div>
    );
  }

  const results = RESULTS.filter((r) => r.projectId === project.id);
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const config = CONFIGS.find((c) => c.id === project.configId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {project.name}
          </h1>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
          >
            <LangDot lang={project.language} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {project.configName}
            </span>
          </div>
        </div>
        {project.status === 'pending' && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--green)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Icon name="play" size={16} color="#fff" /> Run Evaluation
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard icon="student" label="Submissions" value={project.submissionsCount} />
        <StatCard
          icon="check"
          label="Pass Rate"
          value={results.length ? `${Math.round((passCount / results.length) * 100)}%` : '—'}
        />
        <StatCard icon="clock" label="Created" value={project.createdAt} />
      </div>

      {config && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Compile Command', value: config.compileCommand || '(interpreted)' },
              { label: 'Run Command', value: config.runCommand },
              { label: 'Source File', value: config.sourceFileExpected },
              { label: 'Language', value: config.language },
            ].map((f) => (
              <div key={f.label}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ ...cardStyle, padding: 0 }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>Student Results</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Student ID', 'Status', 'Output Matched'].map((h) => (
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
              {results.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/projects/${project.id}/results/${r.studentId}`)}
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
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {r.outputMatched ? (
                      <Icon name="check" size={16} color="var(--green)" />
                    ) : (
                      <Icon name="x" size={16} color="var(--red)" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
