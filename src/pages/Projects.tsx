import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { Project } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { cardStyle } from '@/components/shared/StatCard';
import { CreateProjectModal } from '@/components/shared/CreateProjectModal';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    ipc.project.getAll()
      .then(setProjects)
      .catch((err) => console.error('Failed to load projects:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async (data: Parameters<typeof ipc.project.create>[0]) => {
    await ipc.project.create(data);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Projects</h1>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Icon name="plus" size={16} color="#fff" /> New Project
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex',
        }}>
          <Icon name="search" size={16} color="var(--text-muted)" />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          style={{
            width: '100%', padding: '10px 14px 10px 36px',
            borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Language', 'Configuration', 'Date', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {search ? 'No projects match your search.' : 'No projects yet. Create one to get started.'}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LangDot lang={p.configuration?.language ?? ''} />
                      <span style={{ textTransform: 'capitalize' }}>
                        {p.configuration?.language ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {p.configuration?.name ?? '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Icon name="chevron" size={16} color="var(--text-muted)" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
