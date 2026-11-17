import { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Timer,
  CreditCard,
  QrCode,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { useNavigation } from "../context/useNavigation.js";
import { PAGE_NAMES } from "../context/navigationConstants.js";
import { futsaltixApi } from "../services/futsaltixApi.js";

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export default function CheckoutModal({ match, onClose }) {
  const {
    currentUser,
    navigateTo,
    refreshMatches,
    refreshMyTickets,
    showToast,
  } = useNavigation();

  const maxAllowed = Math.min(
    4,
    Math.max(1, Number(match?.quotaAvailable ?? match?.remaining ?? 4)),
  );
  const [ticketCount, setTicketCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [timeLeft, setTimeLeft] = useState(600);

  // State 2 Tahap: 'FORM' atau 'VERIFYING'
  const [paymentStep, setPaymentStep] = useState("FORM");
  const [walletPhone, setWalletPhone] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!match) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const ticketSubtotal = Number(match.price || 0) * ticketCount;
  const adminFee = 2500;
  const totalAmount = ticketSubtotal + adminFee;

  const handleProceedToVerification = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("futsaltix_token");
    if (!token || !currentUser) {
      showToast?.(
        "Silakan masuk atau daftar akun suporter terlebih dahulu untuk memesan tiket.",
      );
      onClose();
      navigateTo(PAGE_NAMES.LOGIN);
      return;
    }
    setErrorMsg("");
    setPaymentStep("VERIFYING");
  };

  const handleFinalPay = async () => {
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const checkoutRes = await futsaltixApi.checkoutTicket({
        match_id: match.id,
        quantity: ticketCount,
        payment_method: paymentMethod,
      });
      const order = checkoutRes.data.order;

      await futsaltixApi.payOrder(order.id, paymentMethod);
      await Promise.all([refreshMatches(), refreshMyTickets()]);

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        navigateTo(
          PAGE_NAMES.TICKETS,
          `Pembayaran ${ticketCount} tiket ${match.home?.name || match.home_placeholder} vs ${match.away?.name || match.away_placeholder} Berhasil!`,
        );
      }, 1000);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Gagal memproses transaksi tiket.";
      setErrorMsg(msg);
      setPaymentStep("FORM");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-ink/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative my-4 sm:my-8 w-full max-w-4xl border-[3px] border-ink bg-white shadow-brutal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER STEPPER */}
        <div className="border-b-[2.5px] border-ink bg-[#f8faf9] p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink">
              MIDTRANS SNAP GATEWAY • LIVE MYSQL CHECKOUT
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-white text-ink shadow-brutal-sm hover:bg-danger hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 font-mono text-[10px] sm:text-xs">
            <div className="text-ink/70">01 PILIH TIKET</div>
            <ChevronRight size={14} className="text-ink/40" />
            <div
              className={`border border-ink px-2 py-1 font-bold ${paymentStep === "FORM" ? "bg-brand text-white" : "bg-white text-ink"}`}
            >
              02 CHECKOUT &amp; PEMBAYARAN
            </div>
            <ChevronRight size={14} className="text-ink/40" />
            <div
              className={`border border-ink px-2 py-1 font-bold ${paymentStep === "VERIFYING" ? "bg-brand text-white" : "text-ink/50 bg-surface"}`}
            >
              03 VERIFIKASI E-TIKET
            </div>
          </div>
        </div>

        {/* TIMER BAR */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-[#dcfce7] px-4 py-2 font-mono text-xs text-[#15803d] font-bold">
          <span className="flex items-center gap-1.5">
            <Timer size={14} /> HELD QUOTA AMAN:
          </span>
          <span className="border-2 border-ink bg-ink px-2.5 py-0.5 text-[#79db8d]">
            {formatTimer(timeLeft)}
          </span>
        </div>

        {paymentStep === "FORM" ? (
          /* TAHAP 1: FORM PEMESANAN */
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-ink">
            <div className="p-4 sm:p-6 lg:col-span-7 space-y-4">
              <h3 className="font-display text-xl font-black uppercase text-ink">
                Informasi Pemesan
              </h3>

              <div className="space-y-3 font-mono text-xs sm:text-sm">
                <div>
                  <label className="text-ink/75 uppercase font-bold block mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.name || "Tamu Suporter GGM"}
                    className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 font-bold text-ink"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-ink/75 uppercase font-bold block mb-1">
                      Email:
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={currentUser?.email || "-"}
                      className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 font-bold text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-ink/75 uppercase font-bold block mb-1">
                      No WhatsApp:
                    </label>
                    <input
                      type="tel"
                      readOnly
                      value={currentUser?.phone || "-"}
                      className="w-full border-2 border-ink bg-[#f8faf9] px-3 py-2 font-bold text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-ink bg-surface p-4 flex items-center justify-between">
                <span className="font-mono font-black uppercase text-ink">
                  Jumlah Tiket:
                </span>
                <div className="flex items-center border-2 border-ink bg-white">
                  <button
                    type="button"
                    onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                    className="px-3 py-1 font-black"
                  >
                    -
                  </button>
                  <span className="px-4 font-black">{ticketCount}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTicketCount((c) => Math.min(maxAllowed, c + 1))
                    }
                    className="px-3 py-1 font-black"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:col-span-5 bg-[#f8faf9] space-y-4">
              <h4 className="font-display text-lg font-black uppercase text-ink">
                {match.home?.name || match.home_placeholder} vs{" "}
                {match.away?.name || match.away_placeholder}
              </h4>

              <div>
                <span className="font-mono text-xs font-black uppercase text-ink block mb-2">
                  METODE PEMBAYARAN:
                </span>
                <div className="space-y-2 font-mono text-xs">
                  {[
                    {
                      key: "QRIS",
                      label: "QRIS (GoPay, OVO, Dana)",
                      icon: QrCode,
                    },
                    {
                      key: "BCA_VA",
                      label: "BCA Virtual Account",
                      icon: CreditCard,
                    },
                    {
                      key: "GOPAY",
                      label: "GoPay / DANA Wallet",
                      icon: CreditCard,
                    },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key)}
                      className={`w-full flex items-center justify-between border-2 p-3 text-left font-bold cursor-pointer ${paymentMethod === m.key ? "border-ink bg-white text-brand ring-2 ring-brand" : "border-line bg-white text-ink/80"}`}
                    >
                      <span>{m.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border border-ink ${paymentMethod === m.key ? "bg-brand" : "bg-white"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-line pt-3 font-mono text-sm space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total Tagihan:</span>
                  <span className="text-brand font-black text-xl">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToVerification}
                className="w-full py-4 bg-brand text-white font-mono font-black uppercase border-2 border-ink shadow-brutal hover:bg-brand-dark cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Verifikasi</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* TAHAP 2: VERIFIKASI QRIS / DANA */
          <div className="p-6 sm:p-8 max-w-xl mx-auto space-y-6 text-center">
            <div className="border-2 border-ink bg-[#fef08a] p-3 font-mono text-xs font-black uppercase text-ink">
              SIMULASI PEMBAYARAN [{paymentMethod}]
            </div>

            <div>
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Selesaikan Pembayaran
              </h3>
              <p className="font-mono text-sm text-ink/75 mt-1 font-bold">
                Total:{" "}
                <span className="text-brand font-black">
                  {formatRupiah(totalAmount)}
                </span>
              </p>
            </div>

            {paymentMethod === "QRIS" ? (
              <div className="p-6 bg-surface border-2 border-ink shadow-brutal inline-block mx-auto space-y-3">
                <div className="w-48 h-48 mx-auto border-4 border-ink bg-white flex flex-col items-center justify-center p-3">
                  <QrCode size={110} className="text-ink" />
                  <span className="font-mono text-[10px] font-black mt-2 text-ink">
                    QRIS GGM CIANJUR
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-surface border-2 border-ink shadow-brutal text-left space-y-3 max-w-md mx-auto">
                <span className="font-mono text-xs font-black uppercase text-ink block">
                  NOMOR VIRTUAL ACCOUNT:
                </span>
                <span className="font-mono text-lg font-black text-brand">
                  88012 08123456789 (GGM TICKET)
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="border-2 border-danger bg-danger/10 p-3 font-mono text-xs font-bold text-danger">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentStep("FORM")}
                className="w-1/2 py-3.5 bg-surface text-ink font-mono font-black uppercase border-2 border-ink"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleFinalPay}
                className="w-1/2 py-3.5 bg-brand text-white font-mono font-black uppercase border-2 border-ink shadow-brutal"
              >
                {isProcessing ? "Memproses..." : "✓ Konfirmasi Bayar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
