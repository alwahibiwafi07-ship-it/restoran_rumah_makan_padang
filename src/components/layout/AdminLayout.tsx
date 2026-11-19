import { NavLink, Outlet } from "react-router-dom";
import { CalendarBlankIcon, ForkKnifeIcon, IdentificationCardIcon, ReceiptIcon, SignOutIcon, SquaresFourIcon, TagIcon, type Icon } from "@phosphor-icons/react";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/context/AuthContext";
import { initials, longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type NavItem = {to: string; label: string; icon: Icon; end?: boolean};

const groups: {title: string; items: NavItem[]}[] = [
    {title: "Ringkasan", items: [
        {to: "/admin", label: "Dashboard", icon: SquaresFourIcon, end: true},
        {to: "/admin/transaksi", label: "Transaksi", icon: ReceiptIcon},
    ]},
    {title: "Katalog", items: [
        {to: "/admin/menu", label: "Menu", icon: ForkKnifeIcon},
        {to: "/admin/kategori", label: "Kategori", icon: TagIcon},
    ]},
    {title: "Pengaturan", items: [
        {to: "/admin/kasir", label: "Akun Kasir", icon: IdentificationCardIcon},
    ]},
];

export function AdminLayout() {
    const {user, logout} = useAuth();

    return (
        <div className="flex min-h-screen">
            <aside className="motif sticky top-0 flex h-screen w-[260px] shrink-0 flex-col text-white">
                <div className="border-b border-white/10 px-6 py-5"><Logo /></div>
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                    {groups.map((group) => (
                        <div key={group.title} className="mb-5">
                            <div className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-white/50 uppercase">{group.title}</div>
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({isActive}) => cn(
                                        "flex items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-[15px] text-white/80 transition-colors hover:bg-white/5 hover:text-white",
                                        isActive && "border-kunyit bg-pinus-2 font-semibold text-white",
                                    )}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <button onClick={logout} className="flex items-center gap-3 border-t border-white/10 px-7 py-5 text-[15px] text-white/80 hover:text-white">
                    <SignOutIcon size={20} /> Keluar
                </button>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-8">
                    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
                        <CalendarBlankIcon size={18} /> {longDate()}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right leading-tight">
                            <div className="font-heading font-semibold">{user?.name}</div>
                            <div className="text-[11px] font-semibold tracking-widest text-kunyit uppercase">Admin</div>
                        </div>
                        <div className="grid size-10 place-items-center rounded-full bg-pinus text-sm font-semibold text-white">{initials(user?.name ?? "")}</div>
                    </div>
                </header>
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
