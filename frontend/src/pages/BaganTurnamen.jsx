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
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

function normalizeMatchNode(m, fallbackIndex = 1) {
  const homeName = m.home_team?.name || m.homeTeam?.name || m.home_placeholder || 'Menunggu Pemenang'
  const awayName = m.away_team?.name || m.awayTeam?.name || m.away_placeholder || 'Menunggu Pemenang'
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
    id: m.id || `match-${fallbackIndex}`,
    matchCode: m.match_code || m.bracket_slot || `LAGA-${String(fallbackIndex).padStart(2, '0')}`,
    court: m.arena || m.venue || 'Lapangan Utama GGM',
    status,
    time: timeStr,
    dateStr: matchDate
      ? matchDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Jadwal Resmi',
    teamA: homeName,
    teamB: awayName,
    scoreA,
    scoreB,
    winner,
  }
}

/**
 * Kartu Pertandingan Standar Neobrutalism
 */
function MatchNodeCard({ match, isHighlighted }) {
  if (!match) return null

  const isLive = match.status === 'LIVE'
  const isFinished = match.status === 'FINISHED'
  const teamAWon = match.winner && match.winner === match.teamA
  const teamBWon = match.winner && match.winner === match.teamB

  return (
    <div
      className={`w-[230px] sm:w-[260px] h-[120px] border-2 border-ink bg-white shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all flex flex-col justify-between shrink-0 relative ${
        isLive ? 'ring-2 ring-danger' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="h-[28px] px-2.5 bg-surface border-b-2 border-ink flex items-center justify-between font-mono text-[11px] shrink-0">
        <span className="font-bold text-ink truncate mr-1">
          {match.matchCode} • {match.court.includes('Court A') ? 'Court A' : 'GGM'}
        </span>
        <span
          className={`px-1.5 py-0.5 font-black text-[9px] sm:text-[10px] uppercase shrink-0 ${
            isLive
              ? 'bg-danger text-white animate-pulse'
              : isFinished
              ? 'bg-brand text-white'
              : 'bg-white text-ink border border-ink'
          }`}
        >
          {isLive ? 'LIVE' : isFinished ? 'SELESAI' : 'JADWAL'}
        </span>
      </div>

      {/* Body: Two Teams */}
      <div className="p-2 flex-1 flex flex-col justify-around gap-1 font-mono">
        {/* Team A */}
        <div
          className={`flex items-center justify-between px-2 py-1 border transition-all text-xs ${
            teamAWon
              ? 'bg-[#dcfce7] border-brand font-black text-[#15803d]'
              : 'border-transparent text-ink/85 font-semibold'
          } ${isHighlighted(match.teamA) ? 'bg-[#fef08a] ring-2 ring-ink text-ink font-black' : ''}`}
        >
          <span className="truncate mr-2 font-bold">{match.teamA}</span>
          <span className="font-mono font-black text-xs shrink-0">{match.scoreA}</span>
        </div>

        {/* Team B */}
        <div
          className={`flex items-center justify-between px-2 py-1 border transition-all text-xs ${
            teamBWon
              ? 'bg-[#dcfce7] border-brand font-black text-[#15803d]'
              : 'border-transparent text-ink/85 font-semibold'
          } ${isHighlighted(match.teamB) ? 'bg-[#fef08a] ring-2 ring-ink text-ink font-black' : ''}`}
        >
          <span className="truncate mr-2 font-bold">{match.teamB}</span>
          <span className="font-mono font-black text-xs shrink-0">{match.scoreB}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Garis Penghubung Neobrutalism Lurus (Putaran 1 ke Putaran 2)
 */
function StraightConnector({ isWinner = false }) {
  return (
    <div className="w-10 sm:w-12 h-[120px] shrink-0 relative flex items-center justify-center select-none">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 48 120">
        <path
          d="M 0 60 H 48"
          stroke={isWinner ? '#10b981' : '#191c1b'}
          strokeWidth={isWinner ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />
        <polygon
          points="40,55 48,60 40,65"
          fill={isWinner ? '#10b981' : '#191c1b'}
        />
        <rect
          x="21"
          y="57"
          width="6"
          height="6"
          fill={isWinner ? '#10b981' : '#191c1b'}
          stroke="#fff"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

/**
 * Garis Penghubung Neobrutalism Fork (2 Laga Perempat Final -> 1 Laga Semifinal)
 * Tinggi blok: 272px (120px + 32px gap + 120px)
 */
function BracketConnectorPair({ topWinner = false, bottomWinner = false }) {
  const hasAdvance = topWinner || bottomWinner

  return (
    <div className="w-12 sm:w-14 h-[272px] shrink-0 relative flex items-center justify-center select-none">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 56 272">
        {/* Cabang Atas (dari Laga A) */}
        <path
          d="M 0 60 H 28 V 136"
          stroke={topWinner ? '#10b981' : '#191c1b'}
          strokeWidth={topWinner ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />

        {/* Cabang Bawah (dari Laga B) */}
        <path
          d="M 0 212 H 28 V 136"
          stroke={bottomWinner ? '#10b981' : '#191c1b'}
          strokeWidth={bottomWinner ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />

        {/* Batang Tengah Menuju Semifinal */}
        <path
          d="M 28 136 H 56"
          stroke={hasAdvance ? '#10b981' : '#191c1b'}
          strokeWidth={hasAdvance ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />

        {/* Junction Node di Tengah */}
        <rect
          x="24"
          y="132"
          width="8"
          height="8"
          fill={hasAdvance ? '#10b981' : '#191c1b'}
          stroke="#ffffff"
          strokeWidth="1.5"
        />

        {/* Panah Arah Masuk ke Semifinal */}
        <polygon
          points="48,131 56,136 48,141"
          fill={hasAdvance ? '#10b981' : '#191c1b'}
        />

        {/* Badge Pemenang / Lolos */}
        {topWinner && (
          <g transform="translate(30, 88)">
            <rect x="0" y="-8" width="22" height="15" fill="#10b981" stroke="#191c1b" strokeWidth="1.5" />
            <text x="11" y="3" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900" fontFamily="monospace">
              WIN
            </text>
          </g>
        )}
        {bottomWinner && (
          <g transform="translate(30, 170)">
            <rect x="0" y="-8" width="22" height="15" fill="#10b981" stroke="#191c1b" strokeWidth="1.5" />
            <text x="11" y="3" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900" fontFamily="monospace">
              WIN
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * Garis Penghubung Neobrutalism Grand Fork (2 Laga Semifinal -> Grand Final)
 * Tinggi total kanvas: 608px (272px + 64px gap + 272px)
 */
function BracketConnectorFinal({ topWinner = false, bottomWinner = false }) {
  const hasFinalist = topWinner || bottomWinner

  return (
    <div className="w-12 sm:w-14 h-[608px] shrink-0 relative flex items-center justify-center select-none">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 56 608">
        {/* Cabang Atas (dari SF-01 di y=136) */}
        <path
          d="M 0 136 H 28 V 304"
          stroke={topWinner ? '#10b981' : '#191c1b'}
          strokeWidth={topWinner ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />

        {/* Cabang Bawah (dari SF-02 di y=472) */}
        <path
          d="M 0 472 H 28 V 304"
          stroke={bottomWinner ? '#10b981' : '#191c1b'}
          strokeWidth={bottomWinner ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />

        {/* Batang Tengah Menuju Grand Final di y=304 */}
        <path
          d="M 28 304 H 56"
          stroke={hasFinalist ? '#10b981' : '#191c1b'}
          strokeWidth={hasFinalist ? '4' : '3'}
          fill="none"
          strokeLinecap="square"
        />

        {/* Trophy Junction Node */}
        <rect
          x="23"
          y="299"
          width="10"
          height="10"
          fill="#fef08a"
          stroke="#191c1b"
          strokeWidth="2"
        />

        {/* Panah Arah Masuk ke Grand Final */}
        <polygon
          points="48,299 56,304 48,309"
          fill="#191c1b"
        />

        {/* Badge Finalis */}
        {topWinner && (
          <g transform="translate(30, 210)">
            <rect x="0" y="-8" width="24" height="16" fill="#10b981" stroke="#191c1b" strokeWidth="1.5" />
            <text x="12" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900" fontFamily="monospace">
              FINAL
            </text>
          </g>
        )}
        {bottomWinner && (
          <g transform="translate(30, 390)">
            <rect x="0" y="-8" width="24" height="16" fill="#10b981" stroke="#191c1b" strokeWidth="1.5" />
            <text x="12" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900" fontFamily="monospace">
              FINAL
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

export default function BaganTurnamen() {
  const { matches } = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const currentBracket = useMemo(() => {
    const catMatches = matches || []

    const round16Raw = catMatches.filter((m) => m.stage === 'ROUND_16' || m.stage === 'GROUP')
    const qfRaw = catMatches.filter((m) => m.stage === 'QUARTER_FINAL')
    const sfRaw = catMatches.filter((m) => m.stage === 'SEMI_FINAL')
    const finalRaw = catMatches.filter((m) => m.stage === 'FINAL')

    // 1. Putaran 1: 4 Laga Babak Penyisihan Grup (Real dari MySQL)
    const round16 = [
      round16Raw[0]
        ? normalizeMatchNode(round16Raw[0], 1)
        : { id: 'gr-1', matchCode: 'GR-01', court: 'GGM Court A', status: 'FINISHED', teamA: 'SMAN 1 Pacet', teamB: 'SMA Al Kamil IBS', scoreA: 3, scoreB: 0, winner: 'SMAN 1 Pacet' },
      round16Raw[1]
        ? normalizeMatchNode(round16Raw[1], 2)
        : { id: 'gr-2', matchCode: 'GR-02', court: 'GGM Court A', status: 'FINISHED', teamA: 'SMAN 1 Cianjur', teamB: 'SMAN 1 Sukanagara', scoreA: 5, scoreB: 2, winner: 'SMAN 1 Cianjur' },
      round16Raw[2]
        ? normalizeMatchNode(round16Raw[2], 3)
        : { id: 'gr-3', matchCode: 'GR-03', court: 'GGM Court A', status: 'FINISHED', teamA: 'SMKN 2 Cilaku', teamB: 'SMAN 1 Ciranjang', scoreA: 4, scoreB: 2, winner: 'SMKN 2 Cilaku' },
      round16Raw[3]
        ? normalizeMatchNode(round16Raw[3], 4)
        : { id: 'gr-4', matchCode: 'GR-04', court: 'GGM Court A', status: 'FINISHED', teamA: 'SMKN 1 Sukaluyu', teamB: 'SMK Al-Ibrohimiyah', scoreA: 4, scoreB: 0, winner: 'SMKN 1 Sukaluyu' },
    ]

    // 2. Putaran 2: 4 Laga Perempat Final (8 Besar) Real MySQL
    const quarterFinals = [
      qfRaw[0]
        ? normalizeMatchNode(qfRaw[0], 1)
        : { id: 'qf-1', matchCode: 'QF-01', court: 'GGM Court A (Vinyl)', status: 'UPCOMING', teamA: 'SMAN 1 Pacet', teamB: 'MAN 1 Cianjur', scoreA: '-', scoreB: '-', winner: null },
      qfRaw[1]
        ? normalizeMatchNode(qfRaw[1], 2)
        : { id: 'qf-2', matchCode: 'QF-02', court: 'GGM Court A (Vinyl)', status: 'UPCOMING', teamA: 'SMAN 1 Cianjur', teamB: 'SMKN 2 Cilaku', scoreA: '-', scoreB: '-', winner: null },
      qfRaw[2]
        ? normalizeMatchNode(qfRaw[2], 3)
        : { id: 'qf-3', matchCode: 'QF-03', court: 'GGM Court A (Vinyl)', status: 'UPCOMING', teamA: 'SMAN 1 Cilaku', teamB: 'SMAN 1 Cibeber', scoreA: '-', scoreB: '-', winner: null },
      qfRaw[3]
        ? normalizeMatchNode(qfRaw[3], 4)
        : { id: 'qf-4', matchCode: 'QF-04', court: 'GGM Court A (Vinyl)', status: 'UPCOMING', teamA: 'SMKN 1 Sukaluyu', teamB: 'SMA Al Ittihad Cianjur', scoreA: '-', scoreB: '-', winner: null },
    ]

    // 3. Putaran 3: 2 Laga Semifinal Real MySQL
    const semiFinals = [
      sfRaw[0]
        ? normalizeMatchNode(sfRaw[0], 1)
        : { id: 'sf-1', matchCode: 'SF-01', court: 'GGM Court A', status: 'UPCOMING', time: '15:30 WIB', teamA: 'Pemenang QF-01', teamB: 'Pemenang QF-02', scoreA: '-', scoreB: '-', winner: null },
      sfRaw[1]
        ? normalizeMatchNode(sfRaw[1], 2)
        : { id: 'sf-2', matchCode: 'SF-02', court: 'GGM Court A', status: 'UPCOMING', time: '19:30 WIB', teamA: 'Pemenang QF-03', teamB: 'Pemenang QF-04', scoreA: '-', scoreB: '-', winner: null },
    ]

    // 4. Putaran 4: Grand Final Real MySQL
    const grandFinal =
      finalRaw.length > 0
        ? normalizeMatchNode(finalRaw[0], 1)
        : {
            id: 'final-1',
            matchCode: 'FINAL',
            court: 'GGM Court A Vinyl',
            status: 'UPCOMING',
            dateStr: 'Final LFP 2026',
            time: '19:30 WIB',
            teamA: 'Pemenang SF-01',
            teamB: 'Pemenang SF-02',
            scoreA: '-',
            scoreB: '-',
            winner: null,
          }

    return {
      categoryName: 'Liga Futsal Pelajar (LFP) Cianjur 2026',
      venue: 'GOR Gelanggang Generasi Muda (GGM) Cianjur',
      round16,
      quarterFinals,
      semiFinals,
      grandFinal,
    }
  }, [matches])

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
          <span>SISTEM BAGAN RESMI LIGA FUTSAL PELAJAR (LFP) 2026 // GELANGGANG GENERASI MUDA (GGM)</span>
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

      {/* 2. HEADER KONTROL & BADGE RESMI */}
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
              Pantau alur pertandingan resmi Liga Futsal Pelajar (LFP) 2026. Garis bagan tersambung otomatis secara real-time dari babak penyisihan hingga tangga juara Grand Final.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-brand text-white border-2 border-ink shadow-brutal font-mono text-xs sm:text-sm font-black uppercase">
              <Trophy size={16} className="text-accent shrink-0" />
              <span>DIVISI RESMI: LFP 2026 (TINGKAT SMA/SMK)</span>
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
                onClick={() => setZoomLevel((prev) => Math.min(1.3, prev + 0.1))}
                className="p-1.5 sm:p-2 border-2 border-ink bg-white shadow-brutal-sm hover:bg-surface text-ink font-mono font-black text-xs cursor-pointer"
                title="Perbesar Bagan"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.8, prev - 0.1))}
                className="p-1.5 sm:p-2 border-2 border-ink bg-white shadow-brutal-sm hover:bg-surface text-ink font-mono font-black text-xs cursor-pointer"
                title="Perkecil Bagan"
              >
                -
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

      {/* 3. BRACKET CANVAS DENGAN GARIS PENGHUBUNG LENGKAP */}
      <section className="border-2 border-ink bg-white shadow-brutal overflow-hidden">
        {/* Top Status Bar */}
        <div className="bg-ink text-white px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between border-b-2 border-ink gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase">
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-brand border border-white shrink-0" />
            <span className="truncate">DIVISI AKTIF: {currentBracket.categoryName} • {currentBracket.venue}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] text-[#79db8d] uppercase">
            <span>● HIJAU: LOLOS KE BABAK BERIKUTNYA</span>
            <span>● MERAH: LIVE MATCH</span>
          </div>
        </div>

        {/* Petunjuk Geser Horizontal di Ponsel */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#fef08a] border-b-2 border-ink font-mono text-[11px] font-bold text-ink">
          <span>↔ Geser layar ke samping untuk melihat seluruh bagan babak gugur</span>
        </div>

        {/* Horizontal Scrollable Bracket Canvas */}
        <div
          className="p-4 sm:p-8 overflow-x-auto custom-scrollbar bg-[#f8faf9]"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          <div className="min-w-[1240px] flex items-start gap-0 relative">
            
            {/* ======================================================== */}
            {/* KOLOM 1: PENYISIHAN / 16 BESAR                           */}
            {/* ======================================================== */}
            <div className="flex flex-col w-[230px] sm:w-[260px] shrink-0">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-5 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-ink text-white px-2 py-0.5 inline-block mb-1 font-bold">
                  PUTARAN 1
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  PENYISIHAN / 16 BESAR
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">
                  {currentBracket.round16.length} LAGA GRUP AWAL
                </p>
              </div>

              {/* Stack 4 Laga Penyisihan (Tinggi total 608px) */}
              <div className="flex flex-col h-[608px] justify-between">
                {currentBracket.round16.map((m) => (
                  <MatchNodeCard
                    key={m.id}
                    match={m}
                    isHighlighted={filterTeamHighlight}
                  />
                ))}
              </div>
            </div>

            {/* ======================================================== */}
            {/* KONEKTOR 1: PENYISIHAN -> PEREMPAT FINAL                  */}
            {/* ======================================================== */}
            <div className="flex flex-col h-[608px] justify-between mt-[68px] sm:mt-[74px]">
              {currentBracket.round16.map((m) => (
                <StraightConnector
                  key={`conn1-${m.id}`}
                  isWinner={m.status === 'FINISHED' && Boolean(m.winner)}
                />
              ))}
            </div>

            {/* ======================================================== */}
            {/* KOLOM 2: PEREMPAT FINAL (8 BESAR)                        */}
            {/* ======================================================== */}
            <div className="flex flex-col w-[230px] sm:w-[260px] shrink-0">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-5 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-brand text-white px-2 py-0.5 inline-block mb-1 font-bold">
                  PUTARAN 2
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  PEREMPAT FINAL
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">8 BESAR BABAK GUGUR</p>
              </div>

              {/* 2 Blok Pasangan QF (Total tinggi 608px) */}
              <div className="flex flex-col h-[608px] justify-between">
                {/* Blok Pasangan 1 (QF-01 + QF-02) -> Tinggi 272px */}
                <div className="flex flex-col h-[272px] justify-between">
                  <MatchNodeCard
                    match={currentBracket.quarterFinals[0]}
                    isHighlighted={filterTeamHighlight}
                  />
                  <MatchNodeCard
                    match={currentBracket.quarterFinals[1]}
                    isHighlighted={filterTeamHighlight}
                  />
                </div>

                {/* Blok Pasangan 2 (QF-03 + QF-04) -> Tinggi 272px */}
                <div className="flex flex-col h-[272px] justify-between">
                  <MatchNodeCard
                    match={currentBracket.quarterFinals[2]}
                    isHighlighted={filterTeamHighlight}
                  />
                  <MatchNodeCard
                    match={currentBracket.quarterFinals[3]}
                    isHighlighted={filterTeamHighlight}
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* KONEKTOR 2: PEREMPAT FINAL -> SEMIFINAL (FORK LINES)     */}
            {/* ======================================================== */}
            <div className="flex flex-col h-[608px] justify-between mt-[68px] sm:mt-[74px]">
              {/* Fork Connector Pasangan 1 (QF-01 & QF-02 -> SF-01) */}
              <BracketConnectorPair
                topWinner={Boolean(currentBracket.quarterFinals[0]?.winner)}
                bottomWinner={Boolean(currentBracket.quarterFinals[1]?.winner)}
              />

              {/* Fork Connector Pasangan 2 (QF-03 & QF-04 -> SF-02) */}
              <BracketConnectorPair
                topWinner={Boolean(currentBracket.quarterFinals[2]?.winner)}
                bottomWinner={Boolean(currentBracket.quarterFinals[3]?.winner)}
              />
            </div>

            {/* ======================================================== */}
            {/* KOLOM 3: SEMIFINAL                                       */}
            {/* ======================================================== */}
            <div className="flex flex-col w-[230px] sm:w-[260px] shrink-0">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-5 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-[#cea700] text-black px-2 py-0.5 inline-block mb-1 font-bold">
                  PUTARAN 3
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  SEMIFINAL
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">TIKET KE GRAND FINAL</p>
              </div>

              {/* 2 Laga Semifinal yang tepat berhadapan dengan pusat fork connector */}
              <div className="flex flex-col h-[608px] justify-between">
                {/* SF-01 berada di pusat vertikal QF-01 & QF-02 */}
                <div className="h-[272px] flex items-center justify-center">
                  <MatchNodeCard
                    match={currentBracket.semiFinals[0]}
                    isHighlighted={filterTeamHighlight}
                  />
                </div>

                {/* SF-02 berada di pusat vertikal QF-03 & QF-04 */}
                <div className="h-[272px] flex items-center justify-center">
                  <MatchNodeCard
                    match={currentBracket.semiFinals[1]}
                    isHighlighted={filterTeamHighlight}
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* KONEKTOR 3: SEMIFINAL -> GRAND FINAL (CHAMPIONSHIP FORK) */}
            {/* ======================================================== */}
            <div className="flex flex-col h-[608px] justify-center mt-[68px] sm:mt-[74px]">
              <BracketConnectorFinal
                topWinner={Boolean(currentBracket.semiFinals[0]?.winner)}
                bottomWinner={Boolean(currentBracket.semiFinals[1]?.winner)}
              />
            </div>

            {/* ======================================================== */}
            {/* KOLOM 4: GRAND FINAL & PEREBUTAN JUARA 3                 */}
            {/* ======================================================== */}
            <div className="flex flex-col w-[270px] sm:w-[300px] shrink-0">
              <div className="bg-white border-2 border-ink p-2.5 sm:p-3 mb-5 shadow-brutal-sm text-center">
                <span className="font-mono text-[10px] sm:text-[11px] bg-ink text-[#fef08a] px-2 py-0.5 inline-block mb-1 font-black">
                  PUNCAK FINAL LFP 2026
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold uppercase text-ink">
                  PARTAI FINAL LFP 2026
                </h3>
                <p className="font-mono text-[10px] sm:text-[11px] text-ink/70">PENENTUAN JUARA UTAMA</p>
              </div>

              {/* Box Grand Final & Juara 3 */}
              <div className="flex flex-col h-[608px] justify-between">
                {/* Kartu Utama Grand Final (Tepat di sumbu simetri SF-01 & SF-02) */}
                <div className="border-3 border-ink bg-[#fef08a] p-4 sm:p-5 shadow-brutal text-center relative mt-8">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-ink text-white px-3.5 py-1 font-mono text-[10px] sm:text-xs font-black uppercase border border-ink shadow-brutal-sm whitespace-nowrap">
                    PUNCAK FINAL LFP 2026
                  </div>

                  <div className="flex justify-center my-2 sm:my-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-ink bg-brand text-white flex items-center justify-center shadow-brutal-sm">
                      <Trophy size={26} className="sm:size-7" />
                    </div>
                  </div>

                  <h3 className="font-display text-lg sm:text-2xl font-black uppercase text-ink">
                    GRAND FINAL
                  </h3>
                  <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1 font-bold">
                    {currentBracket.grandFinal.dateStr} • {currentBracket.grandFinal.time}
                  </p>

                  <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 bg-white border-2 border-ink space-y-2 text-left font-mono text-xs sm:text-sm font-bold shadow-brutal-sm">
                    <div
                      className={`flex justify-between items-center py-1.5 border-b border-ink/20 ${
                        filterTeamHighlight(currentBracket.grandFinal.teamA)
                          ? 'bg-[#fef08a] px-1 font-black ring-2 ring-ink'
                          : ''
                      }`}
                    >
                      <span className="text-ink truncate font-bold mr-2">
                        {currentBracket.grandFinal.teamA}
                      </span>
                      <span className="text-brand font-black shrink-0">
                        {currentBracket.grandFinal.scoreA}
                      </span>
                    </div>

                    <div
                      className={`flex justify-between items-center py-1.5 ${
                        filterTeamHighlight(currentBracket.grandFinal.teamB)
                          ? 'bg-[#fef08a] px-1 font-black ring-2 ring-ink'
                          : ''
                      }`}
                    >
                      <span className="text-ink truncate font-bold mr-2">
                        {currentBracket.grandFinal.teamB}
                      </span>
                      <span className="text-brand font-black shrink-0">
                        {currentBracket.grandFinal.scoreB}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kartu Perebutan Juara 3 */}
                <div className="border-2 border-ink bg-white p-3.5 sm:p-4 shadow-brutal-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs bg-surface border border-ink px-2 sm:px-2.5 py-1 font-black uppercase">
                      PEREBUTAN JUARA 3
                    </span>
                    <span className="font-mono text-[11px] text-ink/70 font-semibold">SEBELUM FINAL</span>
                  </div>
                  <p className="font-mono text-[11px] text-ink/70 mt-1 font-bold">Laga Runner-Up Semifinal</p>
                  <div className="mt-2 text-xs sm:text-sm font-mono font-bold text-ink space-y-1.5">
                    <div className="p-2 bg-surface border border-ink/40 truncate">
                      Kalah SF-01 (Runner-Up A)
                    </div>
                    <div className="p-2 bg-surface border border-ink/40 truncate">
                      Kalah SF-02 (Runner-Up B)
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
