/**
 * teamLogos.js
 * Konfigurasi dan mapping logo resmi 20 sekolah Divisi 1 SMA Putra LFP Cianjur 2026.
 * Anda dapat menaruh file gambar logo sekolah di folder `frontend/src/assets/logos/`
 * (misal: pacet.png, smansa.png, smacil.png, sukaluyu.png, man1.png, smkn2cil.png, cibeber.png, dll)
 * atau mengubah mapping path di bawah ini kapan saja.
 */

export const TEAM_LOGO_MAP = {
  // === GRUP A (10 Sekolah) ===
  'SMAN 1 Pacet': '/src/assets/logos/pacet.png',
  'SMAN 1 Cianjur': '/src/assets/logos/smansa.png',
  'SMAN 1 Cilaku': '/src/assets/logos/smacil.png',
  'SMKN 1 Sukaluyu': '/src/assets/logos/sukaluyu.png',
  'SMK Nurul Islam': '/src/assets/logos/nuris.png',
  'MAN 2 Cianjur': '/src/assets/logos/mandapa.png',
  'SMKN 1 Cianjur': '/src/assets/logos/smkn1.png',
  'SMA Al Kamil IBS': '/src/assets/logos/alkamil.png',
  'SMAN 1 Sukanagara': '/src/assets/logos/sukanagara.png',
  'SMK Al-Ibrohimiyah': '/src/assets/logos/alibrohim.png',

  // === GRUP B (10 Sekolah) ===
  'SMKN 2 Cilaku': '/src/assets/logos/smkn2cil.png',
  'MAN 1 Cianjur': '/src/assets/logos/man1.png',
  'SMAN 1 Cibeber': '/src/assets/logos/cibeber.png',
  'SMA Al Ittihad Cianjur': '/src/assets/logos/alittihad.png',
  "SMAT Al Ma'shum Mardiyah": '/src/assets/logos/mardiyah.png',
  'SMK Pasundan 1': '/src/assets/logos/pasundan.png',
  'SMK Bunga Persada': '/src/assets/logos/buper.png',
  'SMK Darul Muttaqin Cianjur': '/src/assets/logos/damtu.png',
  'SMAN 1 Ciranjang': '/src/assets/logos/ciranjang.png',
  'SMAN 1 Warungkondang': '/src/assets/logos/warkon.png',

  // Alias berdasarkan short name
  'PACET': '/src/assets/logos/pacet.png',
  'SMANSA': '/src/assets/logos/smansa.png',
  'SMACIL': '/src/assets/logos/smacil.png',
  'SUKALUYU': '/src/assets/logos/sukaluyu.png',
  'NURIS': '/src/assets/logos/nuris.png',
  'MANDAPA': '/src/assets/logos/mandapa.png',
  'ZIE': '/src/assets/logos/smkn1.png',
  'ALKAMIL': '/src/assets/logos/alkamil.png',
  'SUKANAGARA': '/src/assets/logos/sukanagara.png',
  'ALIBROHIM': '/src/assets/logos/alibrohim.png',
  'SMKN2CIL': '/src/assets/logos/smkn2cil.png',
  'MANSA': '/src/assets/logos/man1.png',
  'CIBEBER': '/src/assets/logos/cibeber.png',
  'ALITTIHAD': '/src/assets/logos/alittihad.png',
  'MARDIYAH': '/src/assets/logos/mardiyah.png',
  'PASUNDAN': '/src/assets/logos/pasundan.png',
  'BUPER': '/src/assets/logos/buper.png',
  'DAMTU': '/src/assets/logos/damtu.png',
  'CIRANJANG': '/src/assets/logos/ciranjang.png',
  'WARKON': '/src/assets/logos/warkon.png',
}

export const TEAM_BRAND_MAP = {
  // === GRUP A ===
  'SMAN 1 Pacet': { shortName: 'PACET', group: 'A', color: '#10B981', bg: '#ecfdf5', text: '#064e3b' },
  'SMAN 1 Cianjur': { shortName: 'SMANSA', group: 'A', color: '#C6FF00', bg: '#f7fee7', text: '#365314' },
  'SMAN 1 Cilaku': { shortName: 'SMACIL', group: 'A', color: '#EC4899', bg: '#fdf2f8', text: '#831843' },
  'SMKN 1 Sukaluyu': { shortName: 'SUKALUYU', group: 'A', color: '#3B82F6', bg: '#eff6ff', text: '#1e3a8a' },
  'SMK Nurul Islam': { shortName: 'NURIS', group: 'A', color: '#F59E0B', bg: '#fffbeb', text: '#78350f' },
  'MAN 2 Cianjur': { shortName: 'MANDAPA', group: 'A', color: '#8B5CF6', bg: '#f5f3ff', text: '#4c1d95' },
  'SMKN 1 Cianjur': { shortName: 'ZIE', group: 'A', color: '#06B6D4', bg: '#ecfeff', text: '#164e63' },
  'SMA Al Kamil IBS': { shortName: 'ALKAMIL', group: 'A', color: '#6366F1', bg: '#eef2ff', text: '#312e81' },
  'SMAN 1 Sukanagara': { shortName: 'SUKANAGARA', group: 'A', color: '#14B8A6', bg: '#f0fdfa', text: '#134e4a' },
  'SMK Al-Ibrohimiyah': { shortName: 'ALIBROHIM', group: 'A', color: '#EF4444', bg: '#fef2f2', text: '#7f1d1d' },

  // === GRUP B ===
  'SMKN 2 Cilaku': { shortName: 'SMKN2CIL', group: 'B', color: '#10B981', bg: '#ecfdf5', text: '#064e3b' },
  'MAN 1 Cianjur': { shortName: 'MANSA', group: 'B', color: '#C6FF00', bg: '#f7fee7', text: '#365314' },
  'SMAN 1 Cibeber': { shortName: 'CIBEBER', group: 'B', color: '#3B82F6', bg: '#eff6ff', text: '#1e3a8a' },
  'SMA Al Ittihad Cianjur': { shortName: 'ALITTIHAD', group: 'B', color: '#F59E0B', bg: '#fffbeb', text: '#78350f' },
  "SMAT Al Ma'shum Mardiyah": { shortName: 'MARDIYAH', group: 'B', color: '#8B5CF6', bg: '#f5f3ff', text: '#4c1d95' },
  'SMK Pasundan 1': { shortName: 'PASUNDAN', group: 'B', color: '#EC4899', bg: '#fdf2f8', text: '#831843' },
  'SMK Bunga Persada': { shortName: 'BUPER', group: 'B', color: '#06B6D4', bg: '#ecfeff', text: '#164e63' },
  'SMK Darul Muttaqin Cianjur': { shortName: 'DAMTU', group: 'B', color: '#F97316', group: 'B', bg: '#fff7ed', text: '#7c2d12' },
  'SMAN 1 Ciranjang': { shortName: 'CIRANJANG', group: 'B', color: '#EF4444', bg: '#fef2f2', text: '#7f1d1d' },
  'SMAN 1 Warungkondang': { shortName: 'WARKON', group: 'B', color: '#64748B', bg: '#f8fafc', text: '#1e293b' },
}

export function getTeamLogoUrl(teamNameOrShort) {
  if (!teamNameOrShort) return null
  return TEAM_LOGO_MAP[teamNameOrShort] || null
}
