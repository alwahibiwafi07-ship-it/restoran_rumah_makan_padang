import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { EyeIcon, EyeSlashIcon, KeyIcon, MagnifyingGlassIcon, PlusIcon, SpinnerIcon, UserMinusIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field, FormAlert } from "@/components/shared/Field";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/shared/States";
import { createCashier, getCashiers, resetPassword, updateCashier } from "@/api/users";
import { errorMessage, fieldErrors, statusCode } from "@/api/client";
import { initials, shortDate } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";
import type { UserAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type StatusFilter = "all" | "active" | "inactive";

export default function Cashiers() {
    const {data, loading, error, reload} = useFetch(getCashiers, []);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [form, setForm] = useState<{mode: "create" | "edit"; user?: UserAccount} | null>(null);
    const [resetUser, setResetUser] = useState<UserAccount | null>(null);
    const [toDeactivate, setToDeactivate] = useState<UserAccount | null>(null);
    const [busy, setBusy] = useState(false);

    const keyword = search.trim().toLowerCase();
    const rows = (data ?? []).filter((user) => {
        if (filter === "active" && !user.isActive) return false;
        if (filter === "inactive" && user.isActive) return false;
        return !keyword || user.name.toLowerCase().includes(keyword) || user.email.includes(keyword);
    });

    async function setActive(user: UserAccount, isActive: boolean) {
        setBusy(true);
        try {
            await updateCashier(user.id, {isActive});
            toast.success(isActive ? `Akun ${user.name} diaktifkan kembali` : `Akun ${user.name} dinonaktifkan`);
            setToDeactivate(null);
            reload();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Akun Kasir"
                description="Kelola siapa saja yang boleh memakai layar kasir."
                action={<Button className="h-11 px-5 text-base" onClick={() => setForm({mode: "create"})}><PlusIcon /> Tambah Kasir</Button>}
            />

            <div className="overflow-hidden rounded-xl border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div className="relative w-full max-w-sm">
                        <MagnifyingGlassIcon size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama kasir atau email" className="h-11 pl-10" aria-label="Cari kasir" />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="mr-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Filter:</span>
                        {(["all", "active", "inactive"] as const).map((value) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={cn("rounded-md px-3 py-1.5", filter === value ? "bg-lembut font-semibold text-pinus" : "text-muted-foreground hover:text-foreground")}
                            >
                                {{all: "Semua", active: "Aktif", inactive: "Nonaktif"}[value]}
                            </button>
                        ))}
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-lembut">
                        <TableRow className="hover:bg-transparent">
                            {["Nama", "Email", "Status", "Terdaftar"].map((head) => <TableHead key={head} className="px-4 text-xs tracking-widest uppercase">{head}</TableHead>)}
                            <TableHead className="pr-4 text-right text-xs tracking-widest uppercase">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <SkeletonRows rows={4} cols={5} />}
                        {!loading && !error && rows.map((user) => (
                            <TableRow key={user.id} className={cn("h-16", !user.isActive && "bg-muted/40")}>
                                <TableCell className="px-4">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("grid size-10 place-items-center rounded-full text-sm font-semibold", user.isActive ? "bg-pinus text-white" : "bg-muted text-muted-foreground")}>{initials(user.name)}</span>
                                        <span className={cn("text-base", !user.isActive && "text-muted-foreground")}>{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="angka text-sm">{user.email}</TableCell>
                                <TableCell>
                                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", user.isActive ? "bg-daun/10 text-daun" : "bg-muted text-muted-foreground")}>
                                        {user.isActive ? "Aktif" : "Nonaktif"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{shortDate(user.createdAt)}</TableCell>
                                <TableCell className="pr-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => setForm({mode: "edit", user})}>Ubah</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setResetUser(user)}><KeyIcon /> Reset Sandi</Button>
                                        {user.isActive ? (
                                            <Button variant="ghost" size="sm" className="text-cabai hover:bg-cabai/10 hover:text-cabai" onClick={() => setToDeactivate(user)}>Nonaktifkan</Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" className="text-daun hover:bg-daun/10 hover:text-daun" disabled={busy} onClick={() => setActive(user, true)}>Aktifkan</Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {!loading && error && <ErrorState message={error} onRetry={reload} />}
                {!loading && !error && rows.length === 0 && (
                    <EmptyState
                        icon={UsersThreeIcon}
                        title={data?.length ? "Tidak ada akun yang cocok" : "Belum ada akun kasir"}
                        description={data?.length ? "Coba kata kunci atau filter lain." : "Tambahkan akun supaya kasir bisa masuk ke layar kasir."}
                    />
                )}
                {!loading && !error && rows.length > 0 && (
                    <div className="border-t bg-lembut px-5 py-3 text-sm text-muted-foreground">
                        Menampilkan <b className="text-foreground">{rows.length}</b> dari <b className="text-foreground">{data?.length}</b> akun kasir
                    </div>
                )}
            </div>

            {form && (
                <CashierFormDialog
                    mode={form.mode}
                    user={form.user}
                    onClose={() => setForm(null)}
                    onSaved={() => {
                        setForm(null);
                        reload();
                    }}
                />
            )}
            {resetUser && <ResetPasswordDialog user={resetUser} onClose={() => setResetUser(null)} />}

            <ConfirmDialog
                open={!!toDeactivate}
                onOpenChange={(open) => !open && setToDeactivate(null)}
                icon={UserMinusIcon}
                tone="warning"
                title={`Nonaktifkan akun ${toDeactivate?.name ?? ""}?`}
                description={`${toDeactivate?.name.split(" ")[0] ?? ""} tidak bisa masuk lagi. Riwayat transaksinya tetap tersimpan dan akun bisa diaktifkan kembali.`}
                confirmLabel="Nonaktifkan"
                onConfirm={() => toDeactivate && setActive(toDeactivate, false)}
                loading={busy}
            >
                {toDeactivate && (
                    <div className="flex items-center gap-3 rounded-lg bg-lembut p-3 text-left">
                        <span className="grid size-10 place-items-center rounded-full bg-pinus text-sm font-semibold text-white">{initials(toDeactivate.name)}</span>
                        <div className="leading-tight">
                            <div className="font-semibold">{toDeactivate.name}</div>
                            <div className="text-sm text-muted-foreground">{toDeactivate.email}</div>
                        </div>
                    </div>
                )}
            </ConfirmDialog>
        </div>
    );
}

function PasswordInput({id, value, onChange, invalid, placeholder}: {id: string; value: string; onChange: (value: string) => void; invalid?: boolean; placeholder: string}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input id={id} type={show ? "text" : "password"} autoComplete="new-password" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} className="h-11 pr-11" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                {show ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
            </button>
        </div>
    );
}

function CashierFormDialog({mode, user, onClose, onSaved}: {mode: "create" | "edit"; user?: UserAccount; onClose: () => void; onSaved: () => void}) {
    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setAlert("");
        //aturan sama dengan createUserSchema di server/routes/users.ts
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Nama wajib diisi";
        if (!EMAIL_PATTERN.test(email.trim())) next.email = "Format email tidak valid";
        if (mode === "create" && password.length < 8) next.password = "Kata sandi minimal 8 karakter";
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        try {
            if (mode === "create") {
                await createCashier({name: name.trim(), email: email.trim(), password});
                toast.success(`Akun ${name.trim()} dibuat`);
            } else if (user) {
                await updateCashier(user.id, {name: name.trim(), email: email.trim()});
                toast.success("Perubahan akun disimpan");
            }
            onSaved();
        } catch (err) {
            //email dobel dibalas 409
            if (statusCode(err) === 409) setErrors({email: errorMessage(err)});
            else setErrors(fieldErrors(err));
            setAlert(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0">
                <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader className="border-b p-6">
                        <DialogTitle className="text-2xl">{mode === "create" ? "Tambah Kasir" : "Ubah Kasir"}</DialogTitle>
                        <DialogDescription>{mode === "create" ? "Akun baru otomatis berperan sebagai kasir." : user?.email}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 p-6">
                        <FormAlert message={alert} />
                        <Field id="cashier-name" label="Nama lengkap" required error={errors.name}>
                            <Input id="cashier-name" value={name} maxLength={60} placeholder="Contoh: Siti Rahmah" onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} className="h-11" />
                        </Field>
                        <Field id="cashier-email" label="Email" required error={errors.email}>
                            <Input id="cashier-email" type="email" value={email} placeholder="nama@awakpunyo.com" onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} className="h-11" />
                        </Field>
                        {mode === "create" && (
                            <Field id="cashier-password" label="Kata sandi awal" required error={errors.password} hint="Minimal 8 karakter.">
                                <PasswordInput id="cashier-password" value={password} onChange={setPassword} invalid={!!errors.password} placeholder="Masukkan kata sandi awal" />
                            </Field>
                        )}
                    </div>
                    <DialogFooter className="border-t bg-lembut p-5">
                        <Button type="button" variant="outline" className="h-11 px-5" onClick={onClose}>Batal</Button>
                        <Button type="submit" className="h-11 px-5" disabled={saving}>{saving && <SpinnerIcon className="animate-spin" />} Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ResetPasswordDialog({user, onClose}: {user: UserAccount; onClose: () => void}) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (password.length < 8) {
            setError("Kata sandi minimal 8 karakter");
            return;
        }
        setSaving(true);
        try {
            const result = await resetPassword(user.id, password);
            toast.success(result.message);
            onClose();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0">
                <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader className="border-b p-6">
                        <DialogTitle className="text-2xl">Reset Kata Sandi</DialogTitle>
                        <DialogDescription>Buat kata sandi baru untuk {user.name}, lalu sampaikan ke kasirnya.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Field id="reset-password" label="Kata sandi baru" required error={error} hint="Minimal 8 karakter.">
                            <PasswordInput id="reset-password" value={password} onChange={setPassword} invalid={!!error} placeholder="Kata sandi baru" />
                        </Field>
                    </div>
                    <DialogFooter className="border-t bg-lembut p-5">
                        <Button type="button" variant="outline" className="h-11 px-5" onClick={onClose}>Batal</Button>
                        <Button type="submit" className="h-11 px-5" disabled={saving}>{saving && <SpinnerIcon className="animate-spin" />} Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
