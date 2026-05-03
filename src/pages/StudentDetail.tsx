import { useNavigate, useParams } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';
import { PROJECTS, RESULTS, type ResultStatus } from '@/lib/mockData';

interface StepDef {
  label: string;
  failingStatuses: ResultStatus[];
  matchedSensitive?: boolean;
}

const steps: StepDef[] = [
  { label: 'Extracted', failingStatuses: [] },
  { label: 'Compiled', failingStatuses: ['COMPILE_ERROR'] },
  { label: 'Executed', failingStatuses: ['COMPILE_ERROR', 'RUNTIME_ERROR', 'TIMEOUT'] },
  { label: 'Matched', failingStatuses: ['COMPILE_ERROR', 'RUNTIME_ERROR', 'TIMEOUT'], matchedSensitive: true },
];

export default function StudentDetail() {
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const navigate = useNavigate();

  const project = PROJECTS.find((p) => p.id === id);
  const result = RESULTS.find((r) => r.projectId === id && r.studentId === studentId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => (id ? navigate(`/projects/${id}`) : navigate('/projects'))}
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
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {studentId}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {project?.name ?? 'Unknown project'}
          </div>
        </div>
        {result && <StatusBadge status={result.status} />}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {steps.map((step, i) => {
            const ok = result
              ? step.matchedSensitive
                ? result.outputMatched === 1 && !step.failingStatuses.includes(result.status)
                : !step.failingStatuses.includes(result.status)
              : false;
            return (
              <div
                key={step.label}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: ok ? 'var(--green-dim)' : 'var(--red-dim)',
                      border: `2px solid ${ok ? 'var(--green)' : 'var(--red)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={ok ? 'check' : 'x'}
                      size={16}
                      color={ok ? 'var(--green)' : 'var(--red)'}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 40,
                      height: 2,
                      background: 'var(--border)',
                      borderRadius: 1,
                      marginBottom: 24,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!result && (
        <div style={{ ...cardStyle, color: 'var(--text-secondary)' }}>
          No result found for this student. Run the evaluation pipeline first.
        </div>
      )}
    </div>
  );
}
