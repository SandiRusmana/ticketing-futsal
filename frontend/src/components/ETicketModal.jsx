import { useState, useEffect } from 'react'
import { X, Check, Copy, MapPin, Calendar, Clock, ShieldCheck, Download } from 'lucide-react'

/**
 * ETicketModal.jsx
 * Komponen Modal Popup E-Ticket Neo-Brutalist
 * Menampilkan rincian tiket pertandingan, kode QR scannable proporsional, dan kode masuk unik.
 * 
 * Props:
 * - ticket: objek tiket yang dipilih (atau null bila modal tertutup)
 * - onClose: fungsi callback untuk menutup modal
 */
export default function ETicketModal({ ticket, onClose }) {
  const [copied, setCopied] = useState(false)

  // Menutup modal dengan tombol Escape pada keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!ticket) return null

  // Fungsi menyalin kode masuk ke clipboard dengan feedback visual
  const copyCode = () => {
    if (ticket?.entryCode) {
      navigator.clipboard?.writeText(ticket.entryCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isUsed = ticket.status === 'DIGUNAKAN'

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-ink/75 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Kontainer Modal (Lebar, Elegan, dan Proporsional) */}
      <div 
        className="relative my-4 sm:my-8 w-full max-w-[680px] border-[3px] border-ink bg-white shadow-brutal-lg transition-transform animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Bar */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-4 border-b-[2.5px] border-ink bg-[#f8faf9] p-3.5 sm:p-6">
          <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
            {/* Badge kategori & status */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="border-2 border-ink bg-white px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-ink shadow-brutal-sm">
                {ticket.stage} • {ticket.court}
              </span>
              <span 
                className={`border-2 border-ink px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-brutal-sm ${
                  isUsed 
                    ? 'bg-danger text-white' 
                    : 'bg-brand text-white'
                }`}
              >
                STATUS: {ticket.status}
              </span>
            </div>

            {/* Judul Pertandingan (Besar & Tegas) */}
            <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-ink leading-tight break-words">
              {ticket.matchTitle}
            </h2>

            {/* Lokasi Venue */}
            <div className="flex items-center gap-1.5 text-ink/80 text-[11px] sm:text-sm font-mono font-medium">
              <MapPin size={14} className="text-brand shrink-0 sm:size-4" />
              <span className="truncate">{ticket.venue}</span>
            </div>
          </div>

          {/* Tombol Tutup X */}
          <button 
            type="button"
            onClick={onClose}
            aria-label="Tutup E-Ticket"
            className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-ink bg-white text-ink shadow-brutal-sm transition-all hover:bg-danger hover:text-white active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Isi Tiket: QR Code & Detail */}
        <div className="p-3.5 sm:p-7 space-y-4 sm:space-y-6">
          
          {/* Box Display QR Code */}
          <div className="border-[2.5px] border-ink bg-[#f2f4f3] p-3.5 sm:p-7 text-center shadow-brutal-sm">
            {/* Gate indicator banner */}
            <div className="mb-4 sm:mb-5 inline-flex items-center gap-1.5 sm:gap-2 border-2 border-ink bg-ink px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-white shadow-brutal-sm max-w-full">
              <span className={`h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0 rounded-full ${isUsed ? 'bg-danger' : 'bg-[#79db8d] animate-pulse'}`} />
              <span className="truncate">{ticket.gate} • {ticket.turnstile} • {isUsed ? 'SUDAH DIGUNAKAN' : 'READY TO SCAN'}</span>
            </div>

            {/* Kontainer QR Code Responsif Proporsional */}
            <div className="relative mx-auto flex h-44 w-44 sm:h-64 sm:w-64 items-center justify-center border-[2.5px] border-ink bg-white p-2.5 sm:p-3.5 shadow-brutal">
              {/* Vektor QR Code Neo-Brutalist Tajam (SVG) */}
              <svg 
                className={`w-full h-full text-ink transition-opacity ${isUsed ? 'opacity-30' : 'opacity-100'}`} 
                viewBox="0 0 100 100" 
                fill="currentColor"
                shapeRendering="crispEdges"
              >
                {/* Pola Sudut Kiri Atas */}
                <rect x="5" y="5" width="28" height="28" fill="#191c1b" />
                <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
                <rect x="13" y="13" width="12" height="12" fill="#191c1b" />

                {/* Pola Sudut Kanan Atas */}
                <rect x="67" y="5" width="28" height="28" fill="#191c1b" />
                <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
                <rect x="75" y="13" width="12" height="12" fill="#191c1b" />

                {/* Pola Sudut Kiri Bawah */}
                <rect x="5" y="67" width="28" height="28" fill="#191c1b" />
                <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
                <rect x="13" y="75" width="12" height="12" fill="#191c1b" />

                {/* Grid Bit Data Matriks */}
                <rect x="37" y="5" width="4" height="4" />
                <rect x="45" y="5" width="4" height="4" />
                <rect x="57" y="5" width="4" height="4" />
                <rect x="37" y="13" width="4" height="4" />
                <rect x="49" y="13" width="4" height="4" />
                <rect x="53" y="17" width="4" height="4" />
                <rect x="41" y="21" width="4" height="4" />
                <rect x="61" y="21" width="4" height="4" />
                <rect x="5" y="37" width="4" height="4" />
                <rect x="13" y="37" width="4" height="4" />
                <rect x="25" y="37" width="4" height="4" />
                <rect x="41" y="37" width="4" height="4" />
                <rect x="53" y="37" width="4" height="4" />
                <rect x="65" y="37" width="4" height="4" />
                <rect x="77" y="37" width="4" height="4" />
                <rect x="89" y="37" width="4" height="4" />
                <rect x="21" y="45" width="4" height="4" />
                <rect x="29" y="45" width="4" height="4" />
                <rect x="69" y="45" width="4" height="4" />
                <rect x="85" y="45" width="4" height="4" />
                <rect x="5" y="53" width="4" height="4" />
                <rect x="37" y="53" width="4" height="4" />
                <rect x="57" y="53" width="4" height="4" />
                <rect x="73" y="53" width="4" height="4" />
                <rect x="89" y="53" width="4" height="4" />
                <rect x="37" y="69" width="4" height="4" />
                <rect x="45" y="69" width="4" height="4" />
                <rect x="61" y="69" width="4" height="4" />
                <rect x="73" y="73" width="4" height="4" />
                <rect x="81" y="69" width="4" height="4" />
                <rect x="49" y="85" width="4" height="4" />
                <rect x="65" y="81" width="4" height="4" />
                <rect x="77" y="85" width="4" height="4" />

                {/* Emblem Logo FutsalTix di Tengah QR */}
                <rect x="39" y="39" width="22" height="22" fill="#ffffff" stroke="#191c1b" strokeWidth="2" />
                <rect x="43" y="43" width="14" height="14" fill="#15803d" />
              </svg>

              {/* Watermark jika tiket sudah digunakan */}
              {isUsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/85 p-2">
                  <div className="rotate-[-12deg] border-2 border-danger bg-danger-soft px-3 py-1 font-mono text-xs sm:text-base font-black uppercase tracking-wider text-danger shadow-brutal-sm">
                    TIKET TELAH DIPINDAI
                  </div>
                </div>
              )}
            </div>

            {/* Kode Masuk Mandiri + Tombol Salin */}
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5">
              <span className="font-mono text-[11px] sm:text-xs uppercase text-ink/70 font-bold">
                KODE MASUK MANDIRI:
              </span>
              <button
                type="button"
                onClick={copyCode}
                title="Klik untuk menyalin kode"
                className="inline-flex items-center gap-2 border-2 border-ink bg-white px-3 sm:px-4 py-1.5 shadow-brutal-sm transition-all hover:bg-surface active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <span className="font-mono text-sm sm:text-lg font-black tracking-wider text-ink">
                  {ticket.entryCode}
                </span>
                {copied ? (
                  <span className="flex items-center gap-1 font-mono text-xs sm:text-sm text-brand font-bold">
                    <Check size={14} /> Tersalin!
                  </span>
                ) : (
                  <Copy size={14} className="text-brand" />
                )}
              </button>
            </div>
          </div>

          {/* Informasi Detail Tiket */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-4 border-2 border-ink bg-white p-3.5 sm:p-5 shadow-brutal-sm">
            <div>
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-ink/75 font-black">TANGGAL</div>
              <div className="mt-1 font-mono text-xs sm:text-base font-bold flex items-center gap-1 text-ink">
                <Calendar size={14} className="text-brand shrink-0 sm:size-[17px]" /> <span className="truncate">{ticket.date}</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-ink/75 font-black">KICKOFF</div>
              <div className="mt-1 font-mono text-xs sm:text-base font-bold flex items-center gap-1 text-ink">
                <Clock size={14} className="text-brand shrink-0 sm:size-[17px]" /> <span className="truncate">{ticket.kickoff}</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-ink/75 font-black">KATEGORI</div>
              <div className="mt-1 font-mono text-xs sm:text-base font-bold text-ink truncate">{ticket.tier}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-ink/75 font-black">ID TIKET</div>
              <div className="mt-1 font-mono text-xs sm:text-lg font-black text-brand truncate">{ticket.ticketCode}</div>
            </div>
          </div>

          {/* Data Pemilik */}
          <div className="border-2 border-ink bg-surface p-3 sm:p-4 text-xs sm:text-base font-mono space-y-1 shadow-brutal-sm">
            <div className="flex justify-between items-center gap-2">
              <span className="text-ink/70 shrink-0">Pemegang Tiket:</span>
              <span className="font-black text-ink text-sm sm:text-lg truncate">{ticket.buyerName}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-ink/70 shrink-0">Afiliasi Sekolah:</span>
              <span className="font-bold text-ink truncate">{ticket.schoolAffiliation}</span>
            </div>
          </div>

          {/* Catatan Penting Penukaran Gelang */}
          <div className="flex items-start gap-2.5 sm:gap-3 border-2 border-ink bg-ok-soft p-3.5 sm:p-5 text-xs sm:text-base leading-relaxed text-ink/90 font-mono shadow-brutal-sm font-medium">
            <ShieldCheck size={18} className="text-brand mt-0.5 shrink-0 sm:size-[22px]" />
            <p>
              Tunjukkan QR Code ini pada kamera scanner di <strong>{ticket.gate}</strong>. 
              Kecerahan layar HP disarankan maksimal agar proses pemindaian turnstile berlangsung instan tanpa sentuh.
            </p>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t-[2.5px] border-ink bg-[#f8faf9] p-3.5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto text-center border-2 border-ink bg-white px-5 sm:px-7 py-3 sm:py-3.5 font-mono text-xs sm:text-base font-black uppercase tracking-wider shadow-brutal-sm hover:bg-surface active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => alert(`Simulasi: Tiket ${ticket.ticketCode} siap diunduh dalam format PDF/Gambar.`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-ink bg-brand px-5 sm:px-7 py-3 sm:py-3.5 font-mono text-xs sm:text-base font-black uppercase tracking-wider text-white shadow-brutal-sm hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Download size={16} />
            <span>Unduh E-Tiket</span>
          </button>
        </div>
      </div>
    </div>
  )
}
