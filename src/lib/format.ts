import type { Channel, PaymentMethod, TransactionStatus } from "./types";

const angka = new Intl.NumberFormat("id-ID");

//66550 jadi "66.550"
export function num(value: number) {
    return angka.format(value);
}

//66550 jadi "Rp 66.550"
export function rupiah(value: number) {
    return `Rp ${angka.format(value)}`;
}

//"Kamis, 19 Nov 2026"
export function longDate(date: Date | string = new Date()) {
    return new Intl.DateTimeFormat("id-ID", {weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta"}).format(new Date(date));
}

//"19 Nov 2026"
export function shortDate(date: Date | string) {
    return new Intl.DateTimeFormat("id-ID", {day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta"}).format(new Date(date));
}

//"13:05"
export function clock(date: Date | string) {
    return new Intl.DateTimeFormat("id-ID", {hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta"}).format(new Date(date)).replace(".", ":");
}

//tanggal hari ini format YYYY-MM-DD menurut WIB, buat filter
export function todayInput() {
    return new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Jakarta"}).format(new Date());
}

export function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export const channelLabel: Record<Channel, string> = {
    DINE_IN: "Makan di Tempat",
    TAKEAWAY: "Bungkus",
};

export const methodLabel: Record<PaymentMethod, string> = {
    CASH: "Tunai",
    QRIS: "QRIS",
};

export const statusLabel: Record<TransactionStatus, string> = {
    PENDING: "Menunggu",
    PAID: "Lunas",
    EXPIRED: "Kedaluwarsa",
    CANCELLED: "Dibatalkan",
};
