import { ArchiveIcon, CookingPotIcon, PackageIcon, ReceiptIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { getStockLogs } from "@/api/menus";
import { clock, shortDate } from "@/lib/format";
import { formatTicket } from "@/lib/ticket";
import { useFetch } from "@/lib/useFetch";
import type { Menu, StockLog } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeStyle = {
    ADD: {label: "Masuk", className: "bg-daun/15 text-daun"},
    REDUCE: {label: "Keluar", className: "bg-cabai/10 text-cabai"},
    SALE: {label: "Terjual", className: "bg-lembut text-pinus"},
};

export function StockLogSheet({menu, onClose, onAdjust}: {menu: Menu; onClose: () => void; onAdjust: (menu: Menu) => void}) {
    const {data, loading, error, reload} = useFetch(() => getStockLogs(menu.id), [menu.id]);

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full gap-0 sm:max-w-[480px]">
                <div className="border-b p-6 pr-14">
                    <SheetTitle className="font-heading text-2xl font-bold">Riwayat Stok</SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                        {menu.name} <span className="angka rounded bg-lembut px-1.5 py-0.5 text-xs">{menu.code}</span>
                    </SheetDescription>
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-lembut px-4 py-3">
                        <span className="flex items-center gap-2"><ArchiveIcon size={20} /> Stok saat ini</span>
                        <span className="angka text-xl font-semibold">{data?.menu.stockQty ?? menu.stockQty}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-background p-5">
                    {loading && <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />)}</div>}
                    {!loading && error && <ErrorState message={error} onRetry={reload} className="my-0" />}
                    {!loading && !error && data?.logs.length === 0 && <EmptyState icon={ReceiptIcon} title="Belum ada catatan" />}
                    {!loading && !error && !!data?.logs.length && (
                        <>
                            <div className="mb-3 text-right text-xs text-muted-foreground">{data.logs.length} catatan terakhir</div>
                            <ul className="grid gap-3">
                                {data.logs.map((log) => <LogItem key={log.id} log={log} />)}
                            </ul>
                        </>
                    )}
                </div>

                {menu.trackStock && !menu.archivedAt && (
                    <div className="border-t p-5">
                        <Button className="h-12 w-full text-base" onClick={() => onAdjust({...menu, stockQty: data?.menu.stockQty ?? menu.stockQty})}>
                            <ArchiveIcon size={20} /> Atur Stok
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function LogItem({log}: {log: StockLog}) {
    const style = typeStyle[log.type];
    const Icon = log.type === "SALE" ? ReceiptIcon : log.type === "ADD" ? CookingPotIcon : PackageIcon;
    const title = log.type === "SALE" && log.transaction ? `Terjual (${formatTicket(log.transaction.ticketNo)})` : log.reason ?? "-";

    return (
        <li className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="angka text-xs font-semibold">{shortDate(log.createdAt)} {clock(log.createdAt)}</span>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-semibold uppercase", style.className)}>{style.label}</span>
                    <span className={cn("angka text-sm font-semibold", log.change > 0 ? "text-daun" : "text-cabai")}>{log.change > 0 ? `+${log.change}` : log.change}</span>
                </div>
                <div className="text-right leading-tight">
                    <div className="angka text-lg font-semibold">{log.stockAfter}</div>
                    <div className="text-[10px] tracking-widest text-muted-foreground uppercase">Sisa</div>
                </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2"><Icon size={18} className="text-muted-foreground" /> {title}</span>
                <span className="text-muted-foreground">{log.type === "SALE" ? "Kasir" : "Oleh"}: {log.user.name}</span>
            </div>
            {log.note && <p className="mt-2 rounded bg-lembut px-3 py-2 text-sm text-muted-foreground">{log.note}</p>}
        </li>
    );
}
