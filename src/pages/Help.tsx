import { cardStyle } from '@/components/shared/StatCard';

interface HelpSection {
  title: string;
  items: string[];
}

const sections: HelpSection[] = [
  {
    title: 'Getting Started',
    items: [
      'Create a Language Configuration defining compile and run commands',
      'Create a new Project and link it to a configuration',
      'Set the expected input/output for the assignment',
      'Import student ZIP submissions',
      'Run the evaluation pipeline',
    ],
  },
  {
    title: 'Evaluation Pipeline',
    items: [
      'Extract — Student archives are unzipped into isolated directories',
      'Compile — Source is compiled (if applicable); errors are recorded',
      'Execute — Programs run with defined inputs under a timeout',
      'Compare — Output is checked against expected results',
      'Report — Final status (PASS/FAIL/ERROR) is saved to the database',
    ],
  },
  {
    title: 'Supported Languages',
    items: [
      'C (gcc)',
      'C++ (g++)',
      'Java (javac + java)',
      'Python (interpreter)',
      'Haskell (ghc)',
      'Any language via custom configuration',
    ],
  },
  {
    title: 'Configuration Export',
    items: [
      'Configurations can be exported as JSON files',
      'Import configurations on any IAE instance',
      'Share language setups across machines and colleagues',
    ],
  },
];

export default function Help() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Help</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {sections.map((s) => (
          <div key={s.title} style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{s.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.items.map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: 'var(--accent-dim)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
