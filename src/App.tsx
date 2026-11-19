import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CashierLayout } from "@/components/layout/CashierLayout";
import { RequireRole } from "@/components/shared/RequireRole";
import { homePath } from "@/lib/routes";
import { SessionExpiredDialog } from "@/components/shared/SessionExpiredDialog";
import Login from "@/pages/Login";
import Forbidden from "@/pages/Forbidden";
import Dashboard from "@/pages/admin/Dashboard";
import Menus from "@/pages/admin/Menus";
import Categories from "@/pages/admin/Categories";
import Transactions from "@/pages/admin/Transactions";
import Cashiers from "@/pages/admin/Cashiers";
import Pos from "@/pages/kasir/Pos";
import History from "@/pages/kasir/History";

//halaman awal: arahkan sesuai peran
function Home() {
    const {user, checking} = useAuth();
    if (checking) return null;
    return <Navigate to={user ? homePath(user.role) : "/login"} replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/akses-ditolak" element={<Forbidden />} />

                    <Route path="/admin" element={<RequireRole role="ADMIN"><AdminLayout /></RequireRole>}>
                        <Route index element={<Dashboard />} />
                        <Route path="menu" element={<Menus />} />
                        <Route path="kategori" element={<Categories />} />
                        <Route path="transaksi" element={<Transactions />} />
                        <Route path="kasir" element={<Cashiers />} />
                    </Route>

                    <Route path="/kasir" element={<RequireRole role="CASHIER"><CartProvider><CashierLayout /></CartProvider></RequireRole>}>
                        <Route index element={<Pos />} />
                        <Route path="riwayat" element={<History />} />
                    </Route>

                    <Route path="*" element={<Home />} />
                </Routes>
                <SessionExpiredDialog />
                <Toaster position="top-center" richColors />
            </AuthProvider>
        </BrowserRouter>
    );
}
