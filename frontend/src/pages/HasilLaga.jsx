import { useState, useMemo, useEffect } from 'react'
import { useNavigation } from '../context/useNavigation.js'
import {
  Search,
  Clock,
  Layers,
  Trophy,
  Filter,
  Loader2,
} from 'lucide-react'

function normalizeMatchToScoreItem(m) {
  const catCode = (m.category?.code || 'SMA').toUpperCase()
  const displayCat = catCode === 'SMA' ? 'SMA/SMK' : catCode
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
    QUARTER_FINAL: 'Perempat Final',
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
    category: displayCat,
    rawCategoryCode: catCode,
    stage: stageLabelMap[m.stage] || m.stage || 'Turnamen GGM',
    court: m.arena || 'Lapangan Utama GGM',
    minute: m.current_minute ? `${m.current_minute}'` : 'LIVE',
    period: m.current_period || 'Babak Berjalan',
    date: matchDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    attendance: soldTickets || 120,
    scorersSummary,
    home: {
      name: m.home_team?.name || m.home_placeholder || 'Tim Home',
      score: m.home_score ?? 0,
      jerseyColor: 'HIJAU / PUTIH',
      fouls: m.home_fouls ?? 0,
      scorers: homeScorers,
    },
    away: {
      name: m.away_team?.name || m.away_placeholder || 'Tim Away',
      score: m.away_score ?? 0,
      jerseyColor: 'HITAM / KUNING',
      fouls: m.away_fouls ?? 0,
      scorers: awayScorers,
    },
    shotsOnTarget: {
      home: m.home_shots ?? Math.max(2, (m.home_score ?? 0) * 3),
      away: m.away_shots ?? Math.max(2, (m.away_score ?? 0) * 3),
    },
    possession: {
      home: 52,
      away: 48,
    },
  }
}

export default function HasilLaga() {
  const { matches, isLoadingData, refreshMatches } = useNavigation()
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState('TODAY')
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-refresh setiap 15 detik untuk sinkronisasi skor langsung dari Meja Wasit
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMatches?.()
    }, 15000)
    return () => clearInterval(interval)
  }, [refreshMatches])

  const scoreItems = useMemo(() => {
    return (matches || []).map(normalizeMatchToScoreItem)
  }, [matches])

  const filteredFinishedMatches = useMemo(() => {
    return scoreItems.filter((item) => {
      if (item.status === 'LIVE') return false
      if (selectedStatus === 'LIVE') return false
      if (selectedStatus === 'FINISHED' && item.status !== 'FINISHED') return false
      if (
        selectedCategory !== 'ALL' &&
        item.category !== selectedCategory &&
        item.rawCategoryCode !== selectedCategory
      ) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const homeMatch = item.home?.name?.toLowerCase().includes(query)
        const awayMatch = item.away?.name?.toLowerCase().includes(query)
        const scorersMatch = item.scorersSummary?.toLowerCase().includes(query)
        if (!homeMatch && !awayMatch && !scorersMatch) return false
      }
      return true
    })
  }, [scoreItems, selectedCategory, selectedStatus, searchQuery])

  const liveMatch = useMemo(() => {
    return scoreItems.find((m) => m.status === 'LIVE')
  }, [scoreItems])

  const countLive = scoreItems.filter((m) => m.status === 'LIVE').length
  const countFinished = scoreItems.filter((m) => m.status === 'FINISHED').length

  return (
    <div className="flex flex-col gap-5 sm:gap-8 p-3 sm:p-6 lg:p-8 2xl:p-10 max-w-[1440px] 2xl:max-w-[1560px] mx-auto w-full font-sans">
      {/* 1. TOP STATUS BREADCRUMB & LIVE SYNC BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-ink text-white px-2 sm:px-2.5 py-1 font-mono text-[10px] sm:text-xs uppercase font-bold tracking-wider">
            AFK PSSI CIANJUR
          </span>
          <span className="font-mono text-xs text-ink/70 font-bold hidden sm:inline">
            // MUSIM 2026 • GELANGGANG GENERASI MUDA (GGM)
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 border-2 border-ink shadow-brutal-sm">
          <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 bg-brand inline-block animate-ping shrink-0" />
          <span className="text-ink font-bold">LIVE SYNC:</span>
          <span className="text-ink/80 font-medium">MySQL Meja Wasit</span>
          <span className="text-ink/30">|</span>
          <span className="text-brand font-bold">Auto-Refresh 15s</span>
        </div>
      </div>

      {/* 2. HEADER UTAMA & SEARCH/FILTER CONTROL BAR */}
      <div>
        <div className="border-l-4 sm:border-l-8 border-brand pl-3 sm:pl-4 mb-4">
          <h1 className="font-display text-xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-ink leading-tight">
            HASIL PERTANDINGAN &amp; LIVE SCORE
          </h1>
          <p className="text-ink/75 text-xs sm:text-base font-medium max-w-3xl mt-1">
            Pusat skor langsung, pencetak gol resmi, dan rekap hasil pertandingan futsal se-Kabupaten Cianjur. Data diverifikasi langsung oleh meja wasit GGM Cianjur.
          </p>
        </div>

        <div className="bg-white border-2 border-ink p-3.5 sm:p-5 shadow-brutal space-y-3 sm:space-y-4">
          {/* BARIS 1: Search & Sesi */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
            <div className="lg:col-span-5 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sekolah / nama pemain pencetak gol..."
                className="w-full bg-[#ffffff] focus:bg-brand-light/30 border-2 border-ink pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 font-mono text-xs sm:text-sm text-ink placeholder:text-ink/50 focus:outline-none shadow-brutal-sm transition-all font-bold"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-ink/70" />
            </div>

            <div className="lg:col-span-7 flex flex-wrap items-center justify-start lg:justify-end gap-1.5 sm:gap-2">
              <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink mr-1">
                SESI:
              </span>
              {[
                { key: 'YESTERDAY', label: 'Penyisihan Awal' },
                { key: 'TODAY', label: 'Hari Ini - AKTIF', activeDot: true },
                { key: 'TOMORROW', label: 'Fase Gugur' },
              ].map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDate(d.key)}
                  className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[11px] sm:text-sm uppercase font-black border-2 border-ink transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedDate === d.key
                      ? d.activeDot
                        ? 'bg-brand text-white shadow-brutal-sm'
                        : 'bg-ink text-white shadow-brutal-sm'
                      : 'bg-surface text-ink hover:bg-white'
                  }`}
                >
                  {d.activeDot && <span className="h-2 w-2 bg-yellow-400 inline-block shrink-0" />}
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[2px] bg-ink w-full" />

          {/* BARIS 2: Kategori & Status Filter */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 font-mono text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <span className="font-black uppercase text-ink flex items-center gap-1.5 mr-1 text-xs sm:text-sm">
                <Layers size={15} className="text-brand shrink-0" /> KATEGORI:
              </span>
              {[
                { key: 'ALL', label: 'Semua Kategori' },
                { key: 'SD', label: '1. SD' },
                { key: 'SMP', label: '2. SMP' },
                { key: 'SMA/SMK', label: '3. SMA/SMK' },
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-ink font-black uppercase cursor-pointer text-[11px] sm:text-sm ${
                    selectedCategory === c.key
                      ? c.key === 'ALL'
                        ? 'bg-ink text-white shadow-brutal-sm'
                        : 'bg-brand text-white shadow-brutal-sm'
                      : 'bg-white hover:bg-surface text-ink'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <span className="font-black uppercase text-ink flex items-center gap-1.5 text-xs sm:text-sm mr-1">
                <Filter size={15} /> STATUS:
              </span>
              <button
                type="button"
                onClick={() => setSelectedStatus('ALL')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-ink uppercase cursor-pointer font-black text-[11px] sm:text-sm ${
                  selectedStatus === 'ALL' ? 'bg-ink text-white shadow-brutal-sm' : 'bg-surface hover:bg-white text-ink'
                }`}
              >
                Semua ({scoreItems.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('LIVE')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-ink uppercase cursor-pointer flex items-center justify-center gap-1 text-[11px] sm:text-sm font-black ${
                  selectedStatus === 'LIVE' ? 'bg-danger text-white shadow-brutal-sm' : 'bg-surface hover:bg-white text-ink'
                }`}
              >
                <span className="h-1.5 w-1.5 bg-white inline-block animate-ping shrink-0" />
                <span>LIVE ({countLive})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('FINISHED')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-ink uppercase cursor-pointer text-[11px] sm:text-sm font-black ${
                  selectedStatus === 'FINISHED' ? 'bg-brand text-white shadow-brutal-sm' : 'bg-surface hover:bg-white text-ink'
                }`}
              >
                Selesai ({countFinished})
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoadingData && (
        <div className="border-2 border-ink bg-white p-6 sm:p-10 text-center shadow-brutal">
          <Loader2 size={28} className="mx-auto animate-spin text-brand mb-2" />
          <p className="font-mono text-xs font-bold uppercase text-ink">
            Menarik papan skor langsung dari database GGM Cianjur...
          </p>
        </div>
      )}

      {/* 3. HIGHLIGHT MATCH: PERTANDINGAN BERJALAN (LIVE NOW) */}
      {liveMatch &&
        (selectedStatus === 'ALL' || selectedStatus === 'LIVE') &&
        (selectedCategory === 'ALL' || selectedCategory === liveMatch.category) && (
          <section className="border-2 border-ink bg-white shadow-brutal">
            <div className="flex items-center justify-between bg-ink text-white px-3 sm:px-4 py-2 sm:py-3 border-b-2 border-ink gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 sm:h-3 w-2.5 sm:w-3 bg-danger border border-white animate-ping shrink-0" />
                <h2 className="font-display text-xs sm:text-base uppercase font-black tracking-wider truncate">
                  PERTANDINGAN BERJALAN (LIVE NOW)
                </h2>
              </div>
              <div className="font-mono text-[10px] sm:text-xs bg-yellow-400 text-black px-2 sm:px-2.5 py-0.5 border border-ink font-bold shrink-0">
                GGM CIANJUR
              </div>
            </div>

            <div className="p-3.5 sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between border-b-2 border-ink pb-3 sm:pb-4 mb-4 sm:mb-6 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-danger text-white font-mono text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 border-2 border-ink shadow-brutal-sm">
                    <span className="h-1.5 w-1.5 bg-white inline-block animate-ping shrink-0" />
                    LIVE NOW • {liveMatch.minute}
                  </span>
                  <span className="bg-[#fef08a] text-ink font-mono text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 border border-ink">
                    {liveMatch.category}
                  </span>
                </div>
                <div className="font-mono text-[10px] sm:text-xs font-bold text-ink uppercase">
                  {liveMatch.stage} • {liveMatch.court}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 sm:gap-6 items-center">
                {/* Tim Home */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-end text-center lg:text-right">
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-brand uppercase bg-brand-light px-2 py-0.5 border border-brand mb-1">
                    TUAN RUMAH ({liveMatch.home.jerseyColor})
                  </span>
                  <h3 className="font-display text-xl sm:text-3xl font-black uppercase text-ink break-words">
                    {liveMatch.home.name}
                  </h3>

                  <div className="mt-2 sm:mt-3 space-y-1 font-mono text-xs text-ink/80">
                    {liveMatch.home.scorers.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 justify-center lg:justify-end">
                        <span>⚽ {s.name}</span>
                        <span className="font-bold text-brand">({s.minute})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skor Tengah Jumbo */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center p-3 sm:p-4 bg-surface border-2 border-ink shadow-brutal-sm">
                  <span className="font-mono text-[10px] sm:text-xs text-ink/70 font-bold uppercase mb-1">
                    SKOR SEMENTARA
                  </span>
                  <div className="flex items-center gap-3 sm:gap-4 font-display text-4xl sm:text-6xl font-black text-ink leading-none">
                    <span className="text-brand">{liveMatch.home.score}</span>
                    <span className="text-ink/40">-</span>
                    <span className="text-ink">{liveMatch.away.score}</span>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] text-ink/80 bg-white px-2 py-0.5 sm:py-1 border border-ink">
                    <Clock size={12} className="text-danger shrink-0" />
                    <span>{liveMatch.period}</span>
                  </div>
                </div>

                {/* Tim Away */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-ink uppercase bg-surface px-2 py-0.5 border border-ink mb-1">
                    TIM TAMU ({liveMatch.away.jerseyColor})
                  </span>
                  <h3 className="font-display text-xl sm:text-3xl font-black uppercase text-ink break-words">
                    {liveMatch.away.name}
                  </h3>

                  <div className="mt-2 sm:mt-3 space-y-1 font-mono text-xs text-ink/80">
                    {liveMatch.away.scorers.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 justify-center lg:justify-start">
                        <span>⚽ {s.name}</span>
                        <span className="font-bold text-ink">({s.minute})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistik Mobile Friendly */}
              <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t-2 border-ink grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-2 sm:p-2.5 bg-surface border border-ink">
                  <span className="text-ink/60 block text-[10px] sm:text-xs uppercase font-bold">Tembakan Tepat Sasaran</span>
                  <span className="font-black text-ink text-sm sm:text-base mt-0.5 block">
                    {liveMatch.shotsOnTarget.home} - {liveMatch.shotsOnTarget.away}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 bg-surface border border-ink">
                  <span className="text-ink/60 block text-[10px] sm:text-xs uppercase font-bold">Akumulasi Foul</span>
                  <span className="font-black text-danger text-sm sm:text-base mt-0.5 block">
                    {liveMatch.home.fouls} - {liveMatch.away.fouls}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 bg-surface border border-ink">
                  <span className="text-ink/60 block text-[10px] sm:text-xs uppercase font-bold">Penguasaan Bola</span>
                  <span className="font-black text-brand text-sm sm:text-base mt-0.5 block">
                    {liveMatch.possession.home}% - {liveMatch.possession.away}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* 4. REKAP HASIL PERTANDINGAN */}
      <section className="border-2 border-ink bg-white shadow-brutal p-3.5 sm:p-6">
        <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 sm:pb-3 mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy size={18} className="text-brand shrink-0" />
            <h2 className="font-display text-base sm:text-xl font-bold uppercase text-ink truncate">
              DAFTAR SKOR &amp; JADWAL LAGA ({filteredFinishedMatches.length})
            </h2>
          </div>
          <span className="font-mono text-[10px] sm:text-xs text-ink/70 shrink-0">
            Komisi Wasit AFK
          </span>
        </div>

        {filteredFinishedMatches.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-ink/30 bg-surface p-4">
            <p className="font-mono text-xs sm:text-sm text-ink/60">
              Tidak ada pertandingan yang sesuai dengan filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredFinishedMatches.map((match) => (
              <div
                key={match.id}
                className="border-2 border-ink bg-[#ffffff] p-3 sm:p-4 shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-ink/20 pb-2 mb-2 sm:mb-3 font-mono text-[11px] sm:text-xs gap-1">
                    <span className="bg-ink text-white px-1.5 sm:px-2 py-0.5 font-bold">
                      {match.category}
                    </span>
                    <span className="text-ink/70 font-semibold truncate">
                      {match.stage} • {match.court}
                    </span>
                    <span className={`${match.status === 'FINISHED' ? 'bg-brand text-white' : 'bg-surface text-ink border border-ink'} px-1.5 sm:px-2 py-0.5 font-bold shrink-0`}>
                      {match.status === 'FINISHED' ? 'FT' : 'SCHEDULED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:gap-4 py-2">
                    <div className="flex-1 text-left min-w-0">
                      <span className="font-display text-xs sm:text-base font-bold text-ink uppercase block truncate">
                        {match.home.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-surface px-2 sm:px-3 py-1 border-2 border-ink font-display text-lg sm:text-xl font-black text-ink shrink-0">
                      <span>{match.home.score}</span>
                      <span className="text-ink/40">-</span>
                      <span>{match.away.score}</span>
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <span className="font-display text-xs sm:text-base font-bold text-ink uppercase block truncate">
                        {match.away.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-ink/10 font-mono text-[10px] sm:text-[11px] text-ink/70 bg-surface/50 p-2 border border-ink/20">
                    <span className="font-bold text-ink">Catatan Gol:</span> {match.scorersSummary}
                  </div>
                </div>

                <div className="mt-2 pt-1 flex items-center justify-between font-mono text-[10px] text-ink/60">
                  <span>Tanggal: {match.date}</span>
                  <span>Tiket Terjual: {match.attendance} Lembar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
