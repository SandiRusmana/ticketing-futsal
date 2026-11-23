import { useState, useEffect, useMemo, useCallback } from 'react'
import DashboardSidebar from '../components/DashboardSidebar.jsx'
import { futsaltixApi } from '../services/futsaltixApi.js'
import {
  TrendingUp,
  Check,
  X,
  Search,
  RefreshCw,
  Download,
  Plus,
  Menu,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0)

export default function AdminDashboard() {
  const { navigateTo, openLoginModal, logout } = useNavigation()

  // 'OVERVIEW' | 'OPERATOR_APPROVAL' | 'SCHEDULE' | 'BRACKET' | 'SCANNER' | 'REFEREE'
  const [activeTab, setActiveTab] = useState('OVERVIEW')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State Overview MySQL
  const [overviewData, setOverviewData] = useState({
    grossRevenue: 0,
    totalTicketsSold: 0,
    capacityPercentage: 0,
    activeMatchesCount: 0,
    liveMatchesCount: 0,
    dailySales: [],
    recentTransactions: [],
  })

  // State Operator Approval MySQL
  const [operators, setOperators] = useState([])
  const [operatorFilter, setOperatorFilter] = useState('ALL')
  const [operatorSearch, setOperatorSearch] = useState('')
  const [showAddOperatorModal, setShowAddOperatorModal] = useState(false)
  const [newOpForm, setNewOpForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    affiliation: 'Panitia GGM Cianjur',
    gate: 'Gate A (Barat)',
  })

  // State Pertandingan & Kuota MySQL
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [matchSearch, setMatchSearch] = useState('')
  const [matchCategoryFilter, setMatchCategoryFilter] = useState('ALL')
  const [showAddMatchModal, setShowAddMatchModal] = useState(false)
  const [newMatchForm, setNewMatchForm] = useState({
    home_team_id: '',
    away_team_id: '',
    home_placeholder: '',
    away_placeholder: '',
    category: 'LFP (SMA/SMK)',
    stage: 'BABAK PENYISIHAN',
    arena: 'Court A (Vinyl), GGM Cianjur',
    gate: 'Gate A (Barat)',
    match_date: '2026-11-15',
    kickoff_time: '15:30',
    total_quota: 500,
    ticket_price: 15000,
    sales_status: 'OPEN',
  })

  const [noticeMessage, setNoticeMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const showNotice = (msg) => {
    setNoticeMessage(msg)
    setErrorMessage('')
    setTimeout(() => setNoticeMessage(''), 4000)
  }

  const showError = (msg) => {
    setErrorMessage(msg)
    setNoticeMessage('')
    setTimeout(() => setErrorMessage(''), 5000)
  }

  // ==================== FETCH DATA DARI LARAVEL + MYSQL ====================
  const fetchAllAdminData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [overviewRes, operatorsRes, matchesRes, teamsRes] = await Promise.all([
        futsaltixApi.adminOverview().catch(() => ({ data: {} })),
        futsaltixApi.adminOperators().catch(() => ({ data: [] })),
        futsaltixApi.getMatches().catch(() => ({ data: [] })),
        futsaltixApi.getTeams().catch(() => ({ data: [] })),
      ])

      const ov = overviewRes.data?.data || overviewRes.data || {}
      const rawOps = Array.isArray(operatorsRes.data)
        ? operatorsRes.data
        : operatorsRes.data?.data || []
      const rawMatches = Array.isArray(matchesRes.data)
        ? matchesRes.data
        : matchesRes.data?.data || []
      const rawTeams = Array.isArray(teamsRes.data)
        ? teamsRes.data
        : teamsRes.data?.data || []

      setOverviewData({
        grossRevenue: Number(ov.gross_revenue ?? ov.total_revenue ?? 0),
        totalTicketsSold: Number(ov.total_tickets_sold ?? ov.tickets_sold ?? 0),
        capacityPercentage: Number(ov.capacity_percentage ?? 0),
        activeMatchesCount: Number(ov.active_matches_count ?? rawMatches.length),
        liveMatchesCount: Number(
          ov.live_matches_count ?? rawMatches.filter((m) => m.match_status === 'LIVE').length
        ),
        dailySales: Array.isArray(ov.daily_sales) ? ov.daily_sales : [],
        recentTransactions: Array.isArray(ov.recent_transactions) ? ov.recent_transactions : [],
      })

      setOperators(rawOps)
      setMatches(rawMatches)
      setTeams(rawTeams)
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal memuat data dashboard admin dari server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllAdminData()
  }, [fetchAllAdminData])

  // ==================== OPERATOR ACTIONS ====================
  const handleApproveOperator = async (id) => {
    setIsSubmitting(true)
    try {
      await futsaltixApi.approveOperator(id)
      setOperators((prev) =>
        prev.map((op) => (op.id === id ? { ...op, approval_status: 'APPROVED', status: 'APPROVED' } : op))
      )
      showNotice(`Akun operator #${id} berhasil disetujui (ACC)! Kredensial aktif di gate.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyetujui operator.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectOperator = async (id) => {
    setIsSubmitting(true)
    try {
      await futsaltixApi.rejectOperator(id)
      setOperators((prev) =>
        prev.map((op) => (op.id === id ? { ...op, approval_status: 'REJECTED', status: 'REJECTED' } : op))
      )
      showNotice(`Akun operator #${id} telah ditolak.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menolak operator.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateOperator = async (e) => {
    e.preventDefault()
    if (!newOpForm.name.trim() || !newOpForm.email.trim()) return

    setIsSubmitting(true)
    try {
      const response = await futsaltixApi.createOperator({
        name: newOpForm.name.trim(),
        email: newOpForm.email.trim(),
        password: newOpForm.password || 'password123',
        affiliation: newOpForm.affiliation.trim() || 'Panitia GGM Cianjur',
        assigned_gate: newOpForm.gate,
        approval_status: 'APPROVED',
      })

      const created = response.data?.operator || response.data?.data || response.data
      if (created?.id) {
        setOperators((prev) => [created, ...prev])
      } else {
        await fetchAllAdminData()
      }

      setShowAddOperatorModal(false)
      setNewOpForm({
        name: '',
        email: '',
        password: 'password123',
        affiliation: 'Panitia GGM Cianjur',
        gate: 'Gate A (Barat)',
      })
      showNotice(`Operator baru "${newOpForm.name}" berhasil disimpan ke database dan langsung aktif!`)
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal membuat akun operator baru.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== MATCH & QUOTA ACTIONS ====================
  const handleToggleMatchStatus = async (id) => {
    try {
      const res = await futsaltixApi.toggleMatchSales(id)
      const updated = res.data?.match || res.data?.data
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m
          const nextStatus =
            updated?.sales_status || (m.sales_status === 'OPEN' ? 'CLOSED' : 'OPEN')
          return { ...m, sales_status: nextStatus }
        })
      )
      showNotice(`Status penjualan tiket match #${id} diperbarui di MySQL!`)
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal mengubah status penjualan tiket.')
    }
  }

  const handleDeleteMatch = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pertandingan ini dari database?')) return
    try {
      await futsaltixApi.deleteMatch(id)
      setMatches((prev) => prev.filter((m) => m.id !== id))
      showNotice(`Pertandingan #${id} berhasil dihapus dari database!`)
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menghapus pertandingan.')
    }
  }

  const handleCreateMatch = async (e) => {
    e.preventDefault()
    if (!newMatchForm.home_team_id && !newMatchForm.home_placeholder.trim()) {
      showError('Pilih Tim Home atau isi nama tim home terlebih dahulu.')
      return
    }
    if (!newMatchForm.away_team_id && !newMatchForm.away_placeholder.trim()) {
      showError('Pilih Tim Away atau isi nama tim away terlebih dahulu.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        home_team_id: newMatchForm.home_team_id ? Number(newMatchForm.home_team_id) : null,
        away_team_id: newMatchForm.away_team_id ? Number(newMatchForm.away_team_id) : null,
        home_placeholder: newMatchForm.home_placeholder.trim() || null,
        away_placeholder: newMatchForm.away_placeholder.trim() || null,
        category: newMatchForm.category,
        stage: newMatchForm.stage,
        arena: newMatchForm.arena,
        gate: newMatchForm.arena.includes('Court A') ? 'Gate A (Barat)' : 'Gate B (Timur)',
        match_date: newMatchForm.match_date,
        kickoff_time: newMatchForm.kickoff_time,
        total_quota: Number(newMatchForm.total_quota),
        remaining_quota: Number(newMatchForm.total_quota),
        ticket_price: Number(newMatchForm.ticket_price),
        sales_status: 'OPEN',
        match_status: 'UPCOMING',
      }

      const res = await futsaltixApi.createMatch(payload)
      const created = res.data?.match || res.data?.data
      if (created?.id) {
        setMatches((prev) => [created, ...prev])
      } else {
        await fetchAllAdminData()
      }

      setShowAddMatchModal(false)
      setNewMatchForm({
        home_team_id: '',
        away_team_id: '',
        home_placeholder: '',
        away_placeholder: '',
        category: 'LFP (SMA/SMK)',
        stage: 'BABAK PENYISIHAN',
        arena: 'Court A (Vinyl), GGM Cianjur',
        gate: 'Gate A (Barat)',
        match_date: '2026-11-15',
        kickoff_time: '15:30',
        total_quota: 500,
        ticket_price: 20000,
        sales_status: 'OPEN',
      })
      showNotice('Pertandingan baru berhasil dipublikasikan ke jadwal & ticketing!')
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal membuat pertandingan baru.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export CSV langsung dari data transaksi MySQL
  const handleDownloadCsv = () => {
    const rows = [
      ['Order Code', 'Pembeli', 'Pertandingan', 'Jumlah Tiket', 'Total Bayar', 'Status'],
      ...overviewData.recentTransactions.map((tx) => [
        tx.order_code || tx.id,
        tx.buyer_name || tx.user?.name || '-',
        tx.match_title || '-',
        tx.quantity || tx.tickets_count || 1,
        tx.total_amount || 0,
        tx.payment_status || 'PAID',
      ]),
    ]
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `rekap-futsaltix-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotice('File CSV rekap transaksi berhasil diunduh!')
  }

  // Filtered Operators
  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      const status = op.approval_status || op.status || 'PENDING'
      if (operatorFilter === 'PENDING' && status !== 'PENDING') return false
      if (operatorFilter === 'APPROVED' && status !== 'APPROVED') return false
      if (operatorSearch.trim()) {
        const query = operatorSearch.toLowerCase()
        const matchName = (op.name || '').toLowerCase().includes(query)
        const matchEmail = (op.email || '').toLowerCase().includes(query)
        const matchAff = (op.affiliation || '').toLowerCase().includes(query)
        if (!matchName && !matchEmail && !matchAff) return false
      }
      return true
    })
  }, [operators, operatorFilter, operatorSearch])

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (matchCategoryFilter !== 'ALL' && m.category !== matchCategoryFilter) return false
      if (matchSearch.trim()) {
        const query = matchSearch.toLowerCase()
        const homeName = (m.home_team?.name || m.home_placeholder || '').toLowerCase()
        const awayName = (m.away_team?.name || m.away_placeholder || '').toLowerCase()
        if (!homeName.includes(query) && !awayName.includes(query)) return false
      }
      return true
    })
  }, [matches, matchSearch, matchCategoryFilter])

  const pendingCount = operators.filter(
    (o) => (o.approval_status || o.status) === 'PENDING'
  ).length

  const maxDailyCount = Math.max(
    1,
    ...overviewData.dailySales.map((d) => Number(d.count || d.tickets || 0))
  )

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f8faf9] text-ink font-sans">
      {/* 1. FIXED SIDEBAR KIRI */}
      <DashboardSidebar
        role="admin"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOperatorCount={pendingCount}
        onExit={logout}
        onSwitchRole={openLoginModal}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. MAIN WORKSPACE AREA */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar flex flex-col justify-between bg-[#f8faf9] md:ml-[320px]">
        <div className="p-3 sm:p-6 lg:p-8 2xl:p-10 max-w-[1440px] 2xl:max-w-[1560px] mx-auto w-full space-y-4 sm:space-y-6">
          {/* A. TOP BAR / WORKSPACE HEADER */}
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
                    {activeTab === 'OVERVIEW' && 'SUPER ADMIN // MYSQL LIVE'}
                    {activeTab === 'OPERATOR_APPROVAL' && 'OPERATOR // PERSETUJUAN'}
                    {activeTab === 'SCHEDULE' && 'JADWAL & TIKET // ADMIN'}
                    {activeTab === 'REFEREE' && 'MEJA WASIT // KONTROL SKOR'}
                    {activeTab === 'BRACKET' && 'BAGAN // BRACKET GENERATOR'}
                    {activeTab === 'SCANNER' && 'SCANNER // TURNSTILE GATE'}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight break-words">
                  {activeTab === 'OVERVIEW' && 'ADMIN OVERVIEW'}
                  {activeTab === 'OPERATOR_APPROVAL' && 'PERSETUJUAN OPERATOR'}
                  {activeTab === 'SCHEDULE' && 'KELOLA PERTANDINGAN & KUOTA'}
                  {activeTab === 'REFEREE' && 'PAPAN KONTROL MEJA WASIT'}
                  {activeTab === 'BRACKET' && 'BAGAN TURNAMEN GUGUR'}
                  {activeTab === 'SCANNER' && 'PEMINDAI GATE TURNSTILE'}
                </h1>
                <p className="font-sans text-xs sm:text-base text-ink/80 font-bold mt-1">
                  {activeTab === 'OVERVIEW' && 'Ringkasan performa penjualan tiket GGM Cianjur secara real-time'}
                  {activeTab === 'OPERATOR_APPROVAL' && 'Kelola izin akses akun panitia dan operator gate venue GGM Cianjur'}
                  {activeTab === 'SCHEDULE' && 'Atur jadwal pertandingan, kategori tiket, dan kuota GGM Cianjur'}
                  {activeTab === 'REFEREE' && 'Kontrol pencatatan skor real-time pertandingan futsal se-Kabupaten Cianjur'}
                  {activeTab === 'BRACKET' && 'Penetapan slot pertandingan babak penyisihan hingga Grand Final'}
                  {activeTab === 'SCANNER' && 'Validasi QR Code e-tiket penonton langsung di pintu masuk GGM'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="border-2 border-ink bg-white px-3 sm:px-5 py-2 sm:py-3 font-mono text-xs sm:text-base font-black uppercase text-ink shadow-brutal-sm">
                  NOV 2026 • GGM CIANJUR
                </div>

                {activeTab === 'OPERATOR_APPROVAL' && (
                  <button
                    type="button"
                    onClick={() => setShowAddOperatorModal(true)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-brand text-white font-mono text-xs sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus size={18} />
                    <span>+ TAMBAH OPERATOR</span>
                  </button>
                )}

                {activeTab === 'SCHEDULE' && (
                  <button
                    type="button"
                    onClick={() => setShowAddMatchModal(true)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-brand text-white font-mono text-xs sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus size={18} />
                    <span>+ TAMBAH MATCH BARU</span>
                  </button>
                )}

                {activeTab === 'OVERVIEW' && (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-3 bg-white text-ink font-mono text-xs sm:text-base font-black uppercase border-2 border-ink shadow-brutal-sm hover:bg-surface flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                    >
                      <Download size={16} className="text-brand shrink-0" />
                      <span>Unduh CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetchAllAdminData()
                        showNotice('Data dashboard & telemetri GGM Cianjur telah disinkronkan dari MySQL!')
                      }}
                      className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-3 bg-brand text-white font-mono text-xs sm:text-base font-black uppercase border-2 border-ink shadow-brutal-sm hover:bg-brand-dark flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                    >
                      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                      <span>Sync</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Notice & Error Banners */}
          {noticeMessage && (
            <div className="p-4 bg-brand-light text-brand font-mono text-sm sm:text-base font-black border-2 border-brand shadow-brutal-sm flex items-center justify-between">
              <span>{noticeMessage}</span>
              <button type="button" onClick={() => setNoticeMessage('')} className="font-bold text-ink text-base cursor-pointer">✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-danger-soft text-danger font-mono text-sm sm:text-base font-black border-2 border-danger shadow-brutal-sm flex items-center justify-between">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')} className="font-bold text-ink text-base cursor-pointer">✕</button>
            </div>
          )}

          {isLoading ? (
            <div className="border-2 border-ink bg-white p-12 text-center shadow-brutal-sm font-mono">
              <Loader2 size={36} className="mx-auto animate-spin text-brand mb-3" />
              <p className="font-black uppercase text-base">Memuat Data Real-Time dari MySQL...</p>
            </div>
          ) : (
            <>
              {/* =====================================================================
                  1. TAB: OVERVIEW
                  ===================================================================== */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* ROW 1: 4 STAT CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                          Total Pendapatan
                        </span>
                        <div className="mt-2 font-display text-3xl sm:text-4xl font-black text-ink tracking-tight">
                          {formatRupiah(overviewData.grossRevenue)}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between font-mono text-sm font-black text-ink/80">
                        <span>PENDAPATAN TIKET</span>
                        <span className="text-brand font-black flex items-center gap-1">
                          <TrendingUp size={18} /> LIVE DB
                        </span>
                      </div>
                    </div>

                    <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                          Tiket Terjual
                        </span>
                        <div className="mt-2 font-display text-4xl sm:text-5xl font-black text-ink tracking-tight">
                          {overviewData.totalTicketsSold}{' '}
                          <span className="text-xl sm:text-2xl font-mono font-black text-ink/60">Tiket</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between font-mono text-sm font-black text-ink/80">
                        <span>TOTAL TIKET LUNAS</span>
                        <span className="bg-[#dcfce7] text-brand px-2.5 py-0.5 border border-brand text-xs sm:text-sm font-black">
                          {overviewData.capacityPercentage}% GGM
                        </span>
                      </div>
                    </div>

                    <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                          Total Jadwal Laga
                        </span>
                        <div className="mt-2 font-display text-4xl sm:text-5xl font-black text-ink tracking-tight flex items-center gap-2">
                          <span>{matches.length}</span>
                          {overviewData.liveMatchesCount > 0 && (
                            <span className="h-4 w-4 rounded-full bg-danger animate-ping ml-1" />
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between font-mono text-sm font-black text-ink/80">
                        <span>PERTANDINGAN</span>
                        <span className="bg-danger text-white px-2.5 py-0.5 text-xs sm:text-sm font-black">
                          {overviewData.liveMatchesCount} LIVE NOW
                        </span>
                      </div>
                    </div>

                    <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-sm sm:text-base font-black uppercase text-ink/70 block">
                          Operator Pending
                        </span>
                        <div className="mt-2 font-display text-4xl sm:text-5xl font-black text-ink tracking-tight">
                          {pendingCount}
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('OPERATOR_APPROVAL')}
                          className="w-full py-3 px-4 bg-[#fef08a] text-ink font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-yellow-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <span>{pendingCount} Menunggu ACC</span>
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
                        PANEL AKSES CEPAT PUSAT KENDALI
                      </span>
                      <span className="font-mono text-xs sm:text-sm text-ink/80 font-bold">Pilih modul tugas operasional</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab('REFEREE')}
                        className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <span>⏱️ Meja Wasit Live</span>
                        <ArrowRight size={18} className="text-brand group-hover:text-white shrink-0 sm:size-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('SCHEDULE')}
                        className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <span>📅 Tambah Match Baru</span>
                        <ArrowRight size={18} className="text-brand group-hover:text-white shrink-0 sm:size-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('OPERATOR_APPROVAL')}
                        className="p-3.5 sm:p-5 bg-surface hover:bg-brand hover:text-white border-2 border-ink shadow-brutal font-mono text-sm sm:text-lg font-black uppercase text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <span>👥 Persetujuan Operator</span>
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

                  {/* ROW 2: GRAFIK PENJUALAN TIKET HARIAN */}
                  <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-ink gap-2">
                      <div>
                        <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
                          GRAFIK PENJUALAN TIKET HARIAN
                        </h3>
                        <p className="font-mono text-sm text-ink/80 font-bold mt-0.5">
                          Distribusi tiket terjual langsung dari tabel orders MySQL
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm font-black">
                        <span className="w-4 h-4 bg-brand inline-block border border-ink" />
                        <span>TIKET TERJUAL</span>
                      </div>
                    </div>

                    {overviewData.dailySales.length === 0 ? (
                      <div className="mt-6 border-2 border-dashed border-ink/30 bg-surface p-8 text-center font-mono text-sm font-bold text-ink/70">
                        Belum ada data penjualan tiket harian yang tercatat di database.
                      </div>
                    ) : (
                      <div className="mt-6 mb-2">
                        <div className="h-72 flex items-end justify-between gap-3 sm:gap-6 pt-10 pb-4 px-5 border-b-2 border-l-2 border-ink bg-surface relative">
                          {overviewData.dailySales.map((item, idx) => {
                            const count = Number(item.count || item.tickets || 0)
                            const pct = Math.max(12, Math.round((count / maxDailyCount) * 95))
                            const isPeak = count === maxDailyCount && count > 0

                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end z-10">
                                <span className="font-mono text-sm sm:text-base font-black text-ink mb-1.5">
                                  {count}
                                </span>
                                <div
                                  className={`w-full max-w-[56px] border-2 border-ink transition-all shadow-brutal-sm ${
                                    isPeak ? 'bg-brand' : 'bg-brand/85 hover:bg-brand'
                                  }`}
                                  style={{ height: `${pct}%` }}
                                />
                                <span
                                  className={`font-mono text-xs sm:text-sm mt-2.5 font-black ${
                                    isPeak ? 'text-brand' : 'text-ink'
                                  }`}
                                >
                                  {item.day || item.date}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROW 3: TABEL TRANSAKSI TERBARU */}
                  <div className="border-2 border-ink bg-white shadow-brutal-sm">
                    <div className="p-5 border-b-2 border-ink flex items-center justify-between">
                      <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
                        TRANSAKSI TERBARU
                      </h3>
                      <span className="font-mono text-sm text-ink/80 font-bold">
                        {overviewData.recentTransactions.length} transaksi tercatat
                      </span>
                    </div>

                    {overviewData.recentTransactions.length === 0 ? (
                      <div className="p-8 text-center font-mono text-sm font-bold text-ink/70">
                        Belum ada transaksi pembelian tiket di database MySQL.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-sans text-sm sm:text-base">
                          <thead>
                            <tr className="bg-surface border-b-2 border-ink font-mono text-xs sm:text-sm uppercase text-ink font-black">
                              <th className="p-4">KODE ORDER</th>
                              <th className="p-4">PEMBELI</th>
                              <th className="p-4">PERTANDINGAN</th>
                              <th className="p-4">TIKET</th>
                              <th className="p-4">TOTAL</th>
                              <th className="p-4 text-right">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-ink bg-white font-mono text-sm sm:text-base">
                            {overviewData.recentTransactions.map((tx) => (
                              <tr key={tx.id || tx.order_code} className="hover:bg-surface transition-colors">
                                <td className="p-4 font-black text-ink font-mono">
                                  {tx.order_code || `#${tx.id}`}
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-ink block font-sans text-base">
                                    {tx.buyer_name || tx.user?.name || 'Suporter'}
                                  </span>
                                  <span className="text-xs sm:text-sm text-ink/70 font-semibold">
                                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-'}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-ink font-sans">
                                  {tx.match_title || 'Pertandingan Futsal GGM'}
                                </td>
                                <td className="p-4 font-black text-ink">
                                  {tx.quantity || tx.tickets_count || 1}
                                </td>
                                <td className="p-4 font-black text-ink">
                                  {formatRupiah(tx.total_amount)}
                                </td>
                                <td className="p-4 text-right">
                                  <span className="bg-brand text-white px-3.5 py-1.5 font-black text-xs sm:text-sm uppercase border border-ink shadow-brutal-sm inline-block">
                                    {tx.payment_status || 'PAID'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =====================================================================
                  2. TAB: PERSETUJUAN OPERATOR
                  ===================================================================== */}
              {activeTab === 'OPERATOR_APPROVAL' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-2 border-ink bg-white p-3.5 sm:p-6 shadow-brutal-sm">
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 font-mono text-xs sm:text-base font-black w-full lg:w-auto">
                      <button
                        type="button"
                        onClick={() => setOperatorFilter('ALL')}
                        className={`flex-1 sm:flex-initial text-center px-3 sm:px-6 py-2.5 sm:py-3.5 border-2 border-ink uppercase cursor-pointer transition-all ${
                          operatorFilter === 'ALL'
                            ? 'bg-ink text-white shadow-brutal-sm'
                            : 'bg-surface hover:bg-white text-ink'
                        }`}
                      >
                        SEMUA OPERATOR ({operators.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperatorFilter('PENDING')}
                        className={`flex-1 sm:flex-initial text-center px-3 sm:px-6 py-2.5 sm:py-3.5 border-2 border-ink uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
                          operatorFilter === 'PENDING'
                            ? 'bg-brand text-white shadow-brutal-sm'
                            : 'bg-surface hover:bg-white text-ink'
                        }`}
                      >
                        PENDING APPROVAL ({pendingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperatorFilter('APPROVED')}
                        className={`flex-1 sm:flex-initial text-center px-3 sm:px-6 py-2.5 sm:py-3.5 border-2 border-ink uppercase cursor-pointer transition-all ${
                          operatorFilter === 'APPROVED'
                            ? 'bg-brand text-white shadow-brutal-sm'
                            : 'bg-surface hover:bg-white text-ink'
                        }`}
                      >
                        DISETUJUI (
                        {
                          operators.filter((o) => (o.approval_status || o.status) === 'APPROVED')
                            .length
                        }
                        )
                      </button>
                    </div>

                    <div className="relative w-full lg:w-auto min-w-0 lg:min-w-[300px]">
                      <input
                        type="text"
                        value={operatorSearch}
                        onChange={(e) => setOperatorSearch(e.target.value)}
                        placeholder="Cari nama atau email operator..."
                        className="w-full bg-surface border-2 border-ink py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 font-mono text-sm sm:text-base font-bold text-ink focus:bg-white focus:outline-none"
                      />
                      <Search size={18} className="absolute left-3.5 top-3 sm:top-3.5 text-ink/60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* KOLOM KIRI: DAFTAR OPERATOR */}
                    <div className="lg:col-span-8 space-y-5">
                      <div className="flex items-center justify-between font-mono text-base sm:text-lg font-black text-ink pb-1">
                        <span>DAFTAR OPERATOR ({filteredOperators.length} akun)</span>
                        <span className="text-sm font-bold text-ink/80">Sinkronisasi MySQL</span>
                      </div>

                      {filteredOperators.length === 0 ? (
                        <div className="border-2 border-ink bg-white p-8 text-center font-mono text-sm font-bold text-ink/70 shadow-brutal-sm">
                          Tidak ada akun operator yang sesuai filter.
                        </div>
                      ) : (
                        filteredOperators.map((op) => {
                          const status = op.approval_status || op.status || 'PENDING'
                          const isPending = status === 'PENDING'
                          const isApproved = status === 'APPROVED'
                          const initials = (op.name || 'OP').slice(0, 2).toUpperCase()

                          return (
                            <div
                              key={op.id}
                              className="border-2 border-ink bg-white p-6 sm:p-7 shadow-brutal-sm space-y-5"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-ink text-white border-2 border-ink flex items-center justify-center font-black text-xl shrink-0 shadow-brutal-sm">
                                    {initials}
                                  </div>
                                  <div>
                                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink">
                                      {op.name}
                                    </h3>
                                    <p className="font-mono text-base sm:text-lg text-ink font-bold mt-0.5">
                                      {op.email}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`self-start sm:self-auto px-4 py-2 font-mono text-xs sm:text-sm font-black uppercase border-2 border-ink shadow-brutal-sm ${
                                    isPending
                                      ? 'bg-ink text-white'
                                      : isApproved
                                      ? 'bg-brand text-white'
                                      : 'bg-danger text-white'
                                  }`}
                                >
                                  {isPending
                                    ? 'PENDING APPROVAL'
                                    : isApproved
                                    ? 'DISETUJUI'
                                    : 'DITOLAK'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-surface border-2 border-ink font-mono">
                                <div>
                                  <span className="text-ink/80 block text-xs sm:text-sm font-black uppercase tracking-wider mb-1.5">
                                    ASAL INSTANSI / SEKOLAH
                                  </span>
                                  <span className="font-black text-ink text-base sm:text-lg">
                                    {op.affiliation || 'Panitia GGM Cianjur'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-ink/80 block text-xs sm:text-sm font-black uppercase tracking-wider mb-1.5">
                                    PENEMPATAN GATE
                                  </span>
                                  <span className="font-black text-ink text-base sm:text-lg">
                                    {op.assigned_gate || op.gate || 'Gate A (Barat)'}
                                  </span>
                                </div>
                              </div>

                              {isPending ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                                  <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleApproveOperator(op.id)}
                                    className="sm:col-span-2 py-4 px-6 bg-brand text-white font-mono text-base sm:text-lg font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                                  >
                                    <Check size={20} />
                                    <span>✓ ACC / APPROVE</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleRejectOperator(op.id)}
                                    className="py-4 px-6 bg-white text-danger font-mono text-base sm:text-lg font-black uppercase border-2 border-danger shadow-brutal hover:bg-red-50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                                  >
                                    <X size={20} />
                                    <span>✕ TOLAK</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="pt-1 font-mono text-base font-black">
                                  <span className={isApproved ? 'text-brand' : 'text-danger'}>
                                    {isApproved
                                      ? '✓ Akses operator aktif di Meja Wasit & Gate Scanner'
                                      : '✕ Akses akun operator dinonaktifkan'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* KOLOM KANAN: RINGKASAN OPERATOR & GATE */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm space-y-5">
                        <h4 className="font-display text-lg sm:text-xl font-black uppercase text-ink">
                          RINGKASAN OPERATOR
                        </h4>

                        <div className="grid grid-cols-3 gap-3 text-center font-mono">
                          <div className="p-4 bg-brand text-white border-2 border-ink shadow-brutal-sm">
                            <span className="font-display text-4xl font-black block">
                              {
                                operators.filter(
                                  (o) => (o.approval_status || o.status) === 'APPROVED'
                                ).length
                              }
                            </span>
                            <span className="text-xs font-black tracking-wider block mt-1.5">
                              AKTIF
                            </span>
                          </div>
                          <div className="p-4 bg-ink text-white border-2 border-ink shadow-brutal-sm">
                            <span className="font-display text-4xl font-black block">
                              {operators.length}
                            </span>
                            <span className="text-xs font-black tracking-wider block mt-1.5">
                              TOTAL
                            </span>
                          </div>
                          <div className="p-4 bg-white text-ink border-2 border-ink shadow-brutal-sm">
                            <span className="font-display text-4xl font-black block text-danger">
                              {pendingCount}
                            </span>
                            <span className="text-xs font-black tracking-wider block mt-1.5">
                              PENDING
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-2 border-ink bg-white p-6 shadow-brutal-sm space-y-5 font-mono">
                        <h4 className="font-display text-lg sm:text-xl font-black uppercase text-ink">
                          GATE STATUS
                        </h4>

                        <div className="p-4 bg-surface border-2 border-ink flex items-center justify-between">
                          <div>
                            <span className="font-black block text-base sm:text-lg">GGM Cianjur</span>
                            <span className="text-xs sm:text-sm text-ink/80 font-bold">
                              Turnstile gates • MySQL Live
                            </span>
                          </div>
                          <span className="bg-brand text-white px-4 py-1.5 text-xs sm:text-sm font-black uppercase flex items-center gap-2 border border-ink">
                            <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" /> ONLINE
                          </span>
                        </div>

                        <div className="space-y-3 pt-1 font-black">
                          <div className="flex justify-between py-2 border-b border-ink/20 text-base">
                            <span className="text-ink/80">Gate A — Barat</span>
                            <span className="text-brand font-black">● Operasional</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-ink/20 text-base">
                            <span className="text-ink/80">Gate B — Timur</span>
                            <span className="text-brand font-black">● Operasional</span>
                          </div>
                          <div className="flex justify-between py-2 text-base">
                            <span className="text-ink/80">Gate VIP &amp; Media</span>
                            <span className="text-brand font-black">● Operasional</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  3. TAB: KELOLA PERTANDINGAN & KUOTA
                  ===================================================================== */}
              {activeTab === 'SCHEDULE' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-2 border-ink bg-white p-5 sm:p-6 shadow-brutal-sm">
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        value={matchSearch}
                        onChange={(e) => setMatchSearch(e.target.value)}
                        placeholder="Cari pertandingan atau nama sekolah..."
                        className="w-full bg-surface border-2 border-ink py-3 pl-11 pr-4 font-mono text-sm sm:text-base font-bold text-ink focus:bg-white focus:outline-none"
                      />
                      <Search size={18} className="absolute left-3.5 top-3.5 text-ink/60" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-brand text-white border-2 border-ink px-4 py-2.5 font-mono text-xs sm:text-sm font-black uppercase shadow-brutal-sm flex items-center gap-2">
                        <span>LFP 2026 (LIGA FUTSAL PELAJAR)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAddMatchModal(true)}
                        className="px-6 py-3 bg-brand text-white font-mono text-sm sm:text-base font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Plus size={18} />
                        <span>+ TAMBAH MATCH BARU</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-2 border-ink bg-white shadow-brutal-sm">
                    <div className="p-5 sm:p-6 border-b-2 border-ink flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
                          DAFTAR PERTANDINGAN (MYSQL)
                        </h3>
                        <p className="font-mono text-sm text-ink/80 font-bold mt-0.5">
                          {filteredMatches.length} pertandingan •{' '}
                          {filteredMatches.filter((m) => m.sales_status === 'OPEN').length} open •{' '}
                          {filteredMatches.filter((m) => m.sales_status !== 'OPEN').length} closed
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse font-sans text-sm sm:text-base">
                        <thead>
                          <tr className="bg-surface border-b-2 border-ink font-mono text-xs sm:text-sm uppercase text-ink font-black">
                            <th className="p-4">Kode</th>
                            <th className="p-4">Pertandingan</th>
                            <th className="p-4">Tanggal &amp; Jam</th>
                            <th className="p-4">Kategori &amp; Harga</th>
                            <th className="p-4">Kuota Terjual</th>
                            <th className="p-4">Status Sales</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-ink bg-white font-mono text-sm sm:text-base">
                          {filteredMatches.map((m) => {
                            const total = Number(m.total_quota || 500)
                            const remaining = Number(m.remaining_quota ?? total)
                            const sold = Math.max(0, total - remaining)
                            const percent = Math.min(100, Math.round((sold / Math.max(1, total)) * 100))
                            const isOpen = m.sales_status === 'OPEN'
                            const homeName = m.home_team?.name || m.home_placeholder || 'Tim Home'
                            const awayName = m.away_team?.name || m.away_placeholder || 'Tim Away'

                            return (
                              <tr key={m.id} className="hover:bg-surface transition-colors">
                                <td className="p-4 w-20">
                                  <div className="w-14 h-16 bg-ink text-white border-2 border-ink flex flex-col items-center justify-center p-1 text-center font-display font-black leading-none shadow-brutal-sm">
                                    <span className="text-[11px] text-[#79db8d] font-mono font-black">
                                      MTCH
                                    </span>
                                    <span className="text-sm mt-1">#{m.id}</span>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <p className="font-display font-black text-base sm:text-lg text-ink">
                                    {homeName} vs {awayName}
                                  </p>
                                  <span className="font-mono text-xs sm:text-sm text-ink/70 font-bold block mt-0.5">
                                    {m.stage} • {m.arena}
                                  </span>
                                </td>

                                <td className="p-4 text-sm sm:text-base">
                                  <div className="font-black text-ink">{m.match_date}</div>
                                  <div className="text-ink/70 font-semibold">{m.kickoff_time} WIB</div>
                                </td>

                                <td className="p-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="bg-ink text-white px-2.5 py-1 text-xs font-black uppercase text-center border border-ink inline-block w-24">
                                      {m.category}
                                    </span>
                                    <span className="bg-white text-ink px-2.5 py-1 text-xs font-bold uppercase text-center border border-ink inline-block w-24">
                                      {formatRupiah(m.ticket_price)}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-4 min-w-[160px]">
                                  <div className="font-display font-black text-base text-ink">
                                    {sold} / {total}
                                  </div>
                                  <div className="w-full bg-surface border-2 border-ink h-3 mt-1.5 overflow-hidden">
                                    <div className="bg-brand h-full" style={{ width: `${percent}%` }} />
                                  </div>
                                  <span className="text-xs font-black text-ink/80 mt-1 block">
                                    {percent}% TERJUAL
                                  </span>
                                </td>

                                <td className="p-4">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMatchStatus(m.id)}
                                    className={`px-3.5 py-1.5 border-2 border-ink font-mono text-xs sm:text-sm font-black uppercase flex items-center gap-2 cursor-pointer shadow-brutal-sm ${
                                      isOpen ? 'bg-brand text-white' : 'bg-gray-300 text-ink'
                                    }`}
                                  >
                                    <span>{isOpen ? 'OPEN' : 'CLOSED'}</span>
                                    <span
                                      className={`w-3 h-3 border border-ink ${
                                        isOpen ? 'bg-white' : 'bg-ink'
                                      }`}
                                    />
                                  </button>
                                  <span className="text-xs text-ink/70 font-bold block mt-1">
                                    {isOpen ? 'Penjualan aktif' : 'Penjualan ditutup'}
                                  </span>
                                </td>

                                <td className="p-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMatch(m.id)}
                                    className="px-3 py-1.5 bg-white text-danger border-2 border-danger shadow-brutal-sm hover:bg-red-50 font-black text-xs sm:text-sm cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  4. TAB: MEJA WASIT & SKOR
                  ===================================================================== */}
              {activeTab === 'REFEREE' && (
                <div className="border-2 border-ink bg-white p-6 sm:p-8 shadow-brutal-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b-2 border-ink gap-3">
                    <div>
                      <span className="bg-brand text-white px-3 py-1 font-mono text-xs sm:text-sm font-black uppercase border border-ink">
                        MODUL MEJA WASIT REAL-TIME
                      </span>
                      <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink mt-2">
                        PAPAN KONTROL SKOR, TIMER &amp; FOUL GGM CIANJUR
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo(PAGE_NAMES.OPERATOR)}
                      className="px-6 py-3 border-2 border-ink bg-brand text-white font-mono text-sm font-black uppercase cursor-pointer shadow-brutal-sm hover:bg-brand-dark"
                    >
                      Buka Console Meja Wasit ↗
                    </button>
                  </div>
                  <p className="font-mono text-base text-ink/80 font-bold">
                    Setiap gol, pelanggaran, pergantian babak, dan hasil akhir yang dicatat di Meja Wasit langsung tersimpan ke database MySQL dan memajukan pemenang di Bagan Turnamen.
                  </p>
                </div>
              )}

              {/* =====================================================================
                  5. TAB: BAGAN & BRACKET
                  ===================================================================== */}
              {activeTab === 'BRACKET' && (
                <div className="border-2 border-ink bg-white p-6 sm:p-8 shadow-brutal-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b-2 border-ink gap-3">
                    <div>
                      <span className="bg-brand text-white px-3 py-1 font-mono text-xs sm:text-sm font-black uppercase border border-ink">
                        PIALA BUPATI CIANJUR 2026
                      </span>
                      <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink mt-2">
                        BAGAN BABAK GUGUR &amp; PAIRING BRACKET
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo(PAGE_NAMES.BRACKET)}
                      className="px-6 py-3 border-2 border-ink bg-ink text-white font-mono text-sm font-black uppercase cursor-pointer shadow-brutal-sm"
                    >
                      Buka Bagan Publik ↗
                    </button>
                  </div>
                  <p className="font-mono text-base text-ink/80 font-bold">
                    Slot bagan turnamen otomatis tersinkronisasi dengan hasil pertandingan di MySQL.
                  </p>
                </div>
              )}

              {/* =====================================================================
                  6. TAB: SCANNER GATE
                  ===================================================================== */}
              {activeTab === 'SCANNER' && (
                <div className="border-2 border-ink bg-white p-6 sm:p-8 shadow-brutal-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b-2 border-ink gap-3">
                    <div>
                      <span className="bg-brand text-white px-3 py-1 font-mono text-xs sm:text-sm font-black uppercase border border-ink">
                        TURNSTILE GATE RELAY // MYSQL LIVE
                      </span>
                      <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink mt-2">
                        ANTARMUKA PEMINDAI TIKET LAPANGAN
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo(PAGE_NAMES.OPERATOR_SCANNER)}
                      className="px-6 py-3 border-2 border-ink bg-brand text-white font-mono text-sm font-black uppercase cursor-pointer shadow-brutal-sm hover:bg-brand-dark"
                    >
                      Buka Mode Scanner Fullscreen ↗
                    </button>
                  </div>
                  <p className="font-mono text-base text-ink/80 font-bold">
                    Gunakan perangkat mobile atau barcode scanner USB untuk memvalidasi QR Code e-tiket penonton di pintu masuk GGM.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER WORKSPACE */}
        <footer className="p-5 sm:p-6 border-t-2 border-ink bg-white text-center font-mono text-xs sm:text-sm text-ink/80 font-bold">
          DISPARPORA CIANJUR &amp; AFKAB PSSI CIANJUR // SISTEM MANAJEMEN TIKET &amp; MEJA WASIT GGM
        </footer>
      </main>

      {/* =========================================================================
          MODAL TAMBAH OPERATOR
          ========================================================================= */}
      {showAddOperatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl border-[3px] border-ink bg-white p-6 sm:p-8 shadow-brutal-lg">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4 mb-5">
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                + TAMBAH OPERATOR GATE BARU
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOperatorModal(false)}
                className="font-mono text-base font-black p-1.5 hover:bg-surface border-2 border-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="space-y-4 font-mono text-sm">
              <div>
                <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                  NAMA LENGKAP OPERATOR
                </label>
                <input
                  type="text"
                  required
                  value={newOpForm.name}
                  onChange={(e) => setNewOpForm({ ...newOpForm, name: e.target.value })}
                  placeholder="Nama petugas..."
                  className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                  EMAIL RESMI
                </label>
                <input
                  type="email"
                  required
                  value={newOpForm.email}
                  onChange={(e) => setNewOpForm({ ...newOpForm, email: e.target.value })}
                  placeholder="operator@futsaltix.id"
                  className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                  PASSWORD LOGIN
                </label>
                <input
                  type="text"
                  required
                  value={newOpForm.password}
                  onChange={(e) => setNewOpForm({ ...newOpForm, password: e.target.value })}
                  className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                  INSTANSI / ASOSIASI
                </label>
                <input
                  type="text"
                  value={newOpForm.affiliation}
                  onChange={(e) => setNewOpForm({ ...newOpForm, affiliation: e.target.value })}
                  placeholder="AFKAB Cianjur / Komisi Wasit"
                  className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                  PENEMPATAN GATE
                </label>
                <select
                  value={newOpForm.gate}
                  onChange={(e) => setNewOpForm({ ...newOpForm, gate: e.target.value })}
                  className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Gate A (Barat)">Gate A (Barat)</option>
                  <option value="Gate B (Timur)">Gate B (Timur)</option>
                  <option value="Gate VIP & Media">Gate VIP &amp; Media</option>
                  <option value="Meja Wasit Court A">Meja Wasit Court A</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t-2 border-ink">
                <button
                  type="button"
                  onClick={() => setShowAddOperatorModal(false)}
                  className="px-5 py-2.5 border-2 border-ink bg-surface font-black text-sm cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand text-white border-2 border-ink font-black text-sm sm:text-base shadow-brutal-sm hover:bg-brand-dark cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN OPERATOR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL TAMBAH MATCH BARU
          ========================================================================= */}
      {showAddMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl border-[3px] border-ink bg-white p-6 sm:p-8 shadow-brutal-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4 mb-5">
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                + TAMBAH PERTANDINGAN &amp; KUOTA BARU
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMatchModal(false)}
                className="font-mono text-base font-black p-1.5 hover:bg-surface border-2 border-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-4 font-mono text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                    TIM A (HOME)
                  </label>
                  {teams.length > 0 ? (
                    <select
                      value={newMatchForm.home_team_id}
                      onChange={(e) =>
                        setNewMatchForm({ ...newMatchForm, home_team_id: e.target.value })
                      }
                      className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Pilih Tim Home --</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={newMatchForm.home_placeholder}
                      onChange={(e) =>
                        setNewMatchForm({ ...newMatchForm, home_placeholder: e.target.value })
                      }
                      placeholder="Nama tim A..."
                      className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                    TIM B (AWAY)
                  </label>
                  {teams.length > 0 ? (
                    <select
                      value={newMatchForm.away_team_id}
                      onChange={(e) =>
                        setNewMatchForm({ ...newMatchForm, away_team_id: e.target.value })
                      }
                      className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Pilih Tim Away --</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={newMatchForm.away_placeholder}
                      onChange={(e) =>
                        setNewMatchForm({ ...newMatchForm, away_placeholder: e.target.value })
                      }
                      placeholder="Nama tim B..."
                      className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                  TURNAMEN RESMI
                </label>
                <div className="p-3 border-2 border-ink bg-brand text-white font-mono text-sm font-black uppercase shadow-brutal-sm flex items-center justify-between">
                  <span>LIGA FUTSAL PELAJAR (LFP) 2026</span>
                  <span className="bg-white text-ink px-2 py-0.5 text-xs font-bold">RESMI</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                    TANGGAL LAGA (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    required
                    value={newMatchForm.match_date}
                    onChange={(e) =>
                      setNewMatchForm({ ...newMatchForm, match_date: e.target.value })
                    }
                    className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                    JAM KICK-OFF
                  </label>
                  <input
                    type="time"
                    required
                    value={newMatchForm.kickoff_time}
                    onChange={(e) =>
                      setNewMatchForm({ ...newMatchForm, kickoff_time: e.target.value })
                    }
                    className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                    KUOTA KURSI DIBUKA
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newMatchForm.total_quota}
                    onChange={(e) =>
                      setNewMatchForm({ ...newMatchForm, total_quota: e.target.value })
                    }
                    className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1.5 text-xs sm:text-sm">
                    HARGA TIKET (RP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={newMatchForm.ticket_price}
                    onChange={(e) =>
                      setNewMatchForm({ ...newMatchForm, ticket_price: e.target.value })
                    }
                    className="w-full p-3 border-2 border-ink bg-surface font-bold text-sm sm:text-base focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t-2 border-ink">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(false)}
                  className="px-5 py-2.5 border-2 border-ink bg-surface font-black text-sm cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand text-white border-2 border-ink font-black text-sm sm:text-base shadow-brutal-sm hover:bg-brand-dark cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'MENYIMPAN...' : 'PUBLIKASIKAN MATCH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}