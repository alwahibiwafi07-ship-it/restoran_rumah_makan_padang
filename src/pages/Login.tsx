import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, LockSimpleIcon, WarningCircleIcon, SpinnerIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { homePath } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";
import { errorMessage, fieldErrors, statusCode } from "@/api/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
    const {user, login, checking} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as {from?: string} | null)?.from;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState("");
    const [loading, setLoading] = useState(false);

    if (!checking && user) {
        return <Navigate to={homePath(user.role)} replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setAlert("");

        //cek dulu di browser biar gak perlu nunggu server
        const nextErrors: Record<string, string> = {};
        if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = "Format email tidak valid";
        if (!password) nextErrors.password = "Kata sandi wajib diisi";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setLoading(true);
        try {
            const loggedIn = await login(email.trim(), password);
            const home = homePath(loggedIn.role);
            //balik ke halaman terakhir kalau perannya cocok
            navigate(from && from.startsWith(home) ? from : home, {replace: true});
        } catch (err) {
            const code = statusCode(err);
            if (code === 401) setAlert("Email atau kata sandi salah.");
            else setAlert(errorMessage(err));
            setErrors(fieldErrors(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center p-4">
            <div className="grid w-full max-w-[1100px] overflow-hidden rounded-xl border bg-card shadow-sm md:grid-cols-[1fr_1.1fr]">
                <div className="motif hidden flex-col p-12 text-white md:flex">
                    <Logo />
                    <h1 className="mt-10 text-4xl font-bold">Awak Punyo</h1>
                    <p className="mt-3 text-lg text-white/80">Kasir rumah makan Padang.</p>
                    <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-8 text-sm text-white/70">
                        <LockSimpleIcon size={18} className="text-kunyit" />
                        Khusus akun pemilik &amp; kasir
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col p-8 md:p-14">
                    <div className="mb-6 md:hidden"><Logo light={false} /></div>
                    <h2 className="text-3xl font-bold">Masuk</h2>
                    <p className="mt-2 text-muted-foreground">Gunakan akun yang diberikan pemilik.</p>

                    {alert && (
                        <div role="alert" className="mt-6 flex items-center gap-3 rounded-lg border border-cabai/30 bg-cabai/5 px-4 py-3 text-sm font-medium text-cabai">
                            <WarningCircleIcon size={20} />
                            {alert}
                        </div>
                    )}

                    <div className="mt-8 grid gap-2">
                        <Label htmlFor="email" className="text-xs font-semibold tracking-widest uppercase">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="username"
                            placeholder="nama@awakpunyo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={!!errors.email}
                            className="h-12 text-base"
                        />
                        {errors.email && <FieldError message={errors.email} />}
                    </div>

                    <div className="mt-5 grid gap-2">
                        <Label htmlFor="password" className="text-xs font-semibold tracking-widest uppercase">Kata sandi</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Masukkan kata sandi"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={!!errors.password}
                                className="h-12 pr-12 text-base"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                            >
                                {showPassword ? <EyeSlashIcon size={22} /> : <EyeIcon size={22} />}
                            </button>
                        </div>
                        {errors.password && <FieldError message={errors.password} />}
                    </div>

                    <Button type="submit" disabled={loading} className="mt-8 h-12 text-base">
                        {loading && <SpinnerIcon className="animate-spin" />}
                        {loading ? "Memeriksa..." : "Masuk"}
                    </Button>

                    <p className="mt-auto border-t pt-6 text-center text-sm text-muted-foreground max-md:mt-10">Awak Punyo POS · 1 outlet</p>
                </form>
            </div>
        </div>
    );
}

export function FieldError({message}: {message: string}) {
    return (
        <p className="flex items-center gap-1.5 text-sm text-cabai">
            <WarningCircleIcon size={16} /> {message}
        </p>
    );
}
