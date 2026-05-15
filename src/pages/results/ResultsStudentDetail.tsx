// [GÖRKE GÖYNÜGÜR — TAMAMLANDI]
// Bu bileşen gerçek IPC'ye geçirildi.
// Kalan görev: ResultsIndex ve ResultsProject'in IPC'ye geçişi.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { Project, StudentResult } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsStudentDetail() {
  const { projectId, studentId } = useParams<{ projectId: string; studentId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [note, setNote] = useState('');
  const [score, setScore] = useState<number | ''>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([
          ipc.project.getById(projectId!),
          ipc.project.getResults(projectId!),
        ]);
        setProject(p);
        const student = r?.students.find((s) => s.studentId === studentId) ?? null;
        setResult(student);
        // Pre-fill instructor annotation fields from saved values
        if (student) {
          setNote(student.note ?? '');
          setScore(student.score ?? '');
        }
      } catch (err) {
        console.error('ResultsStudentDetail: load failed', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, studentId]);

  /**
   * Persists the instructor note and score via the result:update IPC channel.
   * Shows a brief "Saved ✓" feedback indicator on success.
   */
  async function handleSave() {
    setSaving(true);
    try {
      await ipc.result.update(projectId!, studentId!, {
        note,
        score: score === '' ? undefined : Number(score),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('ResultsStudentDetail: save failed', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Pipeline step definitions ──────────────────────────────────────────────
  // Each step's `ok` field is derived from the real StudentResult boolean fields.
  const pipelineSteps = [
    { label: 'Extracted',    ok: result?.zipExtracted    ?? false },
    { label: 'Source Found', ok: result?.sourceFound     ?? false },
    { label: 'Compiled',     ok: result?.compiled        ?? false },
    { label: 'Executed',     ok: result?.executed        ?? false },
    { label: 'Matched',      ok: result?.outputMatched   ?? false },
  ];

  // ─── Output strings from real StudentResult fields ─────────────────────────
  const compileOutput    = result?.compileOutput    ?? '';
  const compileError     = result?.compileError;
  const executionOutput  = result?.executionOutput  ?? '';
  const executionError   = result?.executionError;
  const expectedOutput   = result?.expectedOutput   ?? '';
  const actualOutput     = result?.actualOutput     ?? '';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackButton onClick={() => navigate(`/results/${projectId}`)} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 24 }}>Loading…</div>
      </div>
    );
  }

  if (!project || !result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackButton onClick={() => navigate(`/results/${projectId}`)} />
        <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 14 }}>
          No result found for student <strong>{studentId}</strong>.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => navigate(`/results/${projectId}`)} />
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
            {project.name}
          </div>
        </div>
        <StatusBadge status={result.status} />
      </div>

      {/* Pipeline */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {pipelineSteps.map((step, i) => (
            <div key={step.label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
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
                    background: step.ok ? 'var(--green-dim)' : 'var(--red-dim)',
                    border: `2px solid ${step.ok ? 'var(--green)' : 'var(--red)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={step.ok ? 'check' : 'x'}
                    size={16}
                    color={step.ok ? 'var(--green)' : 'var(--red)'}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {step.label}
                </span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: 'var(--border)',
                    borderRadius: 1,
                    marginBottom: 24,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compile Output */}
      <Section title="Compile Output" icon="terminal">
        <CodeBlock content={compileOutput || '(no output)'} isError={!!compileError} />
        {compileError && (
          <CodeBlock content={compileError} isError />
        )}
      </Section>

      {/* Execution Output */}
      {result.compiled && (
        <Section title="Execution Output" icon="terminal">
          <CodeBlock content={executionOutput || '(no output)'} isError={!!executionError} />
          {executionError && (
            <CodeBlock content={executionError} isError />
          )}
        </Section>
      )}

      {/* Expected vs Actual diff */}
      {result.compiled && (
        <Section title="Output Comparison" icon="diff">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Expected
              </div>
              <CodeBlock content={expectedOutput || '(no output)'} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Actual
              </div>
              <CodeBlock content={actualOutput || '(no output)'} isError={!result.outputMatched} />
            </div>
          </div>
        </Section>
      )}

      {/* Instructor Panel */}
      <Section title="Instructor Notes" icon="edit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Note textarea */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this student's submission..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Score input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                }}
              >
                Score (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="—"
                style={{
                  width: 100,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            {/* Save button + saved feedback */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: saving ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: saving ? 'var(--text-muted)' : '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <Icon name="check" size={14} color={saving ? 'var(--text-muted)' : '#fff'} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && (
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Saved ✓</span>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Icon name={icon as any} size={15} color="var(--accent)" />
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

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

// ─── BackButton ───────────────────────────────────────────────────────────────

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
