import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowClockwiseIcon, CashRegisterIcon, CaretRightIcon, MagnifyingGlassIcon, ReceiptIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/shared/States";
import { ChannelBadge } from "@/components/shared/StatusBadge";
import { TransactionDetailSheet } from "@/components/shared/TransactionDetailSheet";
import { getMyToday } from "@/api/transactions";
import { clock, longDate, methodLabel, rupiah } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";
import type { Transaction } from "@/lib/types";

//riwayat kasir yang login, hari ini saja
export default function History() {
    const {data, loading, error, reload} = useFetch(getMyToday, []);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Transaction | null>(null);

    const keyword = search.trim().toUpperCase();
    const rows = (data?.transactions ?? []).filter((trx) => !keyword || trx.ticket.includes(keyword) || trx.ticket.replace("-", "").includes(keyword));

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold">Riwayat Transaksi</h1>
                    <p className="mt-1.5 text-muted-foreground">Transaksi Anda hari ini, {longDate()}.</p>
                </div>
                <Button variant="outline" className="h-11" onClick={reload}><ArrowClockwiseIcon /> Muat Ulang</Button>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
                <p className="text-lg">
                    Ringkasan sesi: <b className="angka">{data?.count ?? 0}</b> transaksi, total <b className="angka text-xl">{rupiah(data?.total ?? 0)}</b>
                </p>
                <div className="relative w-full max-w-xs">
                    <MagnifyingGlassIcon size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor tiket" className="angka h-11 pl-10" aria-label="Cari nomor tiket" />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                    <TableHeader className="bg-lembut">
                        <TableRow className="hover:bg-transparent">
                            {["No. tiket", "Waktu", "Kanal", "Metode", "Isi pesanan"].map((head) => <TableHead key={head} className="px-4 text-xs tracking-widest uppercase">{head}</TableHead>)}
                            <TableHead className="text-right text-xs tracking-widest uppercase">Total</TableHead>
                            <TableHead className="pr-4 text-right text-xs tracking-widest uppercase">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <SkeletonRows rows={5} cols={7} />}
                        {!loading && !error && rows.map((trx) => (
                            <TableRow key={trx.id} className="h-14 cursor-pointer" onClick={() => setSelected(trx)}>
                                <TableCell className="angka px-4 font-semibold">{trx.ticket}</TableCell>
                                <TableCell className="angka text-sm">{clock(trx.paidAt ?? trx.createdAt)}</TableCell>
                                <TableCell><ChannelBadge channel={trx.channel} /></TableCell>
                                <TableCell>{methodLabel[trx.paymentMethod]}</TableCell>
                                <TableCell className="max-w-96 whitespace-normal">
                                    <span className="line-clamp-2">{trx.items.map((item) => `${item.qty} ${item.nameSnapshot}`).join(", ")}</span>
                                </TableCell>
                                <TableCell className="angka text-right font-semibold">{rupiah(trx.total)}</TableCell>
                                <TableCell className="pr-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(trx); }}>Lihat <CaretRightIcon /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {!loading && error && <ErrorState message={error} onRetry={reload} />}
                {!loading && !error && data?.count === 0 && (
                    <EmptyState
                        icon={ReceiptIcon}
                        title="Belum ada transaksi hari ini"
                        description="Transaksi yang Anda selesaikan akan muncul di sini."
                        action={<Button asChild className="h-11 px-5"><Link to="/kasir"><CashRegisterIcon size={20} /> Buka Layar Kasir</Link></Button>}
                    />
                )}
                {!loading && !error && !!data?.count && rows.length === 0 && (
                    <EmptyState icon={MagnifyingGlassIcon} title="Tiket tidak ditemukan" description={`Tidak ada tiket "${search}" hari ini.`} />
                )}
                {!loading && !error && rows.length > 0 && (
                    <div className="border-t bg-lembut px-5 py-3 text-sm text-muted-foreground">Menampilkan {rows.length} transaksi</div>
                )}
            </div>

            <TransactionDetailSheet trx={selected} onClose={() => setSelected(null)} printLabel="Cetak Ulang Struk" copy />
        </div>
    );
}
