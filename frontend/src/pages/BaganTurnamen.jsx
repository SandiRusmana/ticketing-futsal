import { useState, useMemo } from 'react'
import { useNavigation } from '../context/useNavigation.js'
import {
  Trophy,
  Search,
  Download,
  RotateCcw,
  Maximize2,
  Radio,
  Clock,
  Layers,
} from 'lucide-react'

function normalizeMatchNode(m, fallbackIndex = 1) {
  const homeName = m.home_team?.name || m.home_placeholder || 'Menunggu Pemenang'
  const awayName = m.away_team?.name || m.away_placeholder || 'Menunggu Pemenang'
  const scoreA = m.home_score ?? '-'
  const scoreB = m.away_score ?? '-'
  const status = (m.status || 'SCHEDULED').toUpperCase()

  let winner = null
  if (status === 'FINISHED' && m.home_score !== null && m.away_score !== null) {
    if (Number(m.home_score) > Number(m.away_score)) winner = homeName
    else if (Number(m.away_score) > Number(m.home_score)) winner = awayName
  }

  const matchDate = m.match_time ? new Date(m.match_time) : null
  const timeStr = matchDate
    ? matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    : 'TBD'

  return {
    id: m.id,
    matchCode: m.match_code || `LAGA-${String(fallbackIndex).padStart(2, '0')}`,
    court: m.arena || 'Lapangan Utama GGM',
    status,
    time: timeStr,
    dateStr: matchDate
      ? matchDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Jadwal Menyusul',
    teamA: homeName,
    teamB: awayName,
    scoreA,
    scoreB,
    winner,
  }
}

export default function BaganTurnamen() {
  const { matches } = useNavigation()
  const [selectedCategory, setSelectedCategory] = useState('SMA/SMK')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const currentBracket = useMemo(() => {
    const targetCode = selectedCategory === 'SMA/SMK' ? 'SMA' : selectedCategory
    const categoryLabelMap = {
      SD: 'Kategori Pelajar SD (U-12)',
      SMP: 'Kategori Pelajar SMP (U-15)',
      'SMA/SMK': 'Kategori Pelajar SMA / SMK (U-18)',
    }

    const catMatches = (matches || []).filter((m) => {
      const code = (m.category?.code || 'SMA').toUpperCase()
      return code === targetCode
    })

    const round16Raw = catMatches.filter((m) => m.stage === 'ROUND_16' || m.stage === 'GROUP')
    const qfRaw = catMatches.filter((m) => m.stage === 'QUARTER_FINAL')
    const sfRaw = catMatches.filter((m) => m.stage === 'SEMI_FINAL')
    const finalRaw = catMatches.filter((m) => m.stage === 'FINAL')

    const round16 =
      round16Raw.length > 0
        ? round16Raw.map((m, idx) => normalizeMatchNode(m, idx + 1))
        : [
            { id: 'r16-1', matchCode: 'R16-01', court: 'GGM Court A', status: 'SCHEDULED', teamA: 'Juara Grup A', teamB: 'Runner-up Grup B', scoreA: '-', scoreB: '-', winner: null },
            { id: 'r16-2', matchCode: 'R16-02', court: 'GGM Court A', status: 'SCHEDULED', teamA: 'Juara Grup C', teamB: 'Runner-up Grup D', scoreA: '-', scoreB: '-', winner: null },
          ]

    const quarterFinals =
      qfRaw.length > 0
        ? qfRaw.map((m, idx) => normalizeMatchNode(m, idx + 1))
        : [
            { id: 'qf-1', matchCode: 'QF-01', court: 'GGM Court A', status: 'SCHEDULED', teamA: 'Pemenang R16-01', teamB: 'Pemenang R16-02', scoreA: '-', scoreB: '-', winner: null },
            { id: 'qf-2', matchCode: 'QF-02', court: 'GGM Court A', status: 'SCHEDULED', teamA: 'Pemenang R16-03', teamB: 'Pemenang R16-04', scoreA: '-', scoreB: '-', winner: null },
          ]

    const semiFinals =
      sfRaw.length > 0
        ? sfRaw.map((m, idx) => normalizeMatchNode(m, idx + 1))
        : [
            { id: 'sf-1', matchCode: 'SF-01', court: 'GGM Court A', status: 'SCHEDULED', time: '14:00 WIB', teamA: 'Pemenang QF-01', teamB: 'Pemenang QF-02', scoreA: '-', scoreB: '-', winner: null },
            { id: 'sf-2', matchCode: 'SF-02', court: 'GGM Court A', status: 'SCHEDULED', time: '15:15 WIB', teamA: 'Pemenang QF-03', teamB: 'Pemenang QF-04', scoreA: '-', scoreB: '-', winner: null },
          ]

    const grandFinal =
      finalRaw.length > 0
        ? normalizeMatchNode(finalRaw[0], 1)
        : {
            id: 'final-1',
            matchCode: 'FINAL',
            court: 'GGM Court A Vinyl',
            status: 'SCHEDULED',
            dateStr: 'Puncak Piala Bupati 2026',
            time: '16:30 WIB',
            teamA: 'Pemenang SF-01',
            teamB: 'Pemenang SF-02',
            scoreA: 'TBD',
            scoreB: 'TBD',
            winner: null,
          }

    return {
      categoryName: categoryLabelMap[selectedCategory] || selectedCategory,
      venue: 'Gelanggang Generasi Muda (GGM) Cianjur',
      round16,
      quarterFinals,
      semiFinals,
      grandFinal,
    }
  }, [matches, selectedCategory])

  const handleDownloadPDF = () => {
    setDownloadSuccess(true)
    window.print?.()
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  const filterTeamHighlight = (teamName) => {
    if (!searchQuery.trim() || !teamName) return false
    return teamName.toLowerCase().includes(searchQuery.toLowerCase())
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 lg:p-8 2xl:p-10 max-w-[1440px] 2xl:max-w-[1560px] mx-auto w-full font-sans">
      {/* 1. NEO-BRUTALIST RUNNING MARQUEE TICKER AFKAB CIANJUR */}
      <div className="border-2 border-ink bg-[#fef08a] px-3 sm:px-4 py-1.5 sm:py-2 shadow-brutal-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink flex-wrap">
          <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 bg-danger inline-block animate-ping shrink-0" />
          <span className="bg-ink text-[#fef08a] px-1.5 py-0.5">RESMI AFKAB</span>
          <span>SISTEM BAGAN RESMI PIALA BUPATI CIANJUR 2026 // GELANGGANG GENERASI MUDA (GGM)</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-ink font-semibold">
          <span className="flex items-center gap-1">
            <span className="font-bold">STATUS:</span> LIVE MYSQL BRACKET
          </span>
          <span>|</span>
          <span className="flex items-center gap-1 text-brand font-bold">
            TOTAL HADIAH: RP 25.000.000
          </span>
        </div>
      </div>

      {/* 2. HEADER KONTROL & SELECTOR 3 KATEGORI */}
      <section className="border-2 border-ink bg-white p-4 sm:p-6 shadow-brutal">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 sm:gap-6 pb-5 sm:pb-6 border-b-2 border-ink">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface border border-ink font-mono text-[10px] sm:text-xs uppercase font-bold mb-2 sm:mb-3">
              <Trophy size={14} className="text-brand shrink-0" />
              <span>OFFICIAL TOURNAMENT BRACKET • GGM CIANJUR</span>
            </div>

            <h1 className="font-display text-xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight leading-tight break-words">
              BAGAN PERTANDINGAN &amp; BABAK GUGUR
            </h1>

            <p className="mt-2 text-ink/75 text-xs sm:text-base font-medium">
              Pantau jalannya knockout stage turnamen futsal antar-sekolah se-Kabupaten Cianjur. Data tersinkronisasi otomatis dengan peluit akhir dari meja wasit GGM.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="font-mono text-xs sm:text-sm uppercase font-black text-ink flex items-center gap-1.5 shrink-0">
              <Layers size={16} className="text-brand shrink-0" /> PILIH DIVISI:
            </span>
            <div className="flex flex-wrap sm:inline-flex p-1 sm:p-1.5 bg-surface border-2 border-ink shadow-brutal-sm gap-1 sm:gap-1.5 w-full sm:w-auto">
              {[
                { key: 'SD', label: '1. Kategori SD', activeBg: 'bg-brand text-white' },
                { key: 'SMP', label: '2. Kategori SMP', activeBg: 'bg-brand text-white' },
                { key: 'SMA/SMK', label: '3. Kategori SMA/SMK', activeBg: 'bg-ink text-white' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex-1 min-w-[90px] sm:flex-initial text-center px-2.5 sm:px-5 py-1.5 sm:py-2 font-mono text-[11px] sm:text-sm font-black uppercase transition-all cursor-pointer ${
                    selectedCategory === cat.key
                      ? `${cat.activeBg} shadow-brutal-sm`
                      : 'bg-transparent text-ink/80 hover:bg-white hover:text-ink'
                  }`}
                >
                  {selectedCategory === cat.key && '✔ '}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TOOLSET BAR */}
        <div className="pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sorot nama sekolah..."
                className="bg-surface border-2 border-ink px-3 sm:px-3.5 py-2 sm:py-2.5 pl-9 sm:pl-10 text-xs sm:text-sm font-mono text-ink w-full sm:w-72 focus:bg-white focus:outline-none shadow-brutal-sm font-bold"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-ink/60" />
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-ink bg-white font-mono text-xs sm:text-sm font-black uppercase shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={16} className="text-brand shrink-0" />
              <span>{downloadSuccess ? 'Menyiapkan Cetak...' : 'Cetak / Unduh Bagan'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-3 sm:gap-4">
            <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs text-ink/80 bg-surface px-2.5 sm:px-3 py-1.5 border border-ink">
              <Clock size={13} className="text-brand shrink-0" />
              <span>Live Sync MySQL: <strong>Aktif</strong></span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel(zoomLevel === 1 ? 1.15 : 1)}
                className="p-1.5 sm:p-2 border-2 border-ink bg-white shadow-brutal-sm hover:bg-surface text-ink cursor-pointer"
                title="Toggle Zoom Bagan"
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1)
                  setSearchQuery('')
                }}
                className="p-1.5 sm:p-2 border-2 border-ink bg-white shadow-brutal-sm hover:bg-surface text-ink cursor-pointer"
                title="Reset Tampilan"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BRACKET CANVAS */}
      <section className="border-2 border-ink bg-white shadow-brutal overflow-hidden">
        <div className="bg-ink text-white px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between border-b-2 border-ink gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase">
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-brand border border-white shrink-0" />
            <span className="truncate">DIVISI AKTIF: {currentBracket.categoryName} • {currentBracket.venue}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] text-[#79db8d] uppercase">
            <span>● HIJAU: LOLOS</span>
            <span>● MERAH: LIVE</span>
          </div>
        </div>

        {/* Petunjuk Geser Horizontal di Ponsel */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#fef08a] border-b-2 border-ink font-mono text-[11px] font-bold text-ink">
          <span>↔ Geser layar ke samping untuk melihat seluruh bagan babak gugur</span>
        </div>

        <div
          className="p-3 sm:p-6 overflow-x-auto custom-scrollbar bg-[#f8faf9] min-h-[580px] sm:min-h-[640px]"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          <div className="min-w-[1050px] sm:min-w-[1100px] grid grid-cols-4 gap-4 sm:gap-6 relative">
            {/* KOLOM 1: PENYISIHAN / 16 BESAR */}
            <div className="flex flex-col">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-4 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-ink text-white px-2 py-0.5 inline-block mb-1 font-bold">
                  PUTARAN 1
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  PENYISIHAN / 16 BESAR
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">
                  {currentBracket.round16.length} LAGA TERDAFTAR
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {currentBracket.round16.map((match) => (
                  <div
                    key={match.id}
                    className={`border-2 border-ink bg-white shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all ${
                      match.status === 'LIVE' ? 'ring-2 ring-danger' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center px-2.5 sm:px-3 py-1.5 bg-surface border-b-2 border-ink font-mono text-[11px] sm:text-xs">
                      <span className="font-bold text-ink truncate">{match.matchCode} • {match.court}</span>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 font-bold text-[10px] sm:text-[11px] shrink-0 ml-1 ${
                          match.status === 'LIVE'
                            ? 'bg-danger text-white animate-pulse'
                            : match.status === 'FINISHED'
                            ? 'bg-brand text-white'
                            : 'bg-white text-ink border border-ink'
                        }`}
                      >
                        {match.status === 'LIVE' ? 'LIVE' : match.status === 'FINISHED' ? 'SELESAI' : 'JADWAL'}
                      </span>
                    </div>

                    <div className="p-2 space-y-1.5">
                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 border transition-all ${
                          match.winner === match.teamA
                            ? 'bg-brand-light/60 border-brand font-black text-brand'
                            : 'border-transparent text-ink/80 font-medium'
                        } ${filterTeamHighlight(match.teamA) ? 'ring-2 ring-yellow-400 font-extrabold' : ''}`}
                      >
                        <span className="text-xs sm:text-sm truncate">{match.teamA}</span>
                        <span className="font-mono text-xs sm:text-sm font-black">{match.scoreA}</span>
                      </div>

                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 border transition-all ${
                          match.winner === match.teamB
                            ? 'bg-brand-light/60 border-brand font-black text-brand'
                            : 'border-transparent text-ink/80 font-medium'
                        } ${filterTeamHighlight(match.teamB) ? 'ring-2 ring-yellow-400 font-extrabold' : ''}`}
                      >
                        <span className="text-xs sm:text-sm truncate">{match.teamB}</span>
                        <span className="font-mono text-xs sm:text-sm font-black">{match.scoreB}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KOLOM 2: PEREMPAT FINAL */}
            <div className="flex flex-col">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-4 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-brand text-white px-2 py-0.5 inline-block mb-1 font-bold">
                  PUTARAN 2
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  PEREMPAT FINAL
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">8 BESAR GUGUR</p>
              </div>

              <div className="flex flex-col gap-8 justify-around h-full">
                {currentBracket.quarterFinals.map((match) => (
                  <div
                    key={match.id}
                    className={`border-2 border-ink bg-white shadow-brutal-sm transition-all ${
                      match.status === 'LIVE' ? 'ring-2 ring-danger' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center px-2.5 sm:px-3 py-1.5 bg-surface border-b-2 border-ink font-mono text-[11px] sm:text-xs">
                      <span className="font-bold text-ink truncate">{match.matchCode} • {match.court}</span>
                      {match.status === 'LIVE' ? (
                        <span className="bg-danger text-white px-1.5 sm:px-2 py-0.5 font-bold text-[10px] sm:text-[11px] flex items-center gap-1 animate-pulse shrink-0 ml-1">
                          <Radio size={11} /> LIVE
                        </span>
                      ) : (
                        <span className="bg-surface-variant text-ink px-1.5 sm:px-2 py-0.5 font-bold text-[10px] sm:text-[11px] shrink-0 ml-1">
                          {match.status === 'FINISHED' ? 'SELESAI' : 'MENDATANG'}
                        </span>
                      )}
                    </div>

                    <div className="p-2 space-y-1.5">
                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 border ${
                          match.winner === match.teamA
                            ? 'bg-brand-light/60 border-brand font-black text-brand'
                            : 'border-transparent text-ink/80 font-medium'
                        } ${filterTeamHighlight(match.teamA) ? 'ring-2 ring-yellow-400 font-extrabold' : ''}`}
                      >
                        <span className="text-xs sm:text-sm truncate">{match.teamA}</span>
                        <span className="font-mono text-xs sm:text-sm font-black">{match.scoreA}</span>
                      </div>

                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 border ${
                          match.winner === match.teamB
                            ? 'bg-brand-light/60 border-brand font-black text-brand'
                            : 'border-transparent text-ink/80 font-medium'
                        } ${filterTeamHighlight(match.teamB) ? 'ring-2 ring-yellow-400 font-extrabold' : ''}`}
                      >
                        <span className="text-xs sm:text-sm truncate">{match.teamB}</span>
                        <span className="font-mono text-xs sm:text-sm font-black">{match.scoreB}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KOLOM 3: SEMIFINAL */}
            <div className="flex flex-col">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-4 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-[#cea700] text-black px-2 py-0.5 inline-block mb-1 font-bold">
                  PUTARAN 3
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  SEMIFINAL
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">TIKET KE GRAND FINAL</p>
              </div>

              <div className="flex flex-col gap-12 sm:gap-16 justify-around h-full">
                {currentBracket.semiFinals.map((match) => (
                  <div
                    key={match.id}
                    className="border-2 border-ink bg-white shadow-brutal-sm"
                  >
                    <div className="flex justify-between items-center px-2.5 sm:px-3 py-1.5 bg-[#dae2fd] border-b-2 border-ink font-mono text-[11px] sm:text-xs">
                      <span className="font-bold text-ink truncate">{match.matchCode} • {match.court}</span>
                      <span className="bg-ink text-white px-2 py-0.5 font-bold text-[10px] sm:text-[11px] shrink-0 ml-1">
                        {match.time}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 space-y-2">
                      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface border-2 border-ink">
                        <span className="text-xs sm:text-sm font-bold text-ink truncate mr-2">{match.teamA}</span>
                        <span className="font-mono text-xs sm:text-sm font-black shrink-0">{match.scoreA}</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface border-2 border-ink">
                        <span className="text-xs sm:text-sm font-bold text-ink truncate mr-2">{match.teamB}</span>
                        <span className="font-mono text-xs sm:text-sm font-black shrink-0">{match.scoreB}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KOLOM 4: GRAND FINAL & JUARA 3 */}
            <div className="flex flex-col justify-between">
              <div className="border-2 border-ink bg-[#fef08a] p-4 sm:p-5 shadow-brutal text-center relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-ink text-white px-3.5 py-1 font-mono text-[10px] sm:text-xs font-black uppercase border border-ink shadow-brutal-sm whitespace-nowrap">
                  PUNCAK PIALA BUPATI
                </div>

                <div className="flex justify-center my-2 sm:my-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-ink bg-brand text-white flex items-center justify-center shadow-brutal-sm">
                    <Trophy size={24} className="sm:size-7" />
                  </div>
                </div>

                <h3 className="font-display text-lg sm:text-2xl font-black uppercase text-ink">
                  GRAND FINAL
                </h3>
                <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1 font-bold">
                  {currentBracket.grandFinal.dateStr} • {currentBracket.grandFinal.time}
                </p>

                <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 bg-white border-2 border-ink space-y-2 text-left font-mono text-xs sm:text-sm font-bold">
                  <div className="flex justify-between items-center py-1.5 border-b border-ink/20">
                    <span className="text-ink truncate font-bold mr-2">{currentBracket.grandFinal.teamA}</span>
                    <span className="text-brand font-black shrink-0">{currentBracket.grandFinal.scoreA}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-ink truncate font-bold mr-2">{currentBracket.grandFinal.teamB}</span>
                    <span className="text-brand font-black shrink-0">{currentBracket.grandFinal.scoreB}</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-ink bg-white p-3.5 sm:p-4 shadow-brutal-sm mt-4 sm:mt-6">
                <span className="font-mono text-xs bg-surface border border-ink px-2 sm:px-2.5 py-1 font-black uppercase">
                  PEREBUTAN JUARA 3
                </span>
                <p className="font-mono text-xs text-ink/70 mt-1 font-bold">Sebelum Laga Grand Final</p>
                <div className="mt-2 text-xs sm:text-sm font-mono font-bold text-ink space-y-1.5">
                  <div className="p-2 bg-surface border border-ink/40 truncate">Runner-up SF-01</div>
                  <div className="p-2 bg-surface border border-ink/40 truncate">Runner-up SF-02</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
