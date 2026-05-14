import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { DashboardStats, Project } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { StatCard, cardStyle } from '@/components/shared/StatCard';
import { CreateProjectModal } from '@/components/shared/CreateProjectModal';

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

  const passRate = Math.round(stats?.overallPassRate ?? 0);
  const totalResults = stats
    ? Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0)
    : 0;
  const passCount = stats?.statusBreakdown.pass ?? 0;
  const failCount = stats?.statusBreakdown.fail ?? 0;
  const errorCount =
    (stats?.statusBreakdown.compile_error ?? 0) +
    (stats?.statusBreakdown.runtime_error ?? 0) +
    (stats?.statusBreakdown.timeout ?? 0);

  const recentProjects = projects.slice(0, 4);

  const breakdown: Array<{ label: string; count: number; color: string }> = [
    { label: 'Pass', count: passCount, color: 'var(--green)' },
    { label: 'Fail', count: failCount, color: 'var(--red)' },
    { label: 'Compile Error', count: stats?.statusBreakdown.compile_error ?? 0, color: 'var(--orange)' },
    { label: 'Runtime Error', count: stats?.statusBreakdown.runtime_error ?? 0, color: 'var(--red)' },
    { label: 'Timeout', count: stats?.statusBreakdown.timeout ?? 0, color: 'var(--purple)' },
  ];

  const statsMap = new Map((stats?.recentProjects ?? []).map((p) => [p.id, p]));

  const pipeline = ['Extraction', 'Compilation', 'Execution', 'Comparison', 'Reporting'];

  const handleSave = async (data: Parameters<typeof ipc.project.create>[0]) => {
    await ipc.project.create(data);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          icon="projects"
          label="Projects"
          value={loading ? '…' : (stats?.totalProjects ?? 0)}
          sub={loading ? '' : `${configCount} configurations`}
        />
        <StatCard
          icon="config"
          label="Configurations"
          value={loading ? '…' : configCount}
          sub="Available templates"
        />
        <StatCard
          icon="student"
          label="Students"
          value={loading ? '…' : (stats?.totalStudents ?? 0)}
          sub="Across all projects"
        />
        <StatCard
          icon="check"
          label="Pass Rate"
          value={loading ? '…' : `${passRate}%`}
          sub={loading ? '' : `${passCount} passed, ${failCount + errorCount} issues`}
        />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Projects */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Recent Projects</span>
            <Link to="/projects" style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
              textDecoration: 'none',
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
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < recentProjects.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <LangDot lang={p.configuration?.language ?? ''} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.configuration?.name ?? '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {pStats?.studentCount ?? 0}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>students</div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      color: pStats?.status === 'completed' ? 'var(--green)' : 'var(--orange)',
                      background: pStats?.status === 'completed' ? 'var(--green-dim)' : 'var(--orange-dim)',
                    }}>
                      {pStats?.status === 'completed' ? 'Evaluated' : 'Pending'}
                    </span>
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
              background: 'none', border: 'none', color: 'var(--accent)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
              textDecoration: 'none',
            }}>
              Details <Icon name="chevron" size={14} />
            </Link>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Donut */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9155" fill="none"
                    stroke="var(--bg-hover)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9155" fill="none"
                    stroke="var(--green)" strokeWidth="3"
                    strokeDasharray={`${passRate} ${100 - passRate}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                    {passRate}%
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {breakdown.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: s.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-project bars */}
            {(stats?.recentProjects ?? []).length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10,
                }}>
                  Pass Rate by Project
                </div>
                {(stats?.recentProjects ?? []).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 12, color: 'var(--text-secondary)',
                      width: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {p.name}
                    </span>
                    <div style={{
                      flex: 1, height: 6, background: 'var(--bg-hover)',
                      borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${p.passRate}%`,
                        background: p.passRate >= 70
                          ? 'var(--green)'
                          : p.passRate >= 50 ? 'var(--orange)' : 'var(--red)',
                        borderRadius: 3, transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      width: 36, textAlign: 'right',
                    }}>
                      {Math.round(p.passRate)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Status */}
      <div style={{ ...cardStyle, padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Evaluation Pipeline</span>
        </div>
        <div style={{ padding: 20, display: 'flex', gap: 0, alignItems: 'center' }}>
          {pipeline.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: i < 4 ? 'var(--green-dim)' : 'var(--accent-dim)',
                  border: `2px solid ${i < 4 ? 'var(--green)' : 'var(--accent)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i < 4
                    ? <Icon name="check" size={18} color="var(--green)" />
                    : <Icon name="bar" size={18} color="var(--accent)" />}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {step}
                </span>
              </div>
              {i < 4 && (
                <div style={{
                  width: 60, height: 2, background: 'var(--green)',
                  borderRadius: 1, marginBottom: 24,
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
