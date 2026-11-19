//batas menipis sama dengan dashboard di backend
export const LOW_STOCK_LIMIT = 6;

export type StockStatus = "HABIS" | "MENIPIS" | "TERSEDIA" | "TIDAK_DILACAK";

export function stockStatus(menu: {trackStock: boolean; stockQty: number | null}): StockStatus {
    if (!menu.trackStock) return "TIDAK_DILACAK";
    const qty = menu.stockQty ?? 0;
    if (qty <= 0) return "HABIS";
    if (qty <= LOW_STOCK_LIMIT) return "MENIPIS";
    return "TERSEDIA";
}
