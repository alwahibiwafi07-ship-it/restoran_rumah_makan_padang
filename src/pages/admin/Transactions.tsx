import { useState } from "react";
import { ArrowClockwiseIcon, CaretLeftIcon, CaretRightIcon, MagnifyingGlassIcon, ReceiptIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/shared/States";
import { ChannelBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { TransactionDetailSheet } from "@/components/shared/TransactionDetailSheet";
import { getTransactions } from "@/api/transactions";
import { getCashiers } from "@/api/users";
import { clock, methodLabel, num, rupiah, shortDate, todayInput } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";
import type { PaymentMethod, Transaction, TransactionStatus } from "@/lib/types";

const PAGE_SIZE = 20;

export default function Transactions() {
    const today = todayInput();
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [cashierId, setCashierId] = useState("all");
    const [method, setMethod] = useState("all");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [ticketSearch, setTicketSearch] = useState("");
    const [selected, setSelected] = useState<Transaction | null>(null);

    const cashiers = useFetch(getCashiers, []);
    const list = useFetch(() => getTransactions({
        from: from || undefined,
        to: to || undefined,
        cashierId: cashierId === "all" ? undefined : cashierId,
        method: method === "all" ? undefined : method as PaymentMethod,
        status: status === "all" ? undefined : status as TransactionStatus,
        page,
        pageSize: PAGE_SIZE,
    }), [from, to, cashierId, method, status, page]);

    //ganti filter = balik ke halaman 1
    function filterSetter(setter: (value: string) => void) {
        return (value: string) => {
            setter(value);
            setPage(1);
        };
    }

    const hasFilter = from !== today || to !== today || cashierId !== "all" || method !== "all" || status !== "all" || !!ticketSearch;
    function resetFilter() {
        setFrom(today);
        setTo(today);
        setCashierId("all");
        setMethod("all");
        setStatus("all");
        setTicketSearch("");
        setPage(1);
    }

    //cari nomor tiket di halaman yang sedang tampil
    const keyword = ticketSearch.trim().toUpperCase();
    const rows = (list.data?.transactions ?? []).filter((trx) => !keyword || trx.ticket.includes(keyword) || trx.ticket.replace("-", "").includes(keyword));
    const multiDay = from !== to;
    const data = list.data;

    return (
        <div>
            <PageHeader
                title="Transaksi"
                description="Semua penjualan dari kasir. Data hanya untuk dilihat."
                action={<Button variant="outline" className="h-11" onClick={list.reload}><ArrowClockwiseIcon /> Muat Ulang</Button>}
            />

            <div className="mb-4 rounded-xl border bg-card p-4">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <FilterBox label="Dari tanggal">
                        <Input type="date" value={from} max={to || undefined} onChange={(e) => filterSetter(setFrom)(e.target.value)} className="angka h-11" />
                    </FilterBox>
                    <FilterBox label="Sampai tanggal">
                        <Input type="date" value={to} min={from || undefined} onChange={(e) => filterSetter(setTo)(e.target.value)} className="angka h-11" />
                    </FilterBox>
                    <FilterBox label="Kasir">
                        <Select value={cashierId} onValueChange={filterSetter(setCashierId)}>
                            <SelectTrigger className="h-11! w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua kasir</SelectItem>
                                {cashiers.data?.map((cashier) => <SelectItem key={cashier.id} value={cashier.id}>{cashier.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FilterBox>
                    <FilterBox label="Metode">
                        <Select value={method} onValueChange={filterSetter(setMethod)}>
                            <SelectTrigger className="h-11! w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua metode</SelectItem>
                                <SelectItem value="CASH">Tunai</SelectItem>
                                <SelectItem value="QRIS">QRIS</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterBox>
                    <FilterBox label="Status">
                        <Select value={status} onValueChange={filterSetter(setStatus)}>
                            <SelectTrigger className="h-11! w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua status</SelectItem>
                                <SelectItem value="PAID">Lunas</SelectItem>
                                <SelectItem value="PENDING">Menunggu</SelectItem>
                                <SelectItem value="EXPIRED">Kedaluwarsa</SelectItem>
                                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterBox>
                    <FilterBox label="Cari tiket">
                        <div className="relative">
                            <MagnifyingGlassIcon size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                            <Input value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} placeholder="A-009" className="angka h-11 pl-9" />
                        </div>
                    </FilterBox>
                </div>
                {hasFilter && (
                    <div className="mt-3 flex justify-end">
                        <button className="text-sm font-semibold text-[#8a6210] underline underline-offset-2" onClick={resetFilter}>Reset filter</button>
                    </div>
                )}
            </div>

            {data && !list.error && (
                <p className="mb-3 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-pinus" />
                    <b className="angka">{num(data.total)}</b> transaksi, omzet lunas <b className="angka">{rupiah(data.revenue)}</b>
                </p>
            )}

            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                    <TableHeader className="bg-lembut">
                        <TableRow className="hover:bg-transparent">
                            {["No. tiket", "Waktu", "Kasir", "Kanal", "Metode", "Status", "Isi pesanan"].map((head) => <TableHead key={head} className="px-4 text-xs tracking-widest uppercase">{head}</TableHead>)}
                            <TableHead className="text-right text-xs tracking-widest uppercase">Total</TableHead>
                            <TableHead className="pr-4 text-right text-xs tracking-widest uppercase">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.loading && <SkeletonRows rows={8} cols={9} />}
                        {!list.loading && !list.error && rows.map((trx) => (
                            <TableRow key={trx.id} className="cursor-pointer" onClick={() => setSelected(trx)}>
                                <TableCell className="px-4"><span className="angka rounded bg-lembut px-2 py-1 text-sm font-semibold">{trx.ticket}</span></TableCell>
                                <TableCell className="angka text-sm whitespace-nowrap">
                                    {multiDay && <div className="text-xs text-muted-foreground">{shortDate(trx.businessDate)}</div>}
                                    {clock(trx.paidAt ?? trx.createdAt)}
                                </TableCell>
                                <TableCell>{trx.cashier.name}</TableCell>
                                <TableCell><ChannelBadge channel={trx.channel} /></TableCell>
                                <TableCell>{methodLabel[trx.paymentMethod]}</TableCell>
                                <TableCell><StatusBadge status={trx.status} /></TableCell>
                                <TableCell className="max-w-72 whitespace-normal">
                                    <span className="line-clamp-2">{trx.items.map((item) => `${item.qty} ${item.nameSnapshot}`).join(", ")}</span>
                                </TableCell>
                                <TableCell className="angka text-right font-semibold whitespace-nowrap">{rupiah(trx.total)}</TableCell>
                                <TableCell className="pr-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(trx); }}>Lihat <CaretRightIcon /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {!list.loading && list.error && <ErrorState message={list.error} onRetry={list.reload} />}
                {!list.loading && !list.error && rows.length === 0 && (
                    <EmptyState
                        icon={ReceiptIcon}
                        title="Tidak ada transaksi"
                        description={hasFilter ? "Tidak ditemukan transaksi dengan filter ini." : "Belum ada transaksi hari ini."}
                        action={hasFilter && <Button variant="outline" className="h-10" onClick={resetFilter}>Hapus Semua Filter</Button>}
                    />
                )}
                {data && !list.error && data.total > 0 && (
                    <div className="flex items-center justify-between border-t bg-lembut px-5 py-3 text-sm">
                        <span className="text-muted-foreground">
                            Menampilkan <b className="text-foreground">{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)}</b> dari <b className="text-foreground">{data.total}</b> transaksi
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" disabled={page <= 1 || list.loading} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya"><CaretLeftIcon /></Button>
                            <span className="angka px-2">Halaman {data.page}/{Math.max(data.totalPages, 1)}</span>
                            <Button variant="outline" size="icon" disabled={page >= data.totalPages || list.loading} onClick={() => setPage(page + 1)} aria-label="Halaman berikutnya"><CaretRightIcon /></Button>
                        </div>
                    </div>
                )}
            </div>

            <TransactionDetailSheet trx={selected} onClose={() => setSelected(null)} />
        </div>
    );
}

function FilterBox({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <div className="grid gap-1.5">
            <Label className="text-sm text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

