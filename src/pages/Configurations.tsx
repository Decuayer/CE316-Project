import { useEffect, useState, useCallback } from 'react';

import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { cardStyle } from '@/components/shared/StatCard';
import { CreateConfigModal } from '@/components/shared/CreateConfigModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ipc } from '@/lib/ipc';
import type { Configuration } from '@shared/types';

const headerButtonPrimary: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const headerButtonSecondary: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const cardIconButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default function Configurations() {
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Configuration | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Configuration | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const list = await ipc.config.getAll();
      setConfigs(list);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openNew = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const openEdit = (c: Configuration) => {
    setEditTarget(c);
    setModalOpen(true);
  };

  const handleSave = async (data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      await ipc.config.update(editTarget.id, data);
    } else {
      await ipc.config.create(data);
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await ipc.config.delete(deleteTarget.id);
    await refresh();
  };

  const handleImport = async () => {
    setPageError(null);
    try {
      const filePath = await ipc.dialog.openFile([
        { name: 'JSON Configurations', extensions: ['json'] },
      ]);
      if (!filePath) return;
      await ipc.config.import(filePath);
      await refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExport = async (c: Configuration) => {
    setPageError(null);
    try {
      const safeName = c.name.replace(/[^a-z0-9-_]+/gi, '_');
      const targetPath = await ipc.dialog.saveFile(`${safeName}.json`, [
        { name: 'JSON Configurations', extensions: ['json'] },
      ]);
      if (!targetPath) return;
      await ipc.config.export(c.id, targetPath);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Configurations</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={headerButtonSecondary} onClick={handleImport}>
            <Icon name="upload" size={16} /> Import JSON
          </button>
          <button type="button" style={headerButtonPrimary} onClick={openNew}>
            <Icon name="plus" size={16} color="#fff" /> New Config
          </button>
        </div>
      </div>

      {pageError && (
        <div
          role="alert"
          style={{
            fontSize: 13,
            color: 'var(--red)',
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            padding: '10px 14px',
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {pageError}
        </div>
      )}

      {loading && configs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading configurations...</div>
      ) : configs.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <Icon name="config" size={32} color="var(--text-muted)" />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No configurations yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Create one with the <strong>New Config</strong> button, or import a shared JSON.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {configs.map((c) => (
            <div
              key={c.id}
              style={cardStyle}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                  minWidth: 0,
                }}
              >
                <LangDot lang={c.language} />
                <span
                  title={c.name}
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'var(--bg-hover)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {c.language}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.compileCommand && (
                  <CardField label="Compile" value={c.compileCommand} tone="accent" />
                )}
                <CardField label="Run" value={c.runCommand} tone="green" />
                <CardField label="Source File" value={c.sourceFileExpected} tone="muted" />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  title="Export as JSON"
                  aria-label={`Export ${c.name}`}
                  style={cardIconButton}
                  onClick={() => handleExport(c)}
                >
                  <Icon name="upload" size={16} />
                </button>
                <button
                  type="button"
                  title="Edit"
                  aria-label={`Edit ${c.name}`}
                  style={cardIconButton}
                  onClick={() => openEdit(c)}
                >
                  <Icon name="config" size={16} />
                </button>
                <button
                  type="button"
                  title="Delete"
                  aria-label={`Delete ${c.name}`}
                  style={{ ...cardIconButton, color: 'var(--red)' }}
                  onClick={() => setDeleteTarget(c)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editTarget}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete configuration"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone. ` +
              `If any project still uses this configuration, the delete will be refused.`
            : ''
        }
        confirmText="Delete"
      />
    </div>
  );
}

function CardField({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'accent' | 'green' | 'muted';
}) {
  const palette =
    tone === 'accent'
      ? { color: 'var(--accent)', background: 'var(--accent-dim)' }
      : tone === 'green'
      ? { color: 'var(--green)', background: 'var(--green-dim)' }
      : { color: 'var(--text-secondary)', background: 'var(--bg-hover)' };
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <code
        style={{
          fontSize: 12,
          color: palette.color,
          background: palette.background,
          padding: '4px 8px',
          borderRadius: 4,
          display: 'block',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </code>
    </div>
  );
}
