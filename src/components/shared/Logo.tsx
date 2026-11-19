import { cn } from "@/lib/utils";

export function LogoMark({className}: {className?: string}) {
    return (
        <div className={cn("grid size-11 place-items-center rounded-md bg-kunyit font-heading text-lg font-bold text-pinus", className)}>
            AP
        </div>
    );
}

export function Logo({subtitle = "Rumah Makan Padang", light = true}: {subtitle?: string; light?: boolean}) {
    return (
        <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
                <div className={cn("font-heading text-xl font-bold", light ? "text-white" : "text-pinus")}>Awak Punyo</div>
                <div className={cn("text-[11px] font-medium tracking-[0.12em] uppercase", light ? "text-white/70" : "text-muted-foreground")}>{subtitle}</div>
            </div>
        </div>
    );
}
