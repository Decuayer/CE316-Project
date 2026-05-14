import { cardStyle } from '@/components/shared/StatCard';

const APP_VERSION = '1.0.0';

interface HelpSection {
  title: string;
  items: string[];
}

const quickStart: HelpSection = {
  title: 'Quick Start Guide',
  items: [
    '1. Go to Configurations and create a language profile (e.g. "C Programming Language").',
    '2. Set compileCommand (e.g. gcc -o main {{sourceFile}}) and runCommand (e.g. ./main).',
    '3. Go to Projects and click "New Project". Link it to the configuration you created.',
    '4. Open the project and set the expected input and expected output files.',
    '5. Click "Import ZIPs" and select the folder containing student .zip submissions.',
    '6. Click "Run Evaluation" — IAE will compile, run, and compare every submission.',
    '7. Review results in the Results tab; click a student row for full execution details.',
  ],
};

const evaluationPipeline: HelpSection = {
  title: 'Evaluation Pipeline',
  items: [
    'Extract — Each student .zip is unpacked into an isolated folder (studentId = filename without .zip).',
    'Compile — The compileCommand is executed. If it exits non-zero the student is marked COMPILE_ERROR.',
    'Execute — The runCommand runs with the configured input under a timeout. TIMEOUT is recorded if exceeded.',
    'Compare — Actual stdout is compared line-by-line against the expected output file.',
    'Report — Final status (PASS / FAIL / COMPILE_ERROR / RUNTIME_ERROR / TIMEOUT) is saved to the database.',
  ],
};

const supportedLanguages: HelpSection = {
  title: 'Supported Languages',
  items: [
    'C (gcc)',
    'C++ (g++)',
    'Java (javac + java)',
    'Python 3 (no compile step needed)',
    'Haskell (ghc)',
    'Any language — provide custom compileCommand / runCommand in the configuration.',
  ],
};

const configExport: HelpSection = {
  title: 'Configuration Import / Export',
  items: [
    'Configurations can be exported as JSON files from the Configurations page.',
    'Import a JSON file to restore a configuration on any IAE installation.',
    'Share language setups with colleagues or use them as templates for new assignments.',
  ],
};

interface ConfigTemplate {
  language: string;
  sourceFile: string;
  compileCommand: string | null;
  runCommand: string;
}

const configTemplates: ConfigTemplate[] = [
  {
    language: 'C',
    sourceFile: 'main.c',
    compileCommand: 'gcc -o {{outputName}} {{sourceFile}}',
    runCommand: './{{outputName}}',
  },
  {
    language: 'C++',
    sourceFile: 'main.cpp',
    compileCommand: 'g++ -o {{outputName}} {{sourceFile}}',
    runCommand: './{{outputName}}',
  },
  {
    language: 'Java',
    sourceFile: 'Main.java',
    compileCommand: 'javac {{sourceFile}}',
    runCommand: 'java Main',
  },
  {
    language: 'Python',
    sourceFile: 'main.py',
    compileCommand: null,
    runCommand: 'python {{sourceFile}}',
  },
  {
    language: 'Haskell',
    sourceFile: 'Main.hs',
    compileCommand: 'ghc -o {{outputName}} {{sourceFile}}',
    runCommand: './{{outputName}}',
  },
];

interface TemplateVar {
  name: string;
  description: string;
}

const templateVars: TemplateVar[] = [
  {
    name: '{{sourceFile}}',
    description: 'Replaced with the expected source filename (e.g. main.c). Configured per language profile.',
  },
  {
    name: '{{outputName}}',
    description: 'Replaced with the compiled binary name (same as source without extension, e.g. main).',
  },
  {
    name: '{{args}}',
    description: 'Replaced with any extra runtime arguments defined in the project settings.',
  },
];

const zipFormatItems: string[] = [
  'Each student submits a single .zip file named after their student ID (e.g. 20200042.zip).',
  'The ZIP must contain the source file at its root (not inside a nested folder).',
  'Example structure: 20200042.zip → main.c',
  'Java example: 20200042.zip → Main.java',
  'Multiple source files are allowed; only the configured "Source File Expected" is used for compilation.',
  'All student ZIPs must be placed in the same folder before clicking "Import ZIPs".',
];

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: 'Compiler not found / command not found',
    answer: 'Ensure the compiler (gcc, g++, javac, python, ghc) is installed and on the system PATH. Restart IAE after installing compilers.',
  },
  {
    question: 'All students show TIMEOUT',
    answer: 'The program may be waiting for stdin input that was not provided, or it runs an infinite loop. Check that the input file is correctly set in the project and that the program terminates.',
  },
  {
    question: 'COMPILE_ERROR for every student',
    answer: 'Verify the compileCommand in the configuration. Test it manually in a terminal with a sample file. Check that {{sourceFile}} matches the actual filename students submit.',
  },
  {
    question: 'Expected output mismatch (FAIL) despite correct logic',
    answer: 'Check for trailing newlines or extra whitespace in the expected output file. IAE compares stdout line-by-line; whitespace differences cause FAIL.',
  },
  {
    question: 'ZIP import shows 0 students extracted',
    answer: 'Confirm the selected folder contains .zip files (not .rar or .7z). ZIP files must use the .zip extension. Nested archives are not supported.',
  },
  {
    question: 'Cannot open the project after creation',
    answer: 'Make sure the linked configuration still exists. If the configuration was deleted, recreate it or assign a new one to the project.',
  },
];

export default function Help() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Help</h1>
        <span
          style={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          v{APP_VERSION}
        </span>
      </div>

      {/* Quick Start + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[quickStart, evaluationPipeline].map((s) => (
          <div key={s.title} style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{s.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Templates */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Configuration Templates</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {configTemplates.map((t) => (
            <div
              key={t.language}
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '4px 16px',
                alignItems: 'start',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  gridRow: '1 / span 3',
                  alignSelf: 'center',
                }}
              >
                {t.language}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Source: <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.sourceFile}</code>
              </span>
              {t.compileCommand ? (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Compile:{' '}
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>
                    {t.compileCommand}
                  </code>
                </span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No compile step
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Run:{' '}
                <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>
                  {t.runCommand}
                </code>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Template Variables */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Template Variables</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Use these placeholders in compile and run commands — IAE substitutes them at evaluation time.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templateVars.map((v) => (
            <div key={v.name} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <code
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  borderRadius: 5,
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {v.name}
              </code>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {v.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ZIP Format + Supported Languages + Export */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>ZIP Format</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {zipFormatItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[supportedLanguages, configExport].map((s) => (
            <div key={s.title} style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{s.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting / FAQ */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Troubleshooting / FAQ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqItems.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {item.question}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Keyboard Shortcuts</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 8,
          }}
        >
          {[
            { keys: 'Ctrl + N', action: 'New Project / New Configuration (on respective page)' },
            { keys: 'Ctrl + R', action: 'Run evaluation for the current project' },
            { keys: 'Ctrl + I', action: 'Import ZIPs for the current project' },
            { keys: 'Backspace / Del', action: 'Delete selected item (with confirmation)' },
            { keys: 'Escape', action: 'Close dialog / cancel current action' },
          ].map((shortcut) => (
            <div key={shortcut.keys} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <code
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {shortcut.keys}
              </code>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{shortcut.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
