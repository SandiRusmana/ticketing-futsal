import { Link, NavLink, useLocation } from 'react-router-dom'
import { Ticket } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()
  const onLogin = pathname === '/masuk'
  const onRegister = pathname === '/daftar'
  const onHome = pathname === '/'

  const linkClass = ({ isActive }) =>
    'pb-1 text-[15px] ' +
    (isActive && onHome
      ? 'border-b-2 border-brand font-semibold text-brand'
      : 'text-ink/70 hover:text-ink')

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div>
            <div className="font-display text-xl font-extrabold uppercase leading-none tracking-tight">
              FutsalTix Cianjur
            </div>
            {/* Di halaman Beranda, tulisan venue ada di bawah logo */}
            {onHome && (
              <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/70">
                Venue resmi: GGM Cianjur
              </div>
            )}
          </div>
          {/* Di halaman Login/Daftar, venue berbentuk badge di samping logo */}
          {!onHome && (
            <span
              className={
                'px-2 py-1 font-mono text-[11px] uppercase tracking-widest ' +
                (onLogin
                  ? 'border border-ink bg-white'
                  : 'border border-line bg-surface')
              }
            >
              {onRegister && <span className="mr-1.5 text-brand">■</span>}
              Venue: GGM Cianjur
            </span>
          )}
        </Link>

        {/* Menu tengah */}
        <nav className="order-3 flex w-full items-center justify-center gap-8 md:order-none md:w-auto">
          <NavLink to="/" end className={linkClass}>
            Jadwal Pertandingan
          </NavLink>
          <a href="#kategori" className="text-[15px] text-ink/70 hover:text-ink">
            Kategori
          </a>
          <a
            href="#cek-tiket"
            className="flex items-center gap-1.5 text-[15px] text-ink/70 hover:text-ink"
          >
            {onHome && <Ticket size={16} />}
            Cek Tiket
          </a>
        </nav>

        {/* Tombol kanan, berbeda tiap halaman */}
        <div className="flex gap-3">
          {onHome && (
            <>
              <Link
                to="/masuk"
                className="border border-ink bg-white px-5 py-2 font-semibold hover:bg-surface"
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark"
              >
                Daftar
              </Link>
            </>
          )}
          {onLogin && (
            <Link
              to="/daftar"
              className="border border-ink bg-white px-5 py-2.5 font-semibold hover:bg-surface"
            >
              Daftar Akun
            </Link>
          )}
          {onRegister && (
            <Link
              to="/masuk"
              className="border border-ink bg-white px-5 py-2 text-sm hover:bg-surface"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
