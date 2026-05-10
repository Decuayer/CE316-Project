// TODO: EGE AYYILDIZ [ConfigService Modülü]
// CreateConfigModal: Yeni konfigürasyon oluşturma ve düzenleme modalı.
//
// Props:
//   isOpen: boolean - Modal açık mı?
//   onClose: () => void - Kapatma fonksiyonu
//   onSave: (data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
//   initialData?: Configuration - Düzenleme modunda mevcut veri
//
// Form Alanları:
//   - name: string (zorunlu) - "C Programming Default" gibi
//   - language: string (zorunlu) - "c", "python", "java" gibi
//   - compileCommand: string (opsiyonel) - "gcc" gibi (interpreted diller için boş)
//   - compileArgs: string (opsiyonel) - "{{sourceFile}} -o {{outputName}}" gibi
//   - runCommand: string (zorunlu) - "./{{outputName}}" veya "python" gibi
//   - runArgs: string (opsiyonel) - "{{sourceFile}} {{args}}" gibi
//   - sourceFileExpected: string (zorunlu) - "main.c", "main.py" gibi
//
// Tasarım:
//   - Portal ile body'e render et (overlay + centered modal)
//   - Arka planı karartma overlay'i ekle
//   - ESC tuşu ile kapatma
//   - Form validation: zorunlu alanlar boş olamaz
//   - Save butonu: loading state göster
//   - Mevcut tasarım diline uygun stiller kullan (cardStyle, var(--bg-card), var(--border) vs.)
//   - {{sourceFile}}, {{outputName}}, {{args}} placeholder'larını açıklayan helper text ekle

import React from 'react';

export function CreateConfigModal() {
  // TODO: Implement
  return null;
}
