import { useState } from 'react'
import { ArrowDown, Timer, ScanLine, Armchair } from 'lucide-react'
import MatchCard from '../components/MatchCard.jsx'
import { matches } from '../data/matches.js'

const tabs = [
  { key: 'ALL', label: 'Semua' },
  { key: 'SMA/SMK', label: 'Kategori SMA/SMK' },
  { key: 'SMP', label: 'Kategori SMP' },
]

export default function Home() {
  const [active, setActive] = useState('ALL')
  const shown = active === 'ALL' ? matches : matches.filter((m) => m.category === active)

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16">
      {/* ===== HERO ===== */}
      <section className="mt-9 border border-ink p-6 md:p-11">
        <span className="inline-flex items-center gap-2 border border-ink bg-white px-2 py-1 font-mono text-[11px] uppercase tracking-widest">
          <span className="text-brand">■</span> Liga Futsal Pelajar Cianjur 2026
        </span>

        <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">
          Beli tiket futsal pelajar Cianjur tanpa antre.
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/80">
          Platform resmi tiket turnamen futsal antar SMP &amp; SMA/SMK se-Kabupaten Cianjur di GGM
          Cianjur. Cepat, aman, dan tanpa calo.
        </p>

        <a
          href="#jadwal"
          className="mt-8 inline-flex items-center gap-3 bg-brand px-7 py-4 font-semibold text-white hover:bg-brand-dark"
        >
          Lihat Jadwal Pertandingan <ArrowDown size={18} />
        </a>

        <div className="mt-8 max-w-[760px] border-t border-line pt-4">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 font-mono text-sm">
              <Timer size={16} className="text-brand" /> Held Quota 10 Menit
            </span>
            <span className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 font-mono text-sm">
              <ScanLine size={16} className="text-brand" /> Validasi QR Code Gate
            </span>
          </div>
        </div>

        {/* Statistik */}
        <div className="mt-10 grid gap-6 border-t border-ink pt-6 md:grid-cols-2">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
              Status Tournament:
            </span>
            <span className="font-mono text-xl uppercase">32 Sekolah Terdaftar</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-3 md:border-l md:border-line md:pl-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
              Gate Automation:
            </span>
            <span className="font-mono text-xl uppercase text-brand">
              100% Valid Gate Scan Turnstile
            </span>
          </div>
        </div>
      </section>

      {/* ===== JADWAL ===== */}
      <section id="jadwal" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-brand">
              Regular &amp; Playoff Bracket
            </div>
            <h2 className="font-display text-4xl font-extrabold uppercase">
              Jadwal Pertandingan Terkini
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/80">
            Pembaruan kuota tiket langsung dari gate controller gelanggang.
          </p>
        </div>

        {/* Tab filter */}
        <div className="mt-5 flex border-b border-line">
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={
                  'border border-ink px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest ' +
                  (active === t.key ? 'bg-ink text-white' : 'bg-white hover:bg-surface')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kartu pertandingan */}
        <div className="mt-7 grid gap-7 lg:grid-cols-2">
          {shown.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
        {shown.length === 0 && (
          <p className="mt-7 font-mono text-sm">Belum ada pertandingan di kategori ini.</p>
        )}

        {/* Info pintu masuk */}
        <div className="mt-11 flex flex-wrap items-center justify-between gap-4 border border-line bg-surface px-5 py-4">
          <div className="flex items-center gap-4">
            <Armchair className="text-brand" size={30} />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
                Informasi Pintu Masuk Gelanggang
              </div>
              <div>
                Pintu Masuk Tribun Timur &amp; Barat GGM - Penukaran gelang digital dibuka 60 menit
                sebelum kickoff.
              </div>
            </div>
          </div>
          <span className="border border-ink bg-white px-3 py-2 font-mono text-xs uppercase tracking-widest">
            Gate Pass Active
          </span>
        </div>
      </section>
    </div>
  )
}
