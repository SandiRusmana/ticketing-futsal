import { useState, useEffect, useMemo } from 'react'
import DashboardSidebar from '../components/DashboardSidebar.jsx'
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Layers,
  Terminal,
  Send,
  Menu,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

export default function OperatorDashboard() {
  const { currentUser, matches, refreshMatches, navigateTo, openLoginModal } = useNavigation()

  const [activeTab, setActiveTab] = useState('OVERVIEW')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [activeCourt, setActiveCourt] = useState('COURT_A')

  // Pilih match aktif untuk dikendalikan di Meja Wasit
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  const activeMatch = useMemo(() => {
    if (!matches || matches.length === 0) return null
    if (selectedMatchId) {
      const found = matches.find((m) => Number(m.id) === Number(selectedMatchId))
      if (found) return found
    }
    return matches.find((m) => m.status === 'LIVE') || matches[0]
  }, [matches, selectedMatchId])

  // State lokal skor & foul yang sinkron dengan activeMatch dari MySQL
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [foulsA, setFoulsA] = useState(0)
  const [foulsB, setFoulsB] = useState(0)
  const [isSyncingScore, setIsSyncingScore] = useState(false)

  useEffect(() => {
    if (activeMatch) {
      setScoreA(Number(activeMatch.home_score ?? 0))
      setScoreB(Number(activeMatch.away_score ?? 0))
      setFoulsA(Number(activeMatch.home_fouls ?? 0))
      setFoulsB(Number(activeMatch.away_fouls ?? 0))
    }
  }, [activeMatch])

  // State Timer Digital Pertandingan
  const [timerSeconds, setTimerSeconds] = useState(20 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // State Form Jadwal Baru
  const [newTeamA, setNewTeamA] = useState('')
  const [newTeamB, setNewTeamB] = useState('')
  const [newCategory, setNewCategory] = useState('SMA') // 'SD' | 'SMP' | 'SMA'
  const [newStage, setNewStage] = useState('GROUP')
  const [newCourt, setNewCourt] = useState('Lapangan Utama GGM (Court A Vinyl)')
  const [newDate, setNewDate] = useState('2026-11-16')
  const [newTime, setNewTime] = useState('15:30')
  const [newQuota, setNewQuota] = useState(350)
  const [newPrice, setNewPrice] = useState(15000)
  const [isCreatingMatch, setIsCreatingMatch] = useState(false)
  const [formFeedback, setFormFeedback] = useState(null)

  // State Bracket Pairing
  const [bracketSuccessMessage, setBracketSuccessMessage] = useState(null)

  // State Scanner Embedded
  const [scannerInput, setScannerInput] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanMessage, setScanMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  // State Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: 'LIVE', message: 'Terminal Meja Wasit GGM terhubung ke database MySQL Laravel', type: 'info' },
  ])

  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const addAuditLog = (msg, type = 'info') => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`
    setAuditLogs((prev) => [{ id: Date.now(), time: timeStr, message: msg, type }, ...prev.slice(0, 11)])
  }

  // Simpan perubahan skor / foul / event ke MySQL
  const syncMatchToServer = async (payload, logText) => {
    if (!activeMatch) return
    setIsSyncingScore(true)
    try {
      await futsaltixApi.operatorUpdateScore(activeMatch.id, payload)
      await refreshMatches()
      if (logText) addAuditLog(logText, 'goal')
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal sinkronisasi skor ke server.'
      addAuditLog(`ERROR: ${msg}`, 'error')
    } finally {
      setIsSyncingScore(false)
    }
  }

  const handleScoreChange = async (team, delta) => {
    if (!activeMatch) return
    const currentMin = Math.max(1, Math.floor(timerSeconds / 60))
    const homeName = activeMatch.home_team?.name || activeMatch.home_placeholder || 'Tim Home'
    const awayName = activeMatch.away_team?.name || activeMatch.away_placeholder || 'Tim Away'

    if (team === 'A') {
      const updated = Math.max(0, scoreA + delta)
      setScoreA(updated)
      const payload = {
        status: activeMatch.status === 'SCHEDULED' ? 'LIVE' : activeMatch.status,
        home_score: updated,
        away_score: scoreB,
        home_fouls: foulsA,
        away_fouls: foulsB,
        current_minute: currentMin,
      }
      if (delta > 0 && activeMatch.home_team?.id) {
        payload.event = {
          team_id: activeMatch.home_team.id,
          event_type: 'GOAL',
          player_name: `Pemain ${homeName}`,
          minute: currentMin,
        }
      }
      await syncMatchToServer(
        payload,
        `${delta > 0 ? '+ Gol untuk' : 'Koreksi skor'} ${homeName} (Skor: ${updated} - ${scoreB})`
      )
    } else {
      const updated = Math.max(0, scoreB + delta)
      setScoreB(updated)
      const payload = {
        status: activeMatch.status === 'SCHEDULED' ? 'LIVE' : activeMatch.status,
        home_score: scoreA,
        away_score: updated,
        home_fouls: foulsA,
        away_fouls: foulsB,
        current_minute: currentMin,
      }
      if (delta > 0 && activeMatch.away_team?.id) {
        payload.event = {
          team_id: activeMatch.away_team.id,
          event_type: 'GOAL',
          player_name: `Pemain ${awayName}`,
          minute: currentMin,
        }
      }
      await syncMatchToServer(
        payload,
        `${delta > 0 ? '+ Gol untuk' : 'Koreksi skor'} ${awayName} (Skor: ${scoreA} - ${updated})`
      )
    }
  }

  const handleFoulChange = async (team) => {
    if (!activeMatch) return
    const homeName = activeMatch.home_team?.name || activeMatch.home_placeholder || 'Tim Home'
    const awayName = activeMatch.away_team?.name || activeMatch.away_placeholder || 'Tim Away'

    if (team === 'A') {
      const updated = (foulsA % 5) + 1
      setFoulsA(updated)
      await syncMatchToServer(
        { home_fouls: updated },
        `Akumulasi Foul ${homeName}: ${updated}/5`
      )
    } else {
      const updated = (foulsB % 5) + 1
      setFoulsB(updated)
      await syncMatchToServer(
        { away_fouls: updated },
        `Akumulasi Foul ${awayName}: ${updated}/5`
      )
    }
  }

  const handleFinishMatch = async () => {
    if (!activeMatch) return
    setIsTimerRunning(false)
    const homeName = activeMatch.home_team?.name || activeMatch.home_placeholder || 'Tim Home'
    const awayName = activeMatch.away_team?.name || activeMatch.away_placeholder || 'Tim Away'

    await syncMatchToServer(
      {
        status: 'FINISHED',
        home_score: scoreA,
        away_score: scoreB,
        home_fouls: foulsA,
        away_fouls: foulsB,
      },
      `PERTANDINGAN SELESAI (FT): ${homeName} (${scoreA}) - (${scoreB}) ${awayName}`
    )
  }

  // Submit Jadwal Baru ke MySQL
  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    if (!newTeamA.trim() || !newTeamB.trim()) return

    setIsCreatingMatch(true)
    setFormFeedback(null)

    try {
      await futsaltixApi.operatorCreateMatch({
        category_code: newCategory,
        stage: newStage,
        home_team_name: newTeamA.trim(),
        away_team_name: newTeamB.trim(),
        arena: newCourt,
        match_time: `${newDate} ${newTime}:00`,
        total_quota: Number(newQuota),
        ticket_price: Number(newPrice),
      })

      await refreshMatches()
      setFormFeedback({
        type: 'success',
        text: `Jadwal [${newCategory}] ${newTeamA} vs ${newTeamB} berhasil disimpan ke MySQL dengan kuota ${newQuota} tiket!`,
      })
      addAuditLog(`Jadwal baru diterbitkan ke MySQL: [${newCategory}] ${newTeamA} vs ${newTeamB}`, 'quota')
      setNewTeamA('')
      setNewTeamB('')
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menerbitkan jadwal pertandingan.'
      setFormFeedback({ type: 'error', text: msg })
    } finally {
      setIsCreatingMatch(false)
    }
  }

  const handleBracketUpdate = async () => {
    await refreshMatches()
    setBracketSuccessMessage('Bagan Babak Gugur resmi disinkronkan dari hasil skor MySQL ke seluruh penonton!')
    addAuditLog('Bagan Babak Gugur diperbarui & disinkronkan oleh Meja Wasit', 'info')
    setTimeout(() => setBracketSuccessMessage(null), 4000)
  }

  // Scan Tiket Asli via API
  const handleRealScan = async (e) => {
    e?.preventDefault()
    const code = scannerInput.trim()
    if (!code) return

    setIsScanning(true)
    setScanResult(null)
    try {
      const res = await futsaltixApi.operatorScanTicket(code, 'Gate A - Turnstile Utama')
      setScanResult('VALID')
      setScanMessage(res.data?.message || `TIKET ${code} VALID — TURNSTILE DIBUKA!`)
      addAuditLog(`Scan tiket ${code} -> VALID (Turnstile Dibuka)`, 'scan')
      setScannerInput('')
    } catch (error) {
      setScanResult('INVALID')
      const msg = error.response?.data?.message || 'TIKET TIDAK VALID / SUDAH DIGUNAKAN!'
      setScanMessage(msg)
      addAuditLog(`Scan tiket ${code} -> DITOLAK (${msg})`, 'scan')
    } finally {
      setIsScanning(false)
    }
  }

  // Statistik ringkasan dari data MySQL
  const liveMatchesCount = (matches || []).filter((m) => m.status === 'LIVE').length
  const totalTicketsSold = useMemo(() => {
    return (matches || []).reduce((acc, m) => {
      const q = m.ticket_quota || {}
      return acc + Math.max(0, Number(q.total_quota || 0) - Number(q.available_quota || 0))
    }, 0)
  }, [matches])

  const activeHomeName = activeMatch?.home_team?.name || activeMatch?.home_placeholder || 'Belum Ada Laga'
  const activeAwayName = activeMatch?.away_team?.name || activeMatch?.away_placeholder || 'Belum Ada Laga'

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f8faf9] text-ink font-sans">
      <DashboardSidebar
        role="operator"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOperatorCount={0}
        onExit={() => navigateTo(PAGE_NAMES.LANDING)}
        onSwitchRole={openLoginModal}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar flex flex-col justify-between bg-[#f8faf9] md:ml-[320px]">
        <div className="p-3 sm:p-6 lg:p-8 2xl:p-10 max-w-[1440px] 2xl:max-w-[1560px] mx-auto w-full space-y-4 sm:space-y-6">
          {/* A. TOP BAR */}
          <header className="border-b-2 border-ink pb-4 sm:pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-2 border-2 border-ink bg-white shadow-brutal-sm text-ink cursor-pointer"
                    aria-label="Buka Menu Sidebar"
                  >
                    <Menu size={20} />
                  </button>

                  <span className="font-mono text-xs sm:text-base font-black uppercase text-brand tracking-wider">
                    {activeTab === 'OVERVIEW' && 'OPERATOR // DASHBOARD UTAMA'}
                    {activeTab === 'REFEREE' && 'MEJA WASIT // KONTROL SKOR LIVE'}
                    {activeTab === 'SCHEDULE' && 'JADWAL & KUOTA // ALOKASI TIKET'}
                    {activeTab === 'BRACKET' && 'BAGAN // BRACKET GENERATOR'}
                    {activeTab === 'SCANNER' && 'SCANNER // GATE TURNSTILE GGM'}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight break-words">
                  {activeTab === 'OVERVIEW' && 'OPERATOR OVERVIEW'}
                  {activeTab === 'REFEREE' && 'MEJA WASIT & UPDATE SKOR LIVE'}
                  {activeTab === 'SCHEDULE' && 'INPUT JADWAL & ALOKASI KUOTA'}
                  {activeTab === 'BRACKET' && 'ATUR BAGAN & PAIRING BRACKET'}
                  {activeTab === 'SCANNER' && 'PEMINDAI TURNSTILE GATE LAPANGAN'}
                </h1>
                <p className="font-sans text-xs sm:text-base text-ink/80 font-bold mt-1">
                  Petugas Aktif: {currentUser?.name || 'Operator Meja GGM'} • Terhubung ke MySQL Server
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs sm:text-base font-black">
                <div className="flex items-center gap-2 border-2 border-ink bg-[#fef08a] px-3 sm:px-5 py-2 sm:py-3 shadow-brutal-sm">
                  <span className="h-2.5 sm:h-3 w-2.5 sm:w-3 rounded-full bg-danger animate-ping" />
                  <span>MEJA 01: ON-AIR</span>
                </div>
                <div className="border-2 border-ink bg-brand text-white px-3 sm:px-5 py-2 sm:py-3 shadow-brutal-sm flex items-center gap-2">
                  <span className="h-2.5 sm:h-3 w-2.5 sm:w-3 rounded-full bg-white animate-pulse" />
                  <span>{isSyncingScore ? 'MENYIMPAN...' : 'MYSQL: ONLINE'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* 1. TAB: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                      Total Laga Terdaftar
                    </span>
                    <div className="mt-2 font-display text-4xl sm:text-5xl font-black text-ink tracking-tight flex items-center gap-2">
                      <span>{(matches || []).length} Laga</span>
                      {liveMatchesCount > 0 && <span className="h-4 w-4 rounded-full bg-danger animate-ping ml-1" />}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between font-mono text-sm font-black text-ink/80">
                    <span>STATUS LIVE</span>
                    <span className="bg-danger text-white px-2.5 py-0.5 text-xs sm:text-sm font-black">{liveMatchesCount} LIVE NOW</span>
                  </div>
                </div>

                <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                      Tiket Terjual
                    </span>
                    <div className="mt-2 font-display text-4xl sm:text-5xl font-black text-ink tracking-tight">
                      {totalTicketsSold} <span className="text-xl sm:text-2xl font-mono font-black text-ink/60">Tiket</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between font-mono text-sm font-black text-ink/80">
                    <span>DATABASE MYSQL</span>
                    <span className="bg-[#dcfce7] text-brand px-2.5 py-0.5 border border-brand text-xs sm:text-sm font-black">
                      TERVERIFIKASI
                    </span>
                  </div>
                </div>

                <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                      Status Meja Wasit
                    </span>
                    <div className="mt-2 font-display text-4xl sm:text-5xl font-black text-brand tracking-tight flex items-center gap-2">
                      <span>ON-AIR</span>
                      <span className="h-4 w-4 rounded-full bg-brand animate-ping" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between font-mono text-sm font-black text-ink/80">
                    <span>COURT A (VINYL)</span>
                    <span className="bg-brand text-white px-2.5 py-0.5 text-xs sm:text-sm font-black">AKTIF</span>
                  </div>
                </div>

                <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                      Operator On-Duty
                    </span>
                    <div className="mt-2 font-display text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                      {currentUser?.name || 'Operator GGM'}
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('REFEREE')}
                      className="w-full py-3 px-4 bg-brand text-white font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <span>Buka Kontrol Skor</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION PANEL */}
              <div className="border-2 border-ink bg-white p-4 sm:p-6 shadow-brutal-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b-2 border-ink mb-4 sm:mb-5">
                  <span className="font-mono text-xs sm:text-base font-black uppercase text-ink flex items-center gap-2">
                    <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 bg-brand inline-block shrink-0" />
                    PANEL AKSES CEPAT OPERATOR MEJA
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-ink/80 font-bold">Pilih modul tugas pertandingan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('REFEREE')}
                    className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>⏱️ Buka Meja Wasit Live</span>
                    <ArrowRight size={18} className="text-brand group-hover:text-white shrink-0 sm:size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('SCHEDULE')}
                    className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>📅 Input Jadwal Laga Baru</span>
                    <ArrowRight size={18} className="text-brand group-hover:text-white shrink-0 sm:size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('BRACKET')}
                    className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>🌳 Atur Bagan Turnamen</span>
                    <ArrowRight size={18} className="text-brand group-hover:text-white shrink-0 sm:size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('SCANNER')}
                    className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>🎟️ Buka Gate Scanner</span>
                    <ArrowRight size={18} className="text-brand group-hover:text-white shrink-0 sm:size-5" />
                  </button>
                </div>
              </div>

              {/* HIGHLIGHT LIVE MATCH CARD */}
              {activeMatch && (
                <div className="border-2 border-ink bg-white shadow-brutal-sm overflow-hidden">
                  <div className="p-5 bg-ink text-white flex items-center justify-between border-b-2 border-ink font-mono text-sm sm:text-base font-black">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 bg-danger inline-block animate-ping" />
                      <span className="uppercase tracking-wider">
                        LAGA TERPILIH — {activeMatch.arena || 'COURT A (VINYL)'}
                      </span>
                    </div>
                    <span className="bg-yellow-400 text-black px-4 py-1.5 font-black uppercase text-xs sm:text-sm">
                      {activeMatch.status} • {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="text-center p-6 bg-surface border-2 border-ink shadow-brutal-sm">
                      <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink/70">TUAN RUMAH</span>
                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase mt-1.5">{activeHomeName}</h3>
                      <div className="font-display text-7xl sm:text-8xl font-black text-brand my-3">{scoreA}</div>
                      <span className="font-mono text-sm font-black text-ink">FOULS: {foulsA}/5</span>
                    </div>

                    <div className="text-center space-y-4">
                      <span className="font-display text-4xl sm:text-5xl font-black text-ink">VS</span>
                      <p className="font-mono text-sm text-ink/80 font-bold">
                        {activeMatch.category?.name || 'Turnamen'} • {activeMatch.stage}
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          disabled={isSyncingScore}
                          onClick={() => handleScoreChange('A', 1)}
                          className="px-5 py-2.5 bg-brand text-white font-mono text-sm font-black border-2 border-ink shadow-brutal-sm cursor-pointer hover:bg-brand-dark transition-all active:translate-x-0.5 active:translate-y-0.5"
                        >
                          + Gol Home
                        </button>
                        <button
                          type="button"
                          disabled={isSyncingScore}
                          onClick={() => handleScoreChange('B', 1)}
                          className="px-5 py-2.5 bg-ink text-white font-mono text-sm font-black border-2 border-ink shadow-brutal-sm cursor-pointer hover:bg-black transition-all active:translate-x-0.5 active:translate-y-0.5"
                        >
                          + Gol Away
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('REFEREE')}
                          className="inline-flex items-center gap-1.5 text-sm font-mono font-black text-brand underline underline-offset-2 cursor-pointer mt-1"
                        >
                          Buka Meja Wasit Lengkap ↗
                        </button>
                      </div>
                    </div>

                    <div className="text-center p-6 bg-surface border-2 border-ink shadow-brutal-sm">
                      <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink/70">TIM TAMU</span>
                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase mt-1.5">{activeAwayName}</h3>
                      <div className="font-display text-7xl sm:text-8xl font-black text-ink my-3">{scoreB}</div>
                      <span className="font-mono text-sm font-black text-ink">FOULS: {foulsB}/5</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DAFTAR JADWAL PERTANDINGAN DI MYSQL */}
              <div className="border-2 border-ink bg-white shadow-brutal-sm">
                <div className="p-5 border-b-2 border-ink flex items-center justify-between">
                  <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
                    DAFTAR PERTANDINGAN DI DATABASE GGM CIANJUR
                  </h3>
                  <span className="font-mono text-sm font-black text-brand border-2 border-brand bg-brand-light px-3 py-1">
                    {(matches || []).length} Laga
                  </span>
                </div>

                <div className="divide-y-2 divide-ink font-mono text-sm sm:text-base">
                  {(matches || []).map((m) => {
                    const hName = m.home_team?.name || m.home_placeholder || 'Tim Home'
                    const aName = m.away_team?.name || m.away_placeholder || 'Tim Away'
                    const avail = m.ticket_quota?.available_quota ?? 0
                    const kickoff = m.match_time
                      ? new Date(m.match_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                      : '-'

                    return (
                      <div key={m.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="bg-ink text-white px-3 py-1 font-black text-xs sm:text-sm uppercase">
                            {m.category?.code || 'SMA'}
                          </span>
                          <div>
                            <p className="font-sans font-black text-base sm:text-lg text-ink">
                              {hName} ({m.home_score ?? 0}) vs ({m.away_score ?? 0}) {aName}
                            </p>
                            <span className="text-xs sm:text-sm text-ink/70 font-semibold">
                              {m.stage} • {m.arena} • Status: {m.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <span className="font-black text-brand text-base sm:text-lg block">{kickoff}</span>
                            <span className="text-xs sm:text-sm text-ink/80 font-bold">Sisa {avail} Tiket</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMatchId(m.id)
                              setActiveTab('REFEREE')
                            }}
                            className="px-5 py-2.5 bg-surface hover:bg-brand hover:text-white border-2 border-ink font-black text-sm cursor-pointer shadow-brutal-sm transition-all"
                          >
                            Kendalikan Laga
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. TAB: MEJA WASIT & SKOR */}
          {activeTab === 'REFEREE' && (
            <div className="space-y-6">
              {/* SELECTOR LAGA AKTIF */}
              <div className="border-2 border-ink bg-white p-5 shadow-brutal-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-xs font-black uppercase text-brand block">
                    PILIH PERTANDINGAN YANG DIKENDALIKAN:
                  </span>
                  <select
                    value={activeMatch?.id || ''}
                    onChange={(e) => setSelectedMatchId(Number(e.target.value))}
                    className="mt-1.5 border-2 border-ink bg-surface px-4 py-2.5 font-mono text-sm font-black text-ink focus:bg-white focus:outline-none"
                  >
                    {(matches || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.category?.code || 'SMA'}] {m.home_team?.name || m.home_placeholder} vs {m.away_team?.name || m.away_placeholder} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      syncMatchToServer(
                        { status: 'LIVE' },
                        `Status laga ${activeHomeName} vs ${activeAwayName} diubah menjadi LIVE ON-AIR`
                      )
                    }
                    className="px-4 py-2.5 bg-danger text-white font-mono text-xs sm:text-sm font-black uppercase border-2 border-ink shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Radio size={15} /> SET STATUS: LIVE
                  </button>
                </div>
              </div>

              {/* COURT SWITCHER */}
              <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="bg-[#fef08a] text-ink font-mono text-xs sm:text-sm font-black uppercase px-3 py-1 border border-ink inline-block mb-1.5">
                    PROTOKOL AFK PSSI CIANJUR // LIVE MYSQL
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink">
                    PAPAN KONTROL SKOR MEJA WASIT GGM
                  </h2>
                </div>

                <div className="flex items-center gap-2 bg-surface p-2 border-2 border-ink">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCourt('COURT_A')
                      addAuditLog('Meja dialihkan ke Court A (Vinyl)', 'court')
                    }}
                    className={`px-4 py-2 font-mono text-xs sm:text-sm font-black uppercase cursor-pointer transition-all ${
                      activeCourt === 'COURT_A' ? 'bg-brand text-white border-2 border-ink shadow-brutal-sm' : 'text-ink'
                    }`}
                  >
                    Court A (Vinyl)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCourt('COURT_B')
                      addAuditLog('Meja dialihkan ke Court B (Sintetis)', 'court')
                    }}
                    className={`px-4 py-2 font-mono text-xs sm:text-sm font-black uppercase cursor-pointer transition-all ${
                      activeCourt === 'COURT_B' ? 'bg-ink text-white border-2 border-ink shadow-brutal-sm' : 'text-ink'
                    }`}
                  >
                    Court B (Sintetis)
                  </button>
                </div>
              </div>

              {/* MAIN DUAL SCORE PANEL */}
              <div className="border-2 border-ink bg-white shadow-brutal-sm overflow-hidden">
                <div className="p-5 bg-surface border-b-2 border-ink flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="border-2 border-ink bg-white px-6 py-3 text-center min-w-[160px] shadow-brutal-sm">
                      <span className="font-mono text-xs text-ink/70 uppercase font-black block">WAKTU PERTANDINGAN</span>
                      <span className="font-mono text-4xl sm:text-5xl font-black text-ink">{formatTimer(timerSeconds)}</span>
                    </div>
                    <div>
                      <span className="font-mono text-xs sm:text-sm font-black bg-brand text-white px-3 py-1 border border-ink uppercase">
                        {activeMatch?.status || 'LIVE'} (2 x 20 MENIT)
                      </span>
                      <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1.5 font-bold">
                        Status Timer: {isTimerRunning ? 'BERJALAN' : 'DIJEDA (PAUSE)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-5 py-3 font-mono text-sm font-black uppercase border-2 border-ink shadow-brutal-sm flex items-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                        isTimerRunning ? 'bg-[#fef08a] text-ink' : 'bg-brand text-white'
                      }`}
                    >
                      {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                      <span>{isTimerRunning ? 'PAUSE TIMER' : 'MULAI TIMER'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerSeconds((prev) => prev + 60)}
                      className="px-4 py-3 bg-white text-ink font-mono text-sm font-black uppercase border-2 border-ink shadow-brutal-sm hover:bg-surface cursor-pointer"
                    >
                      +1 MENIT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimerSeconds(0)
                        setIsTimerRunning(false)
                      }}
                      className="px-4 py-3 bg-white text-danger font-mono text-sm font-black uppercase border-2 border-danger shadow-brutal-sm hover:bg-red-50 cursor-pointer"
                      title="Reset Timer"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  {/* TIM A */}
                  <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b-2 border-ink font-mono text-xs sm:text-sm">
                        <span className="font-black text-ink">TIM TUAN RUMAH</span>
                        <span className="bg-brand text-white px-2.5 py-0.5 font-black text-xs">JERSEY HIJAU</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase mt-2">{activeHomeName}</h3>
                    </div>

                    <div className="my-6 p-5 bg-surface border-2 border-ink flex items-center justify-around">
                      <div className="text-center">
                        <span className="font-mono text-xs sm:text-sm font-black text-ink/60 block">SKOR</span>
                        <span className="font-display text-7xl sm:text-8xl font-black text-brand leading-none">{scoreA}</span>
                      </div>
                      <div className="border-l-2 border-ink pl-5 text-center">
                        <span className="font-mono text-xs sm:text-sm font-black text-ink/60 block">FOULS</span>
                        <div className="flex gap-1.5 justify-center mt-2">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <span key={idx} className={`w-4 h-6 border-2 border-ink ${idx <= foulsA ? 'bg-danger' : 'bg-white'}`} />
                          ))}
                        </div>
                        <span className="font-mono text-xs sm:text-sm font-black text-ink block mt-1.5">{foulsA} / 5</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        disabled={isSyncingScore}
                        onClick={() => handleScoreChange('A', 1)}
                        className="w-full py-3.5 bg-brand text-white font-mono text-base font-black uppercase border-2 border-ink shadow-brutal-sm hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                      >
                        <Plus size={20} /> + GOL {activeHomeName}
                      </button>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          disabled={isSyncingScore}
                          onClick={() => handleScoreChange('A', -1)}
                          className="py-2.5 bg-surface text-ink font-mono text-xs sm:text-sm font-bold border-2 border-ink hover:bg-white cursor-pointer"
                        >
                          - KOREKSI
                        </button>
                        <button
                          type="button"
                          disabled={isSyncingScore}
                          onClick={() => handleFoulChange('A')}
                          className="py-2.5 bg-surface text-ink font-mono text-xs sm:text-sm font-bold border-2 border-ink hover:bg-white cursor-pointer"
                        >
                          + FOUL ({foulsA}/5)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TIM B */}
                  <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b-2 border-ink font-mono text-xs sm:text-sm">
                        <span className="font-black text-ink">TIM TAMU</span>
                        <span className="bg-[#dae2fd] text-ink px-2.5 py-0.5 font-black text-xs border border-ink">JERSEY BIRU</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase mt-2">{activeAwayName}</h3>
                    </div>

                    <div className="my-6 p-5 bg-surface border-2 border-ink flex items-center justify-around">
                      <div className="text-center">
                        <span className="font-mono text-xs sm:text-sm font-black text-ink/60 block">SKOR</span>
                        <span className="font-display text-7xl sm:text-8xl font-black text-ink leading-none">{scoreB}</span>
                      </div>
                      <div className="border-l-2 border-ink pl-5 text-center">
                        <span className="font-mono text-xs sm:text-sm font-black text-ink/60 block">FOULS</span>
                        <div className="flex gap-1.5 justify-center mt-2">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <span key={idx} className={`w-4 h-6 border-2 border-ink ${idx <= foulsB ? 'bg-danger' : 'bg-white'}`} />
                          ))}
                        </div>
                        <span className="font-mono text-xs sm:text-sm font-black text-ink block mt-1.5">{foulsB} / 5</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        disabled={isSyncingScore}
                        onClick={() => handleScoreChange('B', 1)}
                        className="w-full py-3.5 bg-brand text-white font-mono text-base font-black uppercase border-2 border-ink shadow-brutal-sm hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                      >
                        <Plus size={20} /> + GOL {activeAwayName}
                      </button>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          disabled={isSyncingScore}
                          onClick={() => handleScoreChange('B', -1)}
                          className="py-2.5 bg-surface text-ink font-mono text-xs sm:text-sm font-bold border-2 border-ink hover:bg-white cursor-pointer"
                        >
                          - KOREKSI
                        </button>
                        <button
                          type="button"
                          disabled={isSyncingScore}
                          onClick={() => handleFoulChange('B')}
                          className="py-2.5 bg-surface text-ink font-mono text-xs sm:text-sm font-bold border-2 border-ink hover:bg-white cursor-pointer"
                        >
                          + FOUL ({foulsB}/5)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Buttons & FT */}
                <div className="p-5 bg-surface border-t-2 border-ink flex flex-wrap items-center justify-between gap-3 font-mono text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black uppercase text-ink mr-1">LOG EVENT:</span>
                    <button
                      type="button"
                      onClick={() =>
                        syncMatchToServer(
                          {
                            event: {
                              team_id: activeMatch?.home_team?.id,
                              event_type: 'YELLOW_CARD',
                              player_name: `Pemain ${activeHomeName}`,
                              minute: Math.max(1, Math.floor(timerSeconds / 60)),
                            },
                          },
                          `Kartu Kuning dicatat untuk ${activeHomeName}`
                        )
                      }
                      className="px-4 py-2 bg-yellow-300 text-black border-2 border-ink font-bold shadow-brutal-sm cursor-pointer"
                    >
                      + KARTU KUNING
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        syncMatchToServer(
                          {
                            event: {
                              team_id: activeMatch?.away_team?.id,
                              event_type: 'RED_CARD',
                              player_name: `Pemain ${activeAwayName}`,
                              minute: Math.max(1, Math.floor(timerSeconds / 60)),
                            },
                          },
                          `Kartu Merah dicatat untuk ${activeAwayName}`
                        )
                      }
                      className="px-4 py-2 bg-danger text-white border-2 border-ink font-bold shadow-brutal-sm cursor-pointer"
                    >
                      + KARTU MERAH
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncingScore}
                    onClick={handleFinishMatch}
                    className="px-6 py-2.5 bg-danger text-white font-mono text-xs sm:text-sm font-black uppercase border-2 border-ink shadow-brutal-sm hover:bg-red-700 cursor-pointer"
                  >
                    SELESAIKAN PERTANDINGAN (FT)
                  </button>
                </div>
              </div>

              {/* AUDIT LOG TELEMETRI */}
              <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm">
                <div className="flex items-center justify-between pb-3.5 border-b-2 border-ink mb-4 font-mono text-xs sm:text-sm">
                  <span className="font-black uppercase text-ink flex items-center gap-2">
                    <Terminal size={18} className="text-brand" />
                    LIVE TELEMETRI AUDIT LOGS (MYSQL SYNC)
                  </span>
                  <span className="text-ink/80 font-bold">Real-time Database</span>
                </div>

                <div className="space-y-2.5 font-mono text-xs sm:text-sm">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-surface border border-ink flex items-center justify-between">
                      <span className="text-ink font-bold">{log.message}</span>
                      <span className="text-ink/70 font-semibold shrink-0 ml-3">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. TAB: INPUT JADWAL & ALOKASI KUOTA */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-6">
              <div className="border-2 border-ink bg-white shadow-brutal-sm">
                <div className="p-6 border-b-2 border-ink flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink">
                      FORMULIR TERBITKAN JADWAL &amp; KUOTA LAGA
                    </h3>
                    <p className="font-mono text-sm text-ink/80 font-bold mt-0.5">
                      Menyimpan langsung ke tabel matches &amp; ticket_quotas di MySQL
                    </p>
                  </div>
                  <span className="bg-brand text-white font-mono text-xs sm:text-sm font-black px-3 py-1 border border-ink">
                    LIVE DB
                  </span>
                </div>

                {formFeedback && (
                  <div
                    className={`p-4 font-mono text-sm font-black border-b-2 flex items-center gap-2 ${
                      formFeedback.type === 'success'
                        ? 'bg-brand-light text-brand border-brand'
                        : 'bg-danger/10 text-danger border-danger'
                    }`}
                  >
                    {formFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{formFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleScheduleSubmit} className="p-6 sm:p-8 space-y-6 font-mono text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">TIM A (HOME)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: MAN 1 Cianjur"
                        value={newTeamA}
                        onChange={(e) => setNewTeamA(e.target.value)}
                        className="w-full p-3.5 border-2 border-ink bg-surface text-base font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">TIM B (AWAY)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SMAN 2 Cianjur"
                        value={newTeamB}
                        onChange={(e) => setNewTeamB(e.target.value)}
                        className="w-full p-3.5 border-2 border-ink bg-surface text-base font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-black uppercase mb-2 flex items-center gap-2 text-xs sm:text-sm">
                        <Layers size={18} className="text-brand" /> PILIH KATEGORI
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { code: 'SD', label: 'SD' },
                          { code: 'SMP', label: 'SMP' },
                          { code: 'SMA', label: 'SMA/SMK' },
                        ].map((cat) => (
                          <button
                            key={cat.code}
                            type="button"
                            onClick={() => setNewCategory(cat.code)}
                            className={`p-3.5 border-2 border-ink font-black text-center text-sm sm:text-base cursor-pointer transition-all ${
                              newCategory === cat.code ? 'bg-brand text-white shadow-brutal-sm' : 'bg-surface hover:bg-white text-ink'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-black uppercase mb-2 text-xs sm:text-sm">BABAK TURNAMEN</label>
                      <select
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value)}
                        className="w-full p-3.5 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                      >
                        <option value="GROUP">Penyisihan Grup</option>
                        <option value="ROUND_16">Babak 16 Besar</option>
                        <option value="QUARTER_FINAL">Perempat Final (8 Besar)</option>
                        <option value="SEMI_FINAL">Semifinal</option>
                        <option value="FINAL">Grand Final</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-2 text-xs sm:text-sm">VENUE LAPANGAN GGM</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setNewCourt('Lapangan Utama GGM (Court A Vinyl)')}
                        className={`p-4 border-2 border-ink text-left font-bold cursor-pointer transition-all ${
                          newCourt.includes('Vinyl') ? 'bg-white shadow-brutal-sm border-brand text-brand' : 'bg-surface text-ink/80'
                        }`}
                      >
                        <span className="font-black text-base block">Court A (Vinyl Interlock)</span>
                        <span className="text-xs">Standar Futsal Nasional — Tribun Barat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCourt('Lapangan B GGM (Sintetis)')}
                        className={`p-4 border-2 border-ink text-left font-bold cursor-pointer transition-all ${
                          newCourt.includes('Sintetis') ? 'bg-white shadow-brutal-sm border-brand text-brand' : 'bg-surface text-ink/80'
                        }`}
                      >
                        <span className="font-black text-base block">Court B (Rumput Sintetis)</span>
                        <span className="text-xs">Standar Futsal Mini — Tribun Timur</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">TANGGAL</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">JAM KICKOFF</label>
                      <input
                        type="time"
                        required
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">KUOTA KURSI</label>
                      <input
                        type="number"
                        min={10}
                        required
                        value={newQuota}
                        onChange={(e) => setNewQuota(Number(e.target.value))}
                        className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">HARGA TIKET (RP)</label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        required
                        value={newPrice}
                        onChange={(e) => setNewPrice(Number(e.target.value))}
                        className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingMatch}
                    className="w-full py-4 bg-brand text-white font-mono text-base sm:text-lg font-black uppercase tracking-wider border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                  >
                    <Send size={20} />
                    <span>{isCreatingMatch ? 'MENYIMPAN KE MYSQL...' : 'SIMPAN & PUBLIKASIKAN JADWAL KE PENONTON'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 4. TAB: BRACKET & BAGAN */}
          {activeTab === 'BRACKET' && (
            <div className="space-y-6">
              <div className="border-2 border-ink bg-white p-6 sm:p-8 shadow-brutal-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b-2 border-ink mb-5 gap-3">
                  <div>
                    <span className="bg-brand text-white px-3 py-1 font-mono text-xs sm:text-sm font-black uppercase border border-ink">
                      PIALA BUPATI CIANJUR 2026
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink mt-2">
                      SINKRONISASI BAGAN BABAK GUGUR
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleBracketUpdate}
                    className="px-6 py-3 bg-brand text-white font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Sinkronkan Bagan Sekarang
                  </button>
                </div>

                {bracketSuccessMessage && (
                  <div className="p-4 bg-brand-light text-brand font-mono text-sm font-black border-2 border-brand mb-4">
                    {bracketSuccessMessage}
                  </div>
                )}

                <p className="font-mono text-base text-ink/80 font-bold">
                  Setiap skor akhir (FT) yang disahkan pada Meja Wasit otomatis diperbarui pada pohon bagan turnamen publik.
                </p>
              </div>
            </div>
          )}

          {/* 5. TAB: SCANNER GATE */}
          {activeTab === 'SCANNER' && (
            <div className="space-y-6">
              <div className="border-2 border-ink bg-white p-6 sm:p-8 shadow-brutal-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b-2 border-ink mb-5 gap-3">
                  <div>
                    <span className="bg-brand text-white px-3 py-1 font-mono text-xs sm:text-sm font-black uppercase border border-ink">
                      GATE RELAY // TURNSTILE 01
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink mt-2">
                      PEMINDAI TURNSTILE PINTU MASUK (LIVE MYSQL)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo(PAGE_NAMES.OPERATOR_SCANNER)}
                    className="px-6 py-3 bg-ink text-white font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-gray-800 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    Buka Mode Scanner Fullscreen ↗
                  </button>
                </div>

                <form onSubmit={handleRealScan} className="max-w-xl mx-auto p-6 sm:p-8 bg-surface border-2 border-ink space-y-5">
                  <input
                    type="text"
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value)}
                    placeholder="Masukkan / Scan Kode QR E-Tiket (Contoh: FTX-QR-...)..."
                    className="w-full p-4 border-2 border-ink bg-white font-mono text-base font-bold focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full py-3.5 bg-brand text-white font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                  >
                    {isScanning ? 'MEMVALIDASI KE DATABASE...' : 'VALIDASI TIKET & BUKA TURNSTILE'}
                  </button>

                  {scanResult === 'VALID' && (
                    <div className="p-4 bg-brand text-white border-2 border-ink font-mono text-base font-black text-center shadow-brutal-sm animate-in fade-in">
                      ✓ {scanMessage}
                    </div>
                  )}

                  {scanResult === 'INVALID' && (
                    <div className="p-4 bg-danger text-white border-2 border-ink font-mono text-base font-black text-center shadow-brutal-sm animate-in fade-in">
                      ✕ {scanMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>

        <footer className="p-5 sm:p-6 border-t-2 border-ink bg-white text-center font-mono text-xs sm:text-sm text-ink/80 font-bold">
          OPERASIONAL MEJA PERTANDINGAN // GELANGGANG GENERASI MUDA (GGM) CIANJUR
        </footer>
      </main>
    </div>
  )
}