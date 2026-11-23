import { useState, useEffect, useMemo, useCallback } from 'react'
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
  ArrowLeftRight,
  Sparkles,
  X,
  Check,
} from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'
import { TEAM_LOGO_MAP, TEAM_BRAND_MAP, getTeamLogoUrl } from '../utils/teamLogos.js'

/**
 * Komponen Badge Logo Sekolah Resmi
 * Mendukung logo gambar dari folder src/assets/logos/
 * dengan fallback elegan ke lambang warna & singkatan resmi sekolah.
 */
function TeamLogoBadge({ team, size = 'md' }) {
  const [imageError, setImageError] = useState(false)
  const teamName = team?.name || ''
  const shortName = team?.short_name || teamName.slice(0, 6) || 'TIM'
  const logoUrl = getTeamLogoUrl(teamName) || team?.logo_url
  const brand = TEAM_BRAND_MAP[teamName] || {
    color: team?.logo_color || '#10B981',
    bg: '#f2f4f3',
    text: '#191c1b',
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm font-black',
    xl: 'w-16 h-16 text-base font-black',
  }[size] || 'w-10 h-10 text-xs'

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center border-2 border-ink rounded-none shadow-brutal-xs font-mono font-black overflow-hidden ${sizeClasses}`}
      style={{ backgroundColor: brand.bg, borderColor: '#191c1b' }}
      title={teamName}
    >
      {!imageError && logoUrl ? (
        <img
          src={logoUrl}
          alt={teamName}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain p-0.5"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-mono font-black uppercase text-center"
          style={{ backgroundColor: brand.color, color: brand.text }}
        >
          <span className="truncate px-0.5">{shortName}</span>
        </div>
      )}
    </div>
  )
}

export default function OperatorDashboard() {
  const { currentUser, matches, teams, refreshMatches, navigateTo, openLoginModal, logout } = useNavigation()

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

  // State Form Jadwal Baru (Tinggal klik-klik sekolah real dari MySQL)
  const [realTeams, setRealTeams] = useState([])
  const [groupFilter, setGroupFilter] = useState('ALL') // 'ALL' | 'A' | 'B'
  const [selectedTeamA, setSelectedTeamA] = useState(null)
  const [selectedTeamB, setSelectedTeamB] = useState(null)
  const [newTeamA, setNewTeamA] = useState('')
  const [newTeamB, setNewTeamB] = useState('')
  const [newCategory, setNewCategory] = useState('LFP')
  const [newStage, setNewStage] = useState('GROUP')
  const [newCourt, setNewCourt] = useState('GOR Gelanggang Generasi Muda (GGM) Cianjur')
  const [newDate, setNewDate] = useState('2026-11-16')
  const [newTime, setNewTime] = useState('15:30')
  const [newQuota, setNewQuota] = useState(350)
  const [newPrice, setNewPrice] = useState(20000)
  const [isCreatingMatch, setIsCreatingMatch] = useState(false)
  const [formFeedback, setFormFeedback] = useState(null)

  // Ambil daftar tim sekolah real dari database MySQL
  useEffect(() => {
    if (teams && teams.length > 0) {
      setRealTeams(teams)
    } else {
      futsaltixApi
        .getTeams()
        .then(({ data }) => {
          if (data?.teams && data.teams.length > 0) {
            setRealTeams(data.teams)
          } else if (data?.data && data.data.length > 0) {
            setRealTeams(data.data)
          }
        })
        .catch(() => {})
    }
  }, [teams])

  const handleSelectTeamA = (team) => {
    if (selectedTeamB?.id === team.id || selectedTeamB?.name === team.name) {
      setSelectedTeamB(null)
      setNewTeamB('')
    }
    setSelectedTeamA(team)
    setNewTeamA(team.name)
  }

  const handleSelectTeamB = (team) => {
    if (selectedTeamA?.id === team.id || selectedTeamA?.name === team.name) {
      setSelectedTeamA(null)
      setNewTeamA('')
    }
    setSelectedTeamB(team)
    setNewTeamB(team.name)
  }

  const handleSwapTeams = () => {
    const tempA = selectedTeamA
    const tempAName = newTeamA
    setSelectedTeamA(selectedTeamB)
    setNewTeamA(newTeamB)
    setSelectedTeamB(tempA)
    setNewTeamB(tempAName)
  }

  const handleResetTeams = () => {
    setSelectedTeamA(null)
    setNewTeamA('')
    setSelectedTeamB(null)
    setNewTeamB('')
  }

  // Filter daftar tim berdasarkan grup (Grup A / Grup B)
  const filteredTeams = useMemo(() => {
    if (groupFilter === 'A') return realTeams.filter((t) => t.group === 'A')
    if (groupFilter === 'B') return realTeams.filter((t) => t.group === 'B')
    return realTeams
  }, [realTeams, groupFilter])

  // State Bracket Pairing
  const [bracketSuccessMessage, setBracketSuccessMessage] = useState(null)

  // State Scanner Embedded
  const [scannerInput, setScannerInput] = useState('')
  const [scanResult, setScanResult] = useState(null) // null | 'VALID' | 'INVALID' | 'DUPLICATE'
  const [scanMessage, setScanMessage] = useState('')
  const [scanDetail, setScanDetail] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [testTickets, setTestTickets] = useState([])
  const [isResettingTicket, setIsResettingTicket] = useState(false)

  // Ambil daftar tiket sah dari MySQL untuk keperluan pengujian instan operator
  const loadTestTickets = useCallback(async () => {
    try {
      const res = await futsaltixApi.getActiveTestTickets()
      setTestTickets(res.data?.orders || [])
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (activeTab === 'SCANNER') {
      loadTestTickets()
    }
  }, [activeTab, loadTestTickets])

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
    const teamAName = selectedTeamA?.name || newTeamA.trim()
    const teamBName = selectedTeamB?.name || newTeamB.trim()

    if (!teamAName || !teamBName) {
      setFormFeedback({
        type: 'error',
        text: 'Silakan pilih Tim A (Home) dan Tim B (Away) dengan mengklik logo atau nama sekolah di bawah!',
      })
      return
    }

    if (teamAName === teamBName) {
      setFormFeedback({
        type: 'error',
        text: 'Tim A dan Tim B tidak boleh sekolah yang sama! Silakan pilih dua sekolah yang berbeda.',
      })
      return
    }

    setIsCreatingMatch(true)
    setFormFeedback(null)

    try {
      await futsaltixApi.operatorCreateMatch({
        category_code: newCategory,
        stage: newStage,
        home_team_id: selectedTeamA?.id || null,
        away_team_id: selectedTeamB?.id || null,
        home_team_name: teamAName,
        away_team_name: teamBName,
        arena: 'GOR Gelanggang Generasi Muda (GGM) Cianjur',
        venue: 'GOR Gelanggang Generasi Muda (GGM) Cianjur',
        match_time: `${newDate} ${newTime}:00`,
        total_quota: Number(newQuota),
        ticket_price: Number(newPrice),
      })

      await refreshMatches()
      setFormFeedback({
        type: 'success',
        text: `Jadwal [${newCategory}] ${teamAName} vs ${teamBName} berhasil disimpan ke MySQL dengan kuota ${newQuota} tiket!`,
      })
      addAuditLog(`Jadwal baru diterbitkan ke MySQL: [${newCategory}] ${teamAName} vs ${teamBName}`, 'quota')
      setSelectedTeamA(null)
      setSelectedTeamB(null)
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

  // Scan Tiket Asli via API (Mendukung kode input manual maupun klik tombol dari daftar tiket)
  const handleRealScan = async (e, manualCode = null) => {
    e?.preventDefault()
    const code = (manualCode || scannerInput).trim()
    if (!code) return

    setIsScanning(true)
    setScanResult(null)
    setScanDetail(null)
    try {
      const res = await futsaltixApi.operatorScanTicket(code, 'Gate A - Turnstile Utama (Vinyl)')
      const data = res.data?.data || res.data?.ticket || {}
      setScanResult('VALID')
      setScanMessage(res.data?.message || `TIKET ${code} VALID — TURNSTILE DIBUKA!`)
      setScanDetail(data)
      addAuditLog(`Scan tiket ${code} -> VALID (${data.match || 'Turnstile Dibuka'})`, 'scan')
      setScannerInput('')
      loadTestTickets()
      refreshMatches?.()
    } catch (error) {
      const errData = error.response?.data || {}
      const isDup = Boolean(errData.is_duplicate)
      setScanResult(isDup ? 'DUPLICATE' : 'INVALID')
      const msg = errData.message || 'TIKET TIDAK VALID / TIDAK TERDAFTAR!'
      setScanMessage(msg)
      setScanDetail(errData)
      addAuditLog(`Scan tiket ${code} -> ${isDup ? 'GANDA' : 'DITOLAK'} (${msg})`, 'scan')
    } finally {
      setIsScanning(false)
    }
  }

  // Reset status check-in tiket untuk keperluan simulasi & pengujian demo dosen
  const handleResetTicket = async (codeOrId) => {
    setIsResettingTicket(true)
    try {
      const res = await futsaltixApi.resetTicketCheckIn(codeOrId)
      addAuditLog(`Reset tiket -> ${res.data?.message}`, 'info')
      setScanResult(null)
      setScanMessage(res.data?.message)
      setScanDetail(null)
      loadTestTickets()
      refreshMatches?.()
    } catch (err) {
      alert('Gagal reset status tiket: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsResettingTicket(false)
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
        onExit={logout}
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

          {/* 3. TAB: INPUT JADWAL & ALOKASI KUOTA (SIMPEL - POINT & CLICK) */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-6">
              <div className="border-2 border-ink bg-white shadow-brutal-sm">
                {/* Header Bar */}
                <div className="p-5 sm:p-6 border-b-2 border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-2.5 h-2.5 bg-brand animate-ping rounded-full" />
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-brand">
                        OPERATOR JADWAL RESMI // LFP 2026
                      </span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink">
                      FORMULIR TERBITKAN JADWAL &amp; KUOTA LAGA
                    </h3>
                    <p className="font-mono text-xs sm:text-sm text-ink/80 font-bold mt-0.5">
                      Tinggal klik logo / nama sekolah untuk memilih Tim Home &amp; Tim Away (Data Real MySQL)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-brand text-white font-mono text-xs sm:text-sm font-black px-3 py-1.5 border-2 border-ink shadow-brutal-xs flex items-center gap-1.5">
                      <Sparkles size={14} /> LIVE DB
                    </span>
                  </div>
                </div>

                {formFeedback && (
                  <div
                    className={`p-4 font-mono text-xs sm:text-sm font-black border-b-2 flex items-center gap-2.5 ${
                      formFeedback.type === 'success'
                        ? 'bg-brand-light text-brand border-brand'
                        : 'bg-danger/10 text-danger border-danger'
                    }`}
                  >
                    {formFeedback.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                    <span>{formFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleScheduleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-8 font-mono text-sm">
                  {/* 1. MATCHUP PREVIEW (KOTAK DUEL KEDUA TIM) */}
                  <div className="border-2 border-ink bg-[#f8faf9] p-4 sm:p-6 shadow-brutal-sm">
                    <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                        ⚔️ PRATINJAU DUEL PERTANDINGAN
                      </span>
                      {(selectedTeamA || selectedTeamB) && (
                        <button
                          type="button"
                          onClick={handleResetTeams}
                          className="font-mono text-xs font-black uppercase text-danger hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <X size={14} /> Reset Pilihan
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
                      {/* TIM A (HOME) DISPLAY */}
                      <div
                        className={`p-4 border-2 border-ink transition-all ${
                          selectedTeamA
                            ? 'bg-white shadow-brutal-xs'
                            : 'bg-surface border-dashed text-ink/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="border-2 border-ink bg-brand text-white px-2 py-0.5 font-mono text-[10px] font-black uppercase">
                            TIM A (HOME / KANDANG)
                          </span>
                          {selectedTeamA && (
                            <button
                              type="button"
                              onClick={() => { setSelectedTeamA(null); setNewTeamA(''); }}
                              className="text-danger hover:text-black font-black text-xs cursor-pointer"
                              title="Hapus pilihan Tim A"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {selectedTeamA ? (
                          <div className="flex items-center gap-3">
                            <TeamLogoBadge team={selectedTeamA} size="lg" />
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-lg sm:text-xl font-black uppercase text-ink truncate">
                                {selectedTeamA.name}
                              </div>
                              <span className="font-mono text-xs text-brand font-black block mt-0.5">
                                KODE: {selectedTeamA.short_name || 'LFP'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-center">
                            <p className="font-bold text-xs sm:text-sm text-ink/70">
                              ← Klik logo/nama sekolah di kolom Tim Home di bawah
                            </p>
                          </div>
                        )}
                      </div>

                      {/* VS & SWAP BUTTON */}
                      <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                        <div className="w-12 h-12 bg-amber-300 border-2 border-ink shadow-brutal-xs flex items-center justify-center font-display font-black text-xl text-ink">
                          VS
                        </div>
                        <button
                          type="button"
                          onClick={handleSwapTeams}
                          disabled={!selectedTeamA && !selectedTeamB}
                          className="inline-flex items-center gap-1 border-2 border-ink bg-white px-2.5 py-1 font-mono text-[10px] sm:text-xs font-black uppercase hover:bg-surface active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Tukar posisi Home & Away"
                        >
                          <ArrowLeftRight size={12} /> Tukar
                        </button>
                      </div>

                      {/* TIM B (AWAY) DISPLAY */}
                      <div
                        className={`p-4 border-2 border-ink transition-all ${
                          selectedTeamB
                            ? 'bg-white shadow-brutal-xs'
                            : 'bg-surface border-dashed text-ink/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="border-2 border-ink bg-ink text-white px-2 py-0.5 font-mono text-[10px] font-black uppercase">
                            TIM B (AWAY / TANDANG)
                          </span>
                          {selectedTeamB && (
                            <button
                              type="button"
                              onClick={() => { setSelectedTeamB(null); setNewTeamB(''); }}
                              className="text-danger hover:text-black font-black text-xs cursor-pointer"
                              title="Hapus pilihan Tim B"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {selectedTeamB ? (
                          <div className="flex items-center gap-3">
                            <TeamLogoBadge team={selectedTeamB} size="lg" />
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-lg sm:text-xl font-black uppercase text-ink truncate">
                                {selectedTeamB.name}
                              </div>
                              <span className="font-mono text-xs text-ink/70 font-black block mt-0.5">
                                KODE: {selectedTeamB.short_name || 'LFP'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-center">
                            <p className="font-bold text-xs sm:text-sm text-ink/70">
                              Klik logo/nama sekolah di kolom Tim Away di bawah →
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. DUAL INTERACTIVE SCHOOL SELECTOR (KLIK LOGO/NAMA) */}
                  <div className="space-y-3">
                    {/* FILTER GRUP A & GRUP B RESMI LFP */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 border-2 border-ink shadow-brutal-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-brand" />
                        <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink">
                          PILIH GRUP DIVISI 1 SMA PUTRA:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGroupFilter('ALL')}
                          className={`px-3 py-1.5 font-mono text-xs font-black uppercase border-2 border-ink transition-all cursor-pointer ${
                            groupFilter === 'ALL'
                              ? 'bg-ink text-white shadow-brutal-xs'
                              : 'bg-white text-ink hover:bg-gray-100'
                          }`}
                        >
                          SEMUA ({realTeams.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupFilter('A')}
                          className={`px-3 py-1.5 font-mono text-xs font-black uppercase border-2 border-ink transition-all cursor-pointer ${
                            groupFilter === 'A'
                              ? 'bg-brand text-white shadow-brutal-xs'
                              : 'bg-white text-ink hover:bg-gray-100'
                          }`}
                        >
                          🟢 GRUP A ({realTeams.filter((t) => t.group === 'A').length || 10})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupFilter('B')}
                          className={`px-3 py-1.5 font-mono text-xs font-black uppercase border-2 border-ink transition-all cursor-pointer ${
                            groupFilter === 'B'
                              ? 'bg-blue-600 text-white shadow-brutal-xs'
                              : 'bg-white text-ink hover:bg-gray-100'
                          }`}
                        >
                          🔵 GRUP B ({realTeams.filter((t) => t.group === 'B').length || 10})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* KOLOM KIRI: PILIH TIM A */}
                      <div className="border-2 border-ink bg-white p-4 sm:p-5 shadow-brutal-xs">
                        <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 mb-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-none bg-brand text-white border border-ink flex items-center justify-center font-black text-xs">
                              1
                            </span>
                            <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink">
                              KLIK UNTUK MEMILIH TIM A (HOME)
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-ink/70 font-bold">
                            {filteredTeams.length} Sekolah
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {filteredTeams.map((team) => {
                            const isSelectedA = selectedTeamA?.id === team.id || newTeamA === team.name
                            const isSelectedB = selectedTeamB?.id === team.id || newTeamB === team.name

                            return (
                              <button
                                key={`home-${team.id}`}
                                type="button"
                                onClick={() => handleSelectTeamA(team)}
                                className={`p-3 border-2 border-ink text-left transition-all flex items-center gap-3 cursor-pointer ${
                                  isSelectedA
                                    ? 'bg-brand text-white shadow-brutal-sm scale-[1.02] border-ink font-black'
                                    : isSelectedB
                                    ? 'bg-gray-100 opacity-60 border-dashed hover:opacity-90'
                                    : 'bg-surface hover:bg-white shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                }`}
                              >
                                <TeamLogoBadge team={team} size="md" />
                                <div className="min-w-0 flex-1">
                                  <div className={`font-mono text-xs sm:text-sm font-black truncate ${isSelectedA ? 'text-white' : 'text-ink'}`}>
                                    {team.name}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${isSelectedA ? 'border-white text-white' : 'border-ink text-ink/80 bg-white'}`}>
                                      {team.short_name}
                                    </span>
                                    {team.group && (
                                      <span className={`text-[10px] font-mono font-bold px-1 py-0.2 border ${
                                        isSelectedA
                                          ? 'border-white text-white'
                                          : team.group === 'A'
                                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                          : 'border-blue-600 bg-blue-50 text-blue-800'
                                      }`}>
                                        GRUP {team.group}
                                      </span>
                                    )}
                                    {isSelectedA && (
                                      <span className="text-[10px] font-black uppercase text-white tracking-wider">
                                        ✓ TERPILIH
                                      </span>
                                    )}
                                    {isSelectedB && (
                                      <span className="text-[10px] text-ink/60 font-bold">
                                        (Di Tim Away)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* KOLOM KANAN: PILIH TIM B */}
                      <div className="border-2 border-ink bg-white p-4 sm:p-5 shadow-brutal-xs">
                        <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 mb-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-none bg-ink text-white border border-ink flex items-center justify-center font-black text-xs">
                              2
                            </span>
                            <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink">
                              KLIK UNTUK MEMILIH TIM B (AWAY)
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-ink/70 font-bold">
                            {filteredTeams.length} Sekolah
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {filteredTeams.map((team) => {
                            const isSelectedA = selectedTeamA?.id === team.id || newTeamA === team.name
                            const isSelectedB = selectedTeamB?.id === team.id || newTeamB === team.name

                            return (
                              <button
                                key={`away-${team.id}`}
                                type="button"
                                onClick={() => handleSelectTeamB(team)}
                                className={`p-3 border-2 border-ink text-left transition-all flex items-center gap-3 cursor-pointer ${
                                  isSelectedB
                                    ? 'bg-ink text-white shadow-brutal-sm scale-[1.02] border-ink font-black'
                                    : isSelectedA
                                    ? 'bg-gray-100 opacity-60 border-dashed hover:opacity-90'
                                    : 'bg-surface hover:bg-white shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                }`}
                              >
                                <TeamLogoBadge team={team} size="md" />
                                <div className="min-w-0 flex-1">
                                  <div className={`font-mono text-xs sm:text-sm font-black truncate ${isSelectedB ? 'text-white' : 'text-ink'}`}>
                                    {team.name}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${isSelectedB ? 'border-white text-white' : 'border-ink text-ink/80 bg-white'}`}>
                                      {team.short_name}
                                    </span>
                                    {team.group && (
                                      <span className={`text-[10px] font-mono font-bold px-1 py-0.2 border ${
                                        isSelectedB
                                          ? 'border-white text-white'
                                          : team.group === 'A'
                                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                          : 'border-blue-600 bg-blue-50 text-blue-800'
                                      }`}>
                                        GRUP {team.group}
                                      </span>
                                    )}
                                    {isSelectedB && (
                                      <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                                        ✓ TERPILIH
                                      </span>
                                    )}
                                    {isSelectedA && (
                                      <span className="text-[10px] text-ink/60 font-bold">
                                        (Di Tim Home)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. INFO LOGO UNTUK PENGGUNA */}
                  <div className="p-3 sm:p-4 border-2 border-ink bg-[#fffbeb] flex items-center justify-between gap-3 text-xs shadow-brutal-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎨</span>
                      <span className="font-bold text-ink">
                        <strong>Kustomisasi Logo:</strong> Anda dapat menaruh file gambar logo sekolah di folder <code className="bg-white px-1.5 py-0.5 border border-ink font-mono text-[11px]">frontend/src/assets/logos/</code> (contoh: <code>smansa.png</code>, <code>smkn1.png</code>, <code>man1.png</code>, dll). Gambar logo akan otomatis tampil di kartu pertandingan!
                      </span>
                    </div>
                  </div>

                  {/* 4. TURNAMEN & BABAK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-black uppercase mb-2 flex items-center gap-2 text-xs sm:text-sm">
                        <Layers size={18} className="text-brand" /> TURNAMEN RESMI
                      </label>
                      <div className="p-3.5 border-2 border-ink bg-brand text-white font-black text-xs sm:text-sm uppercase shadow-brutal-sm flex items-center justify-between">
                        <span>LIGA FUTSAL PELAJAR (LFP) 2026</span>
                        <span className="font-mono bg-white text-ink px-2 py-0.5 text-xs">RESMI</span>
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

                  {/* 5. TANGGAL, JAM, KUOTA & HARGA TIKET (VENUE LAPANGAN DIHAPUS TOTAL) */}
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

                  {/* 6. TOMBOL SUBMIT */}
                  <button
                    type="submit"
                    disabled={isCreatingMatch || (!selectedTeamA && !newTeamA) || (!selectedTeamB && !newTeamB)}
                    className="w-full py-4 bg-brand text-white font-mono text-base sm:text-lg font-black uppercase tracking-wider border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* PANEL PENGUJIAN CEPAT TIKET REAL MYSQL */}
              <div className="border-2 border-ink bg-white p-5 sm:p-6 shadow-brutal-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b-2 border-ink mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-brand" />
                    <h4 className="font-display text-lg sm:text-xl font-black uppercase text-ink">
                      Daftar Tiket Real MySQL (Pengujian Instan Operator)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={loadTestTickets}
                    className="font-mono text-xs font-bold text-ink underline hover:text-brand cursor-pointer"
                  >
                    🔄 Refresh Data Tiket
                  </button>
                </div>

                <p className="font-mono text-xs sm:text-sm text-ink/75 mb-4 font-medium">
                  Klik tombol <strong>⚡ UJI SCAN</strong> untuk langsung memvalidasi tiket ke MySQL, atau tombol <strong>🔄 RESET</strong> untuk mengembalikan status tiket menjadi Siap Scan.
                </p>

                {testTickets.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-ink/40 bg-surface text-center font-mono text-xs sm:text-sm text-ink/70">
                    Belum ada tiket berstatus PAID di database. Silakan checkout tiket di halaman Jadwal Laga.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {testTickets.map((t) => {
                      const isUsed = Boolean(t.is_checked_in)
                      const hName = t.match?.home_team?.name || t.match?.homeTeam?.name || 'Tim Home'
                      const aName = t.match?.away_team?.name || t.match?.awayTeam?.name || 'Tim Away'
                      const buyerName = t.user?.name || 'Suporter'

                      return (
                        <div
                          key={t.id}
                          className="border-2 border-ink p-3.5 bg-surface hover:bg-white transition-all shadow-brutal-xs flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 border-b border-ink/20 pb-2 mb-2">
                              <span className="font-mono text-[11px] font-black uppercase bg-ink text-white px-2 py-0.5">
                                {t.order_code}
                              </span>
                              <span
                                className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 border ${
                                  isUsed
                                    ? 'bg-danger text-white border-danger'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-600'
                                }`}
                              >
                                {isUsed ? 'SUDAH DI-SCAN' : 'SIAP SCAN'}
                              </span>
                            </div>

                            <div className="font-display text-sm sm:text-base font-black uppercase text-ink truncate">
                              {hName} VS {aName}
                            </div>

                            <div className="mt-1 font-mono text-xs text-ink/80 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Pemesan: <strong>{buyerName}</strong></span>
                              <span>Jumlah: <strong>{t.quantity} Tiket</strong></span>
                            </div>

                            <div className="mt-1.5 p-1.5 bg-white border border-ink/30 font-mono text-[11px] text-ink/70 truncate select-all">
                              Token: <strong className="text-ink">{t.qr_payload}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-ink/20">
                            <button
                              type="button"
                              onClick={() => {
                                setScannerInput(t.qr_payload || t.order_code)
                                handleRealScan(null, t.qr_payload || t.order_code)
                              }}
                              disabled={isScanning}
                              className="flex-1 py-2 bg-brand text-white font-mono text-xs font-black uppercase border-2 border-ink shadow-brutal-xs hover:bg-brand-dark cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                            >
                              ⚡ Uji Scan Tiket Ini
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetTicket(t.order_code)}
                              disabled={isResettingTicket}
                              className="px-3 py-2 bg-white text-ink font-mono text-xs font-black uppercase border-2 border-ink shadow-brutal-xs hover:bg-surface cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                              title="Reset status tiket agar bisa di-scan ulang"
                            >
                              🔄 Reset
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* FORM UTAMA SCANNER PINTU GERBANG GGM */}
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
                  <div>
                    <label className="block font-mono text-xs font-black uppercase mb-1.5 text-ink">
                      MASUKKAN KODE TIKET / TOKEN QR:
                    </label>
                    <input
                      type="text"
                      value={scannerInput}
                      onChange={(e) => setScannerInput(e.target.value)}
                      placeholder="Ketik/Tempel Kode (Contoh: LFP-FTX-... atau Token TIX-...)"
                      className="w-full p-4 border-2 border-ink bg-white font-mono text-sm sm:text-base font-bold focus:outline-none uppercase"
                    />
                    <span className="font-mono text-[11px] text-ink/60 mt-1 block">
                      * Sistem otomatis mengenali perbedaan huruf O dan angka 0 serta tanda hubung.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full py-3.5 bg-brand text-white font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                  >
                    {isScanning ? 'MEMVALIDASI KE DATABASE MYSQL...' : 'VALIDASI TIKET & BUKA TURNSTILE'}
                  </button>

                  {/* HASIL SCAN VALID */}
                  {scanResult === 'VALID' && (
                    <div className="p-5 bg-brand text-white border-2 border-ink font-mono text-sm shadow-brutal-sm space-y-3 animate-in fade-in">
                      <div className="font-black text-base sm:text-lg text-center flex items-center justify-center gap-2">
                        <CheckCircle2 size={24} />
                        <span>{scanMessage}</span>
                      </div>

                      {scanDetail && (
                        <div className="bg-white/10 p-3 border border-white/30 space-y-1 text-xs">
                          <div>Laga: <strong>{scanDetail.match}</strong></div>
                          <div>Pemegang Tiket: <strong>{scanDetail.holder_name}</strong></div>
                          <div>Gerbang: <strong>{scanDetail.gate}</strong> ({scanDetail.scanned_at})</div>
                          <div>Kode Order: <strong>{scanDetail.order_code}</strong></div>
                        </div>
                      )}

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleResetTicket(scanDetail?.order_code || scannerInput)}
                          disabled={isResettingTicket}
                          className="px-4 py-1.5 bg-white text-ink font-mono text-xs font-black uppercase border-2 border-ink shadow-brutal-xs hover:bg-gray-100 cursor-pointer"
                        >
                          🔄 Reset Status Tiket (Untuk Simulasi Demo)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* HASIL SCAN PERINGATAN GANDA / SUDAH DIGUNAKAN */}
                  {scanResult === 'DUPLICATE' && (
                    <div className="p-5 bg-[#fef08a] text-ink border-2 border-ink font-mono text-sm shadow-brutal-sm space-y-3 animate-in fade-in">
                      <div className="font-black text-sm sm:text-base text-danger flex items-start gap-2">
                        <AlertCircle size={22} className="shrink-0 mt-0.5 text-danger" />
                        <span>{scanMessage}</span>
                      </div>

                      <div className="p-3 bg-white border border-ink/40 text-xs text-ink/80">
                        Tiket ini sah namun telah melewati gerbang masuk sebelumnya. Turnstile tidak dibuka untuk mencegah penyalahgunaan duplikat tiket.
                      </div>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => handleResetTicket(scanDetail?.order_code || scannerInput)}
                          disabled={isResettingTicket}
                          className="w-full py-2.5 bg-ink text-white font-mono text-xs font-black uppercase border-2 border-ink shadow-brutal-xs hover:bg-gray-800 cursor-pointer"
                        >
                          🔄 Reset Status Tiket Ini (Agar Bisa Di-scan Ulang)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* HASIL SCAN TIDAK VALID */}
                  {scanResult === 'INVALID' && (
                    <div className="p-5 bg-danger text-white border-2 border-ink font-mono text-sm font-black text-center shadow-brutal-sm animate-in fade-in">
                      <div className="flex items-center justify-center gap-2 text-base sm:text-lg mb-1">
                        <AlertCircle size={22} />
                        <span>AKSES DITOLAK</span>
                      </div>
                      <p className="font-medium text-xs sm:text-sm">{scanMessage}</p>
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