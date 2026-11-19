import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/States";
import { StockPill } from "@/components/shared/StockBadge";
import { useCart } from "@/context/CartContext";
import { getCategories } from "@/api/categories";
import { getMenus } from "@/api/menus";
import { getNextTicket } from "@/api/transactions";
import { num } from "@/lib/format";
import { stockStatus } from "@/lib/stock";
import { useFetch } from "@/lib/useFetch";
import type { Menu, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OrderPanel } from "./OrderPanel";
import { PaymentDialog } from "./PaymentDialog";
import { SuccessView } from "./SuccessView";

export default function Pos() {
    const menus = useFetch(() => getMenus(), []);
    const categories = useFetch(getCategories, []);
    const nextTicket = useFetch(getNextTicket, []);
    const cart = useCart();
    const {syncStock} = cart;

    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState<Transaction | null>(null);

    //tiap menu dimuat ulang, stok & harga di keranjang ikut disamakan
    useEffect(() => {
        if (menus.data) syncStock(menus.data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menus.data]);

    const keyword = search.trim().toLowerCase();
    const visible = (menus.data ?? []).filter((menu) => {
        if (categoryId !== "all" && menu.categoryId !== categoryId) return false;
        return !keyword || menu.name.toLowerCase().includes(keyword) || menu.code.toLowerCase().includes(keyword);
    });
    const qtyInCart = (menuId: string) => cart.items.find((item) => item.menuId === menuId)?.qty ?? 0;

    function handlePaid(trx: Transaction) {
        setPaying(false);
        setPaid(trx);
        cart.clear();
        menus.reload();
        nextTicket.reload();
    }

    if (paid) {
        return <SuccessView trx={paid} onNewOrder={() => setPaid(null)} />;
    }

    return (
        <div className="grid h-full grid-cols-[1fr_minmax(380px,420px)]">
            <section className="flex min-h-0 flex-col bg-background">
                <div className="space-y-4 px-8 pt-6 pb-4">
                    <div className="relative">
                        <MagnifyingGlassIcon size={22} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari menu (contoh: Rendang, Ayam Pop)"
                            className="h-12 bg-card pl-12 text-base"
                            aria-label="Cari menu"
                        />
                        {search && (
                            <button className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground" onClick={() => setSearch("")} aria-label="Hapus pencarian"><XIcon size={20} /></button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kategori menu">
                        <CategoryTab active={categoryId === "all"} onClick={() => setCategoryId("all")}>Semua</CategoryTab>
                        {categories.data?.map((category) => (
                            <CategoryTab key={category.id} active={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}</CategoryTab>
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
                    {menus.loading && !menus.data && (
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({length: 12}).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl border bg-card" />)}
                        </div>
                    )}
                    {menus.error && !menus.data && <ErrorState title="Menu gagal dimuat" message="Periksa koneksi ke server, lalu coba lagi." onRetry={menus.reload} className="max-w-none" />}
                    {menus.data && visible.length === 0 && (
                        <div className="rounded-xl border border-dashed bg-card/60 p-10 text-center text-muted-foreground">
                            <MagnifyingGlassIcon size={32} className="mx-auto mb-3" />
                            {keyword ? <>Tidak ada menu dengan kata kunci <b className="text-foreground">"{search}"</b>.</> : "Belum ada menu di kategori ini."}
                        </div>
                    )}
                    {menus.data && visible.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                            {visible.map((menu) => <MenuCard key={menu.id} menu={menu} qty={qtyInCart(menu.id)} onAdd={() => cart.add(menu)} />)}
                        </div>
                    )}
                </div>
            </section>

            <OrderPanel nextTicket={nextTicket.data?.ticket} onPay={() => setPaying(true)} />

            {paying && (
                <PaymentDialog
                    ticket={nextTicket.data?.ticket}
                    onClose={() => setPaying(false)}
                    onPaid={handlePaid}
                    onStockChanged={menus.reload}
                />
            )}
        </div>
    );
}

function CategoryTab({active, onClick, children}: {active: boolean; onClick: () => void; children: React.ReactNode}) {
    return (
        <button
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn("h-10 rounded-full px-5 text-[15px] font-medium transition-colors", active ? "bg-pinus text-white" : "bg-lembut text-foreground hover:bg-secondary/80")}
        >
            {children}
        </button>
    );
}

function MenuCard({menu, qty, onAdd}: {menu: Menu; qty: number; onAdd: () => void}) {
    const soldOut = stockStatus(menu) === "HABIS";

    return (
        <button
            onClick={onAdd}
            disabled={soldOut}
            aria-label={`Tambah ${menu.name}`}
            className={cn(
                "relative flex h-36 flex-col rounded-xl border-2 border-transparent bg-card p-4 text-left shadow-[0_1px_0_var(--border)] transition hover:border-pinus/30 disabled:cursor-not-allowed",
                qty > 0 && "border-daun hover:border-daun",
                soldOut && "opacity-55",
            )}
        >
            {qty > 0 && (
                <span className="angka absolute -top-2.5 -right-2.5 grid size-7 place-items-center rounded-full bg-pinus text-sm font-semibold text-white">{qty}</span>
            )}
            <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-[17px] leading-snug font-semibold">{menu.name}</span>
                <span className="shrink-0 pt-0.5"><StockPill menu={menu} /></span>
            </div>
            <span className="mt-0.5 text-xs text-muted-foreground">{menu.category.name}</span>
            <div className="mt-auto flex items-end justify-between">
                <span className="angka text-xl font-semibold">{num(menu.price)}</span>
                <span className={cn("grid size-9 place-items-center rounded-md text-xl", soldOut ? "bg-muted text-muted-foreground" : "bg-pinus text-white")}>+</span>
            </div>
        </button>
    );
}
