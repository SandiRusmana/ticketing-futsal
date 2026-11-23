import { useState, useEffect, useMemo } from 'react'
import {
  ArrowDown,
  Timer,
  ScanLine,
  Search,
  X,
  Trophy,
  Loader2,
  Medal,
  Flame,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import MatchCard from '../components/MatchCard.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'
import { getTeamLogoUrl } from '../utils/teamLogos.js'

// Filter Babak Pertandingan Resmi LFP 2026
const stageFilters = [
  { key: 'ALL', label: 'Semua Jadwal' },
  { key: 'GROUP', label: 'Penyisihan Grup' },
  { key: 'QUARTER_FINAL', label: '8 Besar (Quarter Final)' },
  { key: 'SEMI_FINAL', label: 'Semifinal' },
  { key: 'FINAL', label: 'Grand Final' },
]

function normalizeMatchFromApi(m) {
  const quotaObj = m.ticket_quota || m.ticketQuota || {}
  const matchDate = m.match_time ? new Date(m.match_time) : new Date()

  const stageLabelMap = {
    GROUP: 'Penyisihan Grup',
    ROUND_16: '16 Besar',
    QUARTER_FINAL: 'Perempat Final (8 Besar)',
    SEMI_FINAL: 'Semifinal',
    FINAL: 'Grand Final',
  }

  return {
    ...m,
    category: 'LFP 2026',
    stage: stageLabelMap[m.stage] || m.stage || 'Liga Futsal Pelajar',
    arena: m.venue || m.arena || 'Lapangan Utama GGM Cianjur (Court A Vinyl)',
    time: matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    date: matchDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    home: {
      id: m.home_team?.id || m.home_team_id,
      name: m.home_team?.name || m.home_placeholder || 'Tim Home TBD',
      short: m.home_team?.short_name || 'HOME',
      score: m.home_score ?? 0,
      color: m.home_team?.logo_color || '#10B981',
    },
    away: {
      id: m.away_team?.id || m.away_team_id,
      name: m.away_team?.name || m.away_placeholder || 'Tim Away TBD',
      short: m.away_team?.short_name || 'AWAY',
      score: m.away_score ?? 0,
      color: m.away_team?.logo_color || '#3B82F6',
    },
    price: Number(quotaObj.price ?? 20000),
    quotaTotal: Number(quotaObj.total_quota ?? 400),
    quotaAvailable: Number(quotaObj.available_quota ?? 0),
    saleStatus: quotaObj.sale_status || 'OPEN',
  }
}

/**
 * Halaman Utama (Home.jsx) - FutsalTix Cianjur
 * Turnamen Utama: Liga Futsal Pelajar (LFP) 2026
 * Standar Penilaian Evaluasi Dosen (Pak Yayat)
 */
export default function Home() {
  const { navigateTo, matches, teams, isLoadingData } = useNavigation()
  const [activeStage, setActiveStage] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)

  // State Data Dinamis MySQL: Klasemen & Top Scorer
  const [standings, setStandings] = useState([])
  const [groupAStandings, setGroupAStandings] = useState([])
  const [groupBStandings, setGroupBStandings] = useState([])
  const [selectedHomeGroup, setSelectedHomeGroup] = useState('A')
  const [topScorers, setTopScorers] = useState([])
  const [isLoadingStandings, setIsLoadingStandings] = useState(true)

  const currentHomeStandings = useMemo(() => {
    if (selectedHomeGroup === 'A') return groupAStandings
    if (selectedHomeGroup === 'B') return groupBStandings
    return standings
  }, [selectedHomeGroup, groupAStandings, groupBStandings, standings])

  // Ambil data klasemen dan top scorer dari Laravel REST API
  useEffect(() => {
    let isMounted = true
    const fetchTournamentStats = async () => {
      try {
        const [standingsRes, scorersRes] = await Promise.all([
          futsaltixApi.getStandings().catch(() => ({ data: { standings: [], group_a: [], group_b: [] } })),
          futsaltixApi.getTopScorers().catch(() => ({ data: { top_scorers: [] } })),
        ])

        if (isMounted) {
          setStandings(standingsRes.data?.standings || [])
          setGroupAStandings(standingsRes.data?.group_a || [])
          setGroupBStandings(standingsRes.data?.group_b || [])
          setTopScorers(scorersRes.data?.top_scorers || [])
        }
      } catch (err) {
        console.error('Gagal mengambil data statistik turnamen:', err)
      } finally {
        if (isMounted) setIsLoadingStandings(false)
      }
    }

    fetchTournamentStats()
    return () => {
      isMounted = false
    }
  }, [matches])

  const normalizedMatches = useMemo(() => {
    return (matches || []).map(normalizeMatchFromApi)
  }, [matches])

  const filteredMatches = useMemo(() => {
    return normalizedMatches.filter((match) => {
      // Saring tiket: Hanya tampilkan laga yang penjualan tiketnya DIBUKA (tiket yang ditutup/laga selesai dihapus dari daftar pembelian)
      const hasQuota = Boolean(match.ticket_quota || match.ticketQuota)
      const isClosed = match.saleStatus === 'CLOSED' || match.status === 'FINISHED' || !hasQuota || (match.quotaAvailable ?? 0) <= 0
      if (isClosed) return false

      const matchesStage = activeStage === 'ALL' || match.stage === activeStage || match.rawStage === activeStage || (match.stage && match.stage.includes(activeStage))
      const searchLower = searchQuery.toLowerCase().trim()
      const matchesSearch =
        searchLower === '' ||
        match.home.name.toLowerCase().includes(searchLower) ||
        match.away.name.toLowerCase().includes(searchLower) ||
        match.arena.toLowerCase().includes(searchLower) ||
        match.stage.toLowerCase().includes(searchLower)

      return matchesStage && matchesSearch
    })
  }, [normalizedMatches, activeStage, searchQuery])

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative mt-4 sm:mt-9 border-[2.5px] border-ink bg-white p-4 sm:p-10 md:p-12 shadow-brutal-lg">
        <div className="inline-flex items-center gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-ink shadow-brutal-sm">
          <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 bg-brand inline-block rounded-full animate-ping shrink-0" />
          <span className="break-words">LIGA FUTSAL PELAJAR (LFP) CIANJUR 2026 // RESMI GGM</span>
        </div>

        <h1 className="mt-4 sm:mt-5 max-w-5xl font-display text-2xl sm:text-5xl md:text-7xl font-black uppercase leading-[1.05] text-ink break-words">
          E-Ticketing Resmi Liga Futsal Pelajar 2026.
        </h1>

        <p className="mt-4 sm:mt-6 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-ink/85 font-medium">
          Dukung sekolah kebanggaan Anda di <strong className="text-ink font-bold">GOR Gelanggang Generasi Muda (GGM) Cianjur</strong>.
          Pemesanan tiket 100% digital, pembayaran resmi via Midtrans Snap SDK (QRIS &amp; Virtual Account), dan akses masuk pintu turnstile gate tanpa antre.
        </p>

        {/* Tombol Aksi Utama */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <a
            href="#jadwal"
            className="inline-flex items-center justify-center gap-3 border-[2.5px] border-ink bg-brand px-5 sm:px-7 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white shadow-brutal transition-all hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            Pesan Tiket Pertandingan <ArrowDown size={18} />
          </a>
          <a
            href="#klasemen"
            className="inline-flex items-center justify-center gap-2 border-[2.5px] border-ink bg-white px-5 sm:px-7 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-ink shadow-brutal transition-all hover:bg-surface active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            <Trophy size={18} className="text-brand" /> Klasemen &amp; Top Scorer
          </a>
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.BRACKET)}
            className="inline-flex items-center justify-center gap-2 border-[2.5px] border-ink bg-[#fef08a] px-5 sm:px-7 py-3 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-ink shadow-brutal transition-all hover:bg-yellow-300 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            Bagan Babak Gugur ↗
          </button>
        </div>

        {/* Keunggulan Fitur Produksi */}
        <div className="mt-6 sm:mt-9 border-t-2 border-line pt-4 sm:pt-5">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold text-ink shadow-brutal-sm">
              <Timer size={15} className="text-brand shrink-0" /> Held Quota 10 Menit Otomatis
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold text-ink shadow-brutal-sm">
              <CreditCard size={15} className="text-brand shrink-0" /> Midtrans Snap Gateway Asli (QRIS &amp; VA)
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-[#f8faf9] px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-bold text-ink shadow-brutal-sm">
              <ScanLine size={15} className="text-brand shrink-0" /> E-Tiket QR Code Riil untuk Turnstile Gate
            </span>
          </div>
        </div>

        {/* Statistik Ringkas */}
        <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 border-t-2 border-ink pt-5 sm:pt-6 grid-cols-1 sm:grid-cols-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-ink/70 font-bold">
              Turnamen Resmi:
            </span>
            <span className="font-mono text-lg sm:text-xl md:text-2xl font-black uppercase text-ink">
              Liga Futsal Pelajar (LFP) 2026 • 8 Sekolah
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 sm:border-l-2 sm:border-line sm:pl-6">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-ink/70 font-bold">
              Sistem Validasi Tiket:
            </span>
            <span className="font-mono text-lg sm:text-xl md:text-2xl font-black uppercase text-brand">
              Database MySQL + Turnstile Gate GGM
            </span>
          </div>
        </div>
      </section>

      {/* 2. DAFTAR JADWAL PERTANDINGAN & FILTER BABAK */}
      <section id="jadwal" className="mt-10 sm:mt-14 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 border-b-2 border-ink pb-3 sm:pb-4">
          <div>
            <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-brand">
              JADWAL LIGA FUTSAL PELAJAR 2026
            </div>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink">
              Jadwal Pertandingan &amp; Tiket
            </h2>
          </div>
          <p className="font-mono text-xs sm:text-sm text-ink/70 max-w-md font-medium">
            Pembaruan kuota tiket langsung terintegrasi secara real-time dengan database MySQL &amp; gate controller GGM Cianjur.
          </p>
        </div>

        {/* Search Bar & Filter Babak */}
        <div className="mt-5 sm:mt-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search size={20} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-ink/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sekolah (misal: SMAN 1, SMKN 1, MAN 1, SMANDA)..."
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
            {stageFilters.map((stg) => (
              <button
                key={stg.key}
                type="button"
                onClick={() => setActiveStage(stg.key)}
                className={`flex-1 min-w-[100px] sm:flex-initial text-center border-2 border-ink px-3 sm:px-5 py-2.5 sm:py-3.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-brutal-sm cursor-pointer ${
                  activeStage === stg.key
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink hover:bg-surface'
                }`}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info Jumlah Match */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-base font-mono text-ink/80 font-bold">
          <span>
            Menampilkan <strong className="text-brand font-black">{filteredMatches.length}</strong> pertandingan resmi LFP 2026
          </span>
          {searchQuery && <span>Kata kunci pencarian: &ldquo;{searchQuery}&rdquo;</span>}
        </div>

        {/* Loading atau Grid List Kartu Pertandingan */}
        {isLoadingData ? (
          <div className="mt-6 sm:mt-8 border-[2.5px] border-ink bg-white p-8 sm:p-12 text-center shadow-brutal">
            <Loader2 size={32} className="mx-auto animate-spin text-brand mb-3" />
            <p className="font-mono text-xs sm:text-sm font-bold uppercase text-ink">
              Memuat jadwal pertandingan dari database MySQL...
            </p>
          </div>
        ) : (
          <div className="mt-5 sm:mt-6 grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredMatches.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-ink bg-white p-8 text-center font-mono shadow-brutal-sm">
                <p className="text-base font-black uppercase text-ink">Tidak Ada Tiket Terbuka untuk Babak Ini</p>
                <p className="text-xs text-ink/70 mt-1">Seluruh tiket pada kategori ini telah selesai atau ditutup. Silakan pilih babak lain di atas.</p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={(m) => setSelectedMatch(m)}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* 3. SECTION KLASEMEN & TOP SCORER REAL DARI MYSQL */}
      <section id="klasemen" className="mt-14 sm:mt-20 scroll-mt-24 border-t-2 border-ink pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 border-b-2 border-ink pb-4 mb-6">
          <div>
            <span className="font-mono text-xs font-black uppercase text-brand tracking-widest bg-brand-light px-2.5 py-0.5 border border-brand inline-block mb-1">
              DATA OTOMATIS MYSQL • EVALUASI DOSEN
            </span>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink">
              Klasemen &amp; Top Scorer LFP 2026
            </h2>
          </div>
          <span className="font-mono text-xs sm:text-sm text-ink/70 font-bold">
            Dihitung otomatis dari hasil laga berstatus Full Time (FT) &amp; tabel match_events
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* TABEL KLASEMEN SEMENTARA (8 KOLOM) */}
          <div className="lg:col-span-8 border-2 border-ink bg-white shadow-brutal overflow-hidden">
            <div className="p-4 sm:p-5 bg-surface border-b-2 border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display text-lg sm:text-xl font-black uppercase text-ink flex items-center gap-2">
                <Trophy size={20} className="text-brand" /> KLASEMEN LIGA FUTSAL PELAJAR 2026
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedHomeGroup('A')}
                  className={`px-2.5 py-1 font-mono text-xs font-black uppercase border-2 border-ink cursor-pointer transition-all ${
                    selectedHomeGroup === 'A'
                      ? 'bg-brand text-white shadow-brutal-xs'
                      : 'bg-white text-ink hover:bg-gray-100'
                  }`}
                >
                  GRUP A
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHomeGroup('B')}
                  className={`px-2.5 py-1 font-mono text-xs font-black uppercase border-2 border-ink cursor-pointer transition-all ${
                    selectedHomeGroup === 'B'
                      ? 'bg-blue-600 text-white shadow-brutal-xs'
                      : 'bg-white text-ink hover:bg-gray-100'
                  }`}
                >
                  GRUP B
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHomeGroup('ALL')}
                  className={`px-2.5 py-1 font-mono text-xs font-black uppercase border-2 border-ink cursor-pointer transition-all ${
                    selectedHomeGroup === 'ALL'
                      ? 'bg-ink text-white shadow-brutal-xs'
                      : 'bg-white text-ink hover:bg-gray-100'
                  }`}
                >
                  SEMUA
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs sm:text-sm">
                <thead className="bg-[#f8faf9] border-b-2 border-ink text-ink font-black uppercase">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 text-center w-12">#</th>
                    <th className="py-3 px-3 sm:px-4">TIM SEKOLAH</th>
                    <th className="py-3 px-2 sm:px-3 text-center" title="Main">P</th>
                    <th className="py-3 px-2 sm:px-3 text-center" title="Menang">W</th>
                    <th className="py-3 px-2 sm:px-3 text-center" title="Seri">D</th>
                    <th className="py-3 px-2 sm:px-3 text-center" title="Kalah">L</th>
                    <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell" title="Gol Memasukkan">GF</th>
                    <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell" title="Gol Kemasukan">GA</th>
                    <th className="py-3 px-2 sm:px-3 text-center" title="Selisih Gol">GD</th>
                    <th className="py-3 px-3 sm:px-4 text-center bg-brand/10 font-black text-brand text-sm sm:text-base">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/20">
                  {currentHomeStandings.map((row) => {
                    const logoUrl = getTeamLogoUrl(row.team_name)

                    return (
                      <tr
                        key={row.team_id}
                        className={`hover:bg-surface/80 transition-colors ${
                          row.rank <= 4 ? 'bg-white font-bold' : 'text-ink/80'
                        }`}
                      >
                        <td className="py-3 px-3 sm:px-4 text-center font-black">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 border ${
                              row.rank === 1
                                ? 'bg-[#fef08a] border-ink text-ink font-black'
                                : row.rank <= 2
                                ? 'bg-brand text-white font-black'
                                : row.rank <= 4
                                ? 'bg-brand-light border-brand text-brand'
                                : 'text-ink/60'
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-bold text-ink">
                          <div className="flex items-center gap-2">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={row.team_name}
                                className="w-5 h-5 object-contain border border-ink p-0.5 bg-white shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <span
                                className="w-3 h-3 rounded-none border border-ink shrink-0"
                                style={{ backgroundColor: row.logo_color || '#10B981' }}
                              />
                            )}
                            <span className="truncate">{row.team_name}</span>
                            {row.group && (
                              <span className={`text-[9px] font-mono font-bold px-1 py-0.2 border hidden sm:inline ${
                                row.group === 'A'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                  : 'border-blue-600 bg-blue-50 text-blue-800'
                              }`}>
                                GRUP {row.group}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center font-bold">{row.played}</td>
                        <td className="py-3 px-2 sm:px-3 text-center text-brand font-bold">{row.won}</td>
                        <td className="py-3 px-2 sm:px-3 text-center text-ink/70">{row.drawn}</td>
                        <td className="py-3 px-2 sm:px-3 text-center text-danger font-bold">{row.lost}</td>
                        <td className="py-3 px-2 sm:px-3 text-center text-ink/70 hidden sm:table-cell">{row.goals_for}</td>
                        <td className="py-3 px-2 sm:px-3 text-center text-ink/70 hidden sm:table-cell">{row.goals_against}</td>
                        <td className="py-3 px-2 sm:px-3 text-center font-bold">
                          {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center font-black text-brand bg-brand/5 text-sm sm:text-base">
                          {row.points}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#f8faf9] border-t-2 border-ink font-mono text-xs text-ink/70 flex items-center justify-between">
              <span>* Peringkat 1-2 lolos otomatis knockout, 3-4 kualifikasi playoff</span>
              <span className="font-bold text-brand">Real-time MySQL Standings</span>
            </div>
          </div>

          {/* TOP SCORER LFP 2026 (4 KOLOM) */}
          <div className="lg:col-span-4 border-2 border-ink bg-white shadow-brutal overflow-hidden">
            <div className="p-4 sm:p-5 bg-surface border-b-2 border-ink flex items-center justify-between">
              <h3 className="font-display text-lg sm:text-xl font-black uppercase text-ink flex items-center gap-2">
                <Flame size={20} className="text-danger" /> TOP SCORER
              </h3>
              <span className="font-mono text-xs bg-danger text-white px-2.5 py-0.5 font-bold">
                GOL RESMI
              </span>
            </div>

            <div className="p-3 sm:p-4 divide-y divide-ink/20 font-mono text-xs sm:text-sm">
              {topScorers.slice(0, 6).map((scorer) => (
                <div key={scorer.rank} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 flex items-center justify-center font-black border-2 border-ink shrink-0 ${
                        scorer.rank === 1
                          ? 'bg-[#fef08a] text-ink'
                          : scorer.rank === 2
                          ? 'bg-gray-200 text-ink'
                          : scorer.rank === 3
                          ? 'bg-amber-100 text-ink'
                          : 'bg-surface text-ink/70'
                      }`}
                    >
                      {scorer.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-ink truncate text-sm">{scorer.player_name}</p>
                      <span className="text-[11px] text-ink/70 font-semibold truncate block">
                        {scorer.team_name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-display text-xl font-black text-danger block">
                      {scorer.goals} <span className="font-mono text-xs text-ink/60 font-bold">GOL</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#f8faf9] border-t-2 border-ink font-mono text-xs text-center text-ink/70">
              Data agregat dari tabel <code className="font-bold text-ink">match_events</code> MySQL
            </div>
          </div>
        </div>
      </section>

      {/* 4. MODAL CHECKOUT MIDTRANS SNAP */}
      {selectedMatch && (
        <CheckoutModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}
