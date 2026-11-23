import { useRef, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import BottomNav from './components/BottomNav.jsx'
import LoginRoleModal from './components/LoginRoleModal.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import TiketSaya from './pages/TiketSaya.jsx'
import BaganTurnamen from './pages/BaganTurnamen.jsx'
import HasilLaga from './pages/HasilLaga.jsx'
import OperatorDashboard from './pages/OperatorDashboard.jsx'
import OperatorScanner from './pages/OperatorScanner.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'
import { useNavigation } from './context/useNavigation.js'
import { PAGE_NAMES } from './context/navigationConstants.js'

function AppContent() {
  const { currentPage, navigateTo, setPage, isLoginModalOpen, closeLoginModal, currentUser } = useNavigation()
  const workspaceRef = useRef(null)

  useEffect(() => {
    if (workspaceRef.current) {
      workspaceRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentPage])

  const changeRoute = setPage || navigateTo
  const userRole = currentUser?.role

  // Proteksi rute & Pengalihan otomatis sesuai Peran (Role)
  useEffect(() => {
    const isAdminRoute = currentPage === 'admin' || currentPage === PAGE_NAMES.ADMIN
    const isOperatorRoute =
      currentPage === 'operator' ||
      currentPage === PAGE_NAMES.OPERATOR ||
      currentPage === 'scanner' ||
      currentPage === PAGE_NAMES.SCANNER ||
      currentPage === PAGE_NAMES.OPERATOR_SCANNER
    const isLandingRoute = currentPage === 'landing' || currentPage === PAGE_NAMES.LANDING || !currentPage

    // 1. Cegah suporter biasa membuka panel admin / operator
    if (isAdminRoute && userRole !== 'admin') {
      changeRoute(PAGE_NAMES.LOGIN)
      return
    }

    if (isOperatorRoute && userRole !== 'operator' && userRole !== 'admin') {
      changeRoute(PAGE_NAMES.LOGIN)
      return
    }

    // 2. Operator yang sedang aktif langsung diarahkan ke Dashboard Operator, bukan halaman suporter
    if (userRole === 'operator' && isLandingRoute) {
      changeRoute(PAGE_NAMES.OPERATOR)
      return
    }

    // 3. Admin yang sedang aktif diarahkan ke Admin Dashboard jika berada di landing
    if (userRole === 'admin' && isLandingRoute) {
      changeRoute(PAGE_NAMES.ADMIN)
      return
    }
  }, [currentPage, userRole, changeRoute])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'admin':
      case PAGE_NAMES.ADMIN:
        return userRole === 'admin' ? <AdminDashboard /> : <Login />

      case 'operator':
      case PAGE_NAMES.OPERATOR:
        return userRole === 'operator' || userRole === 'admin' ? <OperatorDashboard /> : <Login />

      case 'scanner':
      case PAGE_NAMES.SCANNER:
      case PAGE_NAMES.OPERATOR_SCANNER:
        return userRole === 'operator' || userRole === 'admin' ? <OperatorScanner /> : <Login />

      case 'bracket':
      case PAGE_NAMES.BRACKET:
        return <BaganTurnamen />

      case 'livescore':
      case PAGE_NAMES.LIVESCORE:
        return <HasilLaga />

      case 'tickets':
      case PAGE_NAMES.TICKETS:
        return <TiketSaya />

      case 'register':
      case PAGE_NAMES.REGISTER:
        return <Register />

      case 'login':
      case PAGE_NAMES.LOGIN:
        return <Login />

      case 'landing':
      case PAGE_NAMES.LANDING:
      default:
        return <Home />
    }
  }

  const isDashboardPage =
    (currentPage === 'admin' || currentPage === PAGE_NAMES.ADMIN) && userRole === 'admin' ||
    (currentPage === 'operator' || currentPage === PAGE_NAMES.OPERATOR) && (userRole === 'operator' || userRole === 'admin')

  if (isDashboardPage) {
    return (
      <div className="h-screen w-screen overflow-hidden flex bg-paper text-ink font-sans select-none-text">
        <div className="flex-1 h-screen overflow-hidden">
          {renderCurrentPage()}
        </div>

        <LoginRoleModal
          isOpen={isLoginModalOpen}
          onClose={closeLoginModal}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-paper text-ink font-sans select-none-text">
      <div className="flex-shrink-0 z-40">
        <Navbar />
      </div>

      <main
        id="main-workspace"
        ref={workspaceRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col justify-between pb-24 md:pb-16"
      >
        <div className="flex-1 w-full">
          {renderCurrentPage()}
        </div>

        <Footer />
      </main>

      <div className="flex-shrink-0 md:hidden z-40">
        <BottomNav />
      </div>

      <LoginRoleModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />
    </div>
  )
}

export default function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  )
}