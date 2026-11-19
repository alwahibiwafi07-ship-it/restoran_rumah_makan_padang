import { api } from "./client";
import type { UserAccount } from "@/lib/types";

export async function getCashiers() {
    const res = await api.get<UserAccount[]>("/users", {params: {role: "CASHIER"}});
    return res.data;
}

export async function createCashier(data: {name: string; email: string; password: string}) {
    const res = await api.post<UserAccount>("/users", data);
    return res.data;
}

export async function updateCashier(id: string, data: {name?: string; email?: string; isActive?: boolean}) {
    const res = await api.patch<UserAccount>(`/users/${id}`, data);
    return res.data;
}

export async function resetPassword(id: string, password: string) {
    const res = await api.post<{message: string}>(`/users/${id}/reset-password`, {password});
    return res.data;
}
