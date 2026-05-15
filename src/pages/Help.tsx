import { useState } from 'react';
import { cardStyle } from '@/components/shared/StatCard';
import { Icon } from '@/components/shared/Icon';

// ─── version ──────────────────────────────────────────────────────────────────
const APP_VERSION = '1.0.0';

// ─── data ─────────────────────────────────────────────────────────────────────

const quickStartSteps = [
  {
    step: '1',
    title: 'Create a Configuration',
    detail:
      'Go to the Configurations page (left sidebar). Click "New Configuration". Choose a language (e.g. C), set the Source File Expected (e.g. main.c), the Compile Command (e.g. gcc -o {{outputName}} {{sourceFile}}), and the Run Command (e.g. ./{{outputName}}). Save it.',
  },
  {
    step: '2',
    title: 'Create a Project',
    detail:
      'Go to Projects (or click "New Project" on the Dashboard). Give the project a name (e.g. "HW1 – Sorting"), select the configuration you just created, enter the expected program input (or leave blank), and paste the expected output the program should print.',
  },
  {
    step: '3',
    title: 'Import Student Submissions',
    detail:
      'Open the project and click "Import ZIPs". You have two options: (a) Select Folder – picks every .zip file inside a chosen folder; (b) Select ZIP Files – multi-select individual .zip files from Finder. Each .zip file should be named after the student\'s ID (e.g. 20230001.zip).',
  },
  {
    step: '4',
    title: 'Run Evaluation',
    detail:
      'Click the green "Run Evaluation" button. IAE will extract, compile, execute, and compare every submission automatically. The button shows "Running…" while working — do not close the window.',
  },
  {
    step: '5',
    title: 'Review Results',
    detail:
      'After evaluation completes, the results table appears. Each row shows a student ID, status badge (PASS / FAIL / COMPILE_ERROR / RUNTIME_ERROR / TIMEOUT / MISSING_SOURCE), and whether the output matched. Click any row to see full execution logs, compiler output, and the student\'s source code.',
  },
  {
    step: '6',
    title: 'Annotate & Grade',
    detail:
      'On each student\'s detail page, scroll to "Instructor Notes". Add a text note and/or a numeric score (0–100). Click Save. Annotations are stored in the database and persist across sessions.',
  },
];

const pipelineSteps = [
  {
    icon: 'upload' as const,
    name: 'Extract',
    color: 'var(--accent)',
    bg: 'var(--accent-dim)',
    desc: 'Each student\'s .zip is unpacked into an isolated folder. The folder name becomes the student ID. If a .zip is invalid or empty, the student is marked ZIP_ERROR and skipped — other students are not affected.',
  },
  {
    icon: 'terminal' as const,
    name: 'Compile',
    color: 'var(--orange)',
    bg: 'var(--orange-dim)',
    desc: 'The configured compile command runs (e.g. gcc -o main main.c). If the compiler exits with a non-zero code, the student is marked COMPILE_ERROR and the compile output is saved for inspection.',
  },
  {
    icon: 'play' as const,
    name: 'Execute',
    color: 'var(--green)',
    bg: 'var(--green-dim)',
    desc: 'The run command executes with the configured input (stdin or arguments). A 10-second timeout is enforced. If the program does not finish in time, it is killed and marked TIMEOUT. Crashes produce RUNTIME_ERROR.',
  },
  {
    icon: 'diff' as const,
    name: 'Compare',
    color: 'var(--purple)',
    bg: 'var(--purple-dim)',
    desc: 'The program\'s stdout is compared against the expected output line-by-line. Exact match → PASS. Any difference → FAIL. Trailing newlines are trimmed to avoid false failures.',
  },
  {
    icon: 'results' as const,
    name: 'Report',
    color: 'var(--text-secondary)',
    bg: 'var(--bg-hover)',
    desc: 'Every result (status, compile log, execution output, expected vs actual) is saved to the local SQLite database. Results persist even if you close and reopen IAE.',
  },
];

const statusDefs = [
  { status: 'PASS',           color: 'var(--green)',  bg: 'var(--green-dim)',   desc: 'Program compiled, ran, and produced output that exactly matches the expected output.' },
  { status: 'FAIL',           color: 'var(--red)',    bg: 'var(--red-dim)',     desc: 'Program ran successfully but the output does not match the expected output.' },
  { status: 'COMPILE_ERROR',  color: 'var(--orange)', bg: 'var(--orange-dim)', desc: 'Compilation failed. The compiler exited with a non-zero code. Check the Compile Output in the student detail view.' },
  { status: 'RUNTIME_ERROR',  color: 'var(--red)',    bg: 'var(--red-dim)',     desc: 'The program crashed during execution (segfault, exception, non-zero exit). The error message is shown in Execution Output.' },
  { status: 'TIMEOUT',        color: 'var(--purple)', bg: 'var(--purple-dim)', desc: 'The program did not finish within 10 seconds. Usually caused by an infinite loop or waiting for input that was not provided.' },
  { status: 'MISSING_SOURCE', color: 'var(--orange)', bg: 'var(--orange-dim)', desc: 'The ZIP was extracted successfully but the expected source file (e.g. main.c) was not found inside it.' },
  { status: 'ZIP_ERROR',      color: 'var(--red)',    bg: 'var(--red-dim)',     desc: 'The .zip file could not be opened or extracted. The file may be corrupted, a wrong format (.rar), or zero bytes.' },
];

const templateVars = [
  { name: '{{sourceFile}}',  desc: 'The source filename as configured in the language profile (e.g. main.c). Substituted into compile and run commands.' },
  { name: '{{outputName}}', desc: 'The compiled binary name — the source filename without its extension (e.g. main for main.c). Used for -o flags and execution.' },
];

const configTemplates = [
  { language: 'C',       sourceFile: 'main.c',    compile: 'gcc -o {{outputName}} {{sourceFile}}',  run: './{{outputName}}', notes: 'gcc must be installed and on PATH.' },
  { language: 'C++',     sourceFile: 'main.cpp',  compile: 'g++ -o {{outputName}} {{sourceFile}}',  run: './{{outputName}}', notes: 'g++ must be installed and on PATH.' },
  { language: 'Java',    sourceFile: 'Main.java',  compile: 'javac {{sourceFile}}',                  run: 'java Main',        notes: 'Class name must be Main. JDK required.' },
  { language: 'Python',  sourceFile: 'main.py',   compile: null,                                     run: 'python3 {{sourceFile}}', notes: 'No compile step. python3 must be on PATH.' },
  { language: 'Haskell', sourceFile: 'Main.hs',   compile: 'ghc -o {{outputName}} {{sourceFile}}',  run: './{{outputName}}', notes: 'GHC must be installed.' },
];

const zipRules = [
  'Each .zip file must be named after the student\'s ID — exactly as it should appear in the results table. Example: 20230001.zip → student ID is 20230001.',
  'The source file must be at the root of the ZIP, NOT inside a sub-folder. Example correct structure: 20230001.zip → main.c',
  'If students submit a folder inside the ZIP (e.g. 20230001.zip → 20230001/main.c), IAE automatically detects and flattens the single top-level directory.',
  'Only .zip format is supported. Files with .rar, .7z, .tar.gz or other formats are silently skipped.',
  'Multiple source files are allowed in the ZIP; only the file named in "Source File Expected" is used.',
  'You can import ZIPs in three ways: (a) Select Folder — all ZIPs in a folder, (b) Select ZIP Files — multi-select individual files.',
  'You can delete a student\'s submission individually from the Results page and re-import/re-evaluate just that one student.',
];

const faqItems = [
  {
    q: '"Command not found" or compiler error on every student',
    a: 'The compiler (gcc, javac, python3, ghc…) is not installed or not on the system PATH. Install the compiler for your OS and restart IAE. Test by opening Terminal and typing the compiler name.',
  },
  {
    q: 'Every student shows TIMEOUT',
    a: 'The program is waiting for stdin input that was not provided, or it has an infinite loop. Make sure the "Expected Input" in the project settings matches exactly what the program reads. Also verify the program terminates normally in a terminal.',
  },
  {
    q: 'Every student shows COMPILE_ERROR',
    a: 'Check the Compile Command in the configuration. Open a terminal, go to a student\'s extracted folder, and run the command manually. Common mistakes: wrong flag syntax, mismatched {{sourceFile}} vs actual filename (case-sensitive on macOS/Linux).',
  },
  {
    q: 'Students show FAIL despite correct logic',
    a: 'The output comparison is exact. Check for: trailing newline differences, extra spaces, Windows CRLF (\\r\\n) line endings in the expected output file, or locale-dependent number formatting. Use a hex editor or `cat -A` to inspect the expected output file.',
  },
  {
    q: 'Import shows 0 students extracted',
    a: 'The selected folder may not contain .zip files, or the files use a different extension (.rar, .7z). Confirm file extensions in Finder. Also check that ZIP files are not corrupted (try opening one manually).',
  },
  {
    q: 'MISSING_SOURCE for every student',
    a: '"Source File Expected" in the configuration does not match the actual filename inside the ZIPs. File names are case-sensitive — main.c and Main.c are different files. Update the configuration to match exactly.',
  },
  {
    q: 'Clean Up button does not seem to work',
    a: '"Clean Up Artifacts" removes compiled binaries (e.g. a.out, main) and intermediate files from each student folder, keeping only the original source file. If there are no artifacts to remove, it finishes silently. Run evaluation first to produce artifacts.',
  },
  {
    q: 'I deleted a configuration and now a project shows no config',
    a: 'Configurations are snapshotted at project creation time. If the original configuration is deleted, the project still holds a copy of its settings — evaluation will still work. The display may show "—" for the config name, which is cosmetic only.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Everything is stored locally on your Mac in the ~/.iae directory: database.sqlite holds all project/result data; the projects/ subfolder holds extracted student submissions. Nothing is sent to the internet.',
  },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      {icon}
      <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
    </div>
  );
}

function FaqAccordion({ items }: { items: typeof faqItems }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-hover)',
            border: `1px solid ${open === i ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8,
            overflow: 'hidden',
            transition: 'border-color 0.15s',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.q}
            </span>
            <Icon
              name={open === i ? 'chevronUp' : 'chevronDown'}
              size={14}
              color="var(--text-muted)"
              style={{ flexShrink: 0, marginLeft: 12 }}
            />
          </button>
          {open === i && (
            <div style={{
              padding: '0 16px 14px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
            }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Help() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Help &amp; Documentation
        </h1>
        <span style={{
          fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)',
          background: 'var(--bg-hover)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '2px 8px',
        }}>
          v{APP_VERSION}
        </span>
      </div>

      {/* ── 1. Quick Start ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Quick Start Guide"
          icon={<Icon name="play" size={18} color="var(--green)" />}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {quickStartSteps.map((s) => (
            <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: 'var(--accent-dim)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {s.step}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Evaluation Pipeline ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="How the Evaluation Pipeline Works"
          icon={<Icon name="terminal" size={18} color="var(--accent)" />}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pipelineSteps.map((s, i) => (
            <div key={s.name} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: s.bg, border: `1px solid ${s.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={s.icon} size={16} color={s.color} />
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div style={{ width: 2, height: 20, background: 'var(--border)', marginTop: 4 }} />
                )}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: s.color }}>{s.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Status Reference ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Status Reference"
          icon={<Icon name="results" size={18} color="var(--accent)" />}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statusDefs.map((s) => (
            <div key={s.status} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '10px 14px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                color: s.color, background: s.bg,
                flexShrink: 0, fontFamily: "'JetBrains Mono', monospace",
                alignSelf: 'flex-start',
              }}>
                {s.status}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. ZIP Format ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="ZIP Submission Format"
          icon={<Icon name="folder" size={18} color="var(--orange)" />}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zipRules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)', marginTop: 7, flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rule}</span>
            </div>
          ))}
        </div>
        {/* Visual example */}
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: 'var(--text-secondary)', lineHeight: 1.8,
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>// Example folder structure for Import</div>
          <div>submissions/</div>
          <div style={{ paddingLeft: 16 }}>├── 20230001.zip  → main.c</div>
          <div style={{ paddingLeft: 16 }}>├── 20230002.zip  → main.c</div>
          <div style={{ paddingLeft: 16 }}>└── 20230003.zip  → main.c</div>
        </div>
      </div>

      {/* ── 5. Configuration Templates ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Configuration Templates"
          icon={<Icon name="config" size={18} color="var(--purple)" />}
        />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, marginTop: 0 }}>
          Copy these settings when creating a new configuration for each language.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {configTemplates.map((t) => (
            <div key={t.language} style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{t.language}</span>
                <span style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 4, padding: '1px 7px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {t.sourceFile}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 8px', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Compile Command</span>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", color: t.compile ? 'var(--accent)' : 'var(--text-muted)', fontStyle: t.compile ? 'normal' : 'italic' }}>
                  {t.compile ?? '(no compile step)'}
                </code>
                <span style={{ color: 'var(--text-muted)' }}>Run Command</span>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>{t.run}</code>
                <span style={{ color: 'var(--text-muted)' }}>Notes</span>
                <span style={{ color: 'var(--text-secondary)' }}>{t.notes}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Template variables */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Template Variables</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templateVars.map((v) => (
              <div key={v.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <code style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  color: 'var(--accent)', background: 'var(--accent-dim)',
                  borderRadius: 5, padding: '2px 8px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {v.name}
                </code>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Config Import/Export ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Sharing Configurations"
          icon={<Icon name="upload" size={18} color="var(--green)" />}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'On the Configurations page, click the Export button (↓) next to any configuration to save it as a .json file.',
            'Click "Import Configuration" on the Configurations page to load a .json file on any IAE installation.',
            'This lets you share language setups with colleagues, or back up your configurations.',
            'Configurations are snapshots — exporting then importing gives you an exact copy, independent of the original.',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)', marginTop: 7, flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. FAQ (accordion) ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="Troubleshooting &amp; FAQ"
          icon={<Icon name="help" size={18} color="var(--accent)" />}
        />
        <FaqAccordion items={faqItems} />
      </div>

      {/* ── 8. Data & Privacy ── */}
      <div style={{
        ...cardStyle,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'var(--green-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="check" size={18} color="var(--green)" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>100% Local &amp; Private</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            IAE stores all data locally on your machine inside <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--accent)' }}>~/.iae/</code>.
            This includes the SQLite database (<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>database.sqlite</code>) and all extracted student submissions (<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>projects/</code>).
            No data is sent to any server. No internet connection is required.
          </div>
        </div>
      </div>

    </div>
  );
}
