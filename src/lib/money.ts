import type { Channel } from "./types";

//rumus sama persis dengan server/lib/money.ts, disini cuma buat tampilan
//total yang disimpan tetap dihitung ulang di server
export const TAKEOUT_FEE = 2000;
export const TAX_RATE = 0.1;
export const ROUND_TO = 500;

export function calculateTotal(subtotal: number, channel: Channel) {
    const takeoutFee = channel === "TAKEAWAY" ? TAKEOUT_FEE : 0;
    const tax = Math.round((subtotal + takeoutFee) * TAX_RATE);
    const beforeRounding = subtotal + takeoutFee + tax;
    const total = subtotal > 0 ? Math.ceil(beforeRounding / ROUND_TO) * ROUND_TO : 0;
    const rounding = total - beforeRounding;

    return {subtotal, takeoutFee, tax, rounding: Math.max(rounding, 0), total};
}
