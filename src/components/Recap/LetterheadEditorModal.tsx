import React, { useState } from 'react';
import { LetterheadConfig, ExportCustomOptions } from '../../types';
import {
  FileText,
  Save,
  X,
  Settings2,
  CheckSquare,
  Square,
  Building,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface LetterheadEditorModalProps {
  letterhead: LetterheadConfig;
  exportOptions: ExportCustomOptions;
  onSave: (letterhead: LetterheadConfig, options: ExportCustomOptions) => void;
  onClose: () => void;
}

export function LetterheadEditorModal({
  letterhead,
  exportOptions,
  onSave,
  onClose,
}: LetterheadEditorModalProps) {
  const [kopData, setKopData] = useState<LetterheadConfig>({ ...letterhead });
  const [optData, setOptData] = useState<ExportCustomOptions>({ ...exportOptions });

  const handleToggleOption = (key: keyof ExportCustomOptions) => {
    if (typeof optData[key] === 'boolean') {
      setOptData({
        ...optData,
        [key]: !optData[key],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(kopData, optData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Kustomisasi Kop Surat, Logo & Pilihan Export
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan identitas kop resmi yayasan, sekolah, penandatangan, dan kolom laporan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Kop Surat Lembaga */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Identitas Yayasan & Lembaga Sekolah</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Yayasan Penaung *
                </label>
                <input
                  type="text"
                  value={kopData.yayasanName}
                  onChange={(e) => setKopData({ ...kopData, yayasanName: e.target.value })}
                  placeholder="YAYASAN KESATUAN PENDIDIKAN ISLAM AL ITTIHAD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Satuan Pendidikan (Sekolah) *
                </label>
                <input
                  type="text"
                  value={kopData.schoolName}
                  onChange={(e) => setKopData({ ...kopData, schoolName: e.target.value })}
                  placeholder="SMA IT AL ITTIHAD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motto Sekolah *
              </label>
              <input
                type="text"
                value={kopData.motto}
                onChange={(e) => setKopData({ ...kopData, motto: e.target.value })}
                placeholder="Alquran Akhlak Prestasi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-amber-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Akreditasi
                </label>
                <input
                  type="text"
                  value={kopData.accreditation}
                  onChange={(e) => setKopData({ ...kopData, accreditation: e.target.value })}
                  placeholder="A (Unggul)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NPSN
                </label>
                <input
                  type="text"
                  value={kopData.npsn}
                  onChange={(e) => setKopData({ ...kopData, npsn: e.target.value })}
                  placeholder="10404435"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NSS
                </label>
                <input
                  type="text"
                  value={kopData.nss}
                  onChange={(e) => setKopData({ ...kopData, nss: e.target.value })}
                  placeholder="304096008035"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Sekolah
              </label>
              <textarea
                rows={2}
                value={kopData.address}
                onChange={(e) => setKopData({ ...kopData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon Sekolah
                </label>
                <input
                  type="text"
                  value={kopData.phone}
                  onChange={(e) => setKopData({ ...kopData, phone: e.target.value })}
                  placeholder="(0761) 51522"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={kopData.email}
                  onChange={(e) => setKopData({ ...kopData, email: e.target.value })}
                  placeholder="info@alittihad.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website Sekolah
                </label>
                <input
                  type="text"
                  value={kopData.website}
                  onChange={(e) => setKopData({ ...kopData, website: e.target.value })}
                  placeholder="www.smaitalittihad.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penandatangan Dokumen */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Pejabat Penandatangan Dokumen Legal</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={kopData.headmasterName}
                  onChange={(e) => setKopData({ ...kopData, headmasterName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NIY Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={kopData.headmasterNip}
                  onChange={(e) => setKopData({ ...kopData, headmasterNip: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Koordinator / Guru Piket
                </label>
                <input
                  type="text"
                  value={kopData.counselorName}
                  onChange={(e) => setKopData({ ...kopData, counselorName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIY Koordinator
                </label>
                <input
                  type="text"
                  value={kopData.counselorNiy}
                  onChange={(e) => setKopData({ ...kopData, counselorNiy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kebutuhan Kolom yang Ingin Diexport */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Kebutuhan Kolom yang Ingin Di-Export (PDF & Excel)</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Laporan Dokumen
              </label>
              <input
                type="text"
                value={optData.reportTitle}
                onChange={(e) => setOptData({ ...optData, reportTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                { key: 'includeNis', label: 'Nomor Induk Siswa (NIS)' },
                { key: 'includeNisn', label: 'NISN Nasional' },
                { key: 'includeClass', label: 'Rombongan Belajar (Kelas)' },
                { key: 'includeHadir', label: 'Kolom Hadir (H)' },
                { key: 'includeTerlambat', label: 'Kolom Terlambat (T)' },
                { key: 'includeIzin', label: 'Kolom Izin (I)' },
                { key: 'includeSakit', label: 'Kolom Sakit (S)' },
                { key: 'includeAlpa', label: 'Kolom Alpa (A)' },
                { key: 'includePercentage', label: 'Kolom % Kehadiran' },
                { key: 'includeNotes', label: 'Catatan / Alasan' },
              ].map(({ key, label }) => {
                const isChecked = optData[key as keyof ExportCustomOptions] as boolean;
                return (
                  <div
                    key={key}
                    onClick={() => handleToggleOption(key as keyof ExportCustomOptions)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer inside modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Kop & Export</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
