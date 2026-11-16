import { useState, useMemo } from 'react'
import { ArrowDown, Timer, ScanLine, Search, X, Layers, Loader2 } from 'lucide-react'
import MatchCard from '../components/MatchCard.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'

const categories = [
  { key: 'ALL', label: 'Semua Kategori' },
  { key: 'SD', label: '1. Kategori SD' },
  { key: 'SMP', label: '2. Kategori SMP' },
  { key: 'SMA', label: '3. Kategori SMA/SMK' },
]

// Normalisasi struktur JSON dari API Laravel agar kompatibel dengan komponen kartu & modal
function normalizeMatchFromApi(m) {
  const catCode = (m.category?.code || m.category || 'SMA').toUpperCase()
  const displayCat = catCode === 'SMA' ? 'SMA/SMK' : catCode
  const quotaObj = m.ticket_quota || m.ticketQuota || {}
  const matchDate = m.match_time ? new Date(m.match_time) : new Date()

  const stageLabelMap = {
    GROUP: 'Penyisihan Grup',
    ROUND_16: '16 Besar',
    QUARTER_FINAL: 'Perempat Final',
    SEMI_FINAL: 'Semifinal',
    FINAL: 'Grand Final',
  }

  return {
    ...m,
    category: displayCat,
    rawCategoryCode: catCode,
    stage: stageLabelMap[m.stage] || m.stage || 'Turnamen GGM',
    arena: m.arena || 'Lapangan Utama GGM Cianjur',
    time: matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    date: matchDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    home: {
      id: m.home_team?.id || m.home_team_id,
      name: m.home_team?.name || m.home_placeholder || 'Tim Home TBD',
      short: m.home_team?.short_name || 'HOME',
      score: m.home_score ?? 0,
    },
    away: {
      id: m.away_team?.id || m.away_team_id,
      name: m.away_team?.name || m.away_placeholder || 'Tim Away TBD',
      short: m.away_team?.short_name || 'AWAY',
      score: m.away_score ?? 0,
    },
    price: Number(quotaObj.price ?? 15000),
    quotaTotal: Number(quotaObj.total_quota ?? 200),
    quotaAvailable: Number(quotaObj.available_quota ?? 0),
    saleStatus: quotaObj.sale_status || 'OPEN',
  }
}

export default function Home() {
  const { navigateTo, matches, teams, isLoadingData } = useNavigation()
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)

  const normalizedMatches = useMemo(() => {
    return (matches || []).map(normalizeMatchFromApi)
  }, [matches])

  const filteredMatches = useMemo(() => {
    return normalizedMatches.filter((match) => {
      const matchesCategory =
        activeCategory === 'ALL' ||
        match.category === activeCategory ||
        match.rawCategoryCode === activeCategory

      const searchLower = searchQuery.toLowerCase().trim()
      const matchesSearch =
        searchLower === '' ||
        match.home.name.toLowerCase().includes(searchLower) ||
        match.away.name.toLowerCase().includes(searchLower) ||
        match.arena.toLowerCase().includes(searchLower) ||
        match.stage.toLowerCase().includes(searchLower)

      return matchesCategory && matchesSearch
    })
  }, [normalizedMatches, activeCategory, searchQuery])

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative mt-4 sm:mt-9 border-[2.5px] border-ink bg-white p-4 sm:p-10 md:p-12 shadow-brutal-lg">
        <div className="inline-flex items-center gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-ink shadow-brutal-sm">
          <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 bg-brand inline-block rounded-full animate-ping shrink-0" />
          <span className="break-words">Liga Futsal Pelajar Cianjur 2026 // Piala Bupati</span>
        </div>

        <h1 className="mt-4 sm:mt-5 max-w-5xl font-display text-2xl sm:text-5xl md:text-7xl font-black uppercase leading-[1.05] text-ink break-words">
          Beli tiket futsal pelajar Cianjur tanpa antre.
        </h1>

        <p className="mt-4 sm:mt-6 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-ink/85 font-medium">
          Platform pemesanan tiket resmi turnamen futsal antar SD, SMP &amp; SMA/SMK se-Kabupaten Cianjur di{' '}
          <strong className="text-ink font-bold">Gelanggang Generasi Muda (GGM) Cianjur</strong>. Cepat, aman, terlindungi held-quota otomatis, dan langsung siap dipindai di gate turnstile.
        </p>

        {/* Tombol Aksi Utama */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <a
            href="#jadwal"
            className="inline-flex items-center justify-center gap-3 border-[2.5px] border-ink bg-brand px-5 sm:px-7 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white shadow-brutal transition-all hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            Lihat Jadwal Pertandingan <ArrowDown size={18} />
          </a>
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.BRACKET)}
            className="inline-flex items-center justify-center gap-2 border-[2.5px] border-ink bg-white px-5 sm:px-7 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-ink shadow-brutal transition-all hover:bg-surface active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            Bagan Turnamen
          </button>
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.LIVESCORE)}
            className="inline-flex items-center justify-center gap-2 border-[2.5px] border-ink bg-[#fef08a] px-5 sm:px-7 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-ink shadow-brutal transition-all hover:bg-yellow-300 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            Live Score Meja Wasit
          </button>
        </div>

        {/* Keunggulan Sistem Gate Turnstile */}
        <div className="mt-6 sm:mt-9 border-t-2 border-line pt-4 sm:pt-5">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold text-ink shadow-brutal-sm">
              <Timer size={15} className="text-brand shrink-0 sm:size-4" /> Held Quota 10 Menit Otomatis
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold text-ink shadow-brutal-sm">
              <ScanLine size={15} className="text-brand shrink-0 sm:size-4" /> Validasi QR Gate Turnstile Terhubung
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold text-ink shadow-brutal-sm">
              <Layers size={15} className="text-brand shrink-0 sm:size-4" /> 3 Kategori Divisi: SD, SMP, SMA/SMK
            </span>
          </div>
        </div>

        {/* Statistik Ringkas */}
        <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 border-t-2 border-ink pt-5 sm:pt-6 grid-cols-1 sm:grid-cols-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-ink/70 font-bold">
              Kontestan Terdaftar:
            </span>
            <span className="font-mono text-lg sm:text-xl md:text-2xl font-black uppercase text-ink">
              {teams?.length || 8} Tim Sekolah (SD, SMP, SMA)
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 sm:border-l-2 sm:border-line sm:pl-6">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-ink/70 font-bold">
              Sistem Akses:
            </span>
            <span className="font-mono text-lg sm:text-xl md:text-2xl font-black uppercase text-brand">
              100% Digital Gate Turnstile GGM
            </span>
          </div>
        </div>
      </section>

      {/* 2. DAFTAR JADWAL & FILTER 3 KATEGORI */}
      <section id="jadwal" className="mt-10 sm:mt-14 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 border-b-2 border-ink pb-3 sm:pb-4">
          <div>
            <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-brand">
              Regular &amp; Playoff Bracket
            </div>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink">
              Jadwal Pertandingan Terkini
            </h2>
          </div>
          <p className="font-mono text-xs sm:text-sm text-ink/70 max-w-md font-medium">
            Pembaruan kuota tiket langsung terintegrasi secara real-time dengan database MySQL &amp; gate controller GGM Cianjur.
          </p>
        </div>

        {/* Search Bar & Filter Kontrol */}
        <div className="mt-5 sm:mt-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search size={20} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-ink/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sekolah (misal: SMKN 1, SMPN 4, SDN Ibu Jenab)..."
              className="w-full border-[2.5px] border-ink bg-white py-3 sm:py-4 pl-10 sm:pl-12 pr-10 font-mono text-sm sm:text-base md:text-lg outline-none placeholder:text-ink/40 shadow-brutal-sm focus:border-brand focus:ring-1 focus:ring-brand font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-1 min-w-[100px] sm:flex-initial text-center border-2 border-ink px-3 sm:px-6 py-2.5 sm:py-3.5 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider transition-all shadow-brutal-sm cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink hover:bg-surface'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Informasi Hasil Pencarian */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-base font-mono text-ink/80 font-bold">
          <span>
            Menampilkan <strong className="text-brand font-black">{filteredMatches.length}</strong> pertandingan
          </span>
          {searchQuery && <span>Filter kata kunci: &ldquo;{searchQuery}&rdquo;</span>}
        </div>

        {/* Loading State atau Grid List Kartu Pertandingan */}
        {isLoadingData ? (
          <div className="mt-6 sm:mt-8 border-[2.5px] border-ink bg-white p-8 sm:p-12 text-center shadow-brutal">
            <Loader2 size={32} className="mx-auto animate-spin text-brand mb-3" />
            <p className="font-mono text-xs sm:text-sm font-bold uppercase text-ink">
              Memuat jadwal pertandingan dari server GGM Cianjur...
            </p>
          </div>
        ) : (
          <div className="mt-5 sm:mt-6 grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onSelect={(m) => setSelectedMatch(m)}
              />
            ))}
          </div>
        )}

        {/* Pesan Jika Hasil Pencarian Kosong */}
        {!isLoadingData && filteredMatches.length === 0 && (
          <div className="mt-6 sm:mt-8 border-[2.5px] border-dashed border-line bg-white p-8 sm:p-16 text-center">
            <p className="font-mono text-sm sm:text-base text-ink/70">
              Tidak ada pertandingan yang sesuai dengan filter kategori &ldquo;{activeCategory}&rdquo; atau kata kunci &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('ALL')
                setSearchQuery('')
              }}
              className="mt-4 inline-block border-2 border-ink bg-brand px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase text-white shadow-brutal-sm cursor-pointer hover:bg-brand-dark"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* 3. MODAL CHECKOUT MIDTRANS SNAP */}
      {selectedMatch && (
        <CheckoutModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}
