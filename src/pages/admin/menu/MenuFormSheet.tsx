import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircleIcon, LockSimpleIcon, SpinnerIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Field, FormAlert } from "@/components/shared/Field";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { createMenu, updateMenu } from "@/api/menus";
import { errorMessage, fieldErrors } from "@/api/client";
import type { Category, Menu } from "@/lib/types";

type Props = {
    mode: "create" | "edit";
    menu?: Menu;
    categories: Category[];
    onClose: () => void;
    onSaved: () => void;
    onArchive: (menu: Menu) => void;
};

export function MenuFormSheet({mode, menu, categories, onClose, onSaved, onArchive}: Props) {
    const [name, setName] = useState(menu?.name ?? "");
    const [categoryId, setCategoryId] = useState(menu?.categoryId ?? "");
    const [price, setPrice] = useState<number | null>(menu?.price ?? null);
    const [trackStock, setTrackStock] = useState(menu?.trackStock ?? true);
    const [stockQty, setStockQty] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState("");
    const [saving, setSaving] = useState(false);

    //aturan sama dengan createMenuSchema di server/routes/menus.ts
    function validate() {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Nama menu wajib diisi";
        else if (name.trim().length > 80) next.name = "Nama menu maksimal 80 karakter";
        if (!categoryId) next.categoryId = "Pilih kategori";
        if (!price) next.price = "Harga minimal Rp 1";
        else if (price > 10_000_000) next.price = "Harga terlalu besar";
        if (mode === "create" && trackStock && stockQty !== "" && (!Number.isInteger(Number(stockQty)) || Number(stockQty) < 0)) {
            next.stockQty = "Stok tidak boleh minus";
        }
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
            if (mode === "create") {
                const created = await createMenu({
                    name: name.trim(),
                    price: price!,
                    categoryId,
                    trackStock,
                    stockQty: trackStock && stockQty !== "" ? Number(stockQty) : undefined,
                });
                toast.success(`${created.name} ditambahkan dengan kode ${created.code}`);
            } else if (menu) {
                await updateMenu(menu.id, {name: name.trim(), price: price!, categoryId});
                toast.success("Perubahan menu disimpan");
            }
            onSaved();
        } catch (err) {
            setErrors(fieldErrors(err));
            setAlert(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full gap-0 sm:max-w-[460px]">
                <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
                    <div className="border-b p-6 pr-14">
                        <SheetTitle className="font-heading text-2xl font-bold">{mode === "create" ? "Tambah Menu" : "Ubah Menu"}</SheetTitle>
                        <SheetDescription>{mode === "create" ? "Tambahkan hidangan baru ke katalog kasir." : menu?.name}</SheetDescription>
                    </div>

                    <div className="grid flex-1 content-start gap-5 overflow-y-auto p-6">
                        <FormAlert message={alert} />
                        <Field id="menu-name" label="Nama menu" required error={errors.name}>
                            <Input id="menu-name" value={name} maxLength={80} placeholder="Contoh: Gulai Cincang" onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} className="h-11" />
                        </Field>

                        <Field id="menu-category" label="Kategori" required error={errors.categoryId} hint={mode === "edit" ? "Kode menu tidak ikut berubah walaupun kategori diganti." : undefined}>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger id="menu-category" className="h-11! w-full" aria-invalid={!!errors.categoryId}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field id="menu-price" label="Harga jual" required error={errors.price} hint="Harga sebelum pajak 10%.">
                            <MoneyInput id="menu-price" value={price} onChange={setPrice} invalid={!!errors.price} />
                        </Field>

                        {mode === "create" ? (
                            <>
                                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                                    <div>
                                        <label htmlFor="menu-track" className="font-medium">Lacak stok</label>
                                        <p className="text-sm text-muted-foreground">Matikan untuk menu yang tidak perlu dihitung, misalnya nasi putih dan minuman.</p>
                                    </div>
                                    <Switch id="menu-track" checked={trackStock} onCheckedChange={setTrackStock} />
                                </div>
                                {trackStock && (
                                    <Field id="menu-stock" label="Stok awal" error={errors.stockQty} hint="Hanya diisi sekali. Setelah itu stok diubah lewat Atur Stok.">
                                        <Input id="menu-stock" type="number" min={0} placeholder="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} aria-invalid={!!errors.stockQty} className="angka h-11" />
                                    </Field>
                                )}
                            </>
                        ) : (
                            <Field id="menu-stock-view" label="Stok saat ini" hint={menu?.trackStock ? "Stok hanya bisa diubah lewat Atur Stok supaya tercatat di riwayat." : undefined}>
                                <div id="menu-stock-view" className="flex h-11 items-center gap-2 rounded-lg border bg-lembut px-3 text-muted-foreground">
                                    <LockSimpleIcon size={18} />
                                    {menu?.trackStock ? <span className="angka text-foreground">{menu.stockQty}</span> : "Tidak dilacak"}
                                </div>
                            </Field>
                        )}

                        <Field id="menu-code" label="Kode menu" aside={<span className="text-xs font-semibold tracking-widest text-[#8a6210] uppercase">Otomatis</span>} hint={mode === "create" ? "Dibuat dari kode kategori secara berurutan, contoh LK-004." : undefined}>
                            <div id="menu-code" className="angka flex h-11 items-center gap-2 rounded-lg border border-dashed bg-lembut px-3 text-muted-foreground">
                                <LockSimpleIcon size={18} /> {menu?.code ?? "Dibuat otomatis"}
                            </div>
                        </Field>
                    </div>

                    <div className="flex items-center gap-3 border-t p-5">
                        {mode === "edit" && menu && (
                            <Button type="button" variant="ghost" className="mr-auto h-11 text-cabai hover:bg-cabai/10 hover:text-cabai" onClick={() => onArchive(menu)}>
                                <TrashIcon size={18} /> Arsipkan
                            </Button>
                        )}
                        <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none sm:px-6" onClick={onClose}>Batal</Button>
                        <Button type="submit" className="h-11 flex-1 sm:px-6" disabled={saving}>
                            {saving ? <SpinnerIcon className="animate-spin" /> : <CheckCircleIcon size={18} />}
                            {mode === "create" ? "Simpan Menu" : "Simpan Perubahan"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
