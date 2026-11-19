import { createPortal } from "react-dom";
import { channelLabel, clock, num, shortDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

//isi struk 80mm, dipakai di pratinjau dan saat dicetak
export function Receipt({trx, copy = false}: {trx: Transaction; copy?: boolean}) {
    const time = trx.paidAt ?? trx.createdAt;

    return (
        <div className="angka bg-white px-5 py-6 text-[12px] leading-relaxed text-black">
            <div className="text-center">
                <div className="font-heading text-lg font-bold">RM Awak Punyo</div>
                <div>Masakan Padang</div>
                {copy && <div className="mt-1 font-bold">SALINAN</div>}
            </div>
            <Dash />
            <Row left={<b>Tiket: {trx.ticket}</b>} right={channelLabel[trx.channel]} />
            <Row left={`Kasir: ${trx.cashier.name}`} right="" />
            <Row left={shortDate(time)} right={`${clock(time)} WIB`} />
            <Dash />
            {trx.items.map((item) => (
                <div key={item.id}>
                    <Row left={`${item.qty} ${item.nameSnapshot}`} right={num(item.lineTotal)} />
                    {item.qty > 1 && <div className="pl-3 text-[11px] text-neutral-500">@ {num(item.priceSnapshot)}</div>}
                </div>
            ))}
            <Dash />
            <Row left="Subtotal" right={num(trx.subtotal)} />
            {trx.takeoutFee > 0 && <Row left="Biaya bungkus" right={num(trx.takeoutFee)} />}
            <Row left="PB1 (10%)" right={num(trx.tax)} />
            {trx.rounding > 0 && <Row left="Pembulatan" right={num(trx.rounding)} />}
            <Row left={<b>TOTAL</b>} right={<b>Rp {num(trx.total)}</b>} />
            {trx.paymentMethod === "CASH" ? (
                <>
                    <Row left="Tunai" right={num(trx.cashReceived ?? 0)} />
                    <Row left="Kembalian" right={`Rp ${num(trx.changeAmount ?? 0)}`} />
                </>
            ) : (
                <>
                    <Row left="QRIS" right={num(trx.total)} />
                    {trx.midtransOrderId && <div className="text-[11px] break-all text-neutral-500">Ref: {trx.midtransOrderId}</div>}
                </>
            )}
            <Dash />
            <div className="text-center">
                <div className="font-bold">TARIMO KASIH, SANAK!</div>
                <div className="text-[11px]">Simpan struk ini sebagai bukti pembayaran</div>
            </div>
        </div>
    );
}

function Row({left, right}: {left: React.ReactNode; right: React.ReactNode}) {
    return (
        <div className="flex justify-between gap-3">
            <span>{left}</span>
            <span className="shrink-0 text-right">{right}</span>
        </div>
    );
}

function Dash() {
    return <div className="my-2 border-t border-dashed border-neutral-400" />;
}

//struk yang ikut dicetak, ditaruh di luar layout lewat portal
//css @media print di index.css cuma menampilkan #print-area
export function PrintArea({trx, copy}: {trx: Transaction | null; copy?: boolean}) {
    if (!trx) return null;
    return createPortal(
        <div id="print-area">
            <Receipt trx={trx} copy={copy} />
        </div>,
        document.body,
    );
}
