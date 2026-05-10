// TODO: GÖRKE GÖYNÜGÜR
// CreateProjectModal: Yeni proje oluşturma modalı.
//
// Props:
//   isOpen: boolean
//   onClose: () => void
//   onSave: (data: { name: string; configurationId: string; input: DataSource; expectedOutput: DataSource }) => Promise<void>
//
// Form Alanları:
//   - name: string (zorunlu) - "HW1 - String Sorting" gibi
//   - configurationId: string (zorunlu) - dropdown ile seçim
//     * ipc.config.getAll() ile konfigürasyonları listele
//     * Her birinin name ve language alanını göster
//   - input: DataSource - İki mod:
//     * type='text': textarea ile metin girişi (command line arguments)
//     * type='file': dosya seçme butonu (ipc.dialog.openFile kullan)
//     * Toggle switch ile modlar arası geçiş
//   - expectedOutput: DataSource - İki mod (input ile aynı yapı):
//     * type='text': textarea ile beklenen çıktı girişi
//     * type='file': dosya seçme butonu
//
// Tasarım:
//   - Portal ile body'e render et
//   - Overlay + centered modal
//   - ESC ile kapatma
//   - Form validation
//   - Save butonu loading state
//   - Mevcut tasarım diline uygun stiller

import React from 'react';

export function CreateProjectModal() {
  // TODO: Implement
  return null;
}
