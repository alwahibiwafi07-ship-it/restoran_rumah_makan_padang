import { useEffect } from "react";
import { CheckCircleIcon, ChecksIcon, ForkKnifeIcon, PlusCircleIcon, PrinterIcon, ShoppingBagIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PrintArea, Receipt } from "@/components/shared/Receipt";
import { channelLabel, clock, methodLabel, rupiah, shortDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

//layar setelah pembayaran berhasil
export function SuccessView({trx, onNewOrder}: {trx: Transaction; onNewOrder: () => void}) {
    const time = trx.paidAt ?? trx.createdAt;
    const isCash = trx.paymentMethod === "CASH";

    //enter langsung pesanan baru biar kasir cepat
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Enter") onNewOrder();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onNewOrder]);

    return (
        <div className="h-full overflow-y-auto">
            <div className="mx-auto grid max-w-6xl gap-8 p-8 lg:grid-cols-[1.4fr_1fr]">
                <section className="rounded-xl border bg-card p-8">
                    <div className="flex items-center gap-4">
                        <div className="grid size-16 place-items-center rounded-xl bg-daun/10 text-daun"><CheckCircleIcon size={36} /></div>
                        <div>
                            <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Transaksi berhasil</div>
                            <h1 className="text-3xl font-bold">{isCash ? "Pembayaran berhasil" : "Pembayaran QRIS diterima"}</h1>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl bg-lembut py-8 text-center">
                        <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Nomor antrean tiket</div>
                        <div className="angka mt-2 text-7xl font-bold text-pinus">{trx.ticket}</div>
                        <div className="mt-4 flex justify-center gap-2">
                            <span className="flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-sm font-medium">
                                {trx.channel === "TAKEAWAY" ? <ShoppingBagIcon size={18} /> : <ForkKnifeIcon size={18} />} {channelLabel[trx.channel]}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-md bg-pinus px-3 py-1.5 text-sm font-semibold text-white"><ChecksIcon size={18} /> Lunas</span>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 rounded-xl bg-lembut p-5">
                        <Row label="Total tagihan" value={rupiah(trx.total)} bold />
                        {isCash ? (
                            <>
                                <Row label="Uang diterima (Tunai)" value={rupiah(trx.cashReceived ?? 0)} />
                                <div className="flex items-center justify-between rounded-lg bg-card p-4">
                                    <div>
                                        <div className="text-lg font-semibold">Kembalian pelanggan</div>
                                        <div className="text-xs text-daun">Serahkan ke pelanggan sebelum meninggalkan kasir</div>
                                    </div>
                                    <span className="angka text-4xl font-semibold text-daun">{rupiah(trx.changeAmount ?? 0)}</span>
                                </div>
                            </>
                        ) : (
                            <Row label="Metode pembayaran" value={methodLabel[trx.paymentMethod]} />
                        )}
                        <Row label="Waktu" value={`${shortDate(time)}, ${clock(time)} WIB`} />
                    </div>

                    <div className="mt-8 grid grid-cols-[auto_1fr] gap-3">
                        <Button variant="outline" className="h-14 px-6 text-base" onClick={() => window.print()}><PrinterIcon size={22} /> Cetak Struk</Button>
                        <Button className="h-14 text-base" onClick={onNewOrder} autoFocus><PlusCircleIcon size={22} /> Pesanan Baru</Button>
                    </div>
                </section>

                <section>
                    <div className="mb-2 flex justify-between text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        <span>Pratinjau struk (80mm)</span>
                        <span className="text-daun">● Siap cetak</span>
                    </div>
                    <div className="mx-auto w-[80mm] max-w-full overflow-hidden rounded-t-md border-t-4 border-pinus shadow-md">
                        <Receipt trx={trx} />
                    </div>
                </section>
            </div>
            <PrintArea trx={trx} />
        </div>
    );
}

function Row({label, value, bold}: {label: string; value: string; bold?: boolean}) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={`angka ${bold ? "text-lg font-semibold" : ""}`}>{value}</span>
        </div>
    );
}
