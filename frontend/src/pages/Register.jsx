import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Info, LockKeyhole, ScanLine } from 'lucide-react'

// Hiasan siku di 4 pojok kartu
function Corners() {
  const base = 'absolute h-3 w-3 border-ink'
  return (
    <>
      <span className={`${base} -left-px -top-px border-l-4 border-t-4`} />
      <span className={`${base} -right-px -top-px border-r-4 border-t-4`} />
      <span className={`${base} -bottom-px -left-px border-b-4 border-l-4`} />
      <span className={`${base} -bottom-px -right-px border-b-4 border-r-4`} />
    </>
  )
}

const labelClass = 'font-mono text-xs font-bold uppercase tracking-widest'
const inputClass =
  'mt-2 w-full border border-line bg-white px-4 py-4 outline-none placeholder:text-ink/30 focus:border-ink focus:ring-2 focus:ring-brand'

export default function Register() {
  const [form, setForm] = useState({ name: '', contact: '', password: '', agree: false })

  const update = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: panggil API register di sini
    console.log('Register:', form)
  }

  return (
    <div className="px-6 py-14">
      <div className="relative mx-auto max-w-[640px] bg-white p-12">
        <Corners />

        <div className="flex items-center justify-between">
          <span className="border border-line bg-surface px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest">
            Registrasi Suporter Resmi
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
            GGM-SEC.2026
          </span>
        </div>

        <div className="mt-7 font-mono text-xs uppercase tracking-widest">FutsalTix Cianjur</div>
        <h1 className="font-display text-3xl font-extrabold uppercase">Buat akun penonton</h1>
        <p className="mt-3 border-b border-line pb-6 leading-relaxed text-ink/80">
          Daftar dalam 1 menit untuk beli tiket futsal Cianjur dan amankan kuota pertandingan
          sekolahmu.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-6">
          <div>
            <label htmlFor="name" className={labelClass}>
              Nama lengkap (sesuai kartu pelajar / KTP)
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={update}
              placeholder="misal: Rizky Pratama"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="contact" className={labelClass}>
              Email atau nomor WhatsApp aktif
            </label>
            <input
              id="contact"
              name="contact"
              value={form.contact}
              onChange={update}
              placeholder="misal: 081234567890 atau email@sekolah.sch.id"
              className={inputClass}
            />
            <p className="mt-3 flex items-start gap-2 font-mono text-xs leading-relaxed">
              <Info size={15} className="mt-0.5 shrink-0" />
              E-tiket QR Code akan dikirimkan otomatis ke nomor WhatsApp ini.
            </p>
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              placeholder="Minimal 8 karakter campuran huruf & angka"
              className={inputClass}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={update}
              className="mt-1 h-5 w-5 shrink-0 accent-brand"
            />
            Saya setuju dengan Syarat &amp; Ketentuan FutsalTix serta Tata Tertib Penonton GGM
            Cianjur.
          </label>

          <button
            type="submit"
            disabled={!form.agree}
            className="flex w-full items-center justify-center gap-2 bg-brand py-5 text-lg font-bold uppercase text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buat akun <ArrowRight size={18} />
          </button>
        </form>

        {/* Dua badge keamanan */}
        <div className="mt-8 grid gap-3 border-t border-dashed border-line pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3 border border-line bg-surface px-4 py-4 font-mono text-xs uppercase tracking-widest">
            <LockKeyhole size={18} className="text-brand" /> Quota lock 10 menit
          </div>
          <div className="flex items-center gap-3 border border-line bg-surface px-4 py-4 font-mono text-xs uppercase tracking-widest">
            <ScanLine size={18} className="text-brand" /> QR code anti-calo
          </div>
        </div>

        <p className="mt-6 text-center">
          Sudah punya akun?{' '}
          <Link to="/masuk" className="font-bold text-brand">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
