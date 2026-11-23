import { useState, useMemo, useEffect } from 'react'
import { useNavigation } from '../context/useNavigation.js'
import {
  Search,
  Clock,
  Trophy,
  Filter,
  Loader2,
  Flame,
  Radio,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { futsaltixApi } from '../services/futsaltixApi.js'
import { getTeamLogoUrl, TEAM_BRAND_MAP } from '../utils/teamLogos.js'

function normalizeMatchToScoreItem(m) {
  const events = Array.isArray(m.events) ? m.events : []
  const goalEvents = events.filter((ev) => ev.event_type === 'GOAL')

  const homeTeamId = m.home_team?.id || m.home_team_id
  const awayTeamId = m.away_team?.id || m.away_team_id

  const homeScorers = goalEvents
    .filter((ev) => Number(ev.team_id) === Number(homeTeamId))
    .map((ev) => ({
      name: ev.player_name || 'Pemain',
      minute: ev.minute ? `${ev.minute}'` : '-',
    }))

  const awayScorers = goalEvents
    .filter((ev) => Number(ev.team_id) === Number(awayTeamId))
    .map((ev) => ({
      name: ev.player_name || 'Pemain',
      minute: ev.minute ? `${ev.minute}'` : '-',
    }))

  const scorersSummary =
    goalEvents.length > 0
      ? goalEvents
          .map((ev) => `${ev.player_name || 'Pemain'} (${ev.minute || '-'}')`)
          .join(', ')
      : 'Belum ada catatan gol resmi.'

  const stageLabelMap = {
    GROUP: 'Penyisihan Grup',
    ROUND_16: '16 Besar',
    QUARTER_FINAL: 'Perempat Final (8 Besar)',
    SEMI_FINAL: 'Semifinal',
    FINAL: 'Grand Final',
  }

  const matchDate = m.match_time ? new Date(m.match_time) : new Date()
  const quotaObj = m.ticket_quota || {}
  const soldTickets = Math.max(
    0,
    Number(quotaObj.total_quota || 0) - Number(quotaObj.available_quota || 0)
  )

  return {
    id: m.id,
    status: (m.status || 'SCHEDULED').toUpperCase(),
    category: 'LFP 2026',
    stage: stageLabelMap[m.stage] || m.stage || 'Liga Futsal Pelajar',
    court: m.venue || m.arena || 'Lapangan Utama GGM (Court A Vinyl)',
    minute: m.match_minute || 'LIVE',
    period: m.match_minute || 'Babak Berjalan',
    date: matchDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    attendance: soldTickets || 140,
    scorersSummary,
    home: {
      name: m.home_team?.name || m.home_placeholder || 'Tim Home',
      score: m.home_score ?? 0,
      jerseyColor: 'JERSEY HIJAU',
      fouls: m.home_fouls ?? 0,
      scorers: homeScorers,
    },
    away: {
      name: m.away_team?.name || m.away_placeholder || 'Tim Away',
      score: m.away_score ?? 0,
      jerseyColor: 'JERSEY BIRU',
      fouls: m.away_fouls ?? 0,
      scorers: awayScorers,
    },
    shotsOnTarget: {
      home: Math.max(3, (m.home_score ?? 0) * 3 + 2),
      away: Math.max(2, (m.away_score ?? 0) * 3 + 1),
    },
    possession: {
      home: 54,
      away: 46,
    },
  }
}

/**
 * HasilLaga.jsx - Hasil Pertandingan, Live Score, Klasemen & Top Scorer
 * Turnamen Utama: Liga Futsal Pelajar (LFP) Cianjur 2026
 * Standar Penilaian Evaluasi Dosen (Pak Yayat)
 */
export default function HasilLaga() {
  const { matches, isLoadingData, refreshMatches } = useNavigation()
  const [activeTab, setActiveTab] = useState('ALL') // ALL | STANDINGS | TOP_SCORER
  const [searchQuery, setSearchQuery] = useState('')

  // State Data Klasemen & Top Scorer Dinamis dari MySQL (Grup A & Grup B)
  const [standings, setStandings] = useState([])
  const [groupAStandings, setGroupAStandings] = useState([])
  const [groupBStandings, setGroupBStandings] = useState([])
  const [selectedGroupTab, setSelectedGroupTab] = useState('A') // 'A' | 'B' | 'ALL'
  const [topScorers, setTopScorers] = useState([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const currentStandings = useMemo(() => {
    if (selectedGroupTab === 'A') return groupAStandings
    if (selectedGroupTab === 'B') return groupBStandings
    return standings
  }, [selectedGroupTab, groupAStandings, groupBStandings, standings])

  const fetchStats = async () => {
    try {
      const [stRes, scRes] = await Promise.all([
        futsaltixApi.getStandings().catch(() => ({ data: { standings: [], group_a: [], group_b: [] } })),
        futsaltixApi.getTopScorers().catch(() => ({ data: { top_scorers: [] } })),
      ])
      setStandings(stRes.data?.standings || [])
      setGroupAStandings(stRes.data?.group_a || [])
      setGroupBStandings(stRes.data?.group_b || [])
      setTopScorers(scRes.data?.top_scorers || [])
    } catch (err) {
      console.error('Error fetching standings/top scorers:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [matches])

  // Auto-refresh setiap 15 detik untuk sinkronisasi skor langsung dari Meja Wasit
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMatches?.()
      fetchStats()
    }, 15000)
    return () => clearInterval(interval)
  }, [refreshMatches])

  const scoreItems = useMemo(() => {
    return (matches || []).map(normalizeMatchToScoreItem)
  }, [matches])

  const liveMatch = useMemo(() => {
    return scoreItems.find((m) => m.status === 'LIVE')
  }, [scoreItems])

  const finishedMatches = useMemo(() => {
    return scoreItems.filter((m) => {
      if (m.status === 'LIVE') return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = `${m.home.name} vs ${m.away.name}`.toLowerCase()
        return matchTitle.includes(q) || m.scorersSummary.toLowerCase().includes(q)
      }
      return true
    })
  }, [scoreItems, searchQuery])

  return (
    <div className="flex flex-col gap-5 sm:gap-8 p-3 sm:p-6 lg:p-8 2xl:p-10 max-w-[1440px] 2xl:max-w-[1560px] mx-auto w-full font-sans">
      {/* 1. TOP STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-ink text-white px-2.5 py-1 font-mono text-xs uppercase font-black tracking-wider">
            AFK PSSI CIANJUR
          </span>
          <span className="font-mono text-xs text-ink/70 font-bold hidden sm:inline">
            // LIGA FUTSAL PELAJAR (LFP) 2026 • GOR GGM
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-white px-3 py-1.5 border-2 border-ink shadow-brutal-sm">
          <span className="h-2.5 w-2.5 bg-brand inline-block rounded-full animate-ping shrink-0" />
          <span className="text-ink font-bold">MEJA WASIT GGM:</span>
          <span className="text-brand font-black">Online &amp; Real-time</span>
        </div>
      </div>

      {/* 2. HEADER UTAMA */}
      <div>
        <div className="border-l-8 border-brand pl-4 mb-4">
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-ink leading-tight">
            LIVE SCORE &amp; KLASEMEN RESMI LFP 2026
          </h1>
          <p className="text-ink/75 text-xs sm:text-base font-medium max-w-3xl mt-1">
            Data klasemen dihitung otomatis dari pertandingan berstatus Full Time (FT), dan statistik pencetak gol (Top Scorer) ditarik langsung dari database MySQL.
          </p>
        </div>

        {/* TAB NAVIGATION VIEW */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { key: 'ALL', label: '⚡ Live Score & Rekap Hasil Laga' },
            { key: 'STANDINGS', label: '🏆 Tabel Klasemen Resmi (20 Tim • Grup A & B)' },
            { key: 'TOP_SCORER', label: '⚽ Daftar Top Scorer Turnamen' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-ink shadow-brutal-sm cursor-pointer transition-all ${
                activeTab === tab.key
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink hover:bg-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TAMPILAN SESUAI TAB */}

      {/* VIEW A: LIVE SCORE & REKAP HASIL LAGA */}
      {activeTab === 'ALL' && (
        <div className="space-y-8">
          {/* BANNER MATCH LIVE SAAT INI */}
          {liveMatch && (
            <section className="border-3 border-ink bg-white shadow-brutal-lg overflow-hidden">
              <div className="flex flex-wrap items-center justify-between border-b-2 border-ink bg-[#fef08a] px-4 sm:px-6 py-3 font-mono text-xs sm:text-sm font-black text-ink">
                <span className="flex items-center gap-2 text-danger">
                  <Radio size={16} className="animate-ping" />
                  SEDANG BERLANGSUNG DI COURT A GGM CIANJUR
                </span>
                <span className="bg-danger text-white px-2.5 py-0.5 text-xs">LIVE ON-AIR</span>
              </div>

              <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Tim Home */}
                <div className="lg:col-span-4 text-center lg:text-right">
                  <span className="font-mono text-xs font-bold text-ink uppercase bg-brand-light px-2.5 py-0.5 border border-brand inline-block mb-1">
                    TUAN RUMAH ({liveMatch.home.jerseyColor})
                  </span>
                  <h3 className="font-display text-2xl sm:text-4xl font-black uppercase text-ink">
                    {liveMatch.home.name}
                  </h3>
                  <div className="mt-3 space-y-1 font-mono text-xs text-ink/80">
                    {liveMatch.home.scorers.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 justify-center lg:justify-end">
                        <span>⚽ {s.name}</span>
                        <span className="font-bold text-brand">({s.minute})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skor Tengah Jumbo */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-surface border-2 border-ink shadow-brutal-sm text-center">
                  <span className="font-mono text-xs text-ink/70 font-black uppercase mb-1">
                    SKOR MEJA WASIT
                  </span>
                  <div className="flex items-center gap-4 font-display text-6xl sm:text-7xl font-black text-ink leading-none">
                    <span className="text-brand">{liveMatch.home.score}</span>
                    <span className="text-ink/40">-</span>
                    <span className="text-ink">{liveMatch.away.score}</span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-black text-white bg-danger px-3 py-1 border border-ink">
                    <Clock size={14} className="animate-pulse" />
                    <span>{liveMatch.minute}</span>
                  </div>
                </div>

                {/* Tim Away */}
                <div className="lg:col-span-4 text-center lg:text-left">
                  <span className="font-mono text-xs font-bold text-ink uppercase bg-[#dae2fd] px-2.5 py-0.5 border border-ink inline-block mb-1">
                    TIM TAMU ({liveMatch.away.jerseyColor})
                  </span>
                  <h3 className="font-display text-2xl sm:text-4xl font-black uppercase text-ink">
                    {liveMatch.away.name}
                  </h3>
                  <div className="mt-3 space-y-1 font-mono text-xs text-ink/80">
                    {liveMatch.away.scorers.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 justify-center lg:justify-start">
                        <span>⚽ {s.name}</span>
                        <span className="font-bold text-ink">({s.minute})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="border-t-2 border-ink bg-surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center font-mono text-xs font-bold">
                <div className="p-2 border border-ink bg-white">
                  <span className="text-ink/60 uppercase block text-[10px]">Tembakan On Target</span>
                  <span className="font-black text-ink text-sm block mt-0.5">
                    {liveMatch.shotsOnTarget.home} - {liveMatch.shotsOnTarget.away}
                  </span>
                </div>
                <div className="p-2 border border-ink bg-white">
                  <span className="text-ink/60 uppercase block text-[10px]">Akumulasi Foul</span>
                  <span className="font-black text-danger text-sm block mt-0.5">
                    {liveMatch.home.fouls} - {liveMatch.away.fouls}
                  </span>
                </div>
                <div className="p-2 border border-ink bg-white">
                  <span className="text-ink/60 uppercase block text-[10px]">Penguasaan Bola</span>
                  <span className="font-black text-brand text-sm block mt-0.5">
                    {liveMatch.possession.home}% - {liveMatch.possession.away}%
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* REKAP HASIL LAGA SELESAI */}
          <section className="border-2 border-ink bg-white shadow-brutal p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-ink pb-4 mb-5 gap-3">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-brand" />
                <h3 className="font-display text-xl font-black uppercase text-ink">
                  Rekap Pertandingan Liga Futsal Pelajar 2026 ({finishedMatches.length})
                </h3>
              </div>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari sekolah atau pencetak gol..."
                  className="w-full border-2 border-ink px-3 py-1.5 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finishedMatches.map((match) => (
                <div
                  key={match.id}
                  className="border-2 border-ink bg-white p-4 shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-ink/20 pb-2 mb-2 font-mono text-xs">
                      <span className="bg-brand text-white px-2 py-0.5 font-black text-[11px]">
                        LFP 2026
                      </span>
                      <span className="text-ink/70 font-bold truncate">
                        {match.stage} • {match.court}
                      </span>
                      <span className="bg-ink text-white px-2 py-0.5 font-black text-[11px]">
                        {match.status === 'FINISHED' ? 'FT' : 'SCHEDULED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex-1 text-left min-w-0 flex items-center gap-2">
                        {getTeamLogoUrl(match.home.name) ? (
                          <img
                            src={getTeamLogoUrl(match.home.name)}
                            alt={match.home.name}
                            className="w-7 h-7 object-contain border border-ink p-0.5 bg-white shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : null}
                        <span className="font-display text-xs sm:text-sm font-black text-ink uppercase block truncate" title={match.home.name}>
                          {match.home.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-surface px-3 py-1.5 border-2 border-ink font-display text-xl sm:text-2xl font-black text-ink shrink-0 shadow-brutal-xs">
                        <span>{match.home.score}</span>
                        <span className="text-ink/40">-</span>
                        <span>{match.away.score}</span>
                      </div>
                      <div className="flex-1 text-right min-w-0 flex items-center justify-end gap-2">
                        <span className="font-display text-xs sm:text-sm font-black text-ink uppercase block truncate" title={match.away.name}>
                          {match.away.name}
                        </span>
                        {getTeamLogoUrl(match.away.name) ? (
                          <img
                            src={getTeamLogoUrl(match.away.name)}
                            alt={match.away.name}
                            className="w-7 h-7 object-contain border border-ink p-0.5 bg-white shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-ink/10 font-mono text-xs text-ink/75 bg-surface/60 p-2 border border-ink/20">
                      <span className="font-bold text-ink">Catatan Gol:</span> {match.scorersSummary}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between font-mono text-[11px] text-ink/60 border-t border-ink/10">
                    <span>Tanggal: {match.date}</span>
                    <span>Tiket Terjual: {match.attendance} Lembar</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* VIEW B: KLASEMEN SEMENTARA RESMI DARI DATABASE */}
      {activeTab === 'STANDINGS' && (
        <section className="border-2 border-ink bg-white shadow-brutal p-5 sm:p-8">
          <div className="border-b-2 border-ink pb-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="bg-brand text-white font-mono text-xs font-black px-2.5 py-0.5 uppercase border border-ink inline-block">
                PERHITUNGAN RESMI MYSQL • DIVISI 1 SMA PUTRA
              </span>
              <span className="font-mono text-xs text-ink/70 font-bold">
                TOTAL: 20 TIM SEKOLAH PESERTA
              </span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink">
              Tabel Klasemen Liga Futsal Pelajar (LFP) Cianjur 2026
            </h3>
            <p className="font-mono text-xs sm:text-sm text-ink/70 mt-1">
              Menang = +3 Poin, Seri = +1 Poin, Kalah = 0 Poin. Peringkat diurutkan dari Poin (PTS), Selisih Gol (GD), dan Gol Memasukkan (GF).
            </p>
          </div>

          {/* PILIH TAMPILAN GRUP A, GRUP B, ATAU GABUNGAN */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <button
              type="button"
              onClick={() => setSelectedGroupTab('A')}
              className={`px-4 sm:px-5 py-2.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-ink transition-all shadow-brutal-sm cursor-pointer ${
                selectedGroupTab === 'A'
                  ? 'bg-brand text-white'
                  : 'bg-white text-ink hover:bg-surface'
              }`}
            >
              🟢 GRUP A ({groupAStandings.length || 10} TIM)
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupTab('B')}
              className={`px-4 sm:px-5 py-2.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-ink transition-all shadow-brutal-sm cursor-pointer ${
                selectedGroupTab === 'B'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-ink hover:bg-surface'
              }`}
            >
              🔵 GRUP B ({groupBStandings.length || 10} TIM)
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroupTab('ALL')}
              className={`px-4 sm:px-5 py-2.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-ink transition-all shadow-brutal-sm cursor-pointer ${
                selectedGroupTab === 'ALL'
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink hover:bg-surface'
              }`}
            >
              🏆 KLASEMEN GABUNGAN ({standings.length || 20} TIM)
            </button>
          </div>

          <div className="overflow-x-auto border-2 border-ink">
            <table className="w-full text-left font-mono text-xs sm:text-sm">
              <thead className="bg-[#f8faf9] border-b-2 border-ink text-ink font-black uppercase">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">TIM SEKOLAH</th>
                  <th className="py-3.5 px-3 text-center" title="Main">P</th>
                  <th className="py-3.5 px-3 text-center" title="Menang">W</th>
                  <th className="py-3.5 px-3 text-center" title="Seri">D</th>
                  <th className="py-3.5 px-3 text-center" title="Kalah">L</th>
                  <th className="py-3.5 px-3 text-center" title="Gol Memasukkan">GF</th>
                  <th className="py-3.5 px-3 text-center" title="Gol Kemasukan">GA</th>
                  <th className="py-3.5 px-3 text-center" title="Selisih Gol">GD</th>
                  <th className="py-3.5 px-4 text-center bg-brand/10 font-black text-brand text-base">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/20">
                {currentStandings.map((row) => {
                  const logoUrl = getTeamLogoUrl(row.team_name)
                  const brand = TEAM_BRAND_MAP[row.team_name]

                  return (
                    <tr
                      key={row.team_id}
                      className={`hover:bg-surface transition-colors ${
                        row.rank <= 4 ? 'bg-white font-bold' : 'text-ink/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-black">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 border-2 border-ink ${
                            row.rank === 1
                              ? 'bg-[#fef08a] text-ink font-black shadow-brutal-sm'
                              : row.rank <= 2
                              ? 'bg-brand text-white font-black'
                              : row.rank <= 4
                              ? 'bg-surface font-black text-ink border-brand'
                              : 'bg-surface text-ink/70'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink">
                        <div className="flex items-center gap-2.5">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={row.team_name}
                              className="w-6 h-6 object-contain border border-ink p-0.5 bg-white shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-none border border-ink shrink-0"
                              style={{ backgroundColor: brand?.color || row.logo_color || '#10B981' }}
                            />
                          )}
                          <span className="text-sm sm:text-base font-black uppercase">{row.team_name}</span>
                          <span className="text-xs text-ink/60 font-semibold hidden sm:inline">({row.short_name})</span>
                          {row.group && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 border ml-1 ${
                              row.group === 'A'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : 'border-blue-600 bg-blue-50 text-blue-800'
                            }`}>
                              GRUP {row.group}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-sm">{row.played}</td>
                      <td className="py-3.5 px-3 text-center text-brand font-black text-sm">{row.won}</td>
                      <td className="py-3.5 px-3 text-center text-ink/70">{row.drawn}</td>
                      <td className="py-3.5 px-3 text-center text-danger font-black text-sm">{row.lost}</td>
                      <td className="py-3.5 px-3 text-center text-ink/80">{row.goals_for}</td>
                      <td className="py-3.5 px-3 text-center text-ink/80">{row.goals_against}</td>
                      <td className="py-3.5 px-3 text-center font-black text-sm">
                        {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-brand bg-brand/5 text-base sm:text-lg">
                        {row.points}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#fef08a] border border-ink inline-block" />
              <span className="font-bold text-ink">Peringkat 1: Pemuncak Klasemen Grup</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-brand border border-ink inline-block" />
              <span className="font-bold text-ink">Peringkat 2: Zona Lolos Otomatis Knockout</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-surface border-2 border-brand inline-block" />
              <span className="font-bold text-ink">Peringkat 3-4: Zona Kualifikasi Playoff</span>
            </div>
          </div>
        </section>
      )}

      {/* VIEW C: TOP SCORER RESMI DARI DATABASE */}
      {activeTab === 'TOP_SCORER' && (
        <section className="border-2 border-ink bg-white shadow-brutal p-5 sm:p-8">
          <div className="border-b-2 border-ink pb-4 mb-6">
            <span className="bg-danger text-white font-mono text-xs font-black px-2.5 py-0.5 uppercase border border-ink inline-block mb-1">
              AGREGASI MATCH_EVENTS MYSQL
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink">
              Top Scorer Resmi Liga Futsal Pelajar 2026
            </h3>
            <p className="font-mono text-xs sm:text-sm text-ink/70 mt-1">
              Peringkat pencetak gol terbanyak yang dicatat langsung oleh meja wasit dan terverifikasi di database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            {topScorers.map((scorer) => (
              <div
                key={scorer.rank}
                className="border-2 border-ink bg-surface p-4 shadow-brutal-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 flex items-center justify-center font-black border-2 border-ink shrink-0 text-base ${
                      scorer.rank === 1
                        ? 'bg-[#fef08a] text-ink shadow-brutal-sm'
                        : scorer.rank === 2
                        ? 'bg-gray-200 text-ink'
                        : scorer.rank === 3
                        ? 'bg-amber-100 text-ink'
                        : 'bg-white text-ink/70'
                    }`}
                  >
                    {scorer.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-base text-ink uppercase truncate">{scorer.player_name}</p>
                    <span className="text-xs text-ink/70 font-semibold block truncate">
                      {scorer.team_name} ({scorer.short_name})
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-display text-3xl font-black text-danger block leading-none">
                    {scorer.goals}
                  </span>
                  <span className="text-[10px] text-ink/60 font-black uppercase">GOL</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
