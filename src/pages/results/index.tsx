// TODO: GÖRKE GÖYNÜGÜR [Results Modülü] — Frontend IPC Bağlantısı
// Bu bileşen şu an mockData kullanıyor. Gerçek IPC'ye geçiş için:
//
// ÖN KOŞUL: DEMİR CÜCÜ'nün [FileService + Infra] görevlerini tamamlamasını bekle:
//   - shared/types.ts içindeki DATABASE_SCHEMA'nın `note` ve `score` sütunlarını içermesi
//   - IpcChannels'daki 'result:update' kanal imzasının aktive edilmiş olması
//
// Bu ön koşul sağlandıktan sonra:
// 1. Mock import'larını kaldır:
//    - PROJECTS, RESULTS, statusConfig, type ResultStatus import'larını sil
//
// 2. Gerçek import'ları ekle:
//    import { ipc } from '@/lib/ipc';
//    import type { Project, ProjectResults } from '@shared/types';
//
// 3. `loadProjects()` fonksiyonunu implement et:
//    - ipc.project.getAll() ile tüm projeleri çek → setProjects(data)
//    - Her proje için ipc.project.getResults(p.id) çağır (paralel: Promise.all)
//    - Sonuçları { projectId → ProjectResults } şeklinde bir Map'te sakla → setResultsMap(map)
//    - Hata durumunda console.error ile logla, loading state'i false yap
//
// 4. Proje kartındaki istatistikleri gerçek veriden hesapla:
//    - Öğrenci sayısı: resultsMap.get(p.id)?.students.length ?? 0
//    - Pass count:     resultsMap.get(p.id)?.students.filter(s => s.status === 'pass').length ?? 0
//    - Pass rate:      passCount / studentCount * 100
//    - Son çalıştırma: resultsMap.get(p.id)?.runAt ?? null
//
// 5. Proje durumu (badge) için:
//    - Eğer resultsMap.get(p.id) null ise → 'pending'
//    - Değilse → 'evaluated'
//
// 6. Sort fonksiyonlarını (sortByName, sortByDate, sortByPassRate) gerçek Project tipiyle uyumlu hale getir:
//    - MockProject yerine Project tipini kullan
//    - createdAt zaten string ISO date, doğrudan karşılaştırılabilir

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { cardStyle } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PROJECTS, RESULTS, statusConfig, type ResultStatus } from '@/lib/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'date' | 'passRate';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Verilen projeye ait öğrenci sonuçlarını mockData'dan hesaplar.
 *
 * TODO: GÖRKE GÖYNÜGÜR — Bunu resultsMap.get(projectId) ile değiştir.
 */
function getProjectStats(projectId: string) {
  const projectResults = RESULTS.filter((r) => r.projectId === projectId);
  const total = projectResults.length;
  const passCount = projectResults.filter((r) => r.status === 'PASS').length;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;
  return { total, passCount, passRate };
}

/**
 * Projeleri verilen sıralama anahtarına göre sıralar.
 *
 * TODO: GÖRKE GÖYNÜGÜR — Parametre tipini MockProject'ten Project'e güncelle.
 */
function sortProjects(projects: typeof PROJECTS, key: SortKey): typeof PROJECTS {
  return [...projects].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name);
    if (key === 'date') return b.createdAt.localeCompare(a.createdAt);
    if (key === 'passRate') {
      return getProjectStats(b.id).passRate - getProjectStats(a.id).passRate;
    }
    return 0;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsIndex() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('date');

  // TODO: GÖRKE GÖYNÜGÜR — useState'leri gerçek veriye geçirince buraya ekle:
  // const [projects, setProjects] = useState<Project[]>([]);
  // const [resultsMap, setResultsMap] = useState<Map<string, ProjectResults>>(new Map());
  // const [loading, setLoading] = useState(true);
  //
  // useEffect(() => { loadProjects(); }, []);
  //
  // async function loadProjects() { ... }

  const sorted = sortProjects(PROJECTS, sortKey);

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
      <SummaryBar />

      {/* Project cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => navigate(`/results/${project.id}`)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
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
      )}
    </div>
  );
}

// ─── SummaryBar ───────────────────────────────────────────────────────────────

/**
 * Tüm projeler genelinde özet istatistik satırı.
 *
 * TODO: GÖRKE GÖYNÜGÜR — Gerçek IPC verisiyle hesapla:
 * - totalProjects: projects.length
 * - evaluatedCount: projects.filter(p => resultsMap.has(p.id)).length
 * - totalStudents: [...resultsMap.values()].reduce((acc, r) => acc + r.students.length, 0)
 * - overallPassRate: tüm students içinden status === 'pass' olanlar
 */
function SummaryBar() {
  const totalProjects = PROJECTS.length;
  const evaluatedCount = PROJECTS.filter((p) => p.status === 'evaluated').length;
  const totalStudents = RESULTS.length;
  const passCount = RESULTS.filter((r) => r.status === 'PASS').length;
  const overallPassRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

  const stats = [
    { label: 'Projects', value: totalProjects },
    { label: 'Evaluated', value: evaluatedCount },
    { label: 'Total Students', value: totalStudents },
    { label: 'Overall Pass Rate', value: `${overallPassRate}%` },
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

// ─── ProjectCard ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: (typeof PROJECTS)[number];
  // TODO: GÖRKE GÖYNÜGÜR — MockProject'i Project + resultsMap ile değiştir:
  // project: Project;
  // results: ProjectResults | null;
  onClick: () => void;
}

/**
 * Tek bir proje için özet kart bileşeni.
 *
 * TODO: GÖRKE GÖYNÜGÜR — Gerçek veri bağlantısı:
 * - `project` prop'unu `Project` tipiyle değiştir
 * - `results` prop'u olarak `ProjectResults | null` al
 * - İstatistikleri getProjectStats() yerine `results` prop'undan hesapla
 * - `status` alanını `results !== null ? 'evaluated' : 'pending'` ile belirle
 * - `createdAt` formatını `new Date(project.createdAt).toLocaleDateString()` ile yap
 */
function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { total, passRate } = getProjectStats(project.id);
  const isEvaluated = project.status === 'evaluated';

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
        <LangDot lang={project.language} size={36} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
          <span>{project.configName}</span>
          <span>·</span>
          <span>Created {project.createdAt}</span>
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
