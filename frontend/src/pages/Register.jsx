import { useState } from 'react'
import {
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Building2,
  Lock,
  AlertCircle,
  LogIn,
} from 'lucide-react'
import { useNavigation } from '../context/useNavigation.js'
import { PAGE_NAMES } from '../context/navigationConstants.js'
import { futsaltixApi } from '../services/futsaltixApi.js'

export default function Register() {
  const { navigateTo, handleAuthSuccess } = useNavigation()

  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    phone: '',
    password: '',
    agree: false,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (apiError) setApiError('')
  }

  const validateSuporter = () => {
    const err = {}
    if (!formData.name.trim()) err.name = 'Nama lengkap wajib diisi sesuai kartu identitas.'
    if (!formData.email.trim() || !formData.email.includes('@')) err.email = 'Alamat email valid wajib diisi.'
    if (!formData.phone.trim()) err.phone = 'Nomor WhatsApp wajib diisi untuk e-ticket.'
    if (!formData.password || formData.password.length < 8) err.password = 'Kata sandi minimal 8 karakter.'
    if (!formData.agree) err.agree = 'Anda harus menyetujui syarat & ketentuan turnamen GGM.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSuporterSubmit = async (e) => {
    e.preventDefault()
    if (!validateSuporter()) return

    setIsSubmitting(true)
    setApiError('')

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        password_confirmation: formData.password,
        role: 'user',
        school_affiliation: formData.school.trim() || 'Suporter Futsal Pelajar Cianjur',
      }

      const { data } = await futsaltixApi.register(payload)
      const token = data.token || data.access_token
      const user = data.user

      handleAuthSuccess(token, user, 'Registrasi Akun Suporter Berhasil! Selamat Datang di FutsalTix.')
    } catch (error) {
      const firstErr = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : null
      setApiError(firstErr || error.response?.data?.message || 'Gagal mendaftar. Periksa kembali data Anda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* 1. HEADER HALAMAN REGISTRASI */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 border-2 border-ink bg-white px-3 sm:px-4 py-1.5 font-mono text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-ink shadow-brutal-sm mb-2.5 sm:mb-3">
          <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-brand animate-ping shrink-0" />
          <span className="truncate">PORTAL PENONTON // PENDAFTARAN RESMI GGM</span>
        </div>

        <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight break-words">
          Pendaftaran Akun Suporter
        </h1>
        <p className="mt-2 text-xs sm:text-base md:text-lg text-ink/75 font-medium">
          Daftarkan akun penonton untuk memesan e-tiket turnamen futsal se-Kabupaten Cianjur tanpa antre di loket GGM.
        </p>
      </div>

      {apiError && (
        <div className="mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3 border-2 border-danger bg-danger/10 p-3 sm:p-4 font-mono text-xs sm:text-sm font-bold text-danger">
          <AlertCircle size={18} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* 2. FORM REGISTRASI PENONTON / SUPORTER */}
      <div className="border-[2.5px] border-ink bg-white p-4 sm:p-10 shadow-brutal-lg">
        <div className="border-b-2 border-ink pb-3 sm:pb-4 mb-4 sm:mb-6 flex items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] sm:text-xs uppercase font-bold text-brand block mb-0.5 sm:mb-1">
              KATEGORI: SUPORTER / PENONTON UMUM
            </span>
            <h2 className="font-display text-xl sm:text-3xl font-black uppercase text-ink">
              Formulir Pendaftaran Suporter
            </h2>
          </div>
          <span className="hidden sm:inline-block bg-[#dcfce7] text-brand border-2 border-brand font-mono text-xs font-bold px-3 py-1">
            ✓ Akses Langsung
          </span>
        </div>

        <form onSubmit={handleSuporterSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block font-mono text-xs sm:text-sm font-bold uppercase text-ink mb-1 sm:mb-1.5">
                NAMA LENGKAP <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Ahmad Fauzi"
                  className={`w-full border-2 border-ink bg-surface py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 font-mono text-xs sm:text-base outline-none focus:bg-white font-medium ${
                    errors.name ? 'border-danger bg-red-50' : 'focus:border-brand'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-mono text-xs sm:text-sm font-bold uppercase text-ink mb-1 sm:mb-1.5">
                ASAL SEKOLAH / KOMUNITAS SUPORTER
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  placeholder="Contoh: SMKN 1 Cianjur / SMPN 1"
                  className="w-full border-2 border-ink bg-surface py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 font-mono text-xs sm:text-base outline-none focus:bg-white focus:border-brand font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs sm:text-sm font-bold uppercase text-ink mb-1 sm:mb-1.5">
                ALAMAT EMAIL AKTIF <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@sekolah.sch.id / gmail.com"
                  className={`w-full border-2 border-ink bg-surface py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 font-mono text-xs sm:text-base outline-none focus:bg-white font-medium ${
                    errors.email ? 'border-danger bg-red-50' : 'focus:border-brand'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.email}</p>}
            </div>

            <div>
              <label className="block font-mono text-xs sm:text-sm font-bold uppercase text-ink mb-1 sm:mb-1.5">
                NOMOR WHATSAPP AKTIF <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className={`w-full border-2 border-ink bg-surface py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 font-mono text-xs sm:text-base outline-none focus:bg-white font-medium ${
                    errors.phone ? 'border-danger bg-red-50' : 'focus:border-brand'
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs sm:text-sm font-bold uppercase text-ink mb-1 sm:mb-1.5">
              KATA SANDI AKUN <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter..."
                className={`w-full border-2 border-ink bg-surface py-2.5 sm:py-3 pl-10 sm:pl-11 pr-11 font-mono text-xs sm:text-base outline-none focus:bg-white font-medium ${
                  errors.password ? 'border-danger bg-red-50' : 'focus:border-brand'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.password}</p>}
          </div>

          <div className="p-3 sm:p-4 bg-surface border-2 border-ink">
            <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 rounded-none border-2 border-ink accent-brand cursor-pointer shrink-0"
              />
              <span className="font-sans text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                Saya menyetujui seluruh ketentuan &amp; tata tertib pertandingan FutsalTix di Gelanggang Generasi Muda (GGM) Cianjur.
              </span>
            </label>
            {errors.agree && <p className="mt-1 font-mono text-xs text-danger font-bold">{errors.agree}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-brand text-white font-mono text-xs sm:text-base font-black uppercase tracking-wider border-[2.5px] border-ink shadow-brutal hover:bg-brand-dark active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="truncate">{isSubmitting ? 'MEMPROSES...' : 'DAFTAR SEBAGAI SUPORTER SEKARANG'}</span>
            <ArrowRight size={18} className="shrink-0" />
          </button>
        </form>
      </div>

      {/* 3. FOOTER QUICK ACTION */}
      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white border-[2.5px] border-ink shadow-brutal flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <div>
          <span className="font-mono text-xs text-ink/70 font-bold uppercase block mb-0.5 sm:mb-1">
            SUDAH PUNYA AKUN?
          </span>
          <p className="font-sans text-xs sm:text-base font-bold text-ink">
            Masuk menggunakan email dan kata sandi yang sudah terdaftar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo(PAGE_NAMES.LOGIN)}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-surface border-2 border-ink font-mono text-xs sm:text-sm font-black uppercase shadow-brutal-sm hover:bg-white hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn size={15} className="text-brand" />
          <span>Masuk ke Akun</span>
        </button>
      </div>
    </div>
  )
}
