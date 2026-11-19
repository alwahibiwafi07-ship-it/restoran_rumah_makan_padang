import { ClockIcon, ForkKnifeIcon, MoneyIcon, PrinterIcon, QrCodeIcon, ShoppingBagIcon, UserIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PrintArea } from "@/components/shared/Receipt";
import { channelLabel, clock, longDate, methodLabel, rupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

//drawer detail transaksi, dipakai admin dan riwayat kasir
export function TransactionDetailSheet({trx, onClose, printLabel = "Cetak Struk", copy}: {trx: Transaction | null; onClose: () => void; printLabel?: string; copy?: boolean}) {
    const time = trx ? (trx.paidAt ?? trx.createdAt) : "";

    return (
        <Sheet open={!!trx} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-[520px]">
                {trx && (
                    <>
                        <div className="border-b p-6">
                            <div className="flex items-center gap-3">
                                <SheetTitle className="font-heading text-3xl font-bold">Tiket {trx.ticket}</SheetTitle>
                                <StatusBadge status={trx.status} />
                            </div>
                            <SheetDescription className="sr-only">Detail transaksi {trx.ticket}</SheetDescription>
                        </div>

                        <div className="grid gap-6 p-6">
                            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-lg bg-lembut p-5 text-sm">
                                <dt className="flex items-center gap-2 text-muted-foreground"><ClockIcon size={18} /> Waktu</dt>
                                <dd className="angka text-right">{longDate(time)}, {clock(time)}</dd>
                                <dt className="flex items-center gap-2 text-muted-foreground"><UserIcon size={18} /> Kasir</dt>
                                <dd className="text-right font-medium">{trx.cashier.name}</dd>
                                <dt className="flex items-center gap-2 text-muted-foreground">
                                    {trx.channel === "TAKEAWAY" ? <ShoppingBagIcon size={18} /> : <ForkKnifeIcon size={18} />} Kanal
                                </dt>
                                <dd className="text-right">{channelLabel[trx.channel]}</dd>
                                <dt className="flex items-center gap-2 text-muted-foreground">
                                    {trx.paymentMethod === "QRIS" ? <QrCodeIcon size={18} /> : <MoneyIcon size={18} />} Metode
                                </dt>
                                <dd className="text-right font-medium">{methodLabel[trx.paymentMethod]}</dd>
                            </dl>

                            <div>
                                <div className="mb-3 flex justify-between text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                    <span>Rincian hidangan</span>
                                    <span>{trx.items.length} menu</span>
                                </div>
                                <ul className="divide-y">
                                    {trx.items.map((item) => (
                                        <li key={item.id} className="flex items-start gap-3 py-3">
                                            <span className="angka grid h-7 min-w-8 place-items-center rounded bg-lembut px-1.5 text-xs font-semibold">{item.qty}x</span>
                                            <div className="flex-1">
                                                <div className="font-medium">{item.nameSnapshot}</div>
                                                <div className="angka text-xs text-muted-foreground">@ {rupiah(item.priceSnapshot)}</div>
                                            </div>
                                            <span className="angka font-medium">{rupiah(item.lineTotal)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid gap-2 rounded-lg bg-lembut p-5 text-sm">
                                <Line label="Subtotal" value={trx.subtotal} />
                                {trx.takeoutFee > 0 && <Line label="Biaya bungkus" value={trx.takeoutFee} />}
                                <Line label="PB1 (10%)" value={trx.tax} />
                                {trx.rounding > 0 && <Line label="Pembulatan" value={trx.rounding} />}
                                <div className="mt-2 flex items-end justify-between border-t pt-3">
                                    <span className="font-heading text-xl font-bold">Total</span>
                                    <span className="angka text-2xl font-semibold">{rupiah(trx.total)}</span>
                                </div>
                                {trx.paymentMethod === "CASH" && trx.status === "PAID" && (
                                    <div className="mt-2 grid gap-2 border-t pt-3">
                                        <Line label="Diterima (Tunai)" value={trx.cashReceived ?? 0} />
                                        <div className="flex justify-between font-semibold">
                                            <span>Kembalian</span>
                                            <span className="angka text-daun">{rupiah(trx.changeAmount ?? 0)}</span>
                                        </div>
                                    </div>
                                )}
                                {trx.paymentMethod === "QRIS" && trx.midtransOrderId && (
                                    <div className="mt-2 flex justify-between gap-4 border-t pt-3 text-xs text-muted-foreground">
                                        <span>Ref QRIS</span>
                                        <span className="angka break-all">{trx.midtransOrderId}</span>
                                    </div>
                                )}
                            </div>

                            {trx.status === "PAID" && (
                                <Button variant="outline" className="h-12 text-base" onClick={() => window.print()}>
                                    <PrinterIcon size={20} /> {printLabel}
                                </Button>
                            )}
                        </div>
                        <PrintArea trx={trx} copy={copy} />
                    </>
                )}
            </SheetContent>
        </Sheet>
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

