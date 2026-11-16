import { useState, useEffect } from 'react'
import { X, ShieldCheck, Timer, CreditCard, QrCode, CheckCircle2, ChevronRight, ArrowRight, AlertCircle } from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default function CheckoutModal({ match, onClose }) {
  const { currentUser, navigateTo, refreshMatches, refreshMyTickets, showToast } = useNavigation()

  const maxAllowed = Math.min(4, Math.max(1, Number(match?.quotaAvailable ?? match?.remaining ?? 4)))
  const [ticketCount, setTicketCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('QRIS')
  const [timeLeft, setTimeLeft] = useState(600)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  if (!match) return null

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const ticketSubtotal = Number(match.price || 0) * ticketCount
  const adminFee = 2500
  const totalAmount = ticketSubtotal + adminFee

  const handlePay = async () => {
    const token = localStorage.getItem('futsaltix_token')
    if (!token || !currentUser) {
      showToast?.('Silakan masuk atau daftar akun suporter terlebih dahulu untuk memesan tiket.')
      onClose()
      navigateTo(PAGE_NAMES.LOGIN)
      return
    }

    setIsProcessing(true)
    setErrorMsg('')

    try {
      // 1. Kunci kuota tiket di MySQL (Checkout)
      const checkoutRes = await futsaltixApi.checkoutTicket({
        match_id: match.id,
        quantity: ticketCount,
        payment_method: paymentMethod,
      })
      const order = checkoutRes.data.order

      // 2. Konfirmasi pembayaran & generate QR E-Ticket
      await futsaltixApi.payOrder(order.id, paymentMethod)

      // 3. Refresh kuota di Home & daftar tiket di TiketSaya
      await Promise.all([refreshMatches(), refreshMyTickets()])

      setIsSuccess(true)
      setTimeout(() => {
        onClose()
        navigateTo(
          PAGE_NAMES.TICKETS,
          `Pembayaran ${ticketCount} tiket ${match.home.name} vs ${match.away.name} Berhasil! E-Tiket siap dipindai di Gate.`
        )
      }, 1000)
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Gagal memproses transaksi tiket. Pastikan kuota masih tersedia.'
      setErrorMsg(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-ink/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative my-4 sm:my-8 w-full max-w-4xl border-[3px] border-ink bg-white shadow-brutal-lg transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER STEPPER */}
        <div className="border-b-[2.5px] border-ink bg-[#f8faf9] p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink truncate">
                MIDTRANS SNAP GATEWAY • LIVE MYSQL CHECKOUT
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-white text-ink shadow-brutal-sm hover:bg-danger hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-line pt-2.5 sm:pt-3 font-mono text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 text-ink/70">
              <span className="border border-ink bg-white px-1.5 py-0.5 font-bold">01</span>
              <span className="hidden sm:inline">PILIH TIKET</span>
            </div>
            <ChevronRight size={14} className="text-ink/40" />
            <div className="flex items-center gap-1.5 sm:gap-2 border border-ink bg-brand px-2 sm:px-2.5 py-1 font-bold text-white shadow-brutal-sm">
              <span className="bg-white text-ink px-1.5 py-0.2">02</span>
              <span>CHECKOUT<span className="hidden sm:inline"> &amp; PEMBAYARAN</span></span>
            </div>
            <ChevronRight size={14} className="text-ink/40" />
            <div className="flex items-center gap-1.5 sm:gap-2 text-ink/50">
              <span className="border border-line bg-surface px-1.5 py-0.5 font-bold">03</span>
              <span className="hidden sm:inline">E-TIKET DIGITAL</span>
            </div>
          </div>
        </div>

        {/* Banner Held Quota Timer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-[#dcfce7] px-3.5 sm:px-4 py-2 font-mono text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#15803d] font-bold">
            <Timer size={14} className="shrink-0" />
            <span>HELD QUOTA AMAN: TIKET DIKUNCI SELAMA</span>
          </div>
          <span className="border-2 border-ink bg-ink px-2.5 py-0.5 font-mono text-xs font-bold text-[#79db8d]">
            {formatTimer(timeLeft)}
          </span>
        </div>

        {/* CONTENT 2-KOLOM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-ink">
          {/* Kolom Kiri: Informasi Pemesan & Pilihan Tiket */}
          <div className="p-3.5 sm:p-6 lg:col-span-7 space-y-4 sm:space-y-5">
            <div>
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-brand block">
                [ DATA RESMI SUPORTER ]
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink mt-0.5">
                Informasi Pemesan
              </h3>
            </div>

            {!currentUser && (
              <div className="border-2 border-ink bg-[#fef08a] p-3 sm:p-3.5 font-mono text-xs font-bold text-ink">
                Anda belum login. Klik tombol Bayar untuk diarahkan ke halaman Masuk / Daftar Akun Suporter.
              </div>
            )}

            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <div>
                <label className="text-ink/75 uppercase text-[11px] sm:text-xs font-bold block mb-1">
                  Nama Lengkap Sesuai KTP / Kartu Pelajar:
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.name || 'Tamu Suporter GGM'}
                  className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 sm:px-3.5 sm:py-2.5 font-sans text-xs sm:text-base font-bold text-ink shadow-brutal-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                <div>
                  <label className="text-ink/75 uppercase text-[11px] sm:text-xs font-bold block mb-1">
                    Email Aktif:
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={currentUser?.email || '-'}
                    className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-bold text-ink shadow-brutal-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-ink/75 uppercase text-[11px] sm:text-xs font-bold block mb-1">
                    Nomor WhatsApp / HP:
                  </label>
                  <input
                    type="tel"
                    readOnly
                    value={currentUser?.phone || '-'}
                    className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-bold text-ink shadow-brutal-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-ink/75 uppercase text-[11px] sm:text-xs font-bold block mb-1">
                  Afiliasi Sekolah / Suporter:
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.school_affiliation || currentUser?.school || 'Suporter Pelajar Cianjur'}
                  className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-bold text-ink shadow-brutal-sm outline-none"
                />
              </div>
            </div>

            {/* Pemilihan Jumlah Tiket */}
            <div className="border-2 border-ink bg-surface p-3.5 sm:p-5 shadow-brutal-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs sm:text-base font-black uppercase text-ink block">
                    Jumlah Tiket:
                  </span>
                  <span className="font-mono text-[11px] sm:text-xs text-ink/70">
                    Maksimal {maxAllowed} tiket per transaksi
                  </span>
                </div>

                <div className="flex items-center border-2 border-ink bg-white shadow-brutal-sm">
                  <button
                    type="button"
                    onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                    disabled={ticketCount <= 1 || isProcessing}
                    className="h-9 w-9 sm:h-10 sm:w-10 font-mono text-base sm:text-lg font-black text-ink hover:bg-surface disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 sm:w-12 text-center font-mono text-sm sm:text-base font-black text-ink">
                    {ticketCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTicketCount((c) => Math.min(maxAllowed, c + 1))}
                    disabled={ticketCount >= maxAllowed || isProcessing}
                    className="h-9 w-9 sm:h-10 sm:w-10 font-mono text-base sm:text-lg font-black text-ink hover:bg-surface disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 border border-line bg-ok-soft/50 p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed text-ink/80 font-mono">
              <ShieldCheck size={16} className="text-brand mt-0.5 shrink-0" />
              <span>
                Tiket resmi bebas calo. Dilarang membawa botol kemasan keras, flare, atau benda tajam ke dalam GGM Cianjur.
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Saluran Pembayaran & Ringkasan Biaya */}
          <div className="p-3.5 sm:p-6 lg:col-span-5 bg-[#f8faf9] space-y-4 sm:space-y-5">
            <div>
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink/75 block">
                RINGKASAN PESANAN
              </span>
              <h4 className="font-display text-lg sm:text-xl font-black uppercase text-ink mt-0.5 break-words">
                {match.home.name} vs {match.away.name}
              </h4>
              <p className="font-mono text-xs sm:text-sm text-ink/75 mt-1 font-semibold">
                {match.date} • {match.time || match.kickoff} • {match.arena}
              </p>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div>
              <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-ink block mb-2">
                PILIH METODE PEMBAYARAN:
              </span>
              <div className="space-y-2 sm:space-y-2.5 font-mono text-xs sm:text-sm">
                {[
                  { key: 'QRIS', label: 'QRIS (GoPay, OVO, Dana, ShopeePay)', icon: QrCode },
                  { key: 'BCA_VA', label: 'BCA Virtual Account', icon: CreditCard },
                  { key: 'MANDIRI', label: 'Mandiri Bill Payment', icon: CreditCard },
                  { key: 'GOPAY', label: 'GoPay / GoPay Later', icon: CreditCard },
                ].map((method) => {
                  const Icon = method.icon
                  const isSelected = paymentMethod === method.key

                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key)}
                      className={`flex w-full items-center justify-between border-2 p-2.5 sm:p-3.5 text-left transition-all shadow-brutal-sm cursor-pointer ${
                        isSelected
                          ? 'border-ink bg-white font-black text-brand ring-2 ring-brand'
                          : 'border-line bg-white text-ink/80 hover:border-ink font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <Icon size={16} className={`shrink-0 ${isSelected ? 'text-brand' : 'text-ink/60'}`} />
                        <span className="truncate">{method.label}</span>
                      </div>
                      <span className={`h-3.5 w-3.5 shrink-0 rounded-full border border-ink ${isSelected ? 'bg-brand' : 'bg-white'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rincian Harga */}
            <div className="border-t-2 border-line pt-3 sm:pt-4 font-mono text-xs sm:text-sm space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-ink/80 font-bold">
                <span>Tiket ({ticketCount}x {formatRupiah(match.price)}):</span>
                <span>{formatRupiah(ticketSubtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/80 font-bold">
                <span>Biaya Layanan Gerbang:</span>
                <span>{formatRupiah(adminFee)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-ink pt-2 font-display text-sm sm:text-lg font-black text-ink">
                <span>TOTAL TAGIHAN:</span>
                <span className="text-brand font-mono text-lg sm:text-2xl font-black">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 border-2 border-danger bg-danger/10 p-3 font-mono text-xs font-bold text-danger">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Notifikasi Sukses Bayar */}
            {isSuccess ? (
              <div className="flex items-center justify-center gap-2 border-2 border-brand bg-ok-soft p-3 sm:p-3.5 font-mono text-xs sm:text-sm font-bold text-brand shadow-brutal-sm">
                <CheckCircle2 size={18} />
                <span>Pembayaran Sukses! Mengalihkan ke Tiket Saya...</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePay}
                className="flex w-full items-center justify-center gap-2 border-2 border-ink bg-brand py-3.5 sm:py-4 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white shadow-brutal transition-all hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 cursor-pointer text-center"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Menyimpan ke Server GGM...</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">Bayar Sekarang ({formatRupiah(totalAmount)})</span>
                    <ArrowRight size={16} className="shrink-0" />
                  </>
                )}
              </button>
            )}

            <div className="text-center font-mono text-[11px] sm:text-xs text-ink/65 font-medium">
              Transaksi dilindungi oleh Midtrans 3D-Secure &amp; AFKAB Cianjur.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
