import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ identifier: '', password: '', remember: false })

  const update = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: panggil API login di sini
    console.log('Login:', form)
  }

  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-[560px] border border-ink bg-white p-12">
        {/* Header kartu */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="border border-brand px-2 py-1 font-mono text-xs uppercase tracking-widest text-brand">
            [ GGM-Pass Access ]
          </span>
          <span className="font-mono text-xs uppercase tracking-widest">Gate Terminal v2.6</span>
        </div>

        <div className="mt-7 font-mono text-xs uppercase tracking-widest">FutsalTix Cianjur</div>
        <h1 className="font-display text-3xl font-extrabold uppercase">Selamat datang kembali</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
          Masuk untuk melanjutkan pembelian tiket futsal dan akses e-ticket turnamen di GGM
          Cianjur.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="identifier" className="font-mono text-xs font-bold uppercase tracking-widest">
              Email atau Nomor HP / WhatsApp
            </label>
            <input
              id="identifier"
              name="identifier"
              value={form.identifier}
              onChange={update}
              placeholder="contoh: suporter@sekolah.sch.id / 0812..."
              className="mt-2 w-full border border-ink bg-white px-4 py-4 outline-none placeholder:text-ink/50 focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="password" className="font-mono text-xs font-bold uppercase tracking-widest">
              Kata Sandi
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update}
                placeholder="••••••••••••"
                className="w-full border border-ink bg-white px-4 py-4 pr-12 outline-none placeholder:text-ink/50 focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute inset-y-0 right-4 text-ink"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[15px]">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={update}
                className="h-5 w-5 accent-brand"
              />
              Ingat Saya
            </label>
            <a href="#" className="font-bold underline">
              Lupa Kata Sandi?
            </a>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 bg-brand py-4 text-lg font-semibold text-white hover:bg-brand-dark"
          >
            Masuk Sekarang <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 flex items-start gap-3 border-t border-line pt-5">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1 text-center font-mono text-xs tracking-widest">
            Enkripsi Sesi Tiket Terverifikasi Gate Turnstile GGM
          </p>
        </div>

        <p className="mt-5 border-t border-line pt-5 text-center">
          Belum punya akun?{' '}
          <Link to="/daftar" className="font-bold text-brand">
            [Daftar Sekarang]
          </Link>
        </p>
      </div>
    </div>
  )
}
