import { useEffect, useEffectEvent, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    ArrowClockwiseIcon, ArrowLeftIcon, ArrowsLeftRightIcon, CaretRightIcon, CheckCircleIcon, ClockIcon,
    CloudSlashIcon, LockSimpleIcon, MoneyIcon, QrCodeIcon, SpinnerIcon, TimerIcon, WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { useCart } from "@/context/CartContext";
import { cancelQris, checkQrisStatus, payCash, payQris, regenerateQris } from "@/api/transactions";
import { errorMessage, statusCode } from "@/api/client";
import { channelLabel, num, rupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "method" | "cash" | "qris";
type QrisState = "creating" | "pending" | "expired" | "error";

type Props = {
    ticket?: string;
    onClose: () => void;
    onPaid: (trx: Transaction) => void;
    onStockChanged: () => void;
};

const POLL_MS = 3000;

export function PaymentDialog({ticket, onClose, onPaid, onStockChanged}: Props) {
    const cart = useCart();
    const total = cart.totals.total;
    const [step, setStep] = useState<Step>("method");
    //clientRef = nomor unik pesanan ini, kalau tombol bayar kepencet 2 kali server gak bikin transaksi dobel
    const [clientRef, setClientRef] = useState(() => crypto.randomUUID());
    const [busy, setBusy] = useState(false);

    //qris
    const [qrisState, setQrisState] = useState<QrisState>("creating");
    const [trx, setTrx] = useState<Transaction | null>(null);
    const [qrisError, setQrisError] = useState<{message: string; stock: boolean} | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const order = {clientRef, channel: cart.channel, items: cart.items.map((item) => ({menuId: item.menuId, qty: item.qty}))};

    function handleQrisError(err: unknown) {
        //kalau midtrans gagal, server tetap kirim transaksinya biar bisa dicoba lagi
        if (axios.isAxiosError(err) && err.response?.data?.transaction) {
            setTrx(err.response.data.transaction);
        }
        const stock = statusCode(err) === 409;
        if (stock) onStockChanged();
        setQrisError({
            message: stock ? errorMessage(err) : (statusCode(err) === 502 || !axios.isAxiosError(err) || !err.response ? "Tidak bisa terhubung ke layanan QRIS" : errorMessage(err)),
            stock,
        });
        setQrisState("error");
    }

    function showQr(next: Transaction) {
        setTrx(next);
        if (next.status === "PAID") {
            onPaid(next);
            return;
        }
        setNow(Date.now());
        setQrisState("pending");
    }

    async function startQris() {
        setStep("qris");
        setQrisState("creating");
        setQrisError(null);
        try {
            showQr(await payQris(order));
        } catch (err) {
            handleQrisError(err);
        }
    }

    //buat QR baru untuk transaksi yang sama (QR lama kedaluwarsa / gagal terhubung)
    async function newQr() {
        if (!trx) {
            await startQris();
            return;
        }
        setQrisState("creating");
        setQrisError(null);
        try {
            showQr(await regenerateQris(trx.id));
        } catch (err) {
            handleQrisError(err);
        }
    }

    //cek status ke backend (backend yang tanya ke midtrans)
    async function checkStatus(manual = false) {
        if (!trx) return;
        try {
            const latest = await checkQrisStatus(trx.id);
            setTrx(latest);
            if (latest.status === "PAID") onPaid(latest);
            else if (latest.status === "EXPIRED" || latest.status === "CANCELLED") setQrisState("expired");
            else if (manual) toast.info("Pembayaran belum masuk. Minta pelanggan menyelesaikan scan.");
        } catch (err) {
            if (manual) toast.error(errorMessage(err));
        }
    }

    const poll = useEffectEvent(() => checkStatus());
    const tick = useEffectEvent(() => {
        const current = Date.now();
        setNow(current);
        //waktu QR habis: cek sekali lagi, kalau belum dibayar anggap kedaluwarsa
        if (trx?.expiresAt && new Date(trx.expiresAt).getTime() <= current) {
            checkStatus().finally(() => setQrisState((state) => (state === "pending" ? "expired" : state)));
        }
    });

    //polling status tiap 3 detik selama QR tampil
    useEffect(() => {
        if (step !== "qris" || qrisState !== "pending") return;
        const pollTimer = setInterval(() => poll(), POLL_MS);
        const clockTimer = setInterval(() => tick(), 1000);
        return () => {
            clearInterval(pollTimer);
            clearInterval(clockTimer);
        };
    }, [step, qrisState, trx?.id]);

    //batalkan QR yang masih menunggu, return false kalau ternyata sudah dibayar / gagal
    async function cancelPending() {
        if (!trx || trx.status === "PAID" || trx.status === "CANCELLED") return true;
        setBusy(true);
        try {
            await cancelQris(trx.id);
            return true;
        } catch (err) {
            if (statusCode(err) === 409) {
                //uang ternyata sudah masuk
                const latest = await checkQrisStatus(trx.id).catch(() => null);
                if (latest?.status === "PAID") {
                    onPaid(latest);
                    return false;
                }
            }
            toast.error(errorMessage(err));
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function switchToCash() {
        if (!(await cancelPending())) return;
        //transaksi qris tadi sudah batal, pembayaran tunai pakai clientRef baru
        setTrx(null);
        setClientRef(crypto.randomUUID());
        setStep("cash");
    }

    async function handleClose() {
        if (busy) return;
        if (step === "qris" && trx) {
            if (!(await cancelPending())) return;
        }
        onClose();
    }

    const title = {method: "Pembayaran", cash: "Pembayaran Tunai", qris: "Pembayaran QRIS"}[step];

    return (
        <Dialog open onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[920px] gap-0 p-0 sm:max-w-[920px]" onInteractOutside={(e) => e.preventDefault()}>
                <div className="border-b p-6 pr-14">
                    <DialogTitle className="text-3xl">{title}</DialogTitle>
                    <DialogDescription className="mt-1 text-base">
                        {ticket ? `Tiket ${ticket} · ` : ""}{channelLabel[cart.channel]}
                    </DialogDescription>
                    {step === "cash" && (
                        <button className="mt-2 flex items-center gap-1 text-sm font-semibold" onClick={() => setStep("method")}>
                            <ArrowLeftIcon /> Ganti metode
                        </button>
                    )}
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.05fr]">
                    <OrderSummary />
                    {step === "method" && <MethodPicker onCash={() => setStep("cash")} onQris={startQris} />}
                    {step === "cash" && <CashPanel total={total} order={order} onPaid={onPaid} onStockChanged={onStockChanged} onBack={onClose} />}
                    {step === "qris" && (
                        <QrisPanel
                            state={qrisState}
                            trx={trx}
                            total={total}
                            now={now}
                            error={qrisError}
                        />
                    )}
                </div>

                {step === "method" && (
                    <div className="border-t p-5">
                        <Button variant="secondary" className="h-11 px-6" onClick={onClose}>Batal</Button>
                    </div>
                )}
                {step === "qris" && (
                    <div className="flex items-center justify-between gap-3 border-t bg-lembut p-5">
                        <Button variant={qrisState === "error" ? "default" : "outline"} className="h-11 px-5" onClick={switchToCash} disabled={busy}>
                            {busy ? <SpinnerIcon className="animate-spin" /> : <ArrowsLeftRightIcon />} Ganti ke Tunai
                        </Button>
                        {qrisState === "pending" && <Button variant="outline" className="h-11 bg-card px-5" onClick={() => checkStatus(true)}><ArrowClockwiseIcon /> Cek Status</Button>}
                        {qrisState === "expired" && <Button className="h-11 px-5" onClick={newQr}><ArrowClockwiseIcon /> Buat QR Baru</Button>}
                        {qrisState === "error" && qrisError?.stock && <Button variant="outline" className="h-11 bg-card px-5" onClick={onClose}><ArrowLeftIcon /> Kembali ke Pesanan</Button>}
                        {qrisState === "error" && !qrisError?.stock && <Button variant="outline" className="h-11 bg-card px-5" onClick={newQr}><ArrowClockwiseIcon /> Coba Lagi</Button>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

//rincian pesanan di sisi kiri dialog
function OrderSummary() {
    const {items, totals, channel} = useCart();
    return (
        <div className="flex flex-col rounded-xl bg-lembut p-5">
            <div className="mb-3 flex justify-between text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <span>Ringkasan pesanan</span>
                <span>{items.length} menu</span>
            </div>
            <ul className="grid gap-2.5">
                {items.map((item) => (
                    <li key={item.menuId} className="flex justify-between gap-3">
                        <div>
                            <div className="font-medium">{item.qty}x {item.name}</div>
                            <div className="angka text-xs text-muted-foreground">{item.qty} × {rupiah(item.price)}</div>
                        </div>
                        <span className="angka">{rupiah(item.price * item.qty)}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-4 grid gap-1.5 border-t pt-3 text-sm">
                <Line label="Subtotal" value={totals.subtotal} />
                {channel === "TAKEAWAY" && <Line label="Biaya bungkus" value={totals.takeoutFee} />}
                <Line label="PB1 (10%)" value={totals.tax} />
                {totals.rounding > 0 && <Line label="Pembulatan" value={totals.rounding} />}
            </div>
            <div className="mt-auto flex items-end justify-between border-t pt-4">
                <span className="font-semibold">Total tagihan</span>
                <span className="angka text-3xl font-semibold">{rupiah(totals.total)}</span>
            </div>
        </div>
    );
}

function Line({label, value}: {label: string; value: number}) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="angka">{rupiah(value)}</span>
        </div>
    );
}

function MethodPicker({onCash, onQris}: {onCash: () => void; onQris: () => void}) {
    return (
        <div className="grid content-start gap-4">
            <span className="text-sm font-medium">Pilih metode</span>
            <MethodButton icon={<MoneyIcon size={30} />} title="Tunai" description="Hitung uang dan kembalian." onClick={onCash} />
            <MethodButton
                icon={<QrCodeIcon size={30} />}
                title={<>QRIS <span className="ml-2 rounded bg-kunyit px-2 py-0.5 font-sans text-xs font-bold tracking-wider text-pinus">INSTAN</span></>}
                description="Pelanggan scan dengan aplikasi bank atau e-wallet."
                onClick={onQris}
            />
        </div>
    );
}

function MethodButton({icon, title, description, onClick}: {icon: React.ReactNode; title: React.ReactNode; description: string; onClick: () => void}) {
    return (
        <button onClick={onClick} className="flex items-center gap-4 rounded-xl border bg-card p-5 text-left transition hover:border-pinus hover:shadow-sm">
            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-lembut text-pinus">{icon}</span>
            <span className="flex-1">
                <span className="block font-heading text-xl font-bold">{title}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
            </span>
            <CaretRightIcon size={20} className="text-muted-foreground" />
        </button>
    );
}

//nominal cepat: uang pas + pembulatan ke atas yang masuk akal
function quickAmounts(total: number) {
    const list = [total];
    for (const step of [10_000, 50_000, 100_000]) {
        const value = Math.ceil(total / step) * step;
        if (value > total && !list.includes(value)) list.push(value);
    }
    if (list.length < 4) list.push(Math.ceil(total / 100_000) * 100_000 + 50_000);
    return list.slice(0, 4);
}

type OrderBody = {clientRef: string; channel: Transaction["channel"]; items: {menuId: string; qty: number}[]};

function CashPanel({total, order, onPaid, onStockChanged, onBack}: {total: number; order: OrderBody; onPaid: (trx: Transaction) => void; onStockChanged: () => void; onBack: () => void}) {
    const [cash, setCash] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<{message: string; stock: boolean} | null>(null);

    const received = cash ?? 0;
    const short = cash !== null && received < total;
    const change = received - total;

    async function submit() {
        if (received < total) return;
        setSaving(true);
        setSaveError(null);
        try {
            //total dihitung ulang di server, yang dikirim cuma menuId, qty, dan uang diterima
            const trx = await payCash({...order, cashReceived: received});
            onPaid(trx);
        } catch (err) {
            const stock = statusCode(err) === 409;
            if (stock) onStockChanged();
            setSaveError({message: errorMessage(err), stock});
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="grid content-start gap-4">
            <label htmlFor="cash-received" className="text-sm font-medium">Uang diterima</label>
            <MoneyInput
                id="cash-received"
                value={cash}
                onChange={setCash}
                invalid={short}
                autoFocus
                className="h-16"
                inputClassName="text-right text-3xl font-semibold"
            />
            {short && <p className="-mt-2 flex items-center gap-1.5 text-sm font-medium text-cabai"><WarningCircleIcon size={18} /> Uang kurang {rupiah(total - received)}</p>}

            <div>
                <div className="mb-2 text-xs text-muted-foreground">Nominal cepat</div>
                <div className="grid grid-cols-2 gap-2">
                    {quickAmounts(total).map((value, index) => (
                        <button
                            key={value}
                            onClick={() => setCash(value)}
                            className={cn("angka h-12 rounded-lg border text-[15px] font-medium transition", cash === value ? "border-pinus bg-pinus text-white" : "bg-card hover:border-pinus")}
                        >
                            {index === 0 ? "Uang pas" : `Rp ${num(value)}`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl bg-lembut p-4">
                <div className="text-sm text-muted-foreground">Kembalian</div>
                <div className={cn("angka text-3xl font-semibold", cash !== null && !short ? "text-daun" : "text-muted-foreground")}>
                    {cash !== null && !short ? rupiah(change) : "-"}
                </div>
            </div>

            {saveError && (
                <div role="alert" className="flex gap-3 rounded-xl border border-cabai/40 bg-cabai/5 p-4">
                    <WarningCircleIcon size={22} className="shrink-0 text-cabai" />
                    <div>
                        <div className="font-heading font-bold text-cabai">Pembayaran belum tersimpan</div>
                        <p className="text-sm">{saveError.message}{saveError.stock ? " Kembali ke pesanan lalu ubah jumlahnya." : ""}</p>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                {saveError?.stock ? (
                    <Button variant="outline" className="h-12 px-5" onClick={onBack}><ArrowLeftIcon /> Kembali ke Pesanan</Button>
                ) : (
                    <Button variant="ghost" className="h-12 px-5" onClick={onBack} disabled={saving}>Batal</Button>
                )}
                <Button className="h-12 px-6 text-base" disabled={saving || cash === null || short || !!saveError?.stock} onClick={submit}>
                    {saving ? <SpinnerIcon className="animate-spin" /> : short ? <LockSimpleIcon /> : <CheckCircleIcon size={20} />}
                    {saving ? "Menyimpan..." : saveError ? "Coba Simpan Lagi" : "Selesaikan Pembayaran"}
                </Button>
            </div>
        </div>
    );
}

function QrisPanel({state, trx, total, now, error}: {state: QrisState; trx: Transaction | null; total: number; now: number; error: {message: string; stock: boolean} | null}) {
    if (state === "creating") {
        return (
            <div className="grid min-h-80 place-items-center rounded-xl border bg-card text-center text-muted-foreground">
                <div>
                    <SpinnerIcon size={36} className="mx-auto animate-spin text-pinus" />
                    <p className="mt-3">Membuat kode QR...</p>
                </div>
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="grid min-h-80 place-items-center rounded-xl border border-cabai/20 bg-cabai/5 p-6 text-center">
                <div>
                    <div className="mx-auto grid size-16 place-items-center rounded-xl bg-cabai/10 text-cabai">
                        {error?.stock ? <WarningCircleIcon size={32} /> : <CloudSlashIcon size={32} />}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-cabai">{error?.message}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error?.stock ? "Kembali ke pesanan lalu ubah jumlahnya." : "Periksa koneksi internet, lalu coba lagi. Pembayaran Tunai tetap bisa dipakai."}
                    </p>
                </div>
            </div>
        );
    }

    if (state === "expired") {
        return (
            <div className="grid min-h-80 place-items-center rounded-xl border bg-muted/60 p-6 text-center">
                <div>
                    <div className="mx-auto grid size-16 place-items-center rounded-xl bg-cabai/10 text-cabai"><TimerIcon size={32} /></div>
                    <h3 className="mt-4 text-2xl font-bold">Kode QR kedaluwarsa</h3>
                    <p className="mt-2 text-muted-foreground">Pelanggan belum membayar dalam 15 menit. Tidak ada uang yang terpotong.</p>
                </div>
            </div>
        );
    }

    //pending: tampilkan QR + hitung mundur
    const expiresAt = trx?.expiresAt ? new Date(trx.expiresAt).getTime() : now;
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const percent = Math.min(100, (remaining / (15 * 60)) * 100);
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");

    return (
        <div className="grid content-start gap-4">
            <div className="rounded-xl border bg-card p-5 text-center">
                <div className="mb-3 flex items-center justify-center gap-2 font-sans text-sm font-bold tracking-widest">
                    <span className="text-cabai">QRIS</span> <span>NASIONAL</span>
                </div>
                {trx?.qrUrl ? (
                    <img src={trx.qrUrl} alt="Kode QR pembayaran" className="mx-auto size-56 object-contain" />
                ) : (
                    <div className="mx-auto grid size-56 place-items-center text-sm text-muted-foreground">QR belum tersedia</div>
                )}
                <div className="angka mt-3 rounded-lg bg-lembut py-2 text-xl font-semibold">{rupiah(trx?.total ?? total)}</div>
            </div>
            <div>
                <div className="mb-1.5 flex justify-between text-sm">
                    <span className="flex items-center gap-1.5"><ClockIcon size={18} className="text-kunyit" /> Berlaku</span>
                    <span className="angka font-semibold">{mm}:{ss}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-kunyit transition-[width] duration-1000" style={{width: `${percent}%`}} />
                </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-lembut px-4 py-3">
                <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-kunyit opacity-60" />
                    <span className="relative inline-flex size-3 rounded-full bg-kunyit" />
                </span>
                <div>
                    <div className="font-medium">Menunggu pembayaran dari pelanggan...</div>
                    <div className="text-xs text-muted-foreground">Status diperiksa otomatis setiap 3 detik.</div>
                </div>
            </div>
        </div>
    );
}
