// [GÖRKE GÖYNÜGÜR — TAMAMLANDI]
// Bu bileşen gerçek IPC'ye geçirildi.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { Project, ProjectResults } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { cardStyle } from '@/components/shared/StatCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'date' | 'passRate';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStats(results: ProjectResults | undefined) {
  if (!results) return { total: 0, passCount: 0, passRate: 0 };
  const total = results.students.length;
  const passCount = results.students.filter((s) => s.status === 'pass').length;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;
  return { total, passCount, passRate };
}

function sortProjects(
  projects: Project[],
  key: SortKey,
  resultsMap: Map<string, ProjectResults>
): Project[] {
  return [...projects].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name);
    if (key === 'date') return b.createdAt.localeCompare(a.createdAt);
    if (key === 'passRate') {
      return getStats(resultsMap.get(b.id)).passRate - getStats(resultsMap.get(a.id)).passRate;
    }
    return 0;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultsIndex() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('date');

  const [projects, setProjects] = useState<Project[]>([]);
  const [resultsMap, setResultsMap] = useState<Map<string, ProjectResults>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const all = await ipc.project.getAll();
        setProjects(all);

        // Load results for every project in parallel
        const entries = await Promise.all(
          all.map(async (p) => {
            const r = await ipc.project.getResults(p.id);
            return [p.id, r] as const;
          })
        );
        const map = new Map<string, ProjectResults>();
        for (const [id, r] of entries) {
          if (r) map.set(id, r);
        }
        setResultsMap(map);
      } catch (err) {
        console.error('ResultsIndex: load failed', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const sorted = sortProjects(projects, sortKey, resultsMap);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Results</h1>

        {/* Sort controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['name', 'date', 'passRate'] as SortKey[]).map((key) => {
            const labels: Record<SortKey, string> = { name: 'Name', date: 'Date', passRate: 'Pass Rate' };
            const active = sortKey === key;
            return (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                style={{
                  padding: '6px 12px',
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
                {labels[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary stat row */}
      <SummaryBar projects={projects} resultsMap={resultsMap} loading={loading} />

      {/* Project cards */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 24 }}>Loading…</div>
      ) : sorted.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
            padding: 40,
          }}
        >
          No projects found. Create a project first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              results={resultsMap.get(project.id) ?? null}
              onClick={() => navigate(`/results/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SummaryBar ────────────────────────────────────────────────────────────────

function SummaryBar({
  projects,
  resultsMap,
  loading,
}: {
  projects: Project[];
  resultsMap: Map<string, ProjectResults>;
  loading: boolean;
}) {
  const totalProjects = projects.length;
  const evaluatedCount = projects.filter((p) => resultsMap.has(p.id)).length;
  const allStudents = [...resultsMap.values()].flatMap((r) => r.students);
  const totalStudents = allStudents.length;
  const passCount = allStudents.filter((s) => s.status === 'pass').length;
  const overallPassRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

  const stats = [
    { label: 'Projects',         value: loading ? '…' : totalProjects },
    { label: 'Evaluated',        value: loading ? '…' : evaluatedCount },
    { label: 'Total Students',   value: loading ? '…' : totalStudents },
    { label: 'Overall Pass Rate',value: loading ? '…' : `${overallPassRate}%` },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            ...cardStyle,
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ProjectCard ───────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  results: ProjectResults | null;
  onClick: () => void;
}

function ProjectCard({ project, results, onClick }: ProjectCardProps) {
  const { total, passRate } = getStats(results ?? undefined);
  const isEvaluated = results !== null;
  const lastRun = results?.runAt
    ? new Date(results.runAt).toLocaleDateString()
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '16px 20px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '';
        (e.currentTarget as HTMLDivElement).style.borderColor = '';
      }}
    >
      {/* Lang dot */}
      <div style={{ flexShrink: 0 }}>
        <LangDot lang={project.configuration?.language ?? ''} size={36} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
          <span>{project.configuration?.name ?? '—'}</span>
          <span>·</span>
          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          {lastRun && (
            <>
              <span>·</span>
              <span>Last run {lastRun}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
        <Stat label="Students" value={total > 0 ? String(total) : '—'} />
        <Stat label="Pass Rate" value={isEvaluated && total > 0 ? `${passRate}%` : '—'} highlight={isEvaluated && total > 0} passRate={passRate} />
        <StatusChip evaluated={isEvaluated} />
        <Icon name="chevronRight" size={16} color="var(--text-muted)" />
      </div>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, value, highlight = false, passRate }: { label: string; value: string; highlight?: boolean; passRate?: number }) {
  const color = highlight && passRate !== undefined
    ? passRate >= 70 ? 'var(--green)' : passRate >= 40 ? 'var(--orange)' : 'var(--red)'
    : 'var(--text-primary)';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ─── StatusChip ───────────────────────────────────────────────────────────────

function StatusChip({ evaluated }: { evaluated: boolean }) {
  return (
    <div
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: evaluated ? 'var(--green-dim)' : 'var(--bg-tertiary)',
        color: evaluated ? 'var(--green)' : 'var(--text-muted)',
        border: `1px solid ${evaluated ? 'var(--green)' : 'var(--border)'}`,
      }}
    >
      {evaluated ? 'Evaluated' : 'Pending'}
    </div>
  );
}
