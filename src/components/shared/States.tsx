import type { ReactNode } from "react";
import { ArrowClockwiseIcon, CloudSlashIcon, type Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

//keadaan error dengan tombol coba lagi
export function ErrorState({title = "Gagal memuat data", message, onRetry, className}: {title?: string; message?: string; onRetry: () => void; className?: string}) {
    return (
        <div className={cn("mx-auto my-8 flex max-w-xl flex-col items-center rounded-xl border border-cabai/20 bg-cabai/5 px-8 py-12 text-center", className)}>
            <div className="grid size-16 place-items-center rounded-xl bg-cabai/10 text-cabai">
                <CloudSlashIcon size={32} />
            </div>
            <h3 className="mt-5 text-xl font-bold">{title}</h3>
            <p className="mt-1 text-muted-foreground">{message ?? "Periksa koneksi ke server, lalu coba lagi."}</p>
            <Button className="mt-6 h-10 px-5" onClick={onRetry}>
                <ArrowClockwiseIcon /> Coba Lagi
            </Button>
        </div>
    );
}

//keadaan kosong
export function EmptyState({icon: IconComp, title, description, action, className}: {icon: Icon; title: string; description?: string; action?: ReactNode; className?: string}) {
    return (
        <div className={cn("flex flex-col items-center px-8 py-14 text-center", className)}>
            <div className="grid size-16 place-items-center rounded-xl bg-lembut text-pinus">
                <IconComp size={32} />
            </div>
            <h3 className="mt-5 text-xl font-bold">{title}</h3>
            {description && <p className="mt-1 max-w-md text-muted-foreground">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

//baris abu-abu selama data dimuat
export function SkeletonRows({rows = 6, cols}: {rows?: number; cols: number}) {
    return (
        <>
            {Array.from({length: rows}).map((_, row) => (
                <tr key={row} className="border-b last:border-0">
                    {Array.from({length: cols}).map((__, col) => (
                        <td key={col} className="px-4 py-4">
                            <div className="h-4 animate-pulse rounded bg-muted" style={{width: `${50 + ((row + col) % 3) * 20}%`}} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export function PageHeader({title, description, action}: {title: string; description?: string; action?: ReactNode}) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold">{title}</h1>
                {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
    );
}
