import { useState, useEffect, useMemo } from 'react'
import {
  Ticket,
  QrCode,
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  User,
  CheckCircle2,
  Sparkles,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'
import ETicketModal from '../components/ETicketModal.jsx'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

/**
 * Normalisasi data order MySQL menjadi format tiket yang terstruktur.
 * Mendukung pemesanan tunggal (quantity = 1) maupun banyak tiket (quantity > 1)
 * dengan token QR Code unik untuk tiap tiket.
 */
function normalizeOrderToTicket(order) {
  const match = order.match || {}
  const homeName = match.home_team?.name || match.home_placeholder || 'Tim Home'
  const awayName = match.away_team?.name || match.away_placeholder || 'Tim Away'
  const matchDate = match.match_time ? new Date(match.match_time) : new Date(order.created_at)

  const isOrderCheckedIn = Boolean(order.is_checked_in)
  const stageLabelMap = {
    GROUP: 'Penyisihan Grup',
    ROUND_16: '16 Besar',
    QUARTER_FINAL: 'Perempat Final',
    SEMI_FINAL: 'Semifinal',
    FINAL: 'Grand Final',
  }

  const quantity = Math.max(1, Number(order.quantity) || 1)
  const baseOrderCode = order.order_code || `FTX-${order.id}`
  const baseQrPayload = order.qr_payload || order.order_code || `TIX-LFP2026-${order.id}`

  // Dekomposisi sub-tiket individual
  const subTickets = (order.sub_tickets && order.sub_tickets.length > 0)
    ? order.sub_tickets.map((st, idx) => ({
        ...st,
        ticket_number: st.ticket_number || idx + 1,
        total_tickets: quantity,
        ticket_code: st.ticket_code || (quantity > 1 ? `${baseOrderCode}-T${idx + 1}` : baseOrderCode),
        qr_payload: st.qr_payload || (quantity > 1 ? `${baseQrPayload}-T${idx + 1}` : baseQrPayload),
        seat_label: st.seat_label || `Tiket #${idx + 1} dari ${quantity} (Reguler Tribun)`,
        is_checked_in: Boolean(st.is_checked_in ?? isOrderCheckedIn),
      }))
    : Array.from({ length: quantity }, (_, idx) => ({
        ticket_number: idx + 1,
        total_tickets: quantity,
        ticket_code: quantity > 1 ? `${baseOrderCode}-T${idx + 1}` : baseOrderCode,
        qr_payload: quantity > 1 ? `${baseQrPayload}-T${idx + 1}` : baseQrPayload,
        seat_label: `Tiket #${idx + 1} dari ${quantity} (Reguler Tribun)`,
        is_checked_in: isOrderCheckedIn,
        checked_in_at: order.checked_in_at,
        checked_in_gate: order.checked_in_gate,
      }))

  return {
    ...order,
    id: order.id,
    orderCode: baseOrderCode,
    status: isOrderCheckedIn ? 'DIGUNAKAN' : 'AKTIF',
    category: 'LFP 2026',
    stage: stageLabelMap[match.stage] || match.stage || 'Turnamen GGM',
    court: match.venue || match.arena || 'Lapangan Utama GGM (Court A Vinyl)',
    matchTitle: `${homeName} vs ${awayName}`,
    date: matchDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    kickoff: matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    gate: order.checked_in_gate || 'Gate A - Tribun Utama',
    turnstile: 'Turnstile GGM',
    tier: quantity > 1 ? `Reguler (${quantity} Tiket)` : 'Reguler (1 Orang)',
    quantity: quantity,
    ticketCode: baseOrderCode,
    entryCode: baseQrPayload,
    qrPayload: baseQrPayload,
    sub_tickets: subTickets,
  }
}

export default function TiketSaya() {
  const { currentUser, toastMessage, navigateTo, myTickets, refreshMyTickets } = useNavigation()
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | AKTIF | DIGUNAKAN
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicketModal, setSelectedTicketModal] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleResetOrder = async (orderCode) => {
    try {
      await futsaltixApi.resetTicketCheckIn(orderCode)
      await refreshMyTickets?.()
    } catch (e) {
      alert('Gagal me-reset tiket: ' + (e.response?.data?.message || e.message))
    }
  }

  // Sinkronisasi data tiket riil saat halaman dimuat
  useEffect(() => {
    refreshMyTickets?.()
  }, [refreshMyTickets])

  // Auto-refresh setiap 8 detik agar status tiket otomatis beralih ke "SUDAH DIPINDAI" saat operator scan di gate
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMyTickets?.()
    }, 8000)
    return () => clearInterval(interval)
  }, [refreshMyTickets])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshMyTickets?.()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  // Normalisasi order dari database MySQL
  const tickets = useMemo(() => {
    return (myTickets || [])
      .filter((o) => o.status === 'PAID')
      .map(normalizeOrderToTicket)
  }, [myTickets])

  // Hitung total tiket aktif siap scan (berdasarkan total lembar tiket individual)
  const activeTicketsCount = useMemo(() => {
    return tickets.reduce((acc, t) => {
      const activeSubs = t.sub_tickets.filter((st) => !st.is_checked_in)
      return acc + (activeSubs.length > 0 ? activeSubs.length : (t.status === 'AKTIF' ? t.quantity : 0))
    }, 0)
  }, [tickets])

  const usedTicketsCount = useMemo(() => {
    return tickets.reduce((acc, t) => {
      const usedSubs = t.sub_tickets.filter((st) => st.is_checked_in)
      return acc + (usedSubs.length > 0 ? usedSubs.length : (t.status === 'DIGUNAKAN' ? t.quantity : 0))
    }, 0)
  }, [tickets])

  // Filter dan pencarian data tiket
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Filter status
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'AKTIF' && t.status === 'AKTIF') ||
        (statusFilter === 'DIGUNAKAN' && t.status === 'DIGUNAKAN')

      // Filter pencarian
      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesStatus

      const inMatch = t.matchTitle.toLowerCase().includes(q)
      const inCode = t.ticketCode.toLowerCase().includes(q)
      const inQr = t.entryCode.toLowerCase().includes(q)
      const inSubs = t.sub_tickets.some(
        (st) =>
          st.ticket_code.toLowerCase().includes(q) ||
          st.qr_payload.toLowerCase().includes(q)
      )

      return matchesStatus && (inMatch || inCode || inQr || inSubs)
    })
  }, [tickets, statusFilter, searchQuery])

  // Fungsi membuka modal untuk tiket tertentu atau sub-tiket tertentu
  const openTicketModal = (ticket, subIndex = 0) => {
    setSelectedTicketModal({
      ...ticket,
      activeSubIndex: subIndex,
    })
  }

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10 py-4 sm:py-10">
      {/* FLASH NOTIFIKASI SUKSES */}
      {toastMessage && (
        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4 border-[2.5px] border-ink bg-ok-soft p-3.5 sm:p-5 shadow-brutal-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-ink bg-brand text-white shadow-brutal-sm">
            <CheckCircle2 size={20} className="sm:size-6" />
          </div>
          <div className="flex-1 font-mono text-xs sm:text-base text-ink font-bold">
            {toastMessage}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-brand font-black bg-white px-3 py-1.5 border-2 border-ink shadow-brutal-sm">
            <Sparkles size={14} /> Sinkron MySQL
          </span>
        </div>
      )}

      {/* 1. HEADER HALAMAN & PROFIL SUPORTER */}
      <div className="flex flex-col gap-5 sm:gap-6 border-b-[2.5px] border-ink pb-6 sm:pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 border-2 border-ink bg-white px-2.5 sm:px-4 py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm">
            <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-brand animate-ping shrink-0" />
            <span className="truncate">DOMPET E-TIKET RESMI // LIGA FUTSAL PELAJAR 2026</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight leading-[1.08] break-words">
            Tiket Saya &amp; Dashboard Penonton
          </h1>

          <p className="text-sm sm:text-lg lg:text-xl text-ink/80 max-w-3xl font-sans leading-relaxed font-medium">
            Akses e-tiket turnamen futsal GGM Cianjur langsung dari database MySQL. Tunjukkan QR Code pada gate scanner turnstile untuk masuk gelanggang tanpa antre calo.
          </p>
        </div>

        {/* Profil Suporter Aktif & Tombol Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto min-w-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 border-[2.5px] border-ink bg-white px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink shadow-brutal hover:bg-surface active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            title="Muat ulang tiket dari database MySQL"
          >
            <RefreshCw size={16} className={`text-brand ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronisasi'}</span>
          </button>

          <div className="flex items-center gap-3 sm:gap-4 border-[2.5px] border-ink bg-white p-3.5 sm:p-4 shadow-brutal min-w-0 flex-1 sm:flex-initial">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center border-2 border-ink bg-[#f2f4f3] text-brand shadow-brutal-sm font-bold">
              <User size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-black text-ink truncate">
                  {currentUser?.name || 'Suporter Pelajar'}
                </span>
                <span className="h-2 w-2 rounded-full bg-brand shrink-0" title="Akun Terverifikasi" />
              </div>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-ink/80 block mt-0.5 truncate font-bold">
                {currentUser?.school_affiliation || currentUser?.school || 'SUPORTER RESMI GGM'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATUS RINGKASAN */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
        <div className="h-full flex flex-col justify-between border-[2.5px] border-ink bg-white p-4 sm:p-7 shadow-brutal">
          <div>
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 sm:pb-3 mb-2.5 sm:mb-3">
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink/80">
                TIKET AKTIF SIAP SCAN
              </span>
              <Ticket size={22} className="text-brand sm:size-6" />
            </div>
            <div className="font-mono text-4xl sm:text-6xl font-black text-brand">
              {activeTicketsCount} <span className="text-xl sm:text-3xl text-ink font-bold">Lembar</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-line font-mono text-xs sm:text-base text-ink/80 font-bold">
            ■ {tickets.length} transaksi pesanan sah
          </div>
        </div>

        <div className="h-full flex flex-col justify-between border-[2.5px] border-ink bg-white p-4 sm:p-7 shadow-brutal">
          <div>
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 sm:pb-3 mb-2.5 sm:mb-3">
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink/80">
                GATE TURNSTILE GGM
              </span>
              <ShieldCheck size={22} className="text-brand sm:size-6" />
            </div>
            <div className="font-mono text-2xl sm:text-4xl lg:text-5xl font-black text-ink">
              Online &amp; Sync
            </div>
          </div>
          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-line font-mono text-xs sm:text-base text-brand font-black flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand animate-pulse shrink-0" />
            <span>Gate A &amp; Gate B Terhubung Database</span>
          </div>
        </div>

        <div className="h-full flex flex-col justify-between border-[2.5px] border-ink bg-white p-4 sm:p-7 shadow-brutal">
          <div>
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 sm:pb-3 mb-2.5 sm:mb-3">
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink/80">
                TOTAL TIKET TERPAKAI
              </span>
              <Calendar size={22} className="text-ink/60 sm:size-6" />
            </div>
            <div className="font-mono text-4xl sm:text-6xl font-black text-ink">
              {usedTicketsCount} <span className="text-xl sm:text-3xl text-ink/60 font-bold">Dipindai</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => navigateTo(PAGE_NAMES.LANDING)}
              className="w-full inline-flex items-center justify-center gap-2 border-2 border-ink bg-brand px-3 sm:px-4 py-3 sm:py-3.5 font-mono text-xs sm:text-base font-black uppercase text-white shadow-brutal-sm hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus size={16} /> Pesan Tiket Baru
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & FILTER STATUS */}
      <div className="mt-6 sm:mt-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-2xl">
          <Search size={20} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-ink/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertandingan, kode order, atau token tiket (misal: SMAN 1, FTX-...)..."
            className="w-full border-[2.5px] border-ink bg-white py-3 sm:py-4 pl-10 sm:pl-12 pr-4 font-mono text-sm sm:text-base md:text-lg outline-none placeholder:text-ink/40 shadow-brutal-sm focus:border-brand focus:ring-1 focus:ring-brand font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { key: 'ALL', label: `Semua (${tickets.length})` },
            { key: 'AKTIF', label: `Siap Scan (${activeTicketsCount})` },
            { key: 'DIGUNAKAN', label: `Sudah Dipindai (${usedTicketsCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 min-w-[90px] sm:flex-initial text-center border-2 border-ink px-3 sm:px-6 py-2.5 sm:py-3.5 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider transition-all shadow-brutal-sm cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink hover:bg-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. DAFTAR KARTU TIKET DARI DATABASE MYSQL */}
      <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        {filteredTickets.map((t) => {
          const isFullyUsed = t.status === 'DIGUNAKAN'
          const isMultiTicket = t.quantity > 1
          const isExpanded = Boolean(expandedOrders[t.id])

          return (
            <article
              key={t.id}
              className={`w-full border-[2.5px] border-ink bg-white p-4 sm:p-7 lg:p-8 shadow-brutal-lg transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#191c1b] ${
                isFullyUsed ? 'opacity-90 bg-[#fafafa]' : ''
              }`}
            >
              {/* Header Kartu Order */}
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                    <span className="border-2 border-ink bg-[#f2f4f3] px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm">
                      {t.category} • {t.stage}
                    </span>
                    <span className="border-2 border-ink bg-white px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black text-brand shadow-brutal-sm truncate max-w-[240px]">
                      {t.court}
                    </span>
                    <span
                      className={`border-2 border-ink px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-brutal-sm ${
                        isFullyUsed ? 'bg-danger text-white' : 'bg-brand text-white'
                      }`}
                    >
                      {isFullyUsed ? 'TELAH DIGUNAKAN' : 'SIAP SCAN'}
                    </span>
                    {isMultiTicket && (
                      <span className="border-2 border-ink bg-amber-300 text-ink px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-brutal-sm">
                        🎟️ {t.quantity} TIKET DIBELI
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-ink leading-tight break-words">
                    {t.matchTitle}
                  </h2>

                  {/* Ringkasan Meta Order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 pt-3 sm:pt-4 border-t-2 border-line">
                    <div>
                      <span className="font-mono text-[10px] sm:text-xs md:text-sm text-ink/75 uppercase tracking-wider font-black block mb-0.5 sm:mb-1">
                        TANGGAL &amp; KICKOFF
                      </span>
                      <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-ink flex items-center gap-1.5">
                        <Calendar size={15} className="text-brand shrink-0 sm:size-[18px]" />
                        <span className="truncate">{t.date} ({t.kickoff})</span>
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] sm:text-xs md:text-sm text-ink/75 uppercase tracking-wider font-black block mb-0.5 sm:mb-1">
                        PINTU GERBANG
                      </span>
                      <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-ink flex items-center gap-1.5">
                        <MapPin size={15} className="text-brand shrink-0 sm:size-[18px]" />
                        <span className="truncate">{t.gate}</span>
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] sm:text-xs md:text-sm text-ink/75 uppercase tracking-wider font-black block mb-0.5 sm:mb-1">
                        JUMLAH KUOTA
                      </span>
                      <span className="font-mono text-xs sm:text-sm md:text-base font-black text-ink block truncate">
                        {t.quantity} Lembar Tiket
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] sm:text-xs md:text-sm text-ink/75 uppercase tracking-wider font-black block mb-0.5 sm:mb-1">
                        KODE PESANAN
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm sm:text-base md:text-lg font-black text-brand block truncate">
                          {t.ticketCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(t.ticketCode, `code-${t.id}`)}
                          className="p-1 border border-ink/40 bg-white hover:bg-surface text-ink text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                          title="Salin Kode Pesanan"
                        >
                          {copiedId === `code-${t.id}` ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
                          <span className="hidden sm:inline">{copiedId === `code-${t.id}` ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Utama */}
                <div className="shrink-0 flex flex-col gap-2 pt-3 sm:pt-4 lg:pt-0 lg:pl-6 lg:border-l-2 lg:border-line">
                  <button
                    type="button"
                    onClick={() => openTicketModal(t, 0)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 sm:gap-3 border-[2.5px] border-ink bg-brand px-5 sm:px-8 py-3 sm:py-3.5 font-mono text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-white shadow-brutal transition-all hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <QrCode size={20} className="sm:size-6" />
                    <span>{isMultiTicket ? 'Buka E-Ticket' : 'Lihat E-Ticket'}</span>
                  </button>

                  {isMultiTicket && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(t.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border-2 border-ink bg-surface px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-ink shadow-brutal-xs hover:bg-white active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Sembunyikan Lembar Tiket' : `Lihat ${t.quantity} Lembar Tiket`}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}

                  <div className="font-mono text-[11px] sm:text-xs text-center text-ink/70 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>Token: <strong className="font-black text-ink">{t.entryCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy(t.entryCode, `token-${t.id}`)}
                      className="px-1.5 py-0.5 border border-ink/40 bg-white hover:bg-surface text-ink text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Salin Token Tiket"
                    >
                      {copiedId === `token-${t.id}` ? <Check size={11} className="text-brand" /> : <Copy size={11} />}
                      <span>{copiedId === `token-${t.id}` ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  {isFullyUsed && (
                    <button
                      type="button"
                      onClick={() => handleResetOrder(t.ticketCode)}
                      className="mt-1 w-full py-1.5 bg-[#fef08a] text-ink font-mono text-[11px] font-black uppercase border-2 border-ink shadow-brutal-xs hover:bg-amber-200 cursor-pointer"
                      title="Kembalikan status tiket menjadi Siap Scan untuk pengujian ulang"
                    >
                      🔄 Reset Tiket (Uji Coba Demo)
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Ticket Sub-Cards (jika pembelian > 1 tiket) */}
              {isMultiTicket && (
                <div className={`mt-5 pt-5 border-t-2 border-line ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs sm:text-sm font-black uppercase text-ink flex items-center gap-1.5">
                      <Ticket size={16} className="text-brand" />
                      DAFTAR E-TIKET INDIVIDUAL ({t.sub_tickets.length} PENONTON):
                    </span>
                    <span className="font-mono text-[11px] text-ink/70 hidden sm:inline">
                      Masing-masing penonton memiliki QR Code tersendiri untuk gerbang turnstile
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {t.sub_tickets.map((st, idx) => {
                      const isSubUsed = Boolean(st.is_checked_in)
                      return (
                        <div
                          key={st.ticket_code || idx}
                          className={`border-2 border-ink p-3 sm:p-4 bg-[#fafafa] flex flex-col justify-between shadow-brutal-sm ${
                            isSubUsed ? 'bg-gray-100 opacity-80' : 'bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="border-2 border-ink bg-amber-300 text-ink px-2 py-0.5 font-mono text-[10px] font-black uppercase">
                                TIKET #{idx + 1}
                              </span>
                              <span
                                className={`border border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                  isSubUsed ? 'bg-danger text-white' : 'bg-[#dcfce7] text-[#15803d]'
                                }`}
                              >
                                {isSubUsed ? 'TERPAKAI' : 'READY TO SCAN'}
                              </span>
                            </div>

                            <div className="font-mono text-xs font-black text-ink mb-1 truncate" title={st.ticket_code}>
                              {st.ticket_code}
                            </div>
                            <div className="font-mono text-[11px] text-ink/70 mb-3 truncate">
                              QR: {st.qr_payload}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openTicketModal(t, idx)}
                            className="w-full inline-flex items-center justify-center gap-1.5 border-2 border-ink bg-ink text-white py-2 font-mono text-xs font-black uppercase hover:bg-gray-800 cursor-pointer shadow-brutal-xs active:translate-x-0.5 active:translate-y-0.5"
                          >
                            <QrCode size={14} />
                            <span>Tampilkan QR #{idx + 1}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {/* Empty State jika belum ada tiket atau tidak ada yang sesuai filter */}
        {filteredTickets.length === 0 && (
          <div className="border-[2.5px] border-dashed border-line bg-white p-8 sm:p-16 text-center">
            <Ticket size={40} className="mx-auto text-ink/40 mb-3 sm:size-11" />
            <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
              {tickets.length === 0 ? 'Belum Ada Tiket Dipesan' : 'Tidak Ada Tiket Sesuai Filter'}
            </h3>
            <p className="mt-2 font-mono text-xs sm:text-base text-ink/70 max-w-md mx-auto">
              {tickets.length === 0
                ? 'Belum ada transaksi pembayaran tiket yang sah di akun Anda. Silakan pilih pertandingan turnamen LFP 2026 dan pesan tiket sekarang.'
                : `Tidak ada tiket dengan filter "${statusFilter}" atau kata kunci "${searchQuery}". Silakan ganti filter di atas.`}
            </p>
            <button
              type="button"
              onClick={() => navigateTo(PAGE_NAMES.LANDING)}
              className="mt-5 sm:mt-6 inline-flex items-center gap-2 border-2 border-ink bg-brand px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase text-white shadow-brutal hover:bg-brand-dark cursor-pointer"
            >
              <span>Pesan Tiket LFP 2026 Sekarang</span> <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 4. PANDUAN MASUK GELANGGANG GGM */}
      <div className="mt-10 sm:mt-14 border-[2.5px] border-ink bg-white p-4 sm:p-8 shadow-brutal-lg">
        <div className="flex items-center gap-2.5 sm:gap-3 border-b-2 border-ink pb-3 sm:pb-4">
          <ShieldCheck size={22} className="text-brand shrink-0 sm:size-[26px]" />
          <h3 className="font-display text-lg sm:text-2xl font-black uppercase text-ink">
            Panduan Akses Gerbang Turnstile GGM Cianjur
          </h3>
        </div>
        <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-5 text-xs sm:text-base font-mono text-ink/85 sm:grid-cols-3">
          <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm">
            <span className="font-black text-ink block mb-1 text-sm sm:text-lg">1. Buka QR Code Tiap Tiket</span>
            Bagi pemesanan lebih dari 1 tiket, pastikan setiap orang menunjukkan QR Code masing-masing (Tiket #1, Tiket #2, dst.) pada kamera scanner turnstile.
          </div>
          <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm">
            <span className="font-black text-ink block mb-1 text-sm sm:text-lg">2. Atur Kecerahan Layar</span>
            Tingkatkan kecerahan layar smartphone hingga maksimal agar sensor barcode turnstile dapat membaca kode dengan cepat dalam hitungan detik.
          </div>
          <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm">
            <span className="font-black text-ink block mb-1 text-sm sm:text-lg">3. Anti-Duplikasi MySQL</span>
            Sistem database MySQL mencatat log verifikasi turnstile secara real-time. Tiket yang telah masuk tidak dapat digunakan kembali oleh orang lain.
          </div>
        </div>
      </div>

      {/* 5. MODAL E-TICKET ASLI DENGAN MULTI-TICKET SWITCHER */}
      <ETicketModal
        ticket={selectedTicketModal}
        initialSubIndex={selectedTicketModal?.activeSubIndex ?? 0}
        onClose={() => setSelectedTicketModal(null)}
      />
    </div>
  )
}
