// Data dummy. Nanti ganti dengan data dari API backend.
export const matches = [
  {
    id: 1,
    category: 'SMA/SMK',
    stage: 'BABAK 8 BESAR',
    remaining: 24,
    home: { name: 'SMKN 1 Cianjur', seed: 'JUARA GRUP B' },
    away: { name: 'SMAN 2 Cianjur', seed: 'RUNNER-UP GRUP D' },
    date: 'Sabtu, 14 Nov 2026',
    kickoff: '15:30 WIB',
    arena: 'Court A, GGM',
    price: 15000,
  },
  {
    id: 2,
    category: 'SMP',
    stage: 'PEREMPAT FINAL',
    remaining: 45,
    home: { name: 'SMPN 1 Cianjur', seed: 'JUARA GRUP A' },
    away: { name: 'SMPN 4 Cianjur', seed: 'RUNNER-UP GRUP C' },
    date: 'Sabtu, 14 Nov 2026',
    kickoff: '13:00 WIB',
    arena: 'Court B, GGM',
    price: 10000,
  },
]

export const formatRupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
