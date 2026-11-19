import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { InfoIcon, PencilSimpleIcon, PlusIcon, SpinnerIcon, TagIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field, FormAlert } from "@/components/shared/Field";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/shared/States";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/api/categories";
import { getMenus } from "@/api/menus";
import { errorMessage, fieldErrors, statusCode } from "@/api/client";
import { useFetch } from "@/lib/useFetch";
import type { Category } from "@/lib/types";

export default function Categories() {
    const {data, loading, error, reload} = useFetch(getCategories, []);
    const [form, setForm] = useState<{mode: "create" | "edit"; category?: Category} | null>(null);
    const [toDelete, setToDelete] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [blocked, setBlocked] = useState<{category: Category; menus: string[]} | null>(null);

    //kategori yang masih punya menu aktif tidak boleh dihapus, tampilkan menunya
    async function askDelete(category: Category) {
        const count = category._count?.menus ?? 0;
        if (count === 0) {
            setToDelete(category);
            return;
        }
        try {
            const menus = await getMenus({categoryId: category.id});
            setBlocked({category, menus: menus.map((menu) => menu.name)});
        } catch {
            setBlocked({category, menus: []});
        }
    }

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await deleteCategory(toDelete.id);
            toast.success(`Kategori ${toDelete.name} dihapus`);
            setToDelete(null);
            reload();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Kategori"
                description="Pengelompokan menu di layar kasir. Urutan pertama menjadi tab awal kasir."
                action={<Button className="h-11 px-5 text-base" onClick={() => setForm({mode: "create"})}><PlusIcon /> Tambah Kategori</Button>}
            />

            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                    <TableHeader className="bg-lembut">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-24 px-5 text-xs tracking-widest uppercase">Urutan</TableHead>
                            <TableHead className="text-xs tracking-widest uppercase">Nama kategori</TableHead>
                            <TableHead className="text-xs tracking-widest uppercase">Kode</TableHead>
                            <TableHead className="text-right text-xs tracking-widest uppercase">Jumlah menu</TableHead>
                            <TableHead className="w-32 text-center text-xs tracking-widest uppercase">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <SkeletonRows rows={5} cols={5} />}
                        {!loading && data?.map((category, index) => (
                            <TableRow key={category.id} className="h-16">
                                <TableCell className="angka px-5 font-semibold">{category.sortOrder}</TableCell>
                                <TableCell className="text-base">
                                    {category.name}
                                    {index === 0 && <span className="ml-3 rounded-full bg-daun/10 px-2.5 py-0.5 text-xs font-semibold text-daun">● Tab awal kasir</span>}
                                </TableCell>
                                <TableCell><span className="angka rounded bg-lembut px-2 py-1 text-xs font-semibold">{category.code}</span></TableCell>
                                <TableCell className="text-right"><span className="angka font-semibold">{category._count?.menus ?? 0}</span> menu</TableCell>
                                <TableCell>
                                    <div className="flex justify-center gap-1">
                                        <Button variant="ghost" size="icon" aria-label={`Ubah ${category.name}`} onClick={() => setForm({mode: "edit", category})}><PencilSimpleIcon size={20} /></Button>
                                        <Button variant="ghost" size="icon" aria-label={`Hapus ${category.name}`} className="hover:text-cabai" onClick={() => askDelete(category)}><TrashIcon size={20} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!loading && error && <ErrorState message={error} onRetry={reload} />}
                {!loading && !error && data?.length === 0 && (
                    <EmptyState icon={TagIcon} title="Belum ada kategori" description="Buat kategori dulu sebelum menambah menu." />
                )}
                {!loading && !error && !!data?.length && (
                    <div className="flex justify-end border-t bg-lembut px-5 py-3 text-sm">
                        <span className="angka">Total: <b>{data.length}</b> kategori</span>
                    </div>
                )}
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <InfoIcon size={18} /> Kode dipakai untuk membuat kode menu otomatis, contoh <code className="angka rounded bg-lembut px-1.5 py-0.5 text-foreground">LK-001</code>.
            </p>

            {form && (
                <CategoryFormDialog
                    mode={form.mode}
                    category={form.category}
                    onClose={() => setForm(null)}
                    onSaved={() => {
                        setForm(null);
                        reload();
                    }}
                />
            )}

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                icon={TrashIcon}
                title={`Hapus kategori ${toDelete?.name ?? ""}?`}
                description="Kategori ini tidak punya menu, jadi aman untuk dihapus."
                confirmLabel="Ya, Hapus"
                onConfirm={confirmDelete}
                loading={deleting}
            />

            <Dialog open={!!blocked} onOpenChange={(open) => !open && setBlocked(null)}>
                <DialogContent showCloseButton={false} className="max-w-md p-7 text-center">
                    <div className="mx-auto grid size-16 place-items-center rounded-xl bg-kunyit/15 text-[#8a6210]"><WarningIcon size={30} /></div>
                    <DialogTitle className="text-2xl">Kategori tidak bisa dihapus</DialogTitle>
                    <DialogDescription className="text-base">
                        <b className="text-foreground">{blocked?.category.name}</b> masih dipakai {blocked?.category._count?.menus} menu. Pindahkan atau arsipkan menunya terlebih dahulu.
                    </DialogDescription>
                    {!!blocked?.menus.length && (
                        <div className="rounded-lg bg-lembut p-4 text-left">
                            <div className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Menu terhubung</div>
                            <div className="flex flex-wrap gap-2">
                                {blocked.menus.map((name) => <span key={name} className="rounded bg-card px-2 py-1 text-sm">● {name}</span>)}
                            </div>
                        </div>
                    )}
                    <Button className="mt-2 h-11 text-base" onClick={() => setBlocked(null)}>Mengerti</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CategoryFormDialog({mode, category, onClose, onSaved}: {mode: "create" | "edit"; category?: Category; onClose: () => void; onSaved: () => void}) {
    const [name, setName] = useState(category?.name ?? "");
    const [code, setCode] = useState(category?.code ?? "");
    const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : "");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState("");
    const [saving, setSaving] = useState(false);

    //aturan sama dengan schema zod di server/routes/categories.ts
    function validate() {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Nama kategori wajib diisi";
        else if (name.trim().length > 50) next.name = "Nama maksimal 50 karakter";
        if (mode === "create" && !/^[A-Z]{2,4}$/.test(code)) next.code = "Kode harus 2–4 huruf, contoh: LK";
        if (sortOrder !== "" && (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0)) next.sortOrder = "Urutan minimal 0";
        return next;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setAlert("");
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length) {
            setAlert(`Ada ${Object.keys(next).length} isian yang perlu diperbaiki.`);
            return;
        }

        setSaving(true);
        try {
            const order = sortOrder === "" ? undefined : Number(sortOrder);
            if (mode === "create") {
                await createCategory({code, name: name.trim(), sortOrder: order});
                toast.success(`Kategori ${name.trim()} ditambahkan`);
            } else if (category) {
                await updateCategory(category.id, {name: name.trim(), sortOrder: order});
                toast.success("Perubahan kategori disimpan");
            }
            onSaved();
        } catch (err) {
            //kode dobel dari server dibalas 409
            if (statusCode(err) === 409) setErrors({code: errorMessage(err)});
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
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-2xl">{mode === "create" ? "Tambah Kategori" : "Ubah Kategori"}</DialogTitle>
                        <DialogDescription>Kelompok menu untuk tab di layar kasir.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 p-6">
                        <FormAlert message={alert} />
                        <Field id="cat-name" label="Nama kategori" required error={errors.name} aside={<span className="angka text-xs text-muted-foreground">{name.length}/50</span>}>
                            <Input id="cat-name" value={name} maxLength={50} placeholder="Contoh: Camilan" onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} className="h-11" />
                        </Field>
                        <Field id="cat-code" label="Kode kategori" required={mode === "create"} error={errors.code} hint={mode === "create" ? "2 sampai 4 huruf kapital, tidak boleh sama dengan kategori lain. Tidak bisa diubah setelah disimpan." : "Kode tidak bisa diubah karena dipakai di kode menu."}>
                            <Input
                                id="cat-code"
                                value={code}
                                maxLength={4}
                                placeholder="Contoh: CM"
                                disabled={mode === "edit"}
                                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                                aria-invalid={!!errors.code}
                                className="angka h-11 tracking-widest"
                            />
                        </Field>
                        <Field id="cat-order" label="Urutan" error={errors.sortOrder} hint={mode === "create" ? "Kosongkan untuk ditaruh paling akhir." : "Angka kecil tampil lebih dulu di layar kasir."}>
                            <Input id="cat-order" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-invalid={!!errors.sortOrder} className="angka h-11 w-32" />
                        </Field>
                    </div>
                    <DialogFooter className="border-t bg-lembut p-5">
                        <Button type="button" variant="outline" className="h-11 px-5" onClick={onClose}>Batal</Button>
                        <Button type="submit" className="h-11 px-5" disabled={saving}>
                            {saving && <SpinnerIcon className="animate-spin" />} Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
