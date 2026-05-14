// TODO: GÖRKE GÖYNÜGÜR [Results Modülü] — Frontend IPC Bağlantısı
// Bu bileşen şu an mockData kullanıyor. Gerçek IPC'ye geçiş için:
//
// ÖN KOŞUL: DEMİR CÜCÜ'nün [FileService + Infra] görevlerini tamamlamasını bekle:
//   - shared/types.ts içindeki StudentStatus (küçük harf) ve ResultStatus (büyük harf)
//     uyumsuzluğunun çözülmüş olması: StatusBadge, StudentStatus tipini kabul etmeli
//   - IpcChannels'daki 'result:update' kanal imzasının aktive edilmiş olması
//
// Bu ön koşul sağlandıktan sonra:
// 1. Mock import'larını kaldır:
//    - PROJECTS, RESULTS, statusConfig, type ResultStatus import'larını sil
//
// 2. Gerçek import'ları ekle:
//    import { ipc } from '@/lib/ipc';
//    import type { Project, ProjectResults, StudentResult, StudentStatus } from '@shared/types';
//
// 3. `load()` fonksiyonunu implement et (useEffect içinde çağır):
//    const project = await ipc.project.getById(projectId!);      → setProject(project)
//    const results = await ipc.project.getResults(projectId!);   → setResults(results)
//    Hata durumunda console.error ile logla, loading'i false yap.
//
// 4. Filtre değerlerini StudentStatus tipiyle uyumlu hale getir:
//    'pass' | 'fail' | 'compile_error' | 'runtime_error' | 'timeout' | 'missing_source' | 'zip_error'
//    (Filtre buton label'ları için küçük harf eşleşmesi yap)
//
// 5. Tablo satırındaki onClick'i gerçek navigasyon rotasıyla güncelle:
//    navigate(`/results/${project.id}/${student.studentId}`)  ← zaten bu şekilde
//    sadece student tipini StudentResult olarak değiştir
//
// 6. StatusBadge'e gönderilen `status` değerinin StudentStatus tipinde olduğundan emin ol.
//
// 7. Sıralama fonksiyonlarını StudentResult tipine uyarla:
//    - sortByStudentId: studentId string karşılaştırma
//    - sortByStatus: status string karşılaştırma
//    - sortByOutput: outputMatched boolean karşılaştırma

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cardStyle } from '@/components/shared/StatCard';
import { PROJECTS, RESULTS, statusConfig, type ResultStatus } from '@/lib/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

type Filter = 'ALL' | ResultStatus;
type SortKey = 'studentId' | 'status' | 'output';
type SortDir = 'asc' | 'desc';

const filterOptions: Filter[] = [
  'ALL', 'PASS', 'FAIL', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIMEOUT',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sonuçları verilen filtre değerine göre filtreler.
 *
 * TODO: GÖRKE GÖYNÜGÜR — `ResultStatus` yerine `StudentStatus` (küçük harf) kullan.
 * Filtre değerlerini 'pass' | 'fail' | 'compile_error' şeklinde güncelle.
 */
function applyFilter(results: typeof RESULTS, filter: Filter) {
  if (filter === 'ALL') return results;
  return results.filter((r) => r.status === filter);
}

/**
 * Sonuçları verilen sıralama anahtarı ve yönüne göre sıralar.
 *
 * TODO: GÖRKE GÖYNÜGÜR — `typeof RESULTS` yerine `StudentResult[]` kullan.
 */
function applySort(results: typeof RESULTS, key: SortKey, dir: SortDir) {
  return [...results].sort((a, b) => {
    let cmp = 0;
    if (key === 'studentId') cmp = a.studentId.localeCompare(b.studentId);
    else if (key === 'status') cmp = a.status.localeCompare(b.status);
    else if (key === 'output') cmp = a.outputMatched - b.outputMatched;
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // TODO: GÖRKE GÖYNÜGÜR — Aşağıdaki useState'leri gerçek tiplerle değiştir:
  // const [project, setProject] = useState<Project | null>(null);
  // const [results, setResults] = useState<StudentResult[]>([]);
  // const [loading, setLoading] = useState(true);
  //
  // useEffect(() => { load(); }, [projectId]);
  //
  // async function load() {
  //   setLoading(true);
  //   try {
  //     const [p, r] = await Promise.all([
  //       ipc.project.getById(projectId!),
  //       ipc.project.getResults(projectId!),
  //     ]);
  //     setProject(p);
  //     setResults(r?.students ?? []);
  //   } catch (err) {
  //     console.error('ResultsProject: load failed', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  const [filter, setFilter] = useState<Filter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('studentId');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Mock veri
  const project = PROJECTS.find((p) => p.id === projectId);
  const allResults = RESULTS.filter((r) => r.projectId === projectId);

  const filtered = applyFilter(allResults, filter);
  const sorted = applySort(filtered, sortKey, sortDir);

  /**
   * Sıralama başlığına tıklanınca anahtarı değiştirir veya yönü tersine çevirir.
   *
   * TODO: GÖRKE GÖYNÜGÜR — Bu fonksiyona dokunmana gerek yok, mock → gerçek geçişte çalışmaya devam eder.
   */
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackButton onClick={() => navigate('/results')} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Project not found.
          {/* TODO: GÖRKE GÖYNÜGÜR — loading state eklenince buraya loading spinner ekle */}
        </div>
      </div>
    );
  }

  const totalStudents = allResults.length;
  const passCount = allResults.filter((r) => r.status === 'PASS').length;
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
            <LangDot lang={project.language} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {project.configName}
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
        <MiniStat label="Created" value={project.createdAt} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filterOptions.map((f) => {
          const active = filter === f;
          const label = f === 'ALL' ? 'All' : (statusConfig[f as ResultStatus]?.label ?? f);
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
                key={r.id}
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
                  <StatusBadge status={r.status} />
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
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Icon name="chevronRight" size={14} color="var(--text-muted)" />
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
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
