import { stockStatus } from "@/lib/stock";
import { cn } from "@/lib/utils";

type StockMenu = {trackStock: boolean; stockQty: number | null};

//badge status untuk tabel admin
export function StockStatusBadge({menu}: {menu: StockMenu}) {
    const status = stockStatus(menu);
    const style = {
        HABIS: "border-cabai/30 bg-cabai/10 text-cabai",
        MENIPIS: "border-kunyit/40 bg-kunyit/15 text-[#8a6210]",
        TERSEDIA: "border-daun/30 bg-daun/10 text-daun",
        TIDAK_DILACAK: "border-daun/30 bg-daun/10 text-daun",
    }[status];
    const label = {HABIS: "Habis", MENIPIS: "Menipis", TERSEDIA: "Tersedia", TIDAK_DILACAK: "Tersedia"}[status];

    return <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold", style)}>{label}</span>;
}

//badge kecil di kartu menu kasir: "Stok 15", "Sisa 6", "Habis"
export function StockPill({menu}: {menu: StockMenu}) {
    const status = stockStatus(menu);
    if (status === "TIDAK_DILACAK") return null;
    if (status === "HABIS") return <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-cabai bg-cabai/10">Habis</span>;
    if (status === "MENIPIS") return <span className="rounded bg-kunyit/90 px-1.5 py-0.5 text-xs font-semibold text-pinus">Sisa {menu.stockQty}</span>;
    return <span className="text-xs font-medium text-muted-foreground">Stok {menu.stockQty}</span>;
}
