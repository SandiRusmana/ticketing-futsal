import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Trophy, 
  UserCheck, 
  QrCode, 
  LogOut, 
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'

/**
 * DashboardSidebar.jsx
 * Sidebar Navigasi Kunci Mati (Fixed Sidebar)
 * Responsif untuk desktop (320px) dan mobile (280px / max-w-[85vw])
 * Sesuai referensi Figma di src/assets (contoh dashboard1.png - contoh dashboard 4.png)
 * 
 * Mendukung role: 'admin' | 'operator'
 */
export default function DashboardSidebar({
  role = 'admin',
  activeTab = 'OVERVIEW',
  setActiveTab,
  pendingOperatorCount = 3,
  onExit,
  onSwitchRole,
  isMobileOpen = false,
  setIsMobileOpen,
}) {
  const { currentUser } = useNavigation()
  const isAdmin = role === 'admin'
  const displayName = currentUser?.name || (isAdmin ? 'Super Admin GGM' : 'Kang Farhan (Operator GGM)')
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || (isAdmin ? 'SA' : 'KF')
  const userRoleTitle = currentUser?.assigned_gate || currentUser?.school_affiliation || (isAdmin ? 'Super Admin HQ' : 'Meja 01 Court A')

  // Daftar menu navigasi internal
  const menuItems = [
    {
      id: 'OVERVIEW',
      code: '01',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'REFEREE',
      code: '02',
      label: 'Meja Wasit & Update Skor',
      icon: Clock,
      badge: { text: 'LIVE', color: 'bg-danger text-white animate-pulse' },
    },
    {
      id: 'SCHEDULE',
      code: '03',
      label: 'Jadwal & Kuota Tiket',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'BRACKET',
      code: '04',
      label: 'Bagan & Bracket',
      icon: Trophy,
      badge: null,
    },
    ...(isAdmin ? [
      {
        id: 'OPERATOR_APPROVAL',
        code: '05',
        label: 'Persetujuan Operator',
        icon: UserCheck,
        badge: pendingOperatorCount > 0 
          ? { text: `${pendingOperatorCount} PENDING`, color: 'bg-[#fef08a] text-black font-black' }
          : null,
      }
    ] : []),
    {
      id: 'SCANNER',
      code: isAdmin ? '06' : '05',
      label: 'Scanner Gate Lapangan',
      icon: QrCode,
      badge: null,
    },
  ]

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId)
    if (setIsMobileOpen) {
      setIsMobileOpen(false)
    }
  }

  return (
    <>
      {/* Backdrop untuk layar mobile */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell - Width 280px di mobile (~85vw) dan 320px di desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[280px] sm:w-[320px] max-w-[85vw] h-screen bg-[#0c1420] text-white flex flex-col justify-between border-r-2 border-ink transition-transform duration-200 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex-shrink-0`}
      >
        {/* BAGIAN ATAS: LOGO BRAND & WORKSPACE TITLE */}
        <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl sm:text-3xl tracking-tight text-white">
                  FutsalTix
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                <span className="font-mono text-[11px] sm:text-sm font-black uppercase tracking-widest text-[#79db8d]">
                  {isAdmin ? 'SUPER ADMIN HQ' : 'OPERATOR MEJA'}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#79db8d] animate-ping" />
              </div>
              {/* Garis Aksen Hijau */}
              <div className="h-1.5 w-10 sm:w-12 bg-brand mt-1.5 sm:mt-2" />
            </div>

            {/* Mobile Close Button */}
            {setIsMobileOpen && (
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden p-1.5 text-gray-300 hover:text-white border border-white/30 cursor-pointer font-bold text-sm"
                aria-label="Tutup Menu"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mt-3 sm:mt-4 font-mono text-[11px] sm:text-sm font-black uppercase tracking-wider text-gray-300">
            WORKSPACE // GGM CIANJUR
          </div>
        </div>

        {/* BAGIAN TENGAH: MENU NAVIGASI DENGAN TYPOGRAPHY LEGA */}
        <nav className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-2.5 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id
            const IconComponent = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white border-2 border-ink shadow-brutal-sm font-black'
                    : 'text-gray-200 hover:text-white hover:bg-white/10 font-bold border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className={`font-mono text-xs sm:text-sm font-black ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {item.code}
                  </span>
                  <IconComponent size={19} className={isActive ? 'text-white shrink-0 sm:size-[22px]' : 'text-gray-300 shrink-0 sm:size-[22px]'} />
                  <span className="text-xs sm:text-base font-black truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1.5">
                  {item.badge && (
                    <span className={`font-mono text-[10px] sm:text-xs font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 border border-ink shadow-sm ${item.badge.color}`}>
                      {item.badge.text}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={16} className="text-white shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </nav>

        {/* BAGIAN BAWAH: PROFIL OPERATOR / ADMIN & TOMBOL KELUAR */}
        <div className="flex-shrink-0 p-3.5 sm:p-5 border-t border-white/10 bg-[#090f19] space-y-2.5 sm:space-y-3.5">
          
          {/* Card Info User Login */}
          <div className="p-2.5 sm:p-3.5 bg-[#131d2e] border border-white/20 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none border border-black bg-brand text-white flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-display font-black text-sm sm:text-base text-white truncate">
                  {displayName}
                </p>
                <span className="font-mono text-[11px] sm:text-sm text-gray-300 block truncate font-bold">
                  {userRoleTitle}
                </span>
              </div>
            </div>

            {/* Quick Switch Role Button */}
            {onSwitchRole && (
              <button
                type="button"
                onClick={onSwitchRole}
                className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20 transition-all cursor-pointer"
                title="Ganti Peran / Switch Role"
              >
                <ArrowLeftRight size={15} />
              </button>
            )}
          </div>

          {/* Tombol Keluar ke Website Publik */}
          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 bg-white/10 hover:bg-danger hover:text-white border border-white/20 text-gray-100 font-mono text-xs sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Keluar / Ke Website</span>
          </button>

          {/* Footer Note Teknis */}
          <div className="font-mono text-[11px] sm:text-xs text-gray-300 font-bold text-center leading-relaxed">
            GGM CIANJUR • PUSAT KENDALI TIKET
            <span className="block text-gray-400 font-black mt-0.5">
              {isAdmin ? 'ADMIN PANEL // V.01' : 'OPERATOR PANEL // V.01'}
            </span>
          </div>

        </div>
      </aside>
    </>
  )
}
