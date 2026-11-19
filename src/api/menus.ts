import { api } from "./client";
import type { Menu, StockLog } from "@/lib/types";

export type MenuInput = {name: string; price: number; categoryId: string; trackStock?: boolean; stockQty?: number};
export type StockInput = {type: "ADD" | "REDUCE"; qty: number; reason: string; note?: string};

export async function getMenus(params: {search?: string; categoryId?: string} = {}) {
    const res = await api.get<Menu[]>("/menus", {params: {search: params.search || undefined, categoryId: params.categoryId || undefined}});
    return res.data;
}

export async function createMenu(data: MenuInput) {
    const res = await api.post<Menu>("/menus", data);
    return res.data;
}

export async function updateMenu(id: string, data: {name?: string; price?: number; categoryId?: string}) {
    const res = await api.patch<Menu>(`/menus/${id}`, data);
    return res.data;
}

//soft delete, menu cuma diarsipkan
export async function archiveMenu(id: string) {
    const res = await api.delete<{message: string}>(`/menus/${id}`);
    return res.data;
}

export async function adjustStock(id: string, data: StockInput) {
    const res = await api.post<{menu: Menu}>(`/menus/${id}/stock`, data);
    return res.data;
}

export async function getStockLogs(id: string) {
    const res = await api.get<{menu: Pick<Menu, "id" | "code" | "name" | "trackStock" | "stockQty">; logs: StockLog[]}>(`/menus/${id}/stock-logs`);
    return res.data;
}
