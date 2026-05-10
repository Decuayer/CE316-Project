// TODO: EGE AYYILDIZ [ConfigService Modülü]
// Mock data bağımlılığını kaldır ve langColors'ı bu dosya içinde tanımla:
//   const langColors: Record<string, string> = {
//     c: '#555555',
//     cpp: '#f34b7d',
//     python: '#3572A5',
//     java: '#b07219',
//     haskell: '#5e5086',
//   };
// LangKey tipi yerine string kullan (Configuration.language string'dir).
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
