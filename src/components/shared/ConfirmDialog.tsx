import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { SpinnerIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    icon: Icon;
    tone?: "danger" | "warning";
    title: string;
    description: ReactNode;
    children?: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    loading?: boolean;
};

//dialog konfirmasi: hapus, arsip, nonaktifkan, kosongkan pesanan
export function ConfirmDialog({open, onOpenChange, icon: IconComp, tone = "danger", title, description, children, confirmLabel, onConfirm, loading}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-md p-7 text-center">
                <div className={cn("mx-auto grid size-16 place-items-center rounded-xl", tone === "danger" ? "bg-cabai/10 text-cabai" : "bg-kunyit/15 text-[#8a6210]")}>
                    <IconComp size={30} />
                </div>
                <DialogTitle className="text-2xl">{title}</DialogTitle>
                <DialogDescription className="text-base">{description}</DialogDescription>
                {children}
                <div className="mt-2 grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="h-11 text-base" onClick={() => onOpenChange(false)} disabled={loading}>Batal</Button>
                    <Button className={cn("h-11 text-base", tone === "danger" && "bg-cabai hover:bg-cabai/90")} onClick={onConfirm} disabled={loading}>
                        {loading && <SpinnerIcon className="animate-spin" />}
                        {confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
