import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArchiveIcon, ArrowClockwiseIcon, ClockCounterClockwiseIcon, MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, ForkKnifeIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/shared/States";
import { StockStatusBadge } from "@/components/shared/StockBadge";
import { getCategories } from "@/api/categories";
import { archiveMenu, getMenus } from "@/api/menus";
import { errorMessage } from "@/api/client";
import { rupiah } from "@/lib/format";
import { stockStatus, type StockStatus } from "@/lib/stock";
import { useFetch } from "@/lib/useFetch";
import type { Menu } from "@/lib/types";
import { MenuFormSheet } from "./menu/MenuFormSheet";
import { StockDialog } from "./menu/StockDialog";
import { StockLogSheet } from "./menu/StockLogSheet";

const statusOptions: {value: "all" | StockStatus; label: string}[] = [
    {value: "all", label: "Semua"},
    {value: "TERSEDIA", label: "Tersedia"},
    {value: "MENIPIS", label: "Menipis"},
    {value: "HABIS", label: "Habis"},
    {value: "TIDAK_DILACAK", label: "Tidak dilacak"},
];

export default function Menus() {
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [status, setStatus] = useState<"all" | StockStatus>("all");

    const categories = useFetch(getCategories, []);
    const menus = useFetch(() => getMenus({search, categoryId: categoryId === "all" ? "" : categoryId}), [search, categoryId]);

    const [form, setForm] = useState<{mode: "create" | "edit"; menu?: Menu} | null>(null);
    const [stockMenu, setStockMenu] = useState<Menu | null>(null);
    const [logMenu, setLogMenu] = useState<Menu | null>(null);
    const [toArchive, setToArchive] = useState<Menu | null>(null);
    const [archiving, setArchiving] = useState(false);

    //tunggu berhenti mengetik 300ms baru cari ke server
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    //filter status dihitung di browser dari data stok
    const rows = (menus.data ?? []).filter((menu) => status === "all" || stockStatus(menu) === status);
    const totalMenus = (categories.data ?? []).reduce((sum, category) => sum + (category._count?.menus ?? 0), 0);
    const categoryName = categories.data?.find((category) => category.id === categoryId)?.name;
    const hasFilter = !!search || categoryId !== "all" || status !== "all";

    function resetFilter() {
        setSearchText("");
        setSearch("");
        setCategoryId("all");
        setStatus("all");
    }

    function refreshAll() {
        menus.reload();
        categories.reload();
    }

    async function confirmArchive() {
        if (!toArchive) return;
        setArchiving(true);
        try {
            const result = await archiveMenu(toArchive.id);
            toast.success(result.message);
            setToArchive(null);
            setForm(null);
            refreshAll();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setArchiving(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Menu"
                description="Daftar lauk, pelengkap, dan minuman yang tampil di layar kasir."
                action={<Button className="h-11 px-5 text-base" onClick={() => setForm({mode: "create"})}><PlusIcon /> Tambah Menu</Button>}
            />

            <div className="mb-4 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-64 flex-1">
                        <MagnifyingGlassIcon size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                        <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Cari nama atau kode menu" className="h-11 pl-10" aria-label="Cari menu" />
                        {searchText && (
                            <button className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" onClick={() => setSearchText("")} aria-label="Hapus pencarian"><XIcon size={18} /></button>
                        )}
                    </div>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="h-11! w-56" aria-label="Filter kategori"><span className="text-muted-foreground">Kategori:</span><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            {categories.data?.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                        <SelectTrigger className="h-11! w-52" aria-label="Filter status"><span className="text-muted-foreground">Status:</span><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="size-11" onClick={refreshAll} aria-label="Muat ulang"><ArrowClockwiseIcon size={20} /></Button>
                </div>
                {hasFilter && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Filter aktif:</span>
                        {search && <Chip label={`Cari: "${search}"`} onRemove={() => setSearchText("")} />}
                        {categoryId !== "all" && <Chip label={`Kategori: ${categoryName ?? "-"}`} onRemove={() => setCategoryId("all")} />}
                        {status !== "all" && <Chip label={`Status: ${statusOptions.find((o) => o.value === status)?.label}`} onRemove={() => setStatus("all")} />}
                        <button className="ml-1 font-semibold underline underline-offset-2" onClick={resetFilter}>Reset filter</button>
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                    <TableHeader className="bg-lembut">
                        <TableRow className="hover:bg-transparent">
                            {["Kode", "Nama menu", "Kategori"].map((head) => <TableHead key={head} className="px-4 text-xs tracking-widest uppercase">{head}</TableHead>)}
                            <TableHead className="text-right text-xs tracking-widest uppercase">Harga</TableHead>
                            <TableHead className="text-center text-xs tracking-widest uppercase">Stok</TableHead>
                            <TableHead className="text-center text-xs tracking-widest uppercase">Status</TableHead>
                            <TableHead className="pr-4 text-right text-xs tracking-widest uppercase">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menus.loading && <SkeletonRows rows={8} cols={7} />}
                        {!menus.loading && !menus.error && rows.map((menu) => (
                            <TableRow key={menu.id} className="h-14">
                                <TableCell className="angka px-4 font-semibold">{menu.code}</TableCell>
                                <TableCell className="text-base font-medium">{menu.name}</TableCell>
                                <TableCell className="text-muted-foreground">{menu.category.name}</TableCell>
                                <TableCell className="angka text-right font-medium">{rupiah(menu.price)}</TableCell>
                                <TableCell className="text-center">
                                    {menu.trackStock
                                        ? <span className={`angka font-semibold ${menu.stockQty === 0 ? "text-cabai" : ""}`}>{menu.stockQty}</span>
                                        : <span className="text-sm text-muted-foreground italic">Tidak dilacak</span>}
                                </TableCell>
                                <TableCell className="text-center"><StockStatusBadge menu={menu} /></TableCell>
                                <TableCell className="pr-4">
                                    <div className="flex items-center justify-end gap-1">
                                        {menu.trackStock && (
                                            <>
                                                <Button variant="outline" size="sm" className="h-8" onClick={() => setStockMenu(menu)}><ArchiveIcon /> Atur Stok</Button>
                                                <Button variant="ghost" size="icon" aria-label={`Riwayat stok ${menu.name}`} onClick={() => setLogMenu(menu)}><ClockCounterClockwiseIcon size={20} /></Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" aria-label={`Ubah ${menu.name}`} onClick={() => setForm({mode: "edit", menu})}><PencilSimpleIcon size={20} /></Button>
                                        <Button variant="ghost" size="icon" aria-label={`Arsipkan ${menu.name}`} className="hover:text-cabai" onClick={() => setToArchive(menu)}><TrashIcon size={20} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {!menus.loading && menus.error && <ErrorState title="Gagal memuat data" message={menus.error} onRetry={menus.reload} />}
                {!menus.loading && !menus.error && rows.length === 0 && (hasFilter ? (
                    <EmptyState
                        icon={MagnifyingGlassIcon}
                        title="Tidak ada menu yang cocok"
                        description={search ? `Tidak ditemukan menu dengan kata kunci "${search}" dan filter yang sedang aktif.` : "Tidak ada menu dengan filter yang sedang aktif."}
                        action={<Button variant="outline" className="h-10" onClick={resetFilter}><ArrowClockwiseIcon /> Hapus Semua Filter</Button>}
                    />
                ) : (
                    <EmptyState icon={ForkKnifeIcon} title="Belum ada menu" description="Tambahkan menu pertama supaya bisa dijual di layar kasir." />
                ))}
                {!menus.loading && !menus.error && rows.length > 0 && (
                    <div className="flex justify-between border-t bg-lembut px-5 py-3 text-sm text-muted-foreground">
                        <span>Menampilkan <b className="text-foreground">{rows.length}</b> dari <b className="text-foreground">{totalMenus || rows.length}</b> menu</span>
                        <span>Harga sebelum pajak 10%.</span>
                    </div>
                )}
            </div>

            {form && (
                <MenuFormSheet
                    mode={form.mode}
                    menu={form.menu}
                    categories={categories.data ?? []}
                    onClose={() => setForm(null)}
                    onSaved={() => {
                        setForm(null);
                        refreshAll();
                    }}
                    onArchive={(menu) => setToArchive(menu)}
                />
            )}
            {stockMenu && (
                <StockDialog
                    menu={stockMenu}
                    onClose={() => setStockMenu(null)}
                    onSaved={() => {
                        setStockMenu(null);
                        menus.reload();
                    }}
                />
            )}
            {logMenu && <StockLogSheet menu={logMenu} onClose={() => setLogMenu(null)} onAdjust={(menu) => { setLogMenu(null); setStockMenu(menu); }} />}

            <ConfirmDialog
                open={!!toArchive}
                onOpenChange={(open) => !open && setToArchive(null)}
                icon={TrashIcon}
                title={`Arsipkan menu ${toArchive?.name ?? ""}?`}
                description="Menu tidak akan tampil lagi di layar kasir. Riwayat transaksi lama tetap tersimpan."
                confirmLabel="Ya, Arsipkan"
                onConfirm={confirmArchive}
                loading={archiving}
            >
                {toArchive && (
                    <div className="flex items-center justify-between rounded-lg bg-lembut px-4 py-3 text-sm">
                        <span><b className="angka">{toArchive.code}</b> · {toArchive.category.name}</span>
                        <StockStatusBadge menu={toArchive} />
                    </div>
                )}
            </ConfirmDialog>
        </div>
    );
}

function Chip({label, onRemove}: {label: string; onRemove: () => void}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1">
            {label}
            <button onClick={onRemove} aria-label={`Hapus filter ${label}`}><XIcon size={14} /></button>
        </span>
    );
}
