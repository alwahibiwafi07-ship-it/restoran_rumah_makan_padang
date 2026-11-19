import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MinusCircleIcon, PlusCircleIcon, SpinnerIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormAlert } from "@/components/shared/Field";
import { adjustStock } from "@/api/menus";
import { errorMessage, fieldErrors } from "@/api/client";
import type { Menu } from "@/lib/types";
import { cn } from "@/lib/utils";

//alasan yang boleh, sama dengan adjustStockSchema di server
const reasons = {
    ADD: ["Hasil masak", "Salah hitung"],
    REDUCE: ["Dibawa pulang", "Rusak/basi", "Salah hitung"],
};

export function StockDialog({menu, onClose, onSaved}: {menu: Menu; onClose: () => void; onSaved: () => void}) {
    const [type, setType] = useState<"ADD" | "REDUCE">("ADD");
    const [qty, setQty] = useState("");
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState("");
    const [saving, setSaving] = useState(false);

    const current = menu.stockQty ?? 0;
    const amount = Number(qty) || 0;
    const after = type === "ADD" ? current + amount : current - amount;

    function changeType(next: "ADD" | "REDUCE") {
        setType(next);
        setReason("");
        setErrors({});
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setAlert("");
        const next: Record<string, string> = {};
        if (!Number.isInteger(Number(qty)) || Number(qty) < 1) next.qty = "Jumlah minimal 1";
        else if (type === "REDUCE" && amount > current) next.qty = `Tidak bisa mengurangi lebih dari stok saat ini (${current})`;
        if (!reason) next.reason = "Pilih alasan";
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        try {
            const result = await adjustStock(menu.id, {type, qty: amount, reason, note: note.trim() || undefined});
            toast.success(`Stok ${menu.name} sekarang ${result.menu.stockQty}`);
            onSaved();
        } catch (err) {
            setErrors(fieldErrors(err));
            setAlert(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0">
                <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-2xl">Atur Stok</DialogTitle>
                        <DialogDescription>{menu.name} ({menu.code})</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 p-6">
                        <FormAlert message={alert} />
                        <div className="flex items-center justify-between rounded-lg bg-lembut px-4 py-3">
                            <span>Stok saat ini</span>
                            <span className="angka rounded bg-card px-3 py-1 text-lg font-semibold">{current}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 rounded-lg bg-lembut p-1" role="tablist">
                            <TypeButton active={type === "ADD"} onClick={() => changeType("ADD")}><PlusCircleIcon size={18} /> Tambah</TypeButton>
                            <TypeButton active={type === "REDUCE"} onClick={() => changeType("REDUCE")}><MinusCircleIcon size={18} /> Kurangi</TypeButton>
                        </div>

                        <Field id="stock-qty" label="Jumlah" required error={errors.qty}>
                            <Input id="stock-qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!!errors.qty} className="angka h-11" autoFocus />
                        </Field>

                        <Field id="stock-reason" label="Alasan" required error={errors.reason}>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger id="stock-reason" className="h-11! w-full" aria-invalid={!!errors.reason}><SelectValue placeholder="Pilih alasan" /></SelectTrigger>
                                <SelectContent>
                                    {reasons[type].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field id="stock-note" label="Catatan (opsional)" error={errors.note}>
                            <Textarea id="stock-note" value={note} maxLength={200} rows={2} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: masak siang" />
                        </Field>

                        {amount > 0 && (
                            <div className={cn("flex justify-between rounded-lg px-4 py-3 text-sm", after < 0 ? "bg-cabai/10 text-cabai" : "bg-daun/10 text-daun")}>
                                <span>Stok sesudah disimpan</span>
                                <span className="angka font-semibold">{after}</span>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="border-t bg-lembut p-5">
                        <Button type="button" variant="outline" className="h-11 px-5" onClick={onClose}>Batal</Button>
                        <Button type="submit" className="h-11 px-5" disabled={saving}>
                            {saving && <SpinnerIcon className="animate-spin" />} Simpan Stok
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function TypeButton({active, onClick, children}: {active: boolean; onClick: () => void; children: React.ReactNode}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn("flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium", active ? "bg-pinus text-white" : "text-muted-foreground hover:text-foreground")}
        >
            {children}
        </button>
    );
}
