import { useState, useEffect, useCallback } from 'react'
import { QrCode, CheckCircle2, XCircle, Volume2, ShieldAlert, ArrowLeft } from 'lucide-react'
import { futsaltixApi } from '../services/futsaltixApi.js'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'

export default function OperatorScanner() {
  const { navigateTo, currentUser } = useNavigation()

  const [selectedGate, setSelectedGate] = useState('Gate A (Barat)')
  const [ticketInput, setTicketInput] = useState('')
  const [scanState, setScanState] = useState(null) // null | 'VALID' | 'INVALID'
  const [isScanning, setIsScanning] = useState(false)

  // Detail hasil scan terkini dari database MySQL
  const [lastScanDetail, setLastScanDetail] = useState({
    code: '',
    holderName: '',
    schoolName: '',
    matchTitle: '',
    stage: '',
    arena: '',
    ticketCategory: '',
    verifiedAt: '',
    errorMessage: '',
    alreadyScannedAt: '',
    alreadyScannedGate: '',
  })

  // Log audit scan terkini (dimulai kosong / hanya diisi aktivitas nyata)
  const [scanLogs, setScanLogs] = useState([])

  const closeModal = useCallback(() => {
    setScanState(null)
    setTicketInput('')
  }, [])

  // Pintasan keyboard (Escape / Spacebar) saat modal hasil scan terbuka
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (scanState && (e.key === 'Escape' || e.code === 'Space')) {
        e.preventDefault()
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scanState, closeModal])

  // Validasi QR Code / Kode Tiket langsung ke MySQL
  const handleScanSubmit = async (e) => {
    e?.preventDefault()
    const rawCode = ticketInput.trim()
    if (!rawCode || isScanning) return

    setIsScanning(true)
    const nowTime = new Date().toLocaleTimeString('id-ID') + ' WIB'

    try {
      const response = await futsaltixApi.operatorScanTicket(rawCode, selectedGate)
      const data = response.data?.ticket || response.data?.data || response.data || {}
      const order = data.order || {}
      const match = order.match || data.match || {}

      const homeName = match.home_team?.name || match.home_placeholder || 'Tim Home'
      const awayName = match.away_team?.name || match.away_placeholder || 'Tim Away'
      const holderName = data.holder_name || order.buyer_name || order.user?.name || 'Suporter Terdaftar'
      const schoolName = data.school_name || order.school_name || 'Suporter Umum / Pelajar'
      const ticketCode = data.qr_payload || data.ticket_code || order.order_code || rawCode

      setLastScanDetail({
        code: ticketCode,
        holderName,
        schoolName,
        matchTitle: `${homeName} VS ${awayName}`,
        stage: match.stage || 'Babak Turnamen',
        arena: match.arena || 'Court A GGM',
        ticketCategory: data.seat_category || 'TRIBUNE GENERAL ACCESS',
        verifiedAt: nowTime,
        errorMessage: '',
        alreadyScannedAt: '',
        alreadyScannedGate: '',
      })

      setScanState('VALID')
      setScanLogs((prev) => [
        {
          id: Date.now(),
          time: nowTime,
          code: ticketCode,
          name: holderName,
          status: 'VALID',
          gate: selectedGate,
        },
        ...prev.slice(0, 9),
      ])
    } catch (error) {
      const errData = error.response?.data || {}
      const errMsg = errData.message || 'Tiket tidak ditemukan atau sudah digunakan sebelumnya.'
      const existingTicket = errData.ticket || {}

      setLastScanDetail({
        code: rawCode,
        holderName: existingTicket.holder_name || 'Tidak Dikenal',
        schoolName: '-',
        matchTitle: '-',
        stage: '-',
        arena: '-',
        ticketCategory: '-',
        verifiedAt: nowTime,
        errorMessage: errMsg,
        alreadyScannedAt: existingTicket.checked_in_at
          ? new Date(existingTicket.checked_in_at).toLocaleTimeString('id-ID') + ' WIB'
          : 'Sebelumnya',
        alreadyScannedGate: existingTicket.checked_in_gate || 'Gate GGM',
      })

      setScanState('INVALID')
      setScanLogs((prev) => [
        {
          id: Date.now(),
          time: nowTime,
          code: rawCode,
          name: errMsg,
          status: 'INVALID',
          gate: selectedGate,
        },
        ...prev.slice(0, 9),
      ])
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-10">
      {/* ==================== 1. STATUS BAR OPERATOR ==================== */}
      <div className="flex flex-col gap-3 sm:gap-4 border-b-2 border-ink pb-4 sm:pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
            <button
              type="button"
              onClick={() => navigateTo(PAGE_NAMES.OPERATOR_DASHBOARD)}
              className="inline-flex items-center gap-1.5 border-2 border-ink bg-white px-2.5 sm:px-3 py-1 font-mono text-[11px] sm:text-xs font-black uppercase text-ink shadow-brutal-sm hover:bg-surface cursor-pointer"
            >
              <ArrowLeft size={14} /> Kembali ke Meja Wasit
            </button>
            <div className="inline-flex items-center gap-2 border-2 border-ink bg-white px-2.5 sm:px-3 py-1 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-ink shadow-brutal-sm">
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-brand animate-ping shrink-0" />
              <span className="truncate">OPERATOR SCANNER // {currentUser?.name || 'PETUGAS GATE'}</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight break-words">
            Pemindai Turnstile Gerbang
          </h1>
          <p className="mt-1 font-mono text-xs sm:text-base text-ink/75 font-medium">
            Scan QR Code e-tiket suporter atau masukkan kode tiket untuk validasi langsung ke MySQL.
          </p>
        </div>

        {/* Status Gerbang & Pilihan Gate */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 border-2 border-ink bg-brand px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-xs sm:text-sm font-bold text-white shadow-brutal-sm">
            <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-white animate-pulse shrink-0" />
            <span>TURNSTILE: MYSQL LIVE</span>
          </div>

          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="border-2 border-ink bg-white px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-xs sm:text-sm font-bold uppercase shadow-brutal-sm outline-none"
          >
            <option>Gate A (Barat)</option>
            <option>Gate B (Timur)</option>
            <option>Gate C (VIP / Media)</option>
          </select>
        </div>
      </div>

      {/* ==================== 2. WORKSPACE SCANNER VIEWFINDER ==================== */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Kolom Kiri: Viewfinder & Input Manual (7 Kolom) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative aspect-[4/3] w-full border-[3px] border-ink bg-black overflow-hidden shadow-brutal-lg flex items-center justify-center">
            <div className="absolute inset-0 scanner-grid-bg opacity-30 pointer-events-none" />
            <div className="absolute left-6 right-6 h-1 bg-brand animate-scan-laser shadow-[0_0_12px_#15803d]" />

            <div className="relative h-44 w-44 sm:h-64 sm:w-64 border-2 border-dashed border-white/40 flex items-center justify-center p-3 sm:p-4">
              <span className="absolute -left-1 -top-1 h-5 w-5 sm:h-6 sm:w-6 border-l-4 border-t-4 border-brand" />
              <span className="absolute -right-1 -top-1 h-5 w-5 sm:h-6 sm:w-6 border-r-4 border-t-4 border-brand" />
              <span className="absolute -bottom-1 -left-1 h-5 w-5 sm:h-6 sm:w-6 border-b-4 border-l-4 border-brand" />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 border-b-4 border-r-4 border-brand" />

              <div className="text-center text-white/80 p-2">
                <QrCode size={44} className="mx-auto text-brand opacity-80 mb-2 sm:size-14" />
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider block">
                  Siap Menerima Input Barcode / QR Scanner
                </span>
              </div>
            </div>

            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 font-mono text-[10px] sm:text-[11px] text-white/70 bg-black/60 px-2 py-1 border border-white/20">
              MODE: HARDWARE QR / MANUAL INPUT • {selectedGate}
            </div>
          </div>

          {/* Form Input Kode E-Tiket */}
          <form onSubmit={handleScanSubmit} className="border-2 border-ink bg-white p-3.5 sm:p-5 shadow-brutal space-y-3 sm:space-y-4">
            <label className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink block">
              Scan atau Ketik Kode QR / Kode Tiket:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                autoFocus
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Contoh: FTX-QR-2026-XXXX atau FTX-ORD-XXXX"
                className="flex-1 border-2 border-ink px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono text-xs sm:text-base outline-none placeholder:text-ink/40 shadow-brutal-sm focus:bg-surface font-medium"
              />
              <button
                type="submit"
                disabled={isScanning || !ticketInput.trim()}
                className="w-full sm:w-auto border-2 border-ink bg-brand px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-black uppercase text-white shadow-brutal-sm hover:bg-brand-dark cursor-pointer disabled:opacity-50 text-center"
              >
                {isScanning ? 'Memvalidasi...' : 'Validasi Tiket'}
              </button>
            </div>
            <p className="font-mono text-[11px] sm:text-xs text-ink/70 font-semibold">
              * Scanner barcode USB/Bluetooth otomatis menekan Enter setelah membaca kode QR tiket penonton.
            </p>
          </form>
        </div>

        {/* Kolom Kanan: Log Riwayat Pemindaian Turnstile (5 Kolom) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="border-2 border-ink bg-white p-3.5 sm:p-5 shadow-brutal flex-1">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5 sm:pb-3 mb-3 sm:mb-4">
              <h2 className="font-display text-lg sm:text-2xl font-black uppercase text-ink">
                Riwayat Pemindaian Sesi Ini
              </h2>
              <span className="font-mono text-xs sm:text-sm text-brand font-black">
                {scanLogs.length} Scan
              </span>
            </div>

            {scanLogs.length === 0 ? (
              <div className="border-2 border-dashed border-ink/30 bg-surface p-6 sm:p-8 text-center font-mono text-xs sm:text-sm text-ink/70 font-bold">
                Belum ada tiket yang dipindai pada sesi ini. Masukkan kode QR tiket di kolom sebelah kiri untuk memulai check-in.
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3 font-mono text-xs sm:text-sm">
                {scanLogs.map((log) => {
                  const isValid = log.status === 'VALID'

                  return (
                    <div
                      key={log.id}
                      className={`border-2 border-ink p-3 sm:p-4 shadow-brutal-sm flex items-start justify-between gap-2 ${
                        isValid ? 'bg-ok-soft/40' : 'bg-danger-soft/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0 rounded-full ${
                              isValid ? 'bg-brand' : 'bg-danger'
                            }`}
                          />
                          <span className="font-black text-ink text-xs sm:text-base truncate">{log.code}</span>
                        </div>
                        <div className="text-ink/80 text-xs sm:text-sm mt-0.5 font-bold truncate">{log.name}</div>
                        <div className="text-ink/60 text-[10px] sm:text-xs mt-0.5 truncate">
                          {log.time} • {log.gate}
                        </div>
                      </div>

                      <span
                        className={`border-2 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 ${
                          isValid
                            ? 'border-brand bg-white text-brand'
                            : 'border-danger bg-white text-danger'
                        }`}
                      >
                        {isValid ? 'VERIFIED' : 'DENIED'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 3. MODAL STATUS VISUAL SCANNER ==================== */}

      {/* A. MODAL STATUS: BERHASIL / VALID (HIJAU) */}
      {scanState === 'VALID' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-ink/75 backdrop-blur-xs overflow-y-auto">
          <div className="my-4 w-full max-w-xl border-[3px] border-ink bg-white shadow-brutal-lg transition-transform animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-brand p-3.5 sm:p-5 text-white">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center border-2 border-ink bg-white text-brand shadow-brutal-sm font-bold">
                  <CheckCircle2 size={24} className="sm:size-8" />
                </div>
                <div className="min-w-0">
                  <span className="inline-block border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] sm:text-xs font-black uppercase text-[#79db8d]">
                    ACCESS GRANTED
                  </span>
                  <h2 className="font-display text-lg sm:text-3xl font-black uppercase tracking-tight text-white truncate">
                    TIKET VALID // AKSES DIIZINKAN!
                  </h2>
                </div>
              </div>

              <div className="text-right font-mono text-xs hidden sm:block shrink-0 ml-2">
                <span className="text-white/70 block">STATUS DB</span>
                <span className="font-bold text-base sm:text-lg text-white">CHECKED-IN</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-[#f2f4f3] px-3.5 sm:px-5 py-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm">KODE:</span>
                <span className="border-2 border-ink bg-white px-2.5 py-0.5 font-black text-ink text-xs sm:text-sm">
                  {lastScanDetail.code}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold">
                VERIFIKASI: <strong className="text-brand">{lastScanDetail.verifiedAt}</strong>
              </div>
            </div>

            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
              <div className="border-2 border-ink bg-[#f8faf9] p-3.5 sm:p-5 shadow-brutal-sm">
                <span className="font-mono text-xs sm:text-sm text-ink/60 uppercase font-black block mb-1">NAMA PEMEGANG TIKET</span>
                <div className="font-display text-xl sm:text-3xl font-black uppercase text-ink break-words">
                  {lastScanDetail.holderName}
                </div>
                <div className="mt-1.5 inline-flex items-center gap-2 border-2 border-ink bg-white px-2.5 sm:px-3 py-1 font-mono text-xs sm:text-sm font-bold">
                  <span>Asal / Kontingen: <strong>{lastScanDetail.schoolName}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 font-mono text-xs sm:text-sm">
                <div className="border-2 border-ink bg-white p-3 sm:p-4 shadow-brutal-sm">
                  <span className="text-[11px] sm:text-xs text-ink/60 uppercase font-black block mb-1">PERTANDINGAN</span>
                  <span className="font-black text-ink block break-words">{lastScanDetail.matchTitle}</span>
                  <span className="text-[11px] sm:text-xs text-ink/70 mt-1 block">
                    {lastScanDetail.stage} • {lastScanDetail.arena}
                  </span>
                </div>

                <div className="border-2 border-ink bg-[#fef08a] p-3 sm:p-4 shadow-brutal-sm">
                  <span className="text-[11px] sm:text-xs text-ink/80 uppercase font-black block mb-1">GERBANG MASUK</span>
                  <span className="font-black text-ink block">{selectedGate}</span>
                  <span className="text-[11px] sm:text-xs text-ink font-black mt-1 block">{lastScanDetail.ticketCategory}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-2 border-brand bg-ok-soft p-2.5 sm:p-3 font-mono text-[11px] sm:text-xs font-bold text-brand shadow-brutal-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Volume2 size={16} className="shrink-0" />
                  <span className="truncate">[STATUS: &quot;USED&quot; DI DATABASE MYSQL]</span>
                </div>
                <span className="border border-brand bg-brand px-2 py-0.5 text-white uppercase text-[10px] shrink-0">
                  VERIFIED
                </span>
              </div>
            </div>

            <div className="flex gap-3 border-t-2 border-ink bg-[#f8faf9] p-3.5 sm:p-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border-2 border-ink bg-brand py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm hover:bg-brand-dark cursor-pointer text-center"
              >
                Lanjut Scan Berikutnya (Spacebar / Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. MODAL STATUS: GAGAL / TELAH DIGUNAKAN (MERAH) */}
      {scanState === 'INVALID' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-ink/75 backdrop-blur-xs overflow-y-auto">
          <div className="my-4 w-full max-w-xl border-[3px] border-ink bg-white shadow-brutal-lg transition-transform animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-danger p-3.5 sm:p-5 text-white">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center border-2 border-ink bg-black text-white shadow-brutal-sm font-bold">
                  <XCircle size={24} className="text-white sm:size-8" />
                </div>
                <div className="min-w-0">
                  <span className="inline-block border border-white bg-black px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase text-white">
                    SECURITY ALERT: ACCESS DENIED
                  </span>
                  <h2 className="font-display text-lg sm:text-2xl font-black uppercase tracking-tight text-white truncate">
                    AKSES TIKET DITOLAK!
                  </h2>
                </div>
              </div>

              <div className="text-right font-mono text-xs hidden sm:block shrink-0 ml-2">
                <span className="text-white/70 block">STATUS DB</span>
                <span className="font-bold text-base sm:text-lg text-white">REJECTED</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-[#f2f4f3] px-3.5 sm:px-5 py-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold">KODE:</span>
                <span className="border border-ink bg-white px-2 py-0.5 font-bold line-through text-danger">
                  {lastScanDetail.code}
                </span>
              </div>
              <div className="border border-danger bg-danger-soft px-2 py-0.5 font-bold text-danger">
                TURNSTILE: LOCKED
              </div>
            </div>

            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
              <div className="border-2 border-danger bg-danger-soft p-3.5 sm:p-4 shadow-brutal-sm">
                <div className="flex items-center gap-2 font-display text-sm sm:text-base font-bold uppercase text-danger mb-1">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>Alasan Penolakan Sistem</span>
                </div>
                <p className="font-mono text-xs text-danger leading-relaxed font-bold">
                  {lastScanDetail.errorMessage}
                </p>
                {lastScanDetail.alreadyScannedAt !== 'Sebelumnya' && (
                  <p className="font-mono text-xs text-ink mt-2">
                    Tercatat sudah check-in pada <strong>{lastScanDetail.alreadyScannedAt}</strong> di{' '}
                    <strong>{lastScanDetail.alreadyScannedGate}</strong>.
                  </p>
                )}
              </div>

              <div className="border-2 border-ink bg-[#f8faf9] p-3 sm:p-4 text-xs font-mono space-y-1.5">
                <div className="font-bold uppercase text-ink">Tindakan Petugas Lapangan:</div>
                <ul className="list-disc pl-4 space-y-1 text-ink/80 text-[11px] sm:text-xs">
                  <li>Minta suporter menunjukkan E-Tiket langsung dari menu &quot;Tiket Saya&quot; di aplikasi (bukan screenshot).</li>
                  <li>Cocokkan nama pemegang tiket dengan kartu pelajar / identitas diri.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t-2 border-ink bg-[#f8faf9] p-3.5 sm:p-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border-2 border-ink bg-ink py-2.5 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm hover:bg-black cursor-pointer text-center"
              >
                Tutup &amp; Ulangi Scan (Spacebar / Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
