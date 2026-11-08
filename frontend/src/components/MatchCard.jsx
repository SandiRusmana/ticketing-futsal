import { Ticket } from 'lucide-react'
import { formatRupiah } from '../data/matches.js'

// Sisa tiket <= 30 tampil merah (hampir habis), selain itu hijau
function RemainingBadge({ n }) {
  const low = n <= 30
  return (
    <span
      className={
        'border px-2 py-1 font-mono text-xs uppercase tracking-wider ' +
        (low
          ? 'border-danger/40 bg-danger-soft text-danger'
          : 'border-brand/40 bg-ok-soft text-brand')
      }
    >
      ■ Sisa {n} tiket
    </span>
  )
}

function Team({ team, align = 'left' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className="font-display text-2xl font-bold tracking-tight">{team.name}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-widest text-ink/70">
        {team.seed}
      </div>
    </div>
  )
}

function Meta({ label, value, align = 'left' }) {
  return (
    <div className={align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/70">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  )
}

export default function MatchCard({ match }) {
  return (
    <article className="border border-ink bg-paper">
      {/* Header: kategori + sisa tiket */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="border border-ink bg-white px-2 py-1 font-mono text-xs uppercase tracking-wider">
          {match.category} - {match.stage}
        </span>
        <RemainingBadge n={match.remaining} />
      </div>

      {/* Tim */}
      <div className="px-5 pt-7">
        <div className="flex items-center justify-between gap-3">
          <Team team={match.home} />
          <span className="border border-line bg-surface px-3 py-1.5 font-mono text-xs">VS</span>
          <Team team={match.away} align="right" />
        </div>

        {/* Detail jadwal */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pb-6 pt-4">
          <Meta label="TANGGAL" value={match.date} />
          <Meta label="KICKOFF" value={match.kickoff} align="center" />
          <Meta label="ARENA" value={match.arena} align="right" />
        </div>
      </div>

      {/* Harga + tombol beli */}
      <div className="flex items-center justify-between gap-4 border-t border-dashed border-line px-5 py-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
            Kategori Reguler
          </div>
          <div className="font-mono text-xl">Rp {match.price.toLocaleString('id-ID')}</div>
        </div>
        <button className="flex items-center gap-2 bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">
          <Ticket size={18} />
          Beli Tiket ({formatRupiah(match.price)})
        </button>
      </div>
    </article>
  )
}
