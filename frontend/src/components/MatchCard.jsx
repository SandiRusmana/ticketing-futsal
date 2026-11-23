import { Ticket, MapPin, Calendar, Clock } from 'lucide-react'
import { getTeamLogoUrl } from '../utils/teamLogos.js'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function RemainingBadge({ n, isClosed }) {
  if (isClosed) {
    return (
      <span className="border-2 border-ink bg-ink px-2.5 sm:px-4 py-1 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm">
        Penjualan Ditutup
      </span>
    )
  }

  if (n <= 0) {
    return (
      <span className="border-2 border-danger bg-danger px-2.5 sm:px-4 py-1 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm">
        Habis Terjual
      </span>
    )
  }

  const low = n <= 30
  return (
    <span
      className={
        'border-2 px-2.5 sm:px-4 py-1 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-brutal-sm ' +
        (low
          ? 'border-danger bg-danger-soft text-danger'
          : 'border-brand bg-ok-soft text-brand')
      }
    >
      ■ Sisa {n} tiket
    </span>
  )
}

function Team({ team, align = 'left' }) {
  const logoUrl = getTeamLogoUrl(team?.name)
  return (
    <div className={`flex-1 min-w-0 flex items-center gap-2 sm:gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={team?.name}
          className="w-8 h-8 sm:w-11 sm:h-11 object-contain border-2 border-ink p-1 bg-white shrink-0 shadow-brutal-xs"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div
          className="w-8 h-8 sm:w-11 sm:h-11 border-2 border-ink shrink-0 shadow-brutal-xs flex items-center justify-center font-mono font-black text-xs uppercase text-white"
          style={{ backgroundColor: team?.color || '#2ea247ff' }}
        >
          <span className="truncate px-0.5">{team?.short?.slice(0, 4) || 'TIM'}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-display text-base sm:text-xl lg:text-2xl font-black uppercase tracking-tight text-ink leading-tight break-words">
          {team?.name || 'Tim TBD'}
        </div>
        <div className="mt-0.5 sm:mt-1 font-mono text-[11px] sm:text-sm font-bold uppercase tracking-wider text-ink/75 break-words">
          {team?.seed || team?.short || 'LFP CIANJUR'}
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value, icon: Icon, align = 'left' }) {
  return (
    <div className={align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}>
      <div className="font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-wider text-ink/75 font-black mb-0.5 sm:mb-1 truncate">
        {label}
      </div>
      <div className={`flex items-center gap-1 sm:gap-1.5 font-mono text-xs sm:text-sm md:text-base font-bold text-ink ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {Icon && <Icon size={15} className="text-brand shrink-0 sm:size-[17px]" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}

export default function MatchCard({ match, onSelect }) {
  const remainingCount = Number(match.quotaAvailable ?? match.remaining ?? 0)
  const isClosed = match.saleStatus === 'CLOSED'
  const isSoldOut = remainingCount <= 0 || isClosed

  return (
    <article className="border-[2.5px] border-ink bg-white shadow-brutal-lg transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#191c1b] flex flex-col justify-between">
      <div>
        {/* Baris Header: Kategori + Stage & Badge Kuota */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-ink bg-[#f8faf9] px-3 sm:px-6 py-2.5 sm:py-4 gap-2">
          <span className="border-2 border-ink bg-white px-2.5 sm:px-4 py-1 sm:py-2 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm">
            {match.category} • {match.stage}
          </span>
          <RemainingBadge n={remainingCount} isClosed={isClosed} />
        </div>

        {/* Bagian Tim Pertandingan */}
        <div className="p-3.5 sm:p-6 md:p-7">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Team team={match.home} />
            <div className="shrink-0 border-2 border-ink bg-[#f2f4f3] px-2.5 py-1 sm:px-4 sm:py-2 font-mono text-[10px] sm:text-sm font-black text-ink shadow-brutal-sm self-center">
              VS
            </div>
            <Team team={match.away} align="right" />
          </div>

          {/* Detail Meta Jadwal (3 Kolom) */}
          <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-1.5 sm:gap-3 border-t-2 border-line pt-3 sm:pt-4">
            <Meta label="TANGGAL" value={match.date} icon={Calendar} />
            <Meta label="KICKOFF" value={match.time || match.kickoff} icon={Clock} align="center" />
            <Meta label="ARENA" value={match.arena} icon={MapPin} align="right" />
          </div>
        </div>
      </div>

      {/* Baris Bawah: Harga & Tombol Beli */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t-2 border-dashed border-ink bg-[#f8faf9] px-3.5 sm:px-6 py-3 sm:py-4">
        <div>
          <div className="font-mono text-[11px] sm:text-sm uppercase tracking-wider text-ink/80 font-bold">
            Kategori Reguler • {match.gate || 'Gate Utama'}
          </div>
          <div className="font-mono text-2xl sm:text-3xl lg:text-4xl font-black text-ink">
            {formatRupiah(match.price)}
          </div>
        </div>

        <button
          type="button"
          disabled={isSoldOut}
          onClick={() => onSelect && onSelect(match)}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 border-[2.5px] border-ink px-4 sm:px-8 py-3 sm:py-3.5 font-mono text-xs sm:text-sm md:text-base font-black uppercase tracking-wider transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
            isSoldOut
              ? 'cursor-not-allowed bg-surface text-ink/40 border-line shadow-none'
              : 'bg-brand text-white shadow-brutal hover:bg-brand-dark'
          }`}
        >
          <Ticket size={18} />
          <span>{isClosed ? 'Ditutup' : isSoldOut ? 'Tiket Habis' : 'Beli Tiket'}</span>
        </button>
      </div>
    </article>
  )
}
