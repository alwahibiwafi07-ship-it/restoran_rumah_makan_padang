import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TOKEN_KEY } from "@/api/client";
import * as authApi from "@/api/auth";
import type { User } from "@/lib/types";

type AuthValue = {
    user: User | null;
    checking: boolean;
    sessionExpired: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    relogin: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null);
    //kalau ada token tersimpan, cek dulu ke server sebelum halaman tampil
    const [checking, setChecking] = useState(() => !!localStorage.getItem(TOKEN_KEY));
    const [sessionExpired, setSessionExpired] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    //pas aplikasi dibuka, cek token lama masih berlaku atau tidak
    useEffect(() => {
        if (!localStorage.getItem(TOKEN_KEY)) return;
        authApi.getMe()
            .then(setUser)
            .catch(() => localStorage.removeItem(TOKEN_KEY))
            .finally(() => setChecking(false));
    }, []);

    //event dari interceptor axios di api/client.ts
    useEffect(() => {
        function onExpired() {
            //kalau memang belum login gak perlu munculin modal
            if (localStorage.getItem(TOKEN_KEY)) setSessionExpired(true);
        }
        function onForbidden() {
            navigate("/akses-ditolak", {state: {from: window.location.pathname}});
        }
        window.addEventListener("auth:expired", onExpired);
        window.addEventListener("auth:forbidden", onForbidden);
        return () => {
            window.removeEventListener("auth:expired", onExpired);
            window.removeEventListener("auth:forbidden", onForbidden);
        };
    }, [navigate]);

    const login = useCallback(async (email: string, password: string) => {
        const result = await authApi.login(email, password);
        localStorage.setItem(TOKEN_KEY, result.token);
        setUser(result.user);
        setSessionExpired(false);
        return result.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setSessionExpired(false);
        navigate("/login", {replace: true});
    }, [navigate]);

    //dari modal "Sesi berakhir", keranjang kasir tetap disimpan di localStorage
    const relogin = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setSessionExpired(false);
        navigate("/login", {replace: true, state: {from: location.pathname}});
    }, [navigate, location.pathname]);

    return (
        <AuthContext.Provider value={{user, checking, sessionExpired, login, logout, relogin}}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error("useAuth harus dipakai di dalam AuthProvider");
    return value;
}
