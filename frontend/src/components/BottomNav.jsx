import { Home, Ticket, Trophy, Radio, LogIn, SlidersHorizontal, QrCode, Shield, LogOut } from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'

/**
 * BottomNav.jsx
 * Navigasi Bawah (Bottom Navigation Bar) Khusus Layar Ponsel (Mobile)
 * Menggunakan dummy navigation state: setiap tab beralih secara instan tanpa reload browser.
 * Menyesuaikan dengan peran aktif ('PUBLIC' | 'OPERATOR' | 'ADMIN').
 */
export default function BottomNav() {
  const { currentPage, userRole, openLoginModal, logout, navigateTo } = useNavigation()

  const getNavBtnClass = (page) =>
    'flex flex-1 flex-col items-center justify-center py-2.5 font-mono text-[11px] font-black uppercase transition-all cursor-pointer ' +
    (currentPage === page
      ? 'border-t-2 border-brand bg-brand/10 text-brand'
      : 'text-ink/65 hover:text-ink')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t-2 border-ink bg-white/95 backdrop-blur-sm md:hidden shadow-brutal">
      
      {/* 1. PUBLIC VIEW */}
      {userRole === 'PUBLIC' && (
        <>
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.LANDING)}
            className={getNavBtnClass(PAGE_NAMES.LANDING)}
          >
            <Home size={19} className="mb-0.5" />
            <span>Jadwal</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.BRACKET)}
            className={getNavBtnClass(PAGE_NAMES.BRACKET)}
          >
            <Trophy size={19} className="mb-0.5" />
            <span>Bagan</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.LIVESCORE)}
            className={getNavBtnClass(PAGE_NAMES.LIVESCORE)}
          >
            <Radio size={19} className="mb-0.5 text-danger" />
            <span>Scores</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.TICKETS)}
            className={getNavBtnClass(PAGE_NAMES.TICKETS)}
          >
            <Ticket size={19} className="mb-0.5" />
            <span>Tiket</span>
          </button>

          <button
            type="button"
            onClick={openLoginModal}
            className="flex flex-1 flex-col items-center justify-center py-2.5 font-mono text-[11px] font-black uppercase transition-all text-ink/75 hover:text-ink cursor-pointer"
          >
            <LogIn size={19} className="mb-0.5 text-brand" />
            <span>Masuk</span>
          </button>
        </>
      )}

      {/* 2. OPERATOR VIEW */}
      {userRole === 'OPERATOR' && (
        <>
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.OPERATOR)}
            className={getNavBtnClass(PAGE_NAMES.OPERATOR)}
          >
            <SlidersHorizontal size={19} className="mb-0.5" />
            <span>Skor</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.OPERATOR_SCANNER)}
            className={getNavBtnClass(PAGE_NAMES.OPERATOR_SCANNER)}
          >
            <QrCode size={19} className="mb-0.5" />
            <span>Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.BRACKET)}
            className={getNavBtnClass(PAGE_NAMES.BRACKET)}
          >
            <Trophy size={19} className="mb-0.5" />
            <span>Bagan</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex flex-1 flex-col items-center justify-center py-2.5 font-mono text-[11px] font-black uppercase transition-all text-danger hover:bg-red-50 cursor-pointer"
          >
            <LogOut size={19} className="mb-0.5" />
            <span>Keluar</span>
          </button>
        </>
      )}

      {/* 3. ADMIN VIEW */}
      {userRole === 'ADMIN' && (
        <>
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.ADMIN)}
            className={getNavBtnClass(PAGE_NAMES.ADMIN)}
          >
            <Shield size={19} className="mb-0.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.BRACKET)}
            className={getNavBtnClass(PAGE_NAMES.BRACKET)}
          >
            <Trophy size={19} className="mb-0.5" />
            <span>Bagan</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.LANDING)}
            className={getNavBtnClass(PAGE_NAMES.LANDING)}
          >
            <Home size={19} className="mb-0.5" />
            <span>Publik</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex flex-1 flex-col items-center justify-center py-2.5 font-mono text-[11px] font-black uppercase transition-all text-danger hover:bg-red-50 cursor-pointer"
          >
            <LogOut size={19} className="mb-0.5" />
            <span>Keluar</span>
          </button>
        </>
      )}

    </nav>
  )
}
