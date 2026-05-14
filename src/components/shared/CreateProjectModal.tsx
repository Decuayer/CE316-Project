import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ipc } from '@/lib/ipc';
import type { Configuration, DataSource } from '@shared/types';
import { Icon } from './Icon';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    configurationId: string;
    input: DataSource;
    expectedOutput: DataSource;
  }) => Promise<void>;
}

type DataSourceMode = 'text' | 'file';

function DataSourceField({
  label,
  mode,
  textValue,
  filePath,
  onModeChange,
  onTextChange,
  onFilePick,
}: {
  label: string;
  mode: DataSourceMode;
  textValue: string;
  filePath: string;
  onModeChange: (m: DataSourceMode) => void;
  onTextChange: (v: string) => void;
  onFilePick: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {label}
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['text', 'file'] as DataSourceMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              style={{
                padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--border)',
                background: mode === m ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: mode === m ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {m === 'text' ? 'Text' : 'File'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'text' ? (
        <textarea
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          rows={3}
          placeholder="Enter value…"
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
            resize: 'vertical', outline: 'none',
          }}
        />
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              fontSize: 13, color: filePath ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {filePath || 'No file selected'}
          </div>
          <button
            type="button"
            onClick={onFilePick}
            style={{
              padding: '8px 14px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            <Icon name="folder" size={14} /> Browse
          </button>
        </div>
      )}
    </div>
  );
}

export function CreateProjectModal({ isOpen, onClose, onSave }: CreateProjectModalProps) {
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [name, setName] = useState('');
  const [configurationId, setConfigurationId] = useState('');
  const [inputMode, setInputMode] = useState<DataSourceMode>('text');
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState('');
  const [outputMode, setOutputMode] = useState<DataSourceMode>('text');
  const [outputText, setOutputText] = useState('');
  const [outputFile, setOutputFile] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    ipc.config.getAll().then(setConfigs).catch(() => setConfigs([]));
    setName(''); setConfigurationId(''); setInputMode('text'); setInputText('');
    setInputFile(''); setOutputMode('text'); setOutputText(''); setOutputFile('');
    setError('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pickFile = async (setter: (p: string) => void) => {
    const path = await ipc.dialog.openFile();
    if (path) setter(path);
  };

  const buildDataSource = (mode: DataSourceMode, text: string, file: string): DataSource =>
    mode === 'text' ? { type: 'text', value: text } : { type: 'file', path: file };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (!configurationId) { setError('Please select a configuration.'); return; }
    if (inputMode === 'file' && !inputFile) { setError('Please select an input file.'); return; }
    if (outputMode === 'file' && !outputFile) { setError('Please select an expected output file.'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        configurationId,
        input: buildDataSource(inputMode, inputText, inputFile),
        expectedOutput: buildDataSource(outputMode, outputText, outputFile),
      });
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, width: '100%',
    border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
          display: 'flex', flexDirection: 'column', gap: 20,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>New Project</span>
          <button
            type="button" onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4,
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Project Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HW1 — String Sorting"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Configuration
            </label>
            <select
              value={configurationId}
              onChange={(e) => setConfigurationId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select a configuration…</option>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.language})
                </option>
              ))}
            </select>
          </div>

          <DataSourceField
            label="Input (Command-line Arguments)"
            mode={inputMode}
            textValue={inputText}
            filePath={inputFile}
            onModeChange={setInputMode}
            onTextChange={setInputText}
            onFilePick={() => pickFile(setInputFile)}
          />

          <DataSourceField
            label="Expected Output"
            mode={outputMode}
            textValue={outputText}
            filePath={outputFile}
            onModeChange={setOutputMode}
            onTextChange={setOutputText}
            onFilePick={() => pickFile(setOutputFile)}
          />

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--red-dim)', color: 'var(--red)',
              fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              type="button" onClick={onClose} disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontWeight: 600, fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: saving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontWeight: 700, fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
