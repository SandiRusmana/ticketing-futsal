const links = [
  "Bantuan & Kontak",
  "WhatsApp Panitia GGM",
  "Ketentuan Masuk Gelanggang",
  "Verifikasi Tiket Lapangan",
  "Privasi & Syarat",
];

export default function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-surface">
      <div className="mx-auto grid max-w-[1440px] 2xl:max-w-[1560px] gap-6 sm:gap-8 px-3 sm:px-6 lg:px-8 2xl:px-10 py-6 sm:py-10 md:grid-cols-2">
        <div>
          <div className="font-display text-lg sm:text-2xl font-black uppercase tracking-tight text-ink">
            FutsalTix Cianjur
          </div>
          <p className="mt-1.5 sm:mt-2 max-w-md text-xs sm:text-base leading-relaxed text-ink/80 font-medium">
            © 2026 FutsalTix Cianjur. Gelanggang Generasi Muda (GGM) Cianjur
            Ticketing Ecosystem.
          </p>
        </div>
        <ul className="flex flex-wrap content-start gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-base font-bold text-ink/85 md:justify-end">
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
  );
}
