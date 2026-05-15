// [GÖRKE GÖYNÜGÜR — TAMAMLANDI]
// Bu bileşen gerçek IPC'ye geçirildi.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { Project, StudentResult, StudentStatus } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'ALL' | StudentStatus;
type SortKey = 'studentId' | 'status' | 'output';
type SortDir = 'asc' | 'desc';

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'ALL',            label: 'All' },
  { value: 'pass',           label: 'Pass' },
  { value: 'fail',           label: 'Fail' },
  { value: 'compile_error',  label: 'Compile Error' },
  { value: 'runtime_error',  label: 'Runtime Error' },
  { value: 'timeout',        label: 'Timeout' },
  { value: 'missing_source', label: 'Missing Source' },
  { value: 'zip_error',      label: 'ZIP Error' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyFilter(results: StudentResult[], filter: Filter) {
  if (filter === 'ALL') return results;
  return results.filter((r) => r.status === filter);
}

function applySort(results: StudentResult[], key: SortKey, dir: SortDir) {
  return [...results].sort((a, b) => {
    let cmp = 0;
    if (key === 'studentId') cmp = a.studentId.localeCompare(b.studentId);
    else if (key === 'status') cmp = a.status.localeCompare(b.status);
    else if (key === 'output') cmp = (a.outputMatched ? 1 : 0) - (b.outputMatched ? 1 : 0);
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultsProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [allResults, setAllResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<Filter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('studentId');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([
          ipc.project.getById(projectId!),
          ipc.project.getResults(projectId!),
        ]);
        setProject(p);
        setAllResults(r?.students ?? []);
      } catch (err) {
        console.error('ResultsProject: load failed', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const filtered = applyFilter(allResults, filter);
  const sorted = applySort(filtered, sortKey, sortDir);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  async function handleDeleteStudent() {
    if (!deleteTarget || !project) return;
    setDeleting(true);
    try {
      await ipc.execution.deleteStudent(project.id, deleteTarget);
      setAllResults((prev) => prev.filter((r) => r.studentId !== deleteTarget));
    } catch (err: any) {
      alert(`Failed to delete student: ${err.message}`);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackButton onClick={() => navigate('/results')} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 24 }}>Loading…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackButton onClick={() => navigate('/results')} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Project not found.</div>
      </div>
    );
  }

  const totalStudents = allResults.length;
  const passCount = allResults.filter((r) => r.status === 'pass').length;
  const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => navigate('/results')} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {project.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <LangDot lang={project.configuration?.language ?? ''} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {project.configuration?.name ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <MiniStat label="Students" value={String(totalStudents)} />
        <MiniStat
          label="Pass Rate"
          value={totalStudents > 0 ? `${passRate}%` : '—'}
          color={passRate >= 70 ? 'var(--green)' : passRate >= 40 ? 'var(--orange)' : 'var(--red)'}
        />
        <MiniStat label="Created" value={new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filterOptions.map(({ value: f, label }) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
              {f !== 'ALL' && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  ({allResults.filter((r) => r.status === f).length})
                </span>
              )}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {sorted.length} of {totalStudents} students
        </span>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <SortableHeader label="Student ID" sortKey="studentId" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Status"     sortKey="status"    current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Output"     sortKey="output"    current={sortKey} dir={sortDir} onSort={handleSort} />
              {/* Actions column — no sort */}
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
        {sorted.map((r) => (
          <tr
            key={r.studentId}
            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => navigate(`/results/${project.id}/${r.studentId}`)}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={r.status} />
                {(r.executionError || r.compileError) && (
                  <span
                    title={r.executionError || r.compileError}
                    style={{
                      cursor: 'help',
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'var(--red)',
                      opacity: 0.7,
                    }}
                  >
                    <Icon name="alert" size={13} color="var(--red)" />
                  </span>
                )}
              </div>
            </td>
            <td style={{ padding: '12px 16px' }}>
              {r.outputMatched ? (
                <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={13} color="var(--green)" /> Matched
                </span>
              ) : (
                <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="x" size={13} color="var(--red)" /> Mismatch
                </span>
              )}
            </td>
            <td
              style={{ padding: '8px 16px', textAlign: 'right' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); ipc.execution.openStudentFolder(project.id, r.studentId); }}
                  title="Open student folder"
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '5px 8px', borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-muted)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Icon name="externalLink" size={13} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(r.studentId); }}
                  title="Delete this student"
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '5px 8px', borderRadius: 6,
                    border: '1px solid var(--red)',
                    background: 'var(--red-dim)', color: 'var(--red)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Icon name="trash" size={13} color="var(--red)" />
                </button>
                <Icon name="chevronRight" size={14} color="var(--text-muted)" />
              </div>
            </td>
          </tr>
        ))}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No results match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete student "${deleteTarget}"? This will remove their submission folder and all results. This action cannot be undone.`}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        confirmColor="var(--red)"
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: color ?? 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'default',
};

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(sortKey)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active && (
          <Icon name={dir === 'asc' ? 'chevronUp' : 'chevronDown'} size={12} color="var(--accent)" />
        )}
      </span>
    </th>
  );
}
