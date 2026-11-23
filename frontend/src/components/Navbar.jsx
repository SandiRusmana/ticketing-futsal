import { useState } from 'react'
import { 
  Ticket, 
  Menu, 
  X, 
  Home, 
  LogIn, 
  UserPlus, 
  Trophy, 
  Radio, 
  LogOut, 
  Shield, 
  SlidersHorizontal,
  QrCode,
  UserCheck
} from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'

export default function Navbar() {
  const { 
    currentPage, 
    userRole, 
    currentUser, 
    openLoginModal, 
    logout, 
    navigateTo 
  } = useNavigation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getNavBtnClass = (page) =>
    'flex items-center gap-2 py-2 text-sm lg:text-base font-bold tracking-wide transition-all cursor-pointer ' +
    (currentPage === page
      ? 'border-b-[2.5px] border-brand text-brand font-black'
      : 'text-ink/75 hover:text-ink hover:border-b-2 hover:border-ink/30')

  const getMobileBtnClass = (page) =>
    'flex w-full items-center gap-2.5 sm:gap-3 border-2 border-ink p-3 sm:p-3.5 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ' +
    (currentPage === page
      ? 'bg-ink text-white shadow-brutal-sm'
      : 'bg-white text-ink hover:bg-surface')

  const handleNavClick = (page) => {
    navigateTo(page)
    setMobileMenuOpen(false)
  }

  const handleBrandClick = () => {
    if (userRole === 'OPERATOR') {
      handleNavClick(PAGE_NAMES.OPERATOR)
    } else if (userRole === 'ADMIN') {
      handleNavClick(PAGE_NAMES.ADMIN)
    } else {
      handleNavClick(PAGE_NAMES.LANDING)
    }
  }

  return (
    <header className="w-full border-b-[2.5px] border-ink bg-[#f8faf9]/95 backdrop-blur-sm sticky top-0 z-40 shadow-brutal-sm">
      <div className="w-full max-w-[1440px] 2xl:max-w-[1560px] mx-auto flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-6 lg:px-8 2xl:px-10 py-2.5 sm:py-3.5">
        
        {/* LOGO & BRAND */}
        <button
          type="button"
          onClick={handleBrandClick}
          className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer shrink-0 min-w-0"
        >
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center border-2 border-ink bg-brand text-white shadow-brutal-sm transition-transform group-hover:scale-105 shrink-0">
            <Ticket size={20} className="rotate-[-10deg] sm:size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display text-base sm:text-xl md:text-2xl font-black uppercase leading-none tracking-tight text-ink truncate">
                FutsalTix Cianjur
              </span>
              {userRole === 'OPERATOR' && (
                <span className="bg-[#fef08a] text-ink font-mono text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 border border-ink uppercase shrink-0">
                  OPERATOR
                </span>
              )}
              {userRole === 'ADMIN' && (
                <span className="bg-brand text-white font-mono text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 border border-ink uppercase shrink-0">
                  ADMIN
                </span>
              )}
            </div>
            <div className="mt-0.5 sm:mt-1 font-mono text-[10px] sm:text-[13px] uppercase tracking-wider text-ink/75 font-semibold truncate">
              <strong className="text-brand font-black">LFP 2026</strong> • GGM Cianjur
            </div>
          </div>
        </button>

        {/* DESKTOP NAV - PUBLIC */}
        {userRole === 'PUBLIC' && (
          <nav className="hidden items-center gap-5 xl:gap-8 lg:flex">
            <button type="button" onClick={() => handleNavClick(PAGE_NAMES.LANDING)} className={getNavBtnClass(PAGE_NAMES.LANDING)}>
              <Home size={19} className="text-brand" />
              <span>Jadwal Laga</span>
            </button>
            <button type="button" onClick={() => handleNavClick(PAGE_NAMES.BRACKET)} className={getNavBtnClass(PAGE_NAMES.BRACKET)}>
              <Trophy size={19} className="text-brand" />
              <span>Bagan Turnamen</span>
            </button>
            <button type="button" onClick={() => handleNavClick(PAGE_NAMES.LIVESCORE)} className={getNavBtnClass(PAGE_NAMES.LIVESCORE)}>
              <Radio size={19} className="text-danger animate-pulse" />
              <span>Live Score &amp; Hasil</span>
            </button>
            <button type="button" onClick={() => handleNavClick(PAGE_NAMES.TICKETS)} className={getNavBtnClass(PAGE_NAMES.TICKETS)}>
              <Ticket size={19} className="text-brand" />
              <span>Tiket Saya</span>
            </button>
          </nav>
        )}

        {/* DESKTOP NAV - OPERATOR */}
        {userRole === 'OPERATOR' && (
          <nav className="hidden items-center gap-3 xl:gap-5 lg:flex">
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.OPERATOR)}
              className={getNavBtnClass(PAGE_NAMES.OPERATOR)}
            >
              <SlidersHorizontal size={18} className="text-brand" />
              <span>Dashboard Operator</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.OPERATOR_SCANNER)}
              className={getNavBtnClass(PAGE_NAMES.OPERATOR_SCANNER)}
            >
              <QrCode size={18} className="text-brand" />
              <span>Scanner Gate</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.BRACKET)}
              className={getNavBtnClass(PAGE_NAMES.BRACKET)}
            >
              <Trophy size={18} className="text-brand" />
              <span>Bagan Turnamen</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.LIVESCORE)}
              className={getNavBtnClass(PAGE_NAMES.LIVESCORE)}
            >
              <Radio size={18} className="text-danger animate-pulse" />
              <span>Live Score</span>
            </button>
          </nav>
        )}

        {/* DESKTOP NAV - ADMIN */}
        {userRole === 'ADMIN' && (
          <nav className="hidden items-center gap-3 xl:gap-5 lg:flex">
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.ADMIN)}
              className={getNavBtnClass(PAGE_NAMES.ADMIN)}
            >
              <Shield size={18} className="text-brand" />
              <span>Admin Panel</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.OPERATOR)}
              className={getNavBtnClass(PAGE_NAMES.OPERATOR)}
            >
              <SlidersHorizontal size={18} className="text-brand" />
              <span>Meja Wasit</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.BRACKET)}
              className={getNavBtnClass(PAGE_NAMES.BRACKET)}
            >
              <Trophy size={18} className="text-brand" />
              <span>Bagan Turnamen</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(PAGE_NAMES.LIVESCORE)}
              className={getNavBtnClass(PAGE_NAMES.LIVESCORE)}
            >
              <Radio size={18} className="text-danger animate-pulse" />
              <span>Live Score</span>
            </button>
          </nav>
        )}

        {/* TRAILING ACTION (LOGIN / PROFILE) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openLoginModal}
                className="px-3 sm:px-5 py-2 sm:py-2.5 border-2 border-ink bg-white font-mono text-[11px] sm:text-sm font-black uppercase tracking-wider text-ink shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <LogIn size={15} className="sm:size-[17px]" />
                <span>Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick(PAGE_NAMES.REGISTER)}
                className="hidden sm:inline-flex px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-ink bg-brand text-white font-mono text-xs sm:text-sm font-black uppercase tracking-wider shadow-brutal-sm hover:bg-brand-dark transition-all items-center gap-2 cursor-pointer"
              >
                <UserPlus size={16} />
                <span>Daftar Akun</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 border-2 border-ink bg-surface font-mono text-xs sm:text-sm font-black text-ink">
                <UserCheck size={16} className="text-brand" />
                <span>{currentUser.name || 'Suporter GGM'}</span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-ink bg-white text-danger font-mono text-xs sm:text-sm font-black uppercase shadow-brutal-sm hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={15} />
                <span>Keluar</span>
              </button>
            </div>
          )}

          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center border-2 border-ink bg-white text-ink shadow-brutal-sm hover:bg-surface cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-ink bg-white px-3 sm:px-6 py-3 space-y-2 shadow-brutal">
          {userRole === 'PUBLIC' && (
            <>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.LANDING)} className={getMobileBtnClass(PAGE_NAMES.LANDING)}>
                <Home size={18} className="text-brand" />
                <span>Jadwal Laga</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.BRACKET)} className={getMobileBtnClass(PAGE_NAMES.BRACKET)}>
                <Trophy size={18} className="text-brand" />
                <span>Bagan Turnamen</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.LIVESCORE)} className={getMobileBtnClass(PAGE_NAMES.LIVESCORE)}>
                <Radio size={18} className="text-danger" />
                <span>Live Score &amp; Hasil</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.TICKETS)} className={getMobileBtnClass(PAGE_NAMES.TICKETS)}>
                <Ticket size={18} className="text-brand" />
                <span>Tiket Saya</span>
              </button>
            </>
          )}

          {userRole === 'OPERATOR' && (
            <>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.OPERATOR)} className={getMobileBtnClass(PAGE_NAMES.OPERATOR)}>
                <SlidersHorizontal size={18} className="text-brand" />
                <span>Dashboard Operator</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.OPERATOR_SCANNER)} className={getMobileBtnClass(PAGE_NAMES.OPERATOR_SCANNER)}>
                <QrCode size={18} className="text-brand" />
                <span>Scanner Gate</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.BRACKET)} className={getMobileBtnClass(PAGE_NAMES.BRACKET)}>
                <Trophy size={18} className="text-brand" />
                <span>Bagan Babak Gugur</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.LIVESCORE)} className={getMobileBtnClass(PAGE_NAMES.LIVESCORE)}>
                <Radio size={18} className="text-danger" />
                <span>Live Score</span>
              </button>
            </>
          )}

          {userRole === 'ADMIN' && (
            <>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.ADMIN)} className={getMobileBtnClass(PAGE_NAMES.ADMIN)}>
                <Shield size={18} className="text-brand" />
                <span>Super Admin Panel</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.OPERATOR)} className={getMobileBtnClass(PAGE_NAMES.OPERATOR)}>
                <SlidersHorizontal size={18} className="text-brand" />
                <span>Meja Wasit</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.BRACKET)} className={getMobileBtnClass(PAGE_NAMES.BRACKET)}>
                <Trophy size={18} className="text-brand" />
                <span>Bagan Turnamen</span>
              </button>
              <button type="button" onClick={() => handleNavClick(PAGE_NAMES.LIVESCORE)} className={getMobileBtnClass(PAGE_NAMES.LIVESCORE)}>
                <Radio size={18} className="text-danger" />
                <span>Live Score</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}