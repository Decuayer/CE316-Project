import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Configuration } from '@shared/types';

type ConfigPayload = Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>;

interface CreateConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConfigPayload) => Promise<void>;
  initialData?: Configuration;
}

const EMPTY: ConfigPayload = {
  name: '',
  language: '',
  compileCommand: '',
  compileArgs: '',
  runCommand: '',
  runArgs: '',
  sourceFileExpected: '',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
  display: 'block',
};

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  outline: 'none',
};

const helper: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  marginTop: 4,
  lineHeight: 1.4,
};

export function CreateConfigModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CreateConfigModalProps) {
  const [form, setForm] = useState<ConfigPayload>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setLoading(false);
    if (initialData) {
      setForm({
        name: initialData.name,
        language: initialData.language,
        compileCommand: initialData.compileCommand ?? '',
        compileArgs: initialData.compileArgs ?? '',
        runCommand: initialData.runCommand,
        runArgs: initialData.runArgs ?? '',
        sourceFileExpected: initialData.sourceFileExpected,
      });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const update = (key: keyof ConfigPayload, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Name');
    if (!form.language.trim()) missing.push('Language');
    if (!form.runCommand.trim()) missing.push('Run command');
    if (!form.sourceFileExpected.trim()) missing.push('Source file');
    if (missing.length > 0) {
      setError(`Missing required fields: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
        overflow: 'auto',
      }}
      onClick={() => !loading && onClose()}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h2
          id="config-modal-title"
          style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}
        >
          {isEdit ? 'Edit Configuration' : 'New Configuration'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={fieldLabel}>Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="C Programming Default"
              style={fieldInput}
            />
          </div>
          <div>
            <label style={fieldLabel}>Language</label>
            <input
              value={form.language}
              onChange={(e) => update('language', e.target.value)}
              placeholder="c, python, java, haskell..."
              style={fieldInput}
            />
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Source File</label>
          <input
            value={form.sourceFileExpected}
            onChange={(e) => update('sourceFileExpected', e.target.value)}
            placeholder="main.c"
            style={fieldInput}
          />
          <div style={helper}>The exact filename your compiler/interpreter expects inside each student folder.</div>
        </div>

        <div>
          <label style={fieldLabel}>Compile Command (optional)</label>
          <input
            value={form.compileCommand ?? ''}
            onChange={(e) => update('compileCommand', e.target.value)}
            placeholder="gcc"
            style={fieldInput}
          />
          <div style={helper}>Leave empty for interpreted languages (Python, etc.).</div>
        </div>

        <div>
          <label style={fieldLabel}>Compile Args (optional)</label>
          <input
            value={form.compileArgs ?? ''}
            onChange={(e) => update('compileArgs', e.target.value)}
            placeholder="{{sourceFile}} -o {{outputName}}"
            style={fieldInput}
          />
          <div style={helper}>
            Variables: <code>&#123;&#123;sourceFile&#125;&#125;</code> (student source filename),{' '}
            <code>&#123;&#123;outputName&#125;&#125;</code> (compiled output name).
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Run Command</label>
          <input
            value={form.runCommand}
            onChange={(e) => update('runCommand', e.target.value)}
            placeholder="./{{outputName}} or python"
            style={fieldInput}
          />
        </div>

        <div>
          <label style={fieldLabel}>Run Args (optional)</label>
          <input
            value={form.runArgs ?? ''}
            onChange={(e) => update('runArgs', e.target.value)}
            placeholder="{{sourceFile}} {{args}}"
            style={fieldInput}
          />
          <div style={helper}>
            Variables: <code>&#123;&#123;sourceFile&#125;&#125;</code>,{' '}
            <code>&#123;&#123;outputName&#125;&#125;</code>,{' '}
            <code>&#123;&#123;args&#125;&#125;</code> (the project's program arguments).
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: 'var(--red)',
              background: 'var(--red-dim)',
              border: '1px solid var(--red)',
              padding: '8px 12px',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Configuration'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
