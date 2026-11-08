const links = [
  'Bantuan & Kontak',
  'WhatsApp Panitia GGM',
  'Ketentuan Masuk Gelanggang',
  'Verifikasi Tiket Lapangan',
  'Privasi & Syarat',
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-10 md:grid-cols-2">
        <div>
          <div className="font-display text-xl font-extrabold uppercase tracking-tight">
            FutsalTix Cianjur
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/80">
            © 2026 FutsalTix Cianjur. Gelanggang Generasi Muda (GGM) Cianjur
            Ticketing Ecosystem.
          </p>
        </div>
        <ul className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm text-ink/80 md:justify-end">
          {links.map((l) => (
            <li key={l}>
              <a href="#" className="underline-offset-2 hover:underline">
                {l}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
