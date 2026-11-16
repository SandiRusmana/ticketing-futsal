import { useState, useEffect, useMemo } from 'react'
import { Ticket, QrCode, Search, Calendar, MapPin, ArrowRight, ShieldCheck, User, CheckCircle2, Sparkles, Plus } from 'lucide-react'
import ETicketModal from '../components/ETicketModal.jsx'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'

function normalizeOrderToTicket(order) {
  const match = order.match || {}
  const homeName = match.home_team?.name || match.home_placeholder || 'Tim Home'
  const awayName = match.away_team?.name || match.away_placeholder || 'Tim Away'
  const catCode = (match.category?.code || 'SMA').toUpperCase()
  const matchDate = match.match_time ? new Date(match.match_time) : new Date(order.created_at)

  const isUsed = Boolean(order.is_checked_in)
  const stageLabelMap = {
    GROUP: 'Penyisihan Grup',
    ROUND_16: '16 Besar',
    QUARTER_FINAL: 'Perempat Final',
    SEMI_FINAL: 'Semifinal',
    FINAL: 'Grand Final',
  }

  return {
    ...order,
    id: order.id,
    status: isUsed ? 'DIGUNAKAN' : 'AKTIF',
    category: catCode === 'SMA' ? 'SMA/SMK' : catCode,
    stage: stageLabelMap[match.stage] || match.stage || 'Turnamen GGM',
    court: match.arena || 'Lapangan Utama GGM',
    matchTitle: `${homeName} vs ${awayName}`,
    date: matchDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    kickoff: matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    gate: order.checked_in_gate || 'Gate A - Tribun Utama',
    turnstile: 'Turnstile GGM',
    tier: `Reguler (${order.quantity || 1} Orang)`,
    quantity: order.quantity || 1,
    ticketCode: order.order_code || `FTX-${order.id}`,
    entryCode: order.qr_payload || order.order_code,
    qrPayload: order.qr_payload || order.order_code,
  }
}

export default function TiketSaya() {
  const { currentUser, toastMessage, navigateTo, myTickets, refreshMyTickets } = useNavigation()
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | AKTIF | DIGUNAKAN
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    refreshMyTickets?.()
  }, [refreshMyTickets])

  const tickets = useMemo(() => {
    return (myTickets || [])
      .filter((o) => o.status === 'PAID')
      .map(normalizeOrderToTicket)
  }, [myTickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
      const searchLower = searchQuery.toLowerCase().trim()
      const matchesSearch =
        searchLower === '' ||
        t.matchTitle.toLowerCase().includes(searchLower) ||
        t.ticketCode.toLowerCase().includes(searchLower) ||
        t.entryCode.toLowerCase().includes(searchLower)

      return matchesStatus && matchesSearch
    })
  }, [tickets, statusFilter, searchQuery])

  const activeCount = tickets.filter((t) => t.status === 'AKTIF').length

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10 py-4 sm:py-10">
      {/* FLASH NOTIFIKASI */}
      {toastMessage && (
        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4 border-[2.5px] border-ink bg-ok-soft p-3.5 sm:p-5 shadow-brutal-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-ink bg-brand text-white shadow-brutal-sm">
            <CheckCircle2 size={20} className="sm:size-6" />
          </div>
          <div className="flex-1 font-mono text-xs sm:text-base text-ink font-bold">
            {toastMessage}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-brand font-black bg-white px-3 py-1.5 border-2 border-ink shadow-brutal-sm">
            <Sparkles size={14} /> Tersimpan di MySQL
          </span>
        </div>
      )}

      {/* 1. HEADER HALAMAN & PROFIL SUPORTER */}
      <div className="flex flex-col gap-5 sm:gap-6 border-b-[2.5px] border-ink pb-6 sm:pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 border-2 border-ink bg-white px-2.5 sm:px-4 py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm">
            <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-brand animate-ping shrink-0" />
            <span className="truncate">PORTAL SUPORTER // DOMPET E-TIKET DIGITAL</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight leading-[1.08] break-words">
            Tiket Saya &amp; Dashboard Penonton
          </h1>

          <p className="text-sm sm:text-lg lg:text-xl text-ink/80 max-w-3xl font-sans leading-relaxed font-medium">
            Akses e-tiket turnamen futsal GGM Cianjur. Tunjukkan QR Code pada gate scanner turnstile untuk masuk gelanggang tanpa antre calo.
          </p>
        </div>

        {/* Profil Suporter Aktif */}
        <div className="flex items-center gap-3 sm:gap-4 border-[2.5px] border-ink bg-white p-3.5 sm:p-5 shadow-brutal w-full lg:w-auto min-w-0 max-w-full">
          <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center border-2 border-ink bg-[#f2f4f3] text-brand shadow-brutal-sm font-bold">
            <User size={24} className="sm:size-[30px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-xl font-black text-ink truncate">
                {currentUser?.name || 'Suporter Tamu'}
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-brand shrink-0" title="Akun Terverifikasi" />
            </div>
            <span className="font-mono text-[11px] sm:text-sm uppercase tracking-wider text-ink/80 block mt-0.5 truncate font-bold">
              {currentUser?.school_affiliation || currentUser?.school || 'SUPORTER PELAJAR CIANJUR'}
            </span>
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
              {activeCount} <span className="text-xl sm:text-3xl text-ink font-bold">Tiket</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-line font-mono text-xs sm:text-base text-ink/80 font-bold">
            ■ Siap ditunjukkan pada scanner turnstile
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
            <span>100% Valid Gate Turnstile Aktif</span>
          </div>
        </div>

        <div className="h-full flex flex-col justify-between border-[2.5px] border-ink bg-white p-4 sm:p-7 shadow-brutal">
          <div>
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 sm:pb-3 mb-2.5 sm:mb-3">
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink/80">
                TOTAL RIWAYAT TIKET
              </span>
              <Calendar size={22} className="text-ink/60 sm:size-6" />
            </div>
            <div className="font-mono text-4xl sm:text-6xl font-black text-ink">
              {tickets.length} <span className="text-xl sm:text-3xl text-ink/60 font-bold">Order</span>
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
            placeholder="Cari pertandingan atau kode tiket (misal: SMKN 1, FTX-...)..."
            className="w-full border-[2.5px] border-ink bg-white py-3 sm:py-4 pl-10 sm:pl-12 pr-4 font-mono text-sm sm:text-base md:text-lg outline-none placeholder:text-ink/40 shadow-brutal-sm focus:border-brand focus:ring-1 focus:ring-brand font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'Semua Tiket' },
            { key: 'AKTIF', label: `Siap Scan (${activeCount})` },
            { key: 'DIGUNAKAN', label: 'Sudah Dipindai' },
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

      {/* 3. DAFTAR KARTU TIKET */}
      <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        {filteredTickets.map((t) => {
          const isUsed = t.status === 'DIGUNAKAN'

          return (
            <article
              key={t.id}
              className={`w-full border-[2.5px] border-ink bg-white p-4 sm:p-8 lg:p-10 shadow-brutal-lg transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#191c1b] ${
                isUsed ? 'opacity-90 bg-[#fafafa]' : ''
              }`}
            >
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                    <span className="border-2 border-ink bg-[#f2f4f3] px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm">
                      {t.category} • {t.stage}
                    </span>
                    <span className="border-2 border-ink bg-white px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black text-brand shadow-brutal-sm">
                      {t.court}
                    </span>
                    <span
                      className={`border-2 border-ink px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-brutal-sm ${
                        isUsed ? 'bg-danger text-white' : 'bg-brand text-white'
                      }`}
                    >
                      {isUsed ? 'TELAH DIGUNAKAN' : 'SIAP SCAN'}
                    </span>
                  </div>

                  <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-ink leading-tight break-words">
                    {t.matchTitle}
                  </h2>

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
                        <span className="truncate">{t.gate} • {t.turnstile}</span>
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] sm:text-xs md:text-sm text-ink/75 uppercase tracking-wider font-black block mb-0.5 sm:mb-1">
                        KATEGORI TIKET
                      </span>
                      <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-ink block truncate">
                        {t.tier}
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] sm:text-xs md:text-sm text-ink/75 uppercase tracking-wider font-black block mb-0.5 sm:mb-1">
                        NOMOR E-TIKET
                      </span>
                      <span className="font-mono text-sm sm:text-base md:text-lg font-black text-brand block truncate">
                        {t.ticketCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Lihat E-Ticket */}
                <div className="shrink-0 flex flex-col gap-2 pt-3 sm:pt-4 lg:pt-0 lg:pl-8 lg:border-l-2 lg:border-line">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(t)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 sm:gap-3 border-[2.5px] border-ink bg-brand px-5 sm:px-10 py-3 sm:py-4 font-mono text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-white shadow-brutal transition-all hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <QrCode size={20} className="sm:size-6" />
                    <span>Lihat E-Ticket</span>
                  </button>
                  <div className="font-mono text-[11px] sm:text-sm text-center text-ink/80">
                    Kode QR: <strong className="font-black text-ink text-xs sm:text-base underline">{t.entryCode}</strong>
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        {filteredTickets.length === 0 && (
          <div className="border-[2.5px] border-dashed border-line bg-white p-8 sm:p-16 text-center">
            <Ticket size={40} className="mx-auto text-ink/40 mb-3 sm:size-11" />
            <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
              Belum Ada Tiket Aktif
            </h3>
            <p className="mt-2 font-mono text-xs sm:text-base text-ink/70 max-w-md mx-auto">
              {currentUser
                ? 'Anda belum membeli tiket pertandingan atau tidak ada tiket yang sesuai filter.'
                : 'Silakan masuk menggunakan akun suporter Anda untuk melihat e-tiket.'}
            </p>
            <button
              type="button"
              onClick={() => navigateTo(currentUser ? PAGE_NAMES.LANDING : PAGE_NAMES.LOGIN)}
              className="mt-5 sm:mt-6 inline-flex items-center gap-2 border-2 border-ink bg-brand px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase text-white shadow-brutal hover:bg-brand-dark cursor-pointer"
            >
              {currentUser ? 'Beli Tiket Sekarang' : 'Masuk Akun Suporter'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 4. PANDUAN MASUK GELANGGANG GGM */}
      <div className="mt-10 sm:mt-14 border-[2.5px] border-ink bg-white p-4 sm:p-8 shadow-brutal-lg">
        <div className="flex items-center gap-2.5 sm:gap-3 border-b-2 border-ink pb-3 sm:pb-4">
          <ShieldCheck size={22} className="text-brand shrink-0 sm:size-[26px]" />
          <h3 className="font-display text-lg sm:text-2xl font-black uppercase text-ink">
            Panduan Masuk Gelanggang Generasi Muda (GGM) Cianjur
          </h3>
        </div>
        <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-5 text-xs sm:text-base font-mono text-ink/85 sm:grid-cols-3">
          <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm">
            <span className="font-black text-ink block mb-1 text-sm sm:text-lg">1. Tiba Tepat Waktu</span>
            Pintu turnstile dibuka 60 menit sebelum kickoff laga pertama. Disarankan hadir lebih awal agar tidak terhambat antrean suporter di gerbang utama.
          </div>
          <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm">
            <span className="font-black text-ink block mb-1 text-sm sm:text-lg">2. Siapkan QR Code</span>
            Buka tombol &ldquo;Lihat E-Ticket&rdquo; dan atur kecerahan layar HP ke tingkat maksimum agar kode batang instan terbaca oleh sensor scanner.
          </div>
          <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm">
            <span className="font-black text-ink block mb-1 text-sm sm:text-lg">3. Tiket Sekali Akses</span>
            Satu QR Code hanya valid untuk 1 kali akses masuk turnstile. Pemalsuan atau penggunaan ulang akan otomatis memicu alarm dan penolakan gate.
          </div>
        </div>
      </div>

      {/* 5. MODAL E-TICKET */}
      <ETicketModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  )
}
