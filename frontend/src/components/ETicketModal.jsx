import { useState, useEffect } from 'react'
import { X, Check, Copy, MapPin, Calendar, Clock, ShieldCheck, Download, QrCode, Ticket, ChevronRight } from 'lucide-react'
import RealQRCode from '../utils/qrCodeGenerator.jsx'

/**
 * ETicketModal.jsx
 * Komponen Modal Popup E-Ticket Neo-Brutalist Resmi
 * Turnamen: Liga Futsal Pelajar (LFP) Cianjur 2026
 * Menampilkan QR Code asli berbasis token hash/UUID dari database MySQL
 * Mendukung navigasi Multi-Ticket untuk pemesanan quantity > 1
 */
export default function ETicketModal({ ticket, initialSubIndex = 0, onClose }) {
  const [copied, setCopied] = useState(false)
  const [selectedSubIndex, setSelectedSubIndex] = useState(0)

  // Reset tab ke sub-tiket yang dipilih saat modal dibuka atau ticket berubah
  useEffect(() => {
    if (ticket) {
      setSelectedSubIndex(ticket.activeSubIndex ?? initialSubIndex ?? 0)
    }
  }, [ticket, initialSubIndex])

  // Menutup modal dengan tombol Escape pada keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!ticket) return null

  // Daftar sub-tiket (jika quantity > 1)
  const subTickets = (ticket.sub_tickets && ticket.sub_tickets.length > 0)
    ? ticket.sub_tickets
    : [
        {
          ticket_number: 1,
          total_tickets: ticket.quantity || 1,
          ticket_code: ticket.ticketCode || ticket.order_code,
          qr_payload: ticket.qrPayload || ticket.qr_payload || ticket.entryCode || ticket.ticketCode || 'TIX-LFP2026',
          seat_label: `Tiket #1 dari ${ticket.quantity || 1} (Reguler Tribun)`,
          is_checked_in: ticket.status === 'DIGUNAKAN' || Boolean(ticket.is_checked_in),
        }
      ]

  const activeSubTicket = subTickets[selectedSubIndex] || subTickets[0]

  // Token QR aktif yang ditampilkan
  const qrString = String(activeSubTicket.qr_payload || activeSubTicket.ticket_code || 'TIX-LFP2026')
  const activeCode = String(activeSubTicket.ticket_code || ticket.ticketCode || ticket.order_code)
  const isUsed = Boolean(activeSubTicket.is_checked_in) || ticket.status === 'DIGUNAKAN'

  const copyCode = () => {
    navigator.clipboard?.writeText(qrString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/80 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Kontainer Modal */}
      <div 
        className="relative my-4 sm:my-8 w-full max-w-[640px] border-3 border-ink bg-white shadow-brutal-lg transition-transform animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Bar */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink bg-[#f8faf9] p-4 sm:p-6">
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Badge kategori turnamen & status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="border-2 border-ink bg-brand text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-wider shadow-brutal-sm">
                LIGA FUTSAL PELAJAR 2026
              </span>
              <span 
                className={`border-2 border-ink px-3 py-1 font-mono text-xs font-black uppercase tracking-wider shadow-brutal-sm ${
                  isUsed 
                    ? 'bg-danger text-white' 
                    : 'bg-[#dcfce7] text-[#15803d]'
                }`}
              >
                {isUsed ? 'SUDAH DI-SCAN' : 'TIKET SAH & AKTIF'}
              </span>
              {subTickets.length > 1 && (
                <span className="border-2 border-ink bg-amber-400 text-ink px-3 py-1 font-mono text-xs font-black uppercase tracking-wider shadow-brutal-sm">
                  TOTAL {subTickets.length} TIKET
                </span>
              )}
            </div>

            {/* Judul Pertandingan */}
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-ink leading-tight mt-1">
              {ticket.matchTitle || 'Pertandingan LFP 2026'}
            </h2>

            {/* Lokasi Venue */}
            <div className="flex items-center gap-1.5 text-ink/80 text-xs sm:text-sm font-mono font-medium">
              <MapPin size={14} className="text-brand shrink-0" />
              <span className="truncate">{ticket.court || ticket.venue || 'GOR Gelanggang Generasi Muda (GGM) Cianjur'}</span>
            </div>
          </div>

          {/* Tombol Tutup X */}
          <button 
            type="button"
            onClick={onClose}
            aria-label="Tutup E-Ticket"
            className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-white text-ink shadow-brutal-sm hover:bg-danger hover:text-white active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Multi-Ticket Navigation Tabs (jika quantity > 1) */}
        {subTickets.length > 1 && (
          <div className="border-b-2 border-ink bg-[#fffbeb] p-3 sm:px-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-black uppercase text-ink flex items-center gap-1.5">
                <Ticket size={14} className="text-brand" />
                PILIH TIKET PENONTON ({selectedSubIndex + 1}/{subTickets.length})
              </span>
              <span className="font-mono text-[11px] font-bold text-ink/80">
                {activeSubTicket.seat_label}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {subTickets.map((st, idx) => {
                const isCurrentActive = selectedSubIndex === idx
                return (
                  <button
                    key={st.ticket_code || idx}
                    type="button"
                    onClick={() => setSelectedSubIndex(idx)}
                    className={`shrink-0 border-2 border-ink px-3.5 py-1.5 font-mono text-xs font-black uppercase tracking-wider transition-all shadow-brutal-xs cursor-pointer ${
                      isCurrentActive
                        ? 'bg-ink text-white'
                        : 'bg-white text-ink hover:bg-amber-100'
                    }`}
                  >
                    Tiket #{idx + 1} {st.is_checked_in ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Isi Tiket: QR Code Real & Detail Gate */}
        <div className="p-4 sm:p-7 space-y-5">
          {/* Box Display QR Code Asli */}
          <div className="border-2 border-ink bg-[#f2f4f3] p-5 sm:p-7 text-center shadow-brutal-sm">
            {/* Gate indicator banner */}
            <div className="mb-4 inline-flex items-center gap-2 border-2 border-ink bg-ink px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-brutal-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${isUsed ? 'bg-danger' : 'bg-[#79db8d] animate-pulse'}`} />
              <span>{ticket.gate || 'Gate A - Turnstile Utama'} • {isUsed ? 'CHECK-IN RECORDED' : 'READY TO SCAN'}</span>
            </div>

            {/* KODE QR ASLI (Pure SVG ISO Compliant) */}
            <div className="flex justify-center my-2">
              <div className={`transition-opacity ${isUsed ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                <RealQRCode value={qrString} size={210} />
              </div>
            </div>

            {/* Token String Unik E-Tiket */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="border-2 border-ink bg-white px-3 py-1.5 font-mono text-xs sm:text-sm font-black text-ink shadow-brutal-sm">
                {qrString}
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1 border-2 border-ink bg-surface px-2.5 py-1.5 font-mono text-xs font-bold text-ink hover:bg-white active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Salin Token"
              >
                {copied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <p className="mt-3 font-mono text-[11px] text-ink/70 font-semibold">
              Tunjukkan kode QR ini langsung pada kamera scanner di pintu gerbang turnstile GGM Cianjur.
              {subTickets.length > 1 && ' Setiap penonton memindai tiket masing-masing.'}
            </p>
          </div>

          {/* Rincian Tiket Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 border-2 border-ink bg-surface">
              <span className="text-ink/60 uppercase block text-[10px] font-bold">KODE TIKET</span>
              <span className="font-black text-ink text-xs sm:text-sm truncate block mt-0.5" title={activeCode}>
                {activeCode}
              </span>
            </div>
            <div className="p-3 border-2 border-ink bg-surface">
              <span className="text-ink/60 uppercase block text-[10px] font-bold">KATEGORI</span>
              <span className="font-black text-ink text-xs sm:text-sm block mt-0.5">
                {subTickets.length > 1 ? `Tiket #${selectedSubIndex + 1}` : '1 Tiket'}
              </span>
            </div>
            <div className="p-3 border-2 border-ink bg-surface">
              <span className="text-ink/60 uppercase block text-[10px] font-bold">KICK-OFF</span>
              <span className="font-black text-brand text-xs sm:text-sm block mt-0.5">
                {ticket.kickoff || '15:30 WIB'}
              </span>
            </div>
            <div className="p-3 border-2 border-ink bg-surface">
              <span className="text-ink/60 uppercase block text-[10px] font-bold">PEMBAYARAN</span>
              <span className="font-black text-ink text-[11px] truncate block mt-0.5">
                {ticket.payment_method || 'MIDTRANS SNAP'}
              </span>
            </div>
          </div>

          {/* Footer E-Ticket Modal */}
          <div className="pt-2 border-t-2 border-ink flex items-center justify-between font-mono text-xs text-ink/70 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-brand" /> Tiket Resmi Terverifikasi Database MySQL
            </span>
            <button
              type="button"
              onClick={() => alert(`Tiket ${activeCode} resmi disimpan. Silakan screenshot atau tunjukkan layar ini ke Operator Meja GGM.`)}
              className="px-3 py-1.5 bg-ink text-white font-black text-xs uppercase hover:bg-gray-800 cursor-pointer shadow-brutal-sm"
            >
              Unduh Tiket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
