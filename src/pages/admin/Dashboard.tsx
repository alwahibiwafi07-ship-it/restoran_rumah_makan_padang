import { Link } from "react-router-dom";
import { ArrowClockwiseIcon, ArrowRightIcon, CheckCircleIcon, ReceiptIcon, TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ErrorState, EmptyState, PageHeader } from "@/components/shared/States";
import { ChannelBadge } from "@/components/shared/StatusBadge";
import { getDashboardToday } from "@/api/dashboard";
import { clock, longDate, methodLabel, num, rupiah } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

export default function Dashboard() {
    const {data, loading, error, reload} = useFetch(getDashboardToday, []);

    const header = (
        <PageHeader
            title="Dashboard"
            description="Ringkasan penjualan hari ini. Yang dihitung hanya transaksi lunas."
            action={<Button variant="outline" className="h-11" onClick={reload} disabled={loading}><ArrowClockwiseIcon className={cn(loading && "animate-spin")} /> Muat Ulang</Button>}
        />
    );

    if (loading && !data) {
        return (
            <div>
                {header}
                <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />)}
                </div>
            </div>
        );
    }
    if (error || !data) {
        return <div>{header}<ErrorState message={error ?? undefined} onRetry={reload} /></div>;
    }

    const average = data.transactionCount ? Math.round(data.revenue / data.transactionCount) : 0;
    const maxQty = Math.max(...data.topMenus.map((menu) => menu.qty), 1);
    //tunai dan qris selalu ditampilkan walau nol
    const methods = (["CASH", "QRIS"] as const).map((method) => data.byMethod.find((row) => row.method === method) ?? {method, count: 0, total: 0});

    return (
        <div>
            {header}
            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <section className="rounded-xl border bg-card p-7">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase">Omzet hari ini</h2>
                        <span className="angka text-sm text-muted-foreground">{longDate(`${data.date}T12:00:00+07:00`)}</span>
                    </div>
                    <div className="angka mt-3 text-5xl font-semibold">{rupiah(data.revenue)}</div>
                    <p className="mt-2 text-muted-foreground">
                        <b className="angka text-foreground">{data.transactionCount}</b> transaksi, rata-rata <b className="angka text-foreground">{rupiah(average)}</b> per transaksi
                    </p>
                    <div className="mt-8 grid gap-5 border-t pt-6">
                        {methods.map((row) => {
                            const share = data.revenue ? Math.round((row.total / data.revenue) * 100) : 0;
                            return (
                                <div key={row.method}>
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span className="flex items-center gap-2 font-medium">
                                            <span className={cn("size-2.5 rounded-full", row.method === "CASH" ? "bg-pinus" : "bg-kunyit")} />
                                            {methodLabel[row.method]}: {row.count} transaksi
                                        </span>
                                        <span className="angka">{rupiah(row.total)} ({share}%)</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                        <div className={cn("h-full rounded-full", row.method === "CASH" ? "bg-pinus" : "bg-kunyit")} style={{width: `${share}%`}} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-7">
                    <h2 className="font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase">Perlu perhatian</h2>
                    {data.lowStock.length === 0 ? (
                        <div className="mt-6 flex items-center gap-3 rounded-lg bg-daun/10 p-4 text-daun">
                            <CheckCircleIcon size={24} /> Semua stok masih aman.
                        </div>
                    ) : (
                        <ul className="mt-4 grid gap-3">
                            {data.lowStock.map((menu) => (
                                <li key={menu.id} className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{menu.name}</span>
                                        <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", menu.status === "HABIS" ? "bg-cabai/10 text-cabai" : "bg-kunyit/20 text-[#8a6210]")}>
                                            {menu.status === "HABIS" ? "Habis" : "Menipis"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">Sisa <span className="angka">{menu.stockQty}</span> porsi · <span className="angka">{menu.code}</span></p>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link to="/admin/menu" className="mt-5 flex items-center gap-1 border-t pt-4 text-sm font-semibold text-pinus hover:underline">
                        Atur stok di halaman Menu <ArrowRightIcon />
                    </Link>
                </section>

                <section className="rounded-xl border bg-card p-7">
                    <h2 className="font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase">Menu terlaris hari ini</h2>
                    {data.topMenus.length === 0 ? (
                        <EmptyState icon={TrophyIcon} title="Belum ada penjualan" description="Menu terlaris muncul setelah ada transaksi lunas." className="py-8" />
                    ) : (
                        <ol className="mt-5 grid gap-4">
                            {data.topMenus.map((menu, index) => (
                                <li key={menu.menuId}>
                                    <div className="mb-1.5 flex justify-between text-sm">
                                        <span className="font-medium">{index + 1}. {menu.name}</span>
                                        <span className="angka text-muted-foreground">{menu.qty} porsi · {rupiah(menu.total)}</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-pinus" style={{width: `${(menu.qty / maxQty) * 100}%`}} />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-7 pb-4">
                        <div>
                            <h2 className="font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase">Transaksi terbaru</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{Math.min(data.recentTransactions.length, 5)} dari {num(data.transactionCount)} transaksi hari ini</p>
                        </div>
                        <Link to="/admin/transaksi" className="flex items-center gap-1 text-sm font-semibold text-pinus hover:underline">Lihat semua <ArrowRightIcon /></Link>
                    </div>
                    {data.recentTransactions.length === 0 ? (
                        <EmptyState icon={ReceiptIcon} title="Belum ada transaksi" className="py-8" />
                    ) : (
                        <ul className="divide-y border-t">
                            {data.recentTransactions.map((trx) => (
                                <li key={trx.id} className="flex items-center gap-4 px-7 py-3.5">
                                    <span className="angka w-14 font-semibold">{trx.ticket}</span>
                                    <span className="angka w-12 text-sm text-muted-foreground">{clock(trx.paidAt ?? trx.createdAt)}</span>
                                    <span className="min-w-0 flex-1 truncate">{trx.cashier.name}</span>
                                    <ChannelBadge channel={trx.channel} />
                                    <span className="angka w-28 text-right font-semibold">{rupiah(trx.total)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
