import { useState } from 'react'
import { X, ArrowRight, User, Lock, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

export default function LoginRoleModal({ isOpen, onClose }) {
  const { handleAuthSuccess, navigateTo } = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setApiError('Email/No. HP dan kata sandi wajib diisi.')
      return
    }

    setIsLoading(true)
    setApiError('')

    try {
      const { data } = await futsaltixApi.login({
        email: email.trim(),
        password,
      })
      const token = data.token || data.access_token
      const user = data.user

      setEmail('')
      setPassword('')
      handleAuthSuccess(token, user, `Login Berhasil! Selamat datang kembali, ${user.name}.`)
      onClose()
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        'Email/No. HP atau kata sandi tidak sesuai.'
      setApiError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="my-4 w-full max-w-lg bg-white border-[3px] border-ink shadow-[8px_8px_0px_#191c1b] relative overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="h-2 w-full bg-brand" />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-6 border-b-[2.5px] border-ink bg-surface flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-ink text-white px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1.5 sm:mb-2">
              <Lock size={13} className="text-[#79db8d] shrink-0" />
              <span>GGM-PASS // PORTAL MASUK</span>
            </div>
            <h2 className="font-display text-xl sm:text-3xl font-black uppercase tracking-tight text-ink break-words">
              MASUK KE AKUN FUTSALTIX
            </h2>
            <p className="font-sans text-[11px] sm:text-sm text-ink/80 mt-1 font-medium">
              Masukkan email atau nomor HP dan kata sandi terdaftar Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-ink bg-white hover:bg-danger hover:text-white flex items-center justify-center font-bold text-ink shadow-brutal-sm transition-all cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Login Tunggal */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-7 space-y-3.5 sm:space-y-5 bg-white">
          {apiError && (
            <div className="flex items-center gap-2 border-2 border-danger bg-danger/10 p-2.5 sm:p-3.5 font-mono text-xs font-bold text-danger">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label className="block font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider text-ink mb-1 sm:mb-1.5">
              Email atau Nomor HP / WhatsApp
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (apiError) setApiError('')
                }}
                placeholder="contoh: suporter@futsaltix.id"
                className="w-full border-2 border-ink bg-surface px-3 sm:px-4 py-2.5 sm:py-3 pr-10 font-sans text-xs sm:text-base outline-none focus:bg-white focus:border-brand font-medium"
              />
              <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider text-ink mb-1 sm:mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (apiError) setApiError('')
                }}
                placeholder="••••••••••••"
                className="w-full border-2 border-ink bg-surface px-3 sm:px-4 py-2.5 sm:py-3 pr-11 font-sans text-xs sm:text-base outline-none focus:bg-white focus:border-brand font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 sm:py-3.5 px-4 sm:px-6 bg-brand text-white font-mono text-xs sm:text-sm font-black uppercase tracking-wider border-[2.5px] border-ink shadow-brutal hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
          >
            <span>{isLoading ? 'MEMVERIFIKASI...' : 'MASUK SEKARANG'}</span>
            <ArrowRight size={16} />
          </button>

          <div className="text-center font-mono text-xs text-ink/80 font-bold pt-1">
            Belum punya akun penonton?{' '}
            <button
              type="button"
              onClick={() => {
                onClose()
                navigateTo(PAGE_NAMES.REGISTER)
              }}
              className="font-black text-brand underline hover:text-brand-dark cursor-pointer ml-1"
            >
              [Daftar Sekarang]
            </button>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-surface border-t-2 border-ink flex items-center justify-between font-mono text-[11px] sm:text-xs font-bold">
          <span className="text-ink/75 flex items-center gap-1.5 truncate">
            <UserCheck size={14} className="text-brand shrink-0" />
            <span className="truncate">Sesi Terenkripsi GGM Cianjur</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/70 hover:text-ink font-black uppercase underline cursor-pointer shrink-0 ml-2"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
