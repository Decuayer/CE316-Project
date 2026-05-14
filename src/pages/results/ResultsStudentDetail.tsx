// ─── TODO: DEMİR CÜCÜ [FileService + Infra Modülü] — Ön Koşul ───────────────
// Aşağıdaki GÖRKE GÖYNÜGÜR görevleri başlamadan önce tamamlanmalı:
//
// 1. shared/types.ts → DATABASE_SCHEMA sabitine `note TEXT` ve `score REAL` sütunlarını ekle
// 2. shared/types.ts → IpcChannels içindeki 'result:update' kanal imzasını uncomment et
//    (satır: // 'result:update': (projectId, studentId, patch) => Promise<StudentResult>)
// Tamamlandığında GÖRKE GÖYNÜGÜR'ü bilgilendir.
//
// ─── TODO: GÖRKE GÖYNÜGÜR [Results Modülü] — Frontend + Backend Implementasyonu ─
// DEMİR CÜCÜ yukarıdaki ön koşulları tamamladıktan sonra:
//
// 1. Mock import'larını kaldır:
//    - PROJECTS, RESULTS import'larını sil
//
// 2. Gerçek import'ları ekle:
//    import { ipc } from '@/lib/ipc';
//    import type { Project, StudentResult } from '@shared/types';
//
// 3. `load()` fonksiyonunu implement et (useEffect içinde çağır):
//    const [p, r] = await Promise.all([
//      ipc.project.getById(projectId!),
//      ipc.project.getResults(projectId!),
//    ]);
//    setProject(p);
//    const student = r?.students.find(s => s.studentId === studentId) ?? null;
//    setResult(student);
//
// 4. `handleSave()` fonksiyonunu implement et (result:update kanalı aktive olduktan sonra):
//    - await ipc.result.update(projectId!, studentId!, { note, score: Number(score) });
//    - Başarı durumunda bir toast veya "Saved ✓" animasyonu göster
//    - Hata durumunda console.error ile logla ve kullanıcıya alert göster
//
// 5. Pipeline steps'ini gerçek StudentResult boolean alanlarıyla bağla:
//    - 'Extracted':   result.zipExtracted
//    - 'Source Found': result.sourceFound
//    - 'Compiled':    result.compiled
//    - 'Executed':    result.executed
//    - 'Matched':     result.outputMatched
//
// 6. Code bloklarında gerçek verileri göster:
//    - Compile Output:   result.compileOutput
//    - Compile Error:    result.compileError (varsa kırmızı)
//    - Execution Output: result.executionOutput
//    - Execution Error:  result.executionError (varsa kırmızı)
//    - Expected Output:  result.expectedOutput
//    - Actual Output:    result.actualOutput
//
// 7. Not ve puan state'lerini gerçek veriye bağla:
//    - `note`  state'ini result.note ?? '' ile başlat
//    - `score` state'ini result.score ?? '' ile başlat

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';
import { PROJECTS, RESULTS } from '@/lib/mockData';

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsStudentDetail() {
  const { projectId, studentId } = useParams<{ projectId: string; studentId: string }>();
  const navigate = useNavigate();

  // TODO: GÖRKE GÖYNÜGÜR — Aşağıdaki useState'leri gerçek veriye bağla (yukarıdaki TODO 3)
  // const [project, setProject] = useState<Project | null>(null);
  // const [result, setResult] = useState<StudentResult | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [saving, setSaving] = useState(false);
  //
  // useEffect(() => { load(); }, [projectId, studentId]);

  const [note, setNote] = useState('');
  const [score, setScore] = useState<number | ''>('');

  // Mock veri — gerçek IPC'ye geçince bu iki satırı kaldır
  const project = PROJECTS.find((p) => p.id === projectId);
  const result = RESULTS.find((r) => r.projectId === projectId && r.studentId === studentId);

  /**
   * Not ve puanı kaydeder.
   *
   * TODO: GÖRKE GÖYNÜGÜR — Bu fonksiyonun gövdesini implement et:
   * 1. shared/types.ts'deki `result:update` IPC kanalının aktive edilmesini bekle
   * 2. Aktive edildikten sonra:
   *    setSaving(true);
   *    try {
   *      await ipc.result.update(projectId!, studentId!, { note, score: Number(score) });
   *      // Başarı bildirimi göster (örn. geçici "Saved ✓" text'i)
   *    } catch (err) {
   *      console.error('Save failed:', err);
   *      alert('Failed to save. Please try again.');
   *    } finally {
   *      setSaving(false);
   *    }
   */
  async function handleSave() {
    // TODO: GÖRKE GÖYNÜGÜR — Yukarıdaki açıklamayı oku ve implement et
    console.warn('handleSave: result:update IPC kanalı henüz implement edilmedi.');
    alert('Save functionality will be available once the result:update IPC channel is implemented.\nSee TODO in shared/types.ts');
  }

  // ─── Pipeline step definitions ──────────────────────────────────────────────
  //
  // TODO: GÖRKE GÖYNÜGÜR — Her adım için `ok` değerini gerçek result alanından hesapla (yukarıdaki TODO 5)
  // Şu an status string karşılaştırması kullanılıyor, gerçek veriye geçince boolean alanları kullan.

  const pipelineSteps = [
    {
      label: 'Extracted',
      // TODO: ok: result?.zipExtracted ?? false
      ok: result !== undefined,
    },
    {
      label: 'Source Found',
      // TODO: ok: result?.sourceFound ?? false
      ok: result !== undefined && result.status !== 'COMPILE_ERROR' && result.status !== 'RUNTIME_ERROR',
    },
    {
      label: 'Compiled',
      // TODO: ok: result?.compiled ?? false
      ok: result !== undefined && result.status !== 'COMPILE_ERROR',
    },
    {
      label: 'Executed',
      // TODO: ok: result?.executed ?? false
      ok: result !== undefined && result.status !== 'COMPILE_ERROR' && result.status !== 'RUNTIME_ERROR' && result.status !== 'TIMEOUT',
    },
    {
      label: 'Matched',
      // TODO: ok: result?.outputMatched ?? false
      ok: result?.outputMatched === 1,
    },
  ];

  // ─── Mock output strings ────────────────────────────────────────────────────
  //
  // TODO: GÖRKE GÖYNÜGÜR — Aşağıdaki mock değerleri gerçek result alanlarıyla değiştir:
  // compileOutput   → result.compileOutput
  // compileError    → result.compileError
  // executionOutput → result.executionOutput
  // executionError  → result.executionError
  // expectedOutput  → result.expectedOutput
  // actualOutput    → result.actualOutput

  const compileOutput = result
    ? result.status === 'COMPILE_ERROR'
      ? 'main.c: In function \'main\':\nmain.c:12:3: error: expected \';\' before \'return\''
      : 'Compilation successful.'
    : '';

  const executionOutput = result && result.status !== 'COMPILE_ERROR'
    ? result.outputMatched
      ? 'apple\nbanana\ncherry\n'
      : 'Cherry\nBanana\nApple\n'
    : '';

  const expectedOutput = 'apple\nbanana\ncherry\n';

  if (!project || !result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackButton onClick={() => navigate(`/results/${projectId}`)} />
        <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 14 }}>
          No result found for student <strong>{studentId}</strong>.
          {/* TODO: GÖRKE GÖYNÜGÜR — loading state eklenince loading spinner göster */}
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
        <CodeBlock content={compileOutput || '(no output)'} isError={result.status === 'COMPILE_ERROR'} />
      </Section>

      {/* Execution Output */}
      {result.status !== 'COMPILE_ERROR' && (
        <Section title="Execution Output" icon="terminal">
          <CodeBlock content={executionOutput || '(no output)'} isError={result.status === 'RUNTIME_ERROR'} />
        </Section>
      )}

      {/* Expected vs Actual diff */}
      {result.status !== 'COMPILE_ERROR' && (
        <Section title="Output Comparison" icon="diff">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Expected
              </div>
              <CodeBlock content={expectedOutput} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Actual
              </div>
              <CodeBlock content={executionOutput || '(no output)'} isError={!result.outputMatched} />
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

            {/* Save button */}
            {/* TODO: GÖRKE GÖYNÜGÜR — `disabled` prop'unu `saving` state'iyle bağla */}
            <button
              onClick={handleSave}
              style={{
                marginTop: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon name="check" size={14} color="#fff" />
              Save
            </button>
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
