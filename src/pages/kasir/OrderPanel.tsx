import { useState } from "react";
import { BasketIcon, ForkKnifeIcon, MinusIcon, MoneyIcon, PlusIcon, ShoppingBagIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useCart } from "@/context/CartContext";
import { num, rupiah } from "@/lib/format";
import type { Channel } from "@/lib/types";
import { cn } from "@/lib/utils";

//panel pesanan di kanan layar kasir
export function OrderPanel({nextTicket, onPay}: {nextTicket?: string; onPay: () => void}) {
    const {items, channel, setChannel, setQty, remove, clear, totals, portions} = useCart();
    const [confirmClear, setConfirmClear] = useState(false);

    return (
        <aside className="flex min-h-0 flex-col border-l bg-card">
            <div className="space-y-4 p-6 pb-4">
                <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-3xl font-bold">Pesanan</h2>
                        {nextTicket && <span className="text-sm whitespace-nowrap text-muted-foreground">Tiket berikutnya: <b className="angka text-foreground">{nextTicket}</b></span>}
                    </div>
                    <button
                        className="flex items-center gap-1 text-sm font-medium text-cabai disabled:text-muted-foreground"
                        disabled={items.length === 0}
                        onClick={() => setConfirmClear(true)}
                    >
                        <TrashIcon size={16} /> Kosongkan
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-lembut p-1" role="radiogroup" aria-label="Kanal pesanan">
                    <ChannelButton value="DINE_IN" current={channel} onSelect={setChannel}><ForkKnifeIcon size={20} /> Makan di Tempat</ChannelButton>
                    <ChannelButton value="TAKEAWAY" current={channel} onSelect={setChannel}><ShoppingBagIcon size={20} /> Bungkus</ChannelButton>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
                {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center pb-10 text-center">
                        <div className="grid size-20 place-items-center rounded-2xl bg-lembut text-muted-foreground"><BasketIcon size={40} /></div>
                        <h3 className="mt-5 font-sans text-lg font-semibold">Belum ada pesanan</h3>
                        <p className="mt-1 max-w-60 text-sm text-muted-foreground">Pilih menu di sebelah kiri untuk menambahkan hidangan ke tiket.</p>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => {
                            const atLimit = item.trackStock && item.qty >= (item.stockQty ?? 0);
                            return (
                                <li key={item.menuId} className="py-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-[17px] font-semibold">{item.name}</div>
                                            <div className="angka text-xs text-muted-foreground">{rupiah(item.price)} × {item.qty}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="angka font-semibold">{rupiah(item.price * item.qty)}</span>
                                            <button onClick={() => remove(item.menuId)} className="p-1 text-muted-foreground hover:text-cabai" aria-label={`Hapus ${item.name}`}><TrashIcon size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex items-center rounded-lg bg-lembut">
                                            <button className="grid size-9 place-items-center" onClick={() => setQty(item.menuId, item.qty - 1)} aria-label={`Kurangi ${item.name}`}><MinusIcon size={16} /></button>
                                            <span className="angka w-8 text-center font-semibold">{item.qty}</span>
                                            <button className="grid size-9 place-items-center disabled:opacity-40" onClick={() => setQty(item.menuId, item.qty + 1)} aria-label={`Tambah ${item.name}`}><PlusIcon size={16} /></button>
                                        </div>
                                        {atLimit && <span className="text-xs font-medium text-[#8a6210]">Sudah mencapai sisa stok ({item.stockQty})</span>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="space-y-2 border-t bg-lembut/60 p-6 text-sm">
                <SummaryLine label="Subtotal" value={totals.subtotal} />
                {channel === "TAKEAWAY" && <SummaryLine label={<>Biaya bungkus <span className="ml-1 rounded bg-kunyit/25 px-1.5 text-xs font-semibold text-[#8a6210]">Bungkus</span></>} value={totals.takeoutFee} />}
                <SummaryLine label="PB1 Restoran (10%)" value={totals.tax} />
                {totals.rounding > 0 && <SummaryLine label="Pembulatan" value={totals.rounding} />}
                <div className="flex items-end justify-between pt-3">
                    <div>
                        <div className="text-xs font-semibold tracking-widest uppercase">Total tagihan</div>
                        <div className="text-xs text-muted-foreground">{portions} porsi</div>
                    </div>
                    <span className="angka text-3xl font-semibold">{rupiah(totals.total)}</span>
                </div>
                <Button className="mt-3 h-14 w-full text-lg" disabled={items.length === 0} onClick={onPay}>
                    <MoneyIcon size={24} /> Bayar Pesanan
                </Button>
            </div>

            <ConfirmDialog
                open={confirmClear}
                onOpenChange={setConfirmClear}
                icon={TrashIcon}
                title="Kosongkan pesanan?"
                description={`${items.length} menu akan dihapus dari pesanan ini.`}
                confirmLabel="Ya, Kosongkan"
                onConfirm={() => {
                    clear();
                    setConfirmClear(false);
                }}
            >
                <div className="rounded-lg bg-lembut p-3 text-left text-sm">{items.map((item) => `${item.qty}x ${item.name}`).join(", ")}</div>
            </ConfirmDialog>
        </aside>
    );
}

function ChannelButton({value, current, onSelect, children}: {value: Channel; current: Channel; onSelect: (value: Channel) => void; children: React.ReactNode}) {
    const active = value === current;
    return (
        <button
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(value)}
            className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-md text-[15px] font-medium transition-colors",
                active ? (value === "TAKEAWAY" ? "border border-kunyit bg-kunyit/20 text-pinus" : "bg-pinus text-white") : "text-muted-foreground hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

function SummaryLine({label, value}: {label: React.ReactNode; value: number}) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="angka">Rp {num(value)}</span>
        </div>
    );
}
