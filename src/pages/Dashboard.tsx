import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { DashboardStats, Project } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { StatCard, cardStyle } from '@/components/shared/StatCard';
import { CreateProjectModal } from '@/components/shared/CreateProjectModal';

// ─── helpers ──────────────────────────────────────────────────────────────────

function passRateColor(r: number) {
  if (r >= 70) return 'var(--green)';
  if (r >= 40) return 'var(--orange)';
  return 'var(--red)';
}

function statusLabel(s: string) {
  if (s === 'completed') return 'Evaluated';
  if (s === 'in-progress') return 'Running';
  return 'Pending';
}

function statusColors(s: string): { bg: string; color: string } {
  if (s === 'completed') return { bg: 'var(--green-dim)', color: 'var(--green)' };
  if (s === 'in-progress') return { bg: 'var(--accent-dim)', color: 'var(--accent)' };
  return { bg: 'var(--orange-dim)', color: 'var(--orange)' };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [configCount, setConfigCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    Promise.all([
      ipc.project.getStatistics(),
      ipc.project.getAll(),
      ipc.config.getAll(),
    ])
      .then(([s, p, c]) => {
        setStats(s);
        setProjects(p);
        setConfigCount(c.length);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const passRate   = Math.round(stats?.overallPassRate ?? 0);
  const totalResults = stats
    ? Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0)
    : 0;
  const passCount  = stats?.statusBreakdown.pass ?? 0;
  const failCount  = stats?.statusBreakdown.fail ?? 0;
  const errorCount =
    (stats?.statusBreakdown.compile_error ?? 0) +
    (stats?.statusBreakdown.runtime_error ?? 0) +
    (stats?.statusBreakdown.timeout       ?? 0) +
    (stats?.statusBreakdown.missing_source ?? 0);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statsMap = new Map((stats?.recentProjects ?? []).map((p) => [p.id, p]));

  const breakdown: Array<{ label: string; count: number; color: string; bg: string }> = [
    { label: 'Pass',          count: passCount,                                     color: 'var(--green)',  bg: 'var(--green-dim)'  },
    { label: 'Fail',          count: failCount,                                     color: 'var(--red)',    bg: 'var(--red-dim)'    },
    { label: 'Compile Error', count: stats?.statusBreakdown.compile_error  ?? 0,   color: 'var(--orange)', bg: 'var(--orange-dim)' },
    { label: 'Runtime Error', count: stats?.statusBreakdown.runtime_error  ?? 0,   color: 'var(--red)',    bg: 'var(--red-dim)'    },
    { label: 'Timeout',       count: stats?.statusBreakdown.timeout        ?? 0,   color: 'var(--purple)', bg: 'var(--purple-dim)' },
    { label: 'Missing Source',count: stats?.statusBreakdown.missing_source ?? 0,   color: 'var(--orange)', bg: 'var(--orange-dim)' },
  ].filter((b) => b.count > 0);

  const handleSave = async (data: Parameters<typeof ipc.project.create>[0]) => {
    await ipc.project.create(data);
    load();
  };

  const isEmpty = !loading && projects.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Overview of your assignment evaluation environment
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Icon name="plus" size={16} color="#fff" /> New Project
        </button>
      </div>

      {/* ── Onboarding (empty state) ── */}
      {isEmpty && (
        <div
          style={{
            ...cardStyle,
            padding: 32,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            border: '1px dashed var(--border-light)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="projects" size={28} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No projects yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400 }}>
              Get started by creating a configuration for your programming language, then create a project and import student submissions.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/configurations')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name="config" size={14} /> Set up Configuration
            </button>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name="plus" size={14} color="#fff" /> New Project
            </button>
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      {!isEmpty && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard
            icon="projects"
            label="Projects"
            value={loading ? '…' : (stats?.totalProjects ?? 0)}
            sub={loading ? '' : `${configCount} configuration${configCount !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon="student"
            label="Total Students"
            value={loading ? '…' : (stats?.totalStudents ?? 0)}
            sub="Across all projects"
          />
          <StatCard
            icon="check"
            label="Pass Rate"
            value={loading ? '…' : `${passRate}%`}
            sub={loading ? '' : `${passCount} passed · ${failCount + errorCount} issues`}
          />
          <StatCard
            icon="results"
            label="Evaluations Run"
            value={loading ? '…' : totalResults}
            sub={loading ? '' : `${(stats?.recentProjects ?? []).filter(p => p.status === 'completed').length} projects evaluated`}
          />
        </div>
      )}

      {/* ── Quick Actions ── */}
      {!isEmpty && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: 'projects' as const, label: 'Manage Projects', sub: 'View, create & run evaluations', to: '/projects', accent: 'var(--accent)' },
            { icon: 'results'  as const, label: 'View Results',    sub: 'Browse student scores & logs',   to: '/results',  accent: 'var(--green)'  },
            { icon: 'config'   as const, label: 'Configurations',  sub: 'Language & compiler settings',   to: '/configurations', accent: 'var(--purple)' },
          ].map((a) => (
            <div
              key={a.to}
              onClick={() => navigate(a.to)}
              style={{
                ...cardStyle,
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = a.accent;
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: a.accent === 'var(--accent)' ? 'var(--accent-dim)'
                  : a.accent === 'var(--green)' ? 'var(--green-dim)' : 'var(--purple-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={a.icon} size={20} color={a.accent} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.sub}</div>
              </div>
              <Icon name="chevronRight" size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Two column: Recent Projects + Results Breakdown ── */}
      {!isEmpty && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Recent Projects */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Recent Projects</span>
              <Link to="/projects" style={{
                color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              }}>
                View All <Icon name="chevron" size={14} />
              </Link>
            </div>
            <div>
              {loading ? (
                <div style={{ padding: '24px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                  Loading…
                </div>
              ) : recentProjects.length === 0 ? (
                <div style={{ padding: '24px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                  No projects yet.
                </div>
              ) : (
                recentProjects.map((p, i) => {
                  const pStats = statsMap.get(p.id);
                  const sc = statusColors(pStats?.status ?? 'pending');
                  const pr = pStats?.passRate ?? 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '13px 20px',
                        borderBottom: i < recentProjects.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <LangDot lang={p.configuration?.language ?? ''} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            {p.configuration?.name ?? '—'} · {pStats?.studentCount ?? 0} students
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          color: sc.color, background: sc.bg, flexShrink: 0,
                        }}>
                          {statusLabel(pStats?.status ?? 'pending')}
                        </span>
                      </div>
                      {pStats && pStats.studentCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            flex: 1, height: 4, background: 'var(--bg-hover)',
                            borderRadius: 2, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: `${pr}%`,
                              background: passRateColor(pr),
                              borderRadius: 2, transition: 'width 0.5s',
                            }} />
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: passRateColor(pr), width: 36, textAlign: 'right',
                          }}>
                            {Math.round(pr)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Results Breakdown */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Results Breakdown</span>
              <Link to="/results" style={{
                color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              }}>
                Details <Icon name="chevron" size={14} />
              </Link>
            </div>
            <div style={{ padding: 20 }}>
              {totalResults === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  No evaluations run yet.
                </div>
              ) : (
                <>
                  {/* Donut + numbers */}
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: 90, height: 90, transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.9155" fill="none"
                          stroke="var(--bg-hover)" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.9155" fill="none"
                          stroke="var(--green)" strokeWidth="3.5"
                          strokeDasharray={`${passRate} ${100 - passRate}`}
                          strokeLinecap="round" />
                      </svg>
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                      }}>
                        <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                          {passRate}%
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>PASS</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                      {breakdown.map((s) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: s.color, flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                            {s.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-project pass-rate bars */}
                  {(stats?.recentProjects ?? []).filter(p => p.studentCount > 0).length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pass Rate by Project
                      </div>
                      {(stats?.recentProjects ?? []).filter(p => p.studentCount > 0).map((p) => (
                        <div
                          key={p.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}
                          onClick={() => navigate(`/results/${p.id}`)}
                        >
                          <span style={{
                            fontSize: 12, color: 'var(--text-secondary)',
                            width: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {p.name}
                          </span>
                          <div style={{
                            flex: 1, height: 5, background: 'var(--bg-hover)',
                            borderRadius: 3, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: `${p.passRate}%`,
                              background: passRateColor(p.passRate),
                              borderRadius: 3, transition: 'width 0.6s',
                            }} />
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: passRateColor(p.passRate),
                            width: 34, textAlign: 'right',
                          }}>
                            {Math.round(p.passRate)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
