import { channelLabel, statusLabel } from "@/lib/format";
import type { Channel, TransactionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({status}: {status: TransactionStatus}) {
    const style = {
        PAID: "bg-daun/10 text-daun border-daun/30",
        PENDING: "bg-kunyit/15 text-[#8a6210] border-kunyit/40",
        EXPIRED: "bg-muted text-muted-foreground border-border",
        CANCELLED: "bg-cabai/10 text-cabai border-cabai/30",
    }[status];
    return <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold", style)}>{statusLabel[status]}</span>;
}

export function ChannelBadge({channel}: {channel: Channel}) {
    return (
        <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap", channel === "TAKEAWAY" ? "bg-kunyit/20 text-[#8a6210]" : "bg-lembut text-pinus")}>
            {channelLabel[channel]}
        </span>
    );
}
