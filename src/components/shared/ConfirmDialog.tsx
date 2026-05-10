// TODO: GÖRKE GÖYNÜGÜR
// ConfirmDialog: Silme/cleanup gibi tehlikeli işlemler için onay diyaloğu.
//
// Props:
//   isOpen: boolean
//   onClose: () => void
//   onConfirm: () => Promise<void> | void
//   title: string - "Delete Project" gibi
//   message: string - "Bu projeyi silmek istediğinize emin misiniz?" gibi
//   confirmText?: string - Varsayılan: "Confirm"
//   confirmColor?: string - Varsayılan: 'var(--red)' (silme işlemleri için kırmızı)
//
// Tasarım:
//   - Portal ile body'e render et
//   - Overlay + centered küçük modal (max-width: 400px)
//   - ESC ile kapatma
//   - İki buton: Cancel (secondary) + Confirm (primary, confirmColor ile renkli)
//   - Confirm butonuna tıklandığında loading state göster
//   - Mevcut tasarım diline uygun stiller

import React from 'react';

export function ConfirmDialog() {
  // TODO: Implement
  return null;
}
