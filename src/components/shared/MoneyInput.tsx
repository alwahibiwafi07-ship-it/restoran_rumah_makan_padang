import { num } from "@/lib/format";
import { cn } from "@/lib/utils";

//input rupiah: yang diketik cuma angka, tampilannya pakai titik ribuan
export function MoneyInput({id, value, onChange, invalid, className, inputClassName, placeholder = "0", autoFocus}: {
    id: string;
    value: number | null;
    onChange: (value: number | null) => void;
    invalid?: boolean;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    autoFocus?: boolean;
}) {
    return (
        <div className={cn("flex h-11 overflow-hidden rounded-lg border bg-card focus-within:ring-3 focus-within:ring-ring/30", invalid && "border-cabai bg-cabai/5", className)}>
            <span className="angka grid place-items-center border-r bg-lembut px-3 text-sm text-muted-foreground">Rp</span>
            <input
                id={id}
                inputMode="numeric"
                autoComplete="off"
                autoFocus={autoFocus}
                placeholder={placeholder}
                aria-invalid={invalid}
                value={value === null ? "" : num(value)}
                onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    onChange(digits ? Number(digits) : null);
                }}
                className={cn("angka min-w-0 flex-1 bg-transparent px-3 outline-none", inputClassName)}
            />
        </div>
    );
}
