import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ipc } from '@/lib/ipc';
import type { Project, ProjectResults } from '@shared/types';
import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { StatCard, cardStyle } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<ProjectResults | null>(null);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [p, r, s] = await Promise.all([
        ipc.project.getById(id),
        ipc.project.getResults(id),
        ipc.execution.getStudents(id),
      ]);
      setProject(p);
      setResults(r);
      setStudents(s);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
            color: 'var(--text-secondary)', width: 'fit-content',
          }}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
            color: 'var(--text-secondary)', width: 'fit-content',
          }}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Project not found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          The project you are looking for could not be located.
        </p>
      </div>
    );
  }

  const config = project.configuration;
  const passCount = results?.students.filter((s) => s.status === 'pass').length ?? 0;
  const totalStudents = results?.students.length ?? students.length;
  const hasResults = results !== null && results.students.length > 0;

  const handleImportFolder = async () => {
    setShowImportMenu(false);
    const dirPath = await ipc.dialog.openDirectory();
    if (!dirPath) return;
    setImporting(true);
    try {
      const imported = await ipc.execution.importZips(project.id, dirPath);
      setStudents(imported);
    } catch (err: any) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFiles = async () => {
    setShowImportMenu(false);
    const filePaths = await ipc.dialog.openFiles([{ name: 'ZIP Archives', extensions: ['zip'] }]);
    if (!filePaths || filePaths.length === 0) return;
    setImporting(true);
    try {
      const imported = await ipc.execution.importZipFiles(project.id, filePaths);
      setStudents((prev) => {
        const merged = new Set([...prev, ...imported]);
        return [...merged];
      });
    } catch (err: any) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleRunEvaluation = async () => {
    setRunning(true);
    try {
      const r = await ipc.execution.run(project.id);
      setResults(r);
      setStudents(r.students.map((s) => s.studentId));
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    await ipc.project.delete(project.id);
    navigate('/projects');
  };

  const handleCleanup = async () => {
    try {
      await ipc.execution.cleanup(project.id);
      setConfirmCleanup(false);
      await load();
    } catch (err: any) {
      console.error('Cleanup failed:', err);
      alert(`Cleanup failed: ${err.message}`);
      setConfirmCleanup(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: 'var(--text-secondary)',
          }}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {project.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <LangDot lang={config?.language ?? ''} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {config?.name ?? '—'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          {/* Import ZIPs split button */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <button
                onClick={handleImportFolder}
                disabled={importing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px',
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                  fontWeight: 600, fontSize: 13, cursor: importing ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: importing ? 0.6 : 1,
                  border: 'none', borderRight: '1px solid var(--border)',
                }}
              >
                <Icon name="folder" size={15} />
                {importing ? 'Importing…' : 'Import ZIPs'}
              </button>
              <button
                onClick={() => setShowImportMenu((v) => !v)}
                disabled={importing}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '9px 10px',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  border: 'none', cursor: importing ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
                title="More import options"
              >
                <Icon name={showImportMenu ? 'chevronUp' : 'chevronDown'} size={13} />
              </button>
            </div>

            {showImportMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 100,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  minWidth: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <button
                  onClick={handleImportFolder}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '11px 16px',
                    background: 'transparent', color: 'var(--text-primary)',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  <Icon name="folder" size={14} /> Select Folder
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>All ZIPs inside</span>
                </button>
                <button
                  onClick={handleImportFiles}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '11px 16px',
                    background: 'transparent', color: 'var(--text-primary)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  <Icon name="file" size={14} /> Select ZIP Files
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>Multi-select</span>
                </button>
              </div>
            )}
          </div>

          {/* Open submissions folder */}
          <button
            onClick={() => ipc.execution.openStudentFolder(project.id, '')}
            title="Open submissions folder in Finder"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 12px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Icon name="externalLink" size={15} />
          </button>

          <button
            onClick={handleRunEvaluation}
            disabled={running || students.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 10, border: 'none',
              background: 'var(--green)', color: '#fff',
              fontWeight: 700, fontSize: 13,
              cursor: running || students.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: running || students.length === 0 ? 0.6 : 1,
            }}
          >
            <Icon name="play" size={15} color="#fff" />
            {running ? 'Running…' : 'Run Evaluation'}
          </button>

          {hasResults && (
            <button
              onClick={() => setConfirmCleanup(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name="trash" size={15} /> Clean Up
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid var(--red)',
              background: 'var(--red-dim)', color: 'var(--red)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Icon name="trash" size={15} color="var(--red)" /> Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard icon="student" label="Submissions" value={totalStudents} />
        <StatCard
          icon="check"
          label="Pass Rate"
          value={hasResults ? `${Math.round((passCount / results!.students.length) * 100)}%` : '—'}
        />
        <StatCard
          icon="clock"
          label="Created"
          value={new Date(project.createdAt).toLocaleDateString()}
        />
      </div>

      {/* Configuration details */}
      {config && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Compile Command', value: config.compileCommand || '(interpreted)' },
              { label: 'Run Command', value: config.runCommand },
              { label: 'Source File', value: config.sourceFileExpected },
              { label: 'Language', value: config.language },
            ].map((f) => (
              <div key={f.label}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', marginBottom: 4,
                }}>
                  {f.label}
                </div>
                <div style={{
                  fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                  padding: '8px 12px', background: 'var(--bg-primary)',
                  borderRadius: 6, border: '1px solid var(--border)',
                }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      {hasResults && (
        <div style={{ ...cardStyle, padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Student Results</span>
            {results!.runAt && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
                Last run: {new Date(results!.runAt).toLocaleString()}
              </span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Student ID', 'Status', 'Output Matched'].map((h) => (
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
              {results!.students.map((s) => (
                <tr
                  key={s.studentId}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/projects/${project.id}/results/${s.studentId}`)}
                >
                  <td style={{
                    padding: '12px 16px',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>
                    {s.studentId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.outputMatched
                      ? <Icon name="check" size={16} color="var(--green)" />
                      : <Icon name="x" size={16} color="var(--red)" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!hasResults && students.length === 0 && !loading && (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No submissions yet. Use "Import ZIPs" to add student submissions.
        </div>
      )}

      {!hasResults && students.length > 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          {students.length} student(s) imported. Click "Run Evaluation" to grade them.
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}" and all its files? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="var(--red)"
      />

      <ConfirmDialog
        isOpen={confirmCleanup}
        onClose={() => setConfirmCleanup(false)}
        onConfirm={handleCleanup}
        title="Clean Up Artifacts"
        message="This will delete all compiled binaries and other build artifacts from each student's folder, keeping only the source file. Continue?"
        confirmText="Clean Up"
        confirmColor="var(--orange)"
      />
    </div>
  );
}
