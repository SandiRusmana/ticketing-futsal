import { useState, useEffect, useCallback } from 'react'
import { NavigationContext } from './navigationContextInstance.js'
import { PAGE_NAMES } from './navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

export function NavigationProvider({ children }) {
  const [currentPage, setCurrentPage] = useState(PAGE_NAMES.LANDING)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // State User Asli (diambil dari localStorage / API /me)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('futsaltix_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Helper untuk menentukan userRole secara aman dari data user backend
  const userRole = (() => {
    if (!currentUser) return 'PUBLIC'
    if (currentUser.role === 'admin') return 'ADMIN'
    if (currentUser.role === 'operator') return 'OPERATOR'
    return 'PUBLIC'
  })()

  // State Data Asli dari Backend MySQL
  const [matches, setMatches] = useState([])
  const [categories, setCategories] = useState([])
  const [teams, setTeams] = useState([])
  const [myTickets, setMyTickets] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const showToast = useCallback((message) => {
    if (!message) return
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 4000)
  }, [])

  // Ambil data jadwal, kategori, dan tim dari Laravel MySQL
  const refreshMatches = useCallback(async (params = {}) => {
    try {
      const { data } = await futsaltixApi.getMatches(params)
      setMatches(data.matches || [])
      setCategories(data.categories || [])
      setTeams(data.teams || [])
    } catch (error) {
      console.error('Gagal mengambil data pertandingan:', error)
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  // Ambil tiket milik user yang sedang login
  const refreshMyTickets = useCallback(async () => {
    const token = localStorage.getItem('futsaltix_token')
    if (!token) {
      setMyTickets([])
      return
    }
    try {
      const { data } = await futsaltixApi.getMyTickets()
      setMyTickets(data.orders || [])
    } catch (error) {
      console.error('Gagal mengambil tiket saya:', error)
    }
  }, [])

  const navigateTo = useCallback((pageName, message = null) => {
    setCurrentPage(pageName)

    if (message) {
      showToast(message)
    }

    document.getElementById('main-workspace')?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [showToast])

  // Simpan sesi login asli (token + user + redirect sesuai role)
  const handleAuthSuccess = useCallback((token, user, customMessage = null) => {
    localStorage.setItem('futsaltix_token', token)
    localStorage.setItem('futsaltix_user', JSON.stringify(user))
    setCurrentUser({ ...user, isRegistered: true })
    setIsLoginModalOpen(false)

    if (user.role === 'admin') {
      navigateTo(PAGE_NAMES.ADMIN, customMessage || `Selamat datang, ${user.name}!`)
    } else if (user.role === 'operator') {
      navigateTo(PAGE_NAMES.OPERATOR, customMessage || `Halo ${user.name}, siap bertugas di Gate!`)
    } else {
      refreshMyTickets()
      navigateTo(PAGE_NAMES.LANDING, customMessage || `Selamat datang, ${user.name}!`)
    }
  }, [navigateTo, refreshMyTickets])

  // Logout asli ke Laravel Sanctum
  const logout = async () => {
    try {
      await futsaltixApi.logout()
    } catch {
      // Abaikan jika token sudah expired
    }
    localStorage.removeItem('futsaltix_token')
    localStorage.removeItem('futsaltix_user')
    setCurrentUser(null)
    setMyTickets([])
    navigateTo(PAGE_NAMES.LANDING, 'Berhasil keluar dari akun.')
  }

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)

  // Load awal: fetch matches + cek sesi login aktif
  useEffect(() => {
    refreshMatches()

    const token = localStorage.getItem('futsaltix_token')
    if (token) {
      futsaltixApi
        .me()
        .then(({ data }) => {
          const user = data.user || data
          localStorage.setItem('futsaltix_user', JSON.stringify(user))
          setCurrentUser({ ...user, isRegistered: true })
          refreshMyTickets()
        })
        .catch(() => {
          localStorage.removeItem('futsaltix_token')
          localStorage.removeItem('futsaltix_user')
          setCurrentUser(null)
        })
    }
  }, [refreshMatches, refreshMyTickets])

  // Sinkronisasi URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '')
      if (Object.values(PAGE_NAMES).includes(hash)) {
        setCurrentPage(hash)
      }
    }

    if (window.location.hash) {
      handleHashChange()
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    window.location.hash = `#/${currentPage}`
  }, [currentPage])

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        setPage: navigateTo,
        userRole,
        setUserRole: () => {}, // Dikontrol ketat via currentUser.role
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        handleAuthSuccess,
        logout,
        navigateTo,
        currentUser,
        setCurrentUser,
        toastMessage,
        setToastMessage,
        showToast,
        matches,
        categories,
        teams,
        myTickets,
        isLoadingData,
        refreshMatches,
        refreshMyTickets,
        PAGE_NAMES,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}