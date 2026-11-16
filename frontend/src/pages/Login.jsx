import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

export default function Login() {
  const { navigateTo, handleAuthSuccess } = useNavigation()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ identifier: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const update = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!form.identifier.trim()) {
      newErrors.identifier = 'Email atau Nomor HP wajib diisi.'
    }
    if (!form.password) {
      newErrors.password = 'Kata sandi wajib diisi.'
    } else if (form.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setApiError('')

    try {
      const payload = {
        email: form.identifier.trim(),
        password: form.password,
      }
      const { data } = await futsaltixApi.login(payload)
      const token = data.token || data.access_token
      const user = data.user

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        handleAuthSuccess(token, user, `Login Berhasil! Selamat datang kembali, ${user.name}.`)
      }, 600)
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
    <div className="px-3 sm:px-6 py-6 sm:py-20">
      <div className="mx-auto max-w-[560px] border-[2.5px] border-ink bg-white p-4 sm:p-10 md:p-12 shadow-brutal-lg">
        {/* Header Kartu Login */}
        <div className="flex items-center justify-between border-b-2 border-line pb-3 sm:pb-4 gap-2">
          <span className="border-2 border-ink bg-white px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-brand shadow-brutal-sm">
            [ GGM-Pass Access ]
          </span>
          <span className="font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-ink/70 font-bold">
            Gate Terminal v2.6
          </span>
        </div>

        <div className="mt-4 sm:mt-6 font-mono text-[11px] sm:text-sm font-black uppercase tracking-widest text-brand">
          FutsalTix Cianjur // Portal Masuk
        </div>
        <h1 className="mt-1 font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink break-words">
          Selamat Datang Kembali
        </h1>
        <p className="mt-2 text-xs sm:text-base leading-relaxed text-ink/80 font-sans font-medium">
          Masuk untuk mengakses e-tiket pertandingan, riwayat turnamen, dan cek kuota di GGM Cianjur.
        </p>

        {apiError && (
          <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-3 border-2 border-danger bg-danger/10 p-3 sm:p-4 font-mono text-xs sm:text-sm font-bold text-danger">
            <AlertCircle size={18} className="shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="mt-6 sm:mt-8 border-2 border-brand bg-ok-soft p-5 sm:p-6 text-center shadow-brutal space-y-2 sm:space-y-3">
            <CheckCircle2 size={32} className="mx-auto text-brand sm:size-9" />
            <div className="font-display text-lg sm:text-xl font-bold uppercase text-ink">
              Autentikasi Berhasil!
            </div>
            <p className="font-mono text-xs text-ink/80">
              Menghubungkan sesi ke server GGM Cianjur...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" noValidate>
            {/* Input Email / HP */}
            <div>
              <label htmlFor="identifier" className="block font-mono text-[11px] sm:text-sm font-black uppercase tracking-wider text-ink mb-1 sm:mb-1.5">
                Email atau Nomor HP / WhatsApp
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={form.identifier}
                  onChange={update}
                  placeholder="contoh: suporter@futsaltix.id"
                  className={`w-full border-2 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3.5 font-sans text-xs sm:text-base outline-none transition-colors placeholder:text-ink/40 shadow-brutal-sm font-medium ${
                    errors.identifier ? 'border-danger' : 'border-ink focus:border-brand'
                  }`}
                />
                <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
              {errors.identifier && (
                <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.identifier}</p>
              )}
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label htmlFor="password" className="block font-mono text-[11px] sm:text-sm font-black uppercase tracking-wider text-ink mb-1 sm:mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update}
                  placeholder="••••••••••••"
                  className={`w-full border-2 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3.5 pr-11 sm:pr-12 font-sans text-xs sm:text-base outline-none transition-colors placeholder:text-ink/40 shadow-brutal-sm font-medium ${
                    errors.password ? 'border-danger' : 'border-ink focus:border-brand'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.password}</p>
              )}
            </div>

            {/* Ingat Saya & Lupa Kata Sandi */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={update}
                  className="h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-none border-2 border-ink accent-brand cursor-pointer"
                />
                <span className="text-ink/80 text-[11px] sm:text-sm">Ingat Saya</span>
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="font-black underline text-ink hover:text-brand text-[11px] sm:text-sm">
                Lupa Sandi?
              </a>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 sm:mt-3 flex w-full items-center justify-center gap-2 border-[2.5px] border-ink bg-brand py-3 sm:py-4 px-4 sm:px-6 font-mono text-xs sm:text-base font-black uppercase tracking-wider text-white shadow-brutal transition-all hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-60 text-center"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Footer Enkripsi Gate Turnstile */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 border-t-2 border-line pt-4 sm:pt-5 font-mono text-[10px] sm:text-sm text-ink/70 font-semibold text-center">
          <Lock size={15} className="text-brand shrink-0" />
          <span>Enkripsi Sesi Tiket Terhubung Gate Turnstile GGM Cianjur</span>
        </div>

        {/* Link Daftar Akun Baru */}
        <div className="mt-4 sm:mt-5 text-center text-xs sm:text-sm font-mono text-ink/80 font-bold">
          Belum punya akun penonton?{' '}
          <button
            type="button"
            onClick={() => navigateTo(PAGE_NAMES.REGISTER)}
            className="font-black text-brand underline underline-offset-2 hover:text-brand-dark cursor-pointer ml-1"
          >
            [Daftar Sekarang]
          </button>
        </div>
      </div>
    </div>
  )
}
