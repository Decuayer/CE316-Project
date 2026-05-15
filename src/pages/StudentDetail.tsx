import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { Project, StudentResult } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';

// ─── Pipeline step definitions ────────────────────────────────────────────────

interface StepDef {
  label: string;
  key: keyof Pick<StudentResult, 'zipExtracted' | 'sourceFound' | 'compiled' | 'executed' | 'outputMatched'>;
}

const steps: StepDef[] = [
  { label: 'Extracted',    key: 'zipExtracted' },
  { label: 'Source Found', key: 'sourceFound' },
  { label: 'Compiled',     key: 'compiled' },
  { label: 'Executed',     key: 'executed' },
  { label: 'Matched',      key: 'outputMatched' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentDetail() {
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([
          ipc.project.getById(id!),
          ipc.project.getResults(id!),
        ]);
        setProject(p);
        const student = r?.students.find((s) => s.studentId === studentId) ?? null;
        setResult(student);
      } catch (err) {
        console.error('StudentDetail: load failed', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, studentId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => navigate(`/projects/${id}`)} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => (id ? navigate(`/projects/${id}`) : navigate('/projects'))} />
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

      {/* Pipeline */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {steps.map((step, i) => {
            const ok = result ? !!result[step.key] : false;
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

      {/* Compile output */}
      {result?.compileOutput && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Compile Output</div>
          <CodeBlock content={result.compileOutput} isError={!!result.compileError} />
          {result.compileError && (
            <div style={{ marginTop: 8 }}>
              <CodeBlock content={result.compileError} isError />
            </div>
          )}
        </div>
      )}

      {/* Execution output */}
      {result?.compiled && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Execution Output</div>
          <CodeBlock content={result.executionOutput || '(no output)'} isError={!!result.executionError} />
          {result.executionError && (
            <div style={{ marginTop: 8 }}>
              <CodeBlock content={result.executionError} isError />
            </div>
          )}
        </div>
      )}

      {/* Output comparison */}
      {result?.compiled && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Output Comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Expected
              </div>
              <CodeBlock content={result.expectedOutput || '(no output)'} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Actual
              </div>
              <CodeBlock content={result.actualOutput || '(no output)'} isError={!result.outputMatched} />
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div style={{ ...cardStyle, color: 'var(--text-secondary)' }}>
          No result found for this student. Run the evaluation pipeline first.
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}
    >
      <Icon name="chevronLeft" size={16} />
    </button>
  );
}

function CodeBlock({ content, isError = false }: { content: string; isError?: boolean }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: '12px 14px',
        borderRadius: 8,
        background: 'var(--bg-primary)',
        border: `1px solid ${isError ? 'var(--red)' : 'var(--border)'}`,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        color: isError ? 'var(--red)' : 'var(--text-primary)',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.6,
      }}
    >
      {content}
    </pre>
  );
}
