import { api } from "./client";
import type { Channel, PaymentMethod, Transaction, TransactionStatus } from "@/lib/types";

export type OrderInput = {clientRef: string; channel: Channel; items: {menuId: string; qty: number}[]};

export type TransactionFilter = {
    from?: string;
    to?: string;
    cashierId?: string;
    method?: PaymentMethod;
    status?: TransactionStatus;
    page?: number;
    pageSize?: number;
};

export type TransactionPage = {
    transactions: Transaction[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    revenue: number;
};

export async function getNextTicket() {
    const res = await api.get<{ticketNo: number; ticket: string}>("/transactions/next-ticket");
    return res.data;
}

export async function getMyToday() {
    const res = await api.get<{count: number; total: number; transactions: Transaction[]}>("/transactions/mine/today");
    return res.data;
}

export async function getTransactions(filter: TransactionFilter) {
    //yang kosong gak usah dikirim
    const params = Object.fromEntries(Object.entries(filter).filter(([, value]) => value !== "" && value !== undefined));
    const res = await api.get<TransactionPage>("/transactions", {params});
    return res.data;
}

export async function getTransaction(id: string) {
    const res = await api.get<Transaction>(`/transactions/${id}`);
    return res.data;
}

export async function payCash(data: OrderInput & {cashReceived: number}) {
    const res = await api.post<Transaction>("/transactions/cash", data);
    return res.data;
}

export async function payQris(data: OrderInput) {
    const res = await api.post<Transaction>("/transactions/qris", data);
    return res.data;
}

export async function checkQrisStatus(id: string) {
    const res = await api.get<Transaction>(`/transactions/${id}/status`);
    return res.data;
}

export async function regenerateQris(id: string) {
    const res = await api.post<Transaction>(`/transactions/${id}/qris/regenerate`);
    return res.data;
}

export async function cancelQris(id: string) {
    const res = await api.post<Transaction>(`/transactions/${id}/qris/cancel`);
    return res.data;
}
