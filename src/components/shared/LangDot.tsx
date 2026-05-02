import { langColors, type LangKey } from '@/lib/mockData';

interface LangDotProps {
  lang: LangKey | string;
  size?: number;
}

export function LangDot({ lang, size = 10 }: LangDotProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: (langColors as Record<string, string>)[lang] ?? '#666',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}
