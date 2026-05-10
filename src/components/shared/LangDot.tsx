const LANG_COLORS: Record<string, string> = {
  c: '#555555',
  cpp: '#f34b7d',
  python: '#3572A5',
  java: '#b07219',
  haskell: '#5e5086',
  javascript: '#f1e05a',
  typescript: '#3178c6',
};

const FALLBACK_COLOR = '#666';

interface LangDotProps {
  lang: string;
  size?: number;
}

export function LangDot({ lang, size = 10 }: LangDotProps) {
  const key = lang.toLowerCase();
  const color = LANG_COLORS[key] ?? FALLBACK_COLOR;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}
