import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { calculateTotal } from "@/lib/money";
import type { Channel, Menu } from "@/lib/types";

export type CartItem = {
    menuId: string;
    name: string;
    price: number;
    qty: number;
    trackStock: boolean;
    stockQty: number | null;
};

type CartValue = {
    items: CartItem[];
    channel: Channel;
    setChannel: (channel: Channel) => void;
    add: (menu: Menu) => void;
    setQty: (menuId: string, qty: number) => void;
    remove: (menuId: string) => void;
    clear: () => void;
    syncStock: (menus: Menu[]) => void;
    totals: ReturnType<typeof calculateTotal>;
    portions: number;
};

const CART_KEY = "awak_cart";
const CartContext = createContext<CartValue | null>(null);

//baca keranjang dari localStorage, biar gak hilang pas sesi habis / halaman di-refresh
function loadCart(): {items: CartItem[]; channel: Channel} {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) ?? "");
        return {items: saved.items ?? [], channel: saved.channel ?? "DINE_IN"};
    } catch {
        return {items: [], channel: "DINE_IN"};
    }
}

export function CartProvider({children}: {children: ReactNode}) {
    const [items, setItems] = useState<CartItem[]>(() => loadCart().items);
    const [channel, setChannel] = useState<Channel>(() => loadCart().channel);

    useEffect(() => {
        localStorage.setItem(CART_KEY, JSON.stringify({items, channel}));
    }, [items, channel]);

    //qty gak boleh lebih dari stok, kalau lebih kasih toast
    function limitQty(item: {name: string; trackStock: boolean; stockQty: number | null}, qty: number) {
        if (item.trackStock && qty > (item.stockQty ?? 0)) {
            toast.error(`Stok ${item.name} tinggal ${item.stockQty ?? 0}`);
            return item.stockQty ?? 0;
        }
        return qty;
    }

    function add(menu: Menu) {
        const current = items.find((item) => item.menuId === menu.id);
        const wanted = (current?.qty ?? 0) + 1;
        const qty = limitQty(menu, wanted);
        if (qty < wanted && qty === (current?.qty ?? 0)) return;

        if (current) {
            setItems(items.map((item) => item.menuId === menu.id ? {...item, qty} : item));
        } else {
            setItems([...items, {menuId: menu.id, name: menu.name, price: menu.price, qty, trackStock: menu.trackStock, stockQty: menu.stockQty}]);
        }
    }

    function setQty(menuId: string, qty: number) {
        const current = items.find((item) => item.menuId === menuId);
        if (!current) return;
        if (qty <= 0) {
            remove(menuId);
            return;
        }
        const limited = limitQty(current, qty);
        setItems(items.map((item) => item.menuId === menuId ? {...item, qty: limited} : item));
    }

    function remove(menuId: string) {
        setItems(items.filter((item) => item.menuId !== menuId));
    }

    function clear() {
        setItems([]);
        setChannel("DINE_IN");
    }

    //setelah menu dimuat ulang, samakan harga dan stok di keranjang dengan data terbaru
    function syncStock(menus: Menu[]) {
        setItems((prev) => prev.flatMap((item) => {
            const menu = menus.find((m) => m.id === item.menuId);
            if (!menu) return [];
            return [{...item, name: menu.name, price: menu.price, trackStock: menu.trackStock, stockQty: menu.stockQty}];
        }));
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totals = useMemo(() => calculateTotal(subtotal, channel), [subtotal, channel]);
    const portions = items.reduce((sum, item) => sum + item.qty, 0);

    return (
        <CartContext.Provider value={{items, channel, setChannel, add, setQty, remove, clear, syncStock, totals, portions}}>
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const value = useContext(CartContext);
    if (!value) throw new Error("useCart harus dipakai di dalam CartProvider");
    return value;
}
