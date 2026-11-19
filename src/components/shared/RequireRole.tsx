import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { SpinnerIcon } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

//penjaga rute: belum login ke /login, salah peran ke /akses-ditolak
export function RequireRole({role, children}: {role: Role; children: ReactNode}) {
    const {user, checking} = useAuth();
    const location = useLocation();

    if (checking) {
        return (
            <div className="grid h-screen place-items-center text-muted-foreground">
                <SpinnerIcon size={28} className="animate-spin" />
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />;
    }
    if (user.role !== role) {
        return <Navigate to="/akses-ditolak" replace state={{from: location.pathname}} />;
    }
    return children;
}
