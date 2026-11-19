import type { ReactNode } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";

export function FieldError({message}: {message?: string}) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1.5 text-sm text-cabai">
            <WarningCircleIcon size={16} className="shrink-0" /> {message}
        </p>
    );
}

//label + input + pesan error / petunjuk
export function Field({id, label, required, error, hint, aside, children}: {id: string; label: string; required?: boolean; error?: string; hint?: ReactNode; aside?: ReactNode; children: ReactNode}) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id} className="text-sm font-medium">
                    {label} {required && <span className="text-cabai">*</span>}
                </Label>
                {aside}
            </div>
            {children}
            {error ? <FieldError message={error} /> : hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
    );
}

//alert merah di atas form
export function FormAlert({message}: {message?: string}) {
    if (!message) return null;
    return (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-cabai/30 bg-cabai/5 px-4 py-3 text-sm font-medium text-cabai">
            <WarningCircleIcon size={20} className="shrink-0" />
            <span>{message}</span>
        </div>
    );
}
