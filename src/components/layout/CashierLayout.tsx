import { NavLink, Outlet } from "react-router-dom";
import { CashRegisterIcon, ReceiptIcon, SignOutIcon } from "@phosphor-icons/react";
import { LogoMark } from "@/components/shared/Logo";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { initials, longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CashierLayout() {
    const {user, logout} = useAuth();
    const {clear} = useCart();

    //keluar sengaja = keranjang dikosongkan biar kasir berikutnya mulai bersih
    function handleLogout() {
        clear();
        logout();
    }

    const railItem = ({isActive}: {isActive: boolean}) => cn(
        "flex flex-col items-center gap-1 border-l-4 border-transparent py-4 text-xs font-medium text-white/60 hover:text-white",
        isActive && "border-kunyit bg-pinus-2 text-white",
    );

    return (
        <div className="flex h-screen overflow-hidden">
            <aside className="motif flex w-[88px] shrink-0 flex-col text-white">
                <div className="grid place-items-center py-5"><LogoMark className="size-14 text-xl" /></div>
                <NavLink to="/kasir" end className={railItem}>
                    <CashRegisterIcon size={28} /> Kasir
                </NavLink>
                <NavLink to="/kasir/riwayat" className={railItem}>
                    <ReceiptIcon size={28} /> Riwayat
                </NavLink>
                <button onClick={handleLogout} className="mt-auto flex flex-col items-center gap-1 border-t border-white/10 py-5 text-xs font-medium text-white/60 hover:text-white">
                    <SignOutIcon size={26} /> Keluar
                </button>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-8">
                    <div className="flex items-baseline gap-4">
                        <span className="font-heading text-2xl font-bold text-pinus">Awak Punyo</span>
                        <span className="text-sm text-muted-foreground">{longDate()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right leading-tight">
                            <div className="font-semibold">{user?.name}</div>
                            <div className="text-[11px] font-semibold tracking-widest text-kunyit uppercase">Kasir</div>
                        </div>
                        <div className="grid size-10 place-items-center rounded-full bg-pinus text-sm font-semibold text-white">{initials(user?.name ?? "")}</div>
                    </div>
                </header>
                <main className="min-h-0 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
