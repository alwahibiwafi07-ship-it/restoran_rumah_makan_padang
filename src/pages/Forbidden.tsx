import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ShieldWarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { homePath } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";

export default function Forbidden() {
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as {from?: string} | null)?.from ?? "-";
    const isAdminPage = from.startsWith("/admin");

    return (
        <div className="flex min-h-screen flex-col">
            <header className="flex h-16 items-center border-b bg-card px-6">
                <Logo light={false} subtitle="Rumah Makan Padang" />
            </header>
            <main className="grid flex-1 place-items-center p-4">
                <div className="w-full max-w-xl overflow-hidden rounded-xl border border-t-4 border-t-cabai bg-card p-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="grid size-14 place-items-center rounded-xl bg-cabai/10 text-cabai">
                            <ShieldWarningIcon size={30} />
                        </div>
                        <div>
                            <div className="angka text-xs tracking-widest text-cabai">KODE 403</div>
                            <h1 className="text-3xl font-bold">Akses ditolak</h1>
                        </div>
                    </div>
                    <p className="mt-6">Halaman ini hanya untuk {isAdminPage ? "Admin" : "Kasir"}.</p>

                    {user && (
                        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-lg bg-lembut p-5 text-sm">
                            <dt className="text-muted-foreground">Akun</dt>
                            <dd className="text-right">{user.name}</dd>
                            <dt className="text-muted-foreground">Peran</dt>
                            <dd className="text-right">{user.role === "ADMIN" ? "Admin" : "Kasir"}</dd>
                            <dt className="text-muted-foreground">Halaman diminta</dt>
                            <dd className="angka text-right">{from}</dd>
                        </dl>
                    )}

                    {user ? (
                        <Button className="mt-6 h-12 w-full text-base" onClick={() => navigate(homePath(user.role), {replace: true})}>
                            <ArrowLeftIcon /> {user.role === "ADMIN" ? "Kembali ke Dashboard" : "Kembali ke Layar Kasir"}
                        </Button>
                    ) : (
                        <Button className="mt-6 h-12 w-full text-base" onClick={logout}>Masuk</Button>
                    )}
                </div>
            </main>
        </div>
    );
}
