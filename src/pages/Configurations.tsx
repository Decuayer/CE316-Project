import { Icon } from '@/components/shared/Icon';
import { LangDot } from '@/components/shared/LangDot';
import { cardStyle } from '@/components/shared/StatCard';
import { CONFIGS } from '@/lib/mockData';

export default function Configurations() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Configurations</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
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
            }}
          >
            <Icon name="upload" size={16} /> Import JSON
          </button>
          <button
            style={{
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
            }}
          >
            <Icon name="plus" size={16} color="#fff" /> New Config
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {CONFIGS.map((c) => (
          <div
            key={c.id}
            style={{ ...cardStyle, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <LangDot lang={c.language} />
              <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{c.name}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                {c.language}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.compileCommand && (
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
                    Compile
                  </div>
                  <code
                    style={{
                      fontSize: 12,
                      color: 'var(--accent)',
                      background: 'var(--accent-dim)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      display: 'block',
                    }}
                  >
                    {c.compileCommand}
                  </code>
                </div>
              )}
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
                  Run
                </div>
                <code
                  style={{
                    fontSize: 12,
                    color: 'var(--green)',
                    background: 'var(--green-dim)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    display: 'block',
                  }}
                >
                  {c.runCommand}
                </code>
              </div>
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
                  Source File
                </div>
                <code
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    display: 'block',
                    background: 'var(--bg-hover)',
                  }}
                >
                  {c.sourceFileExpected}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
