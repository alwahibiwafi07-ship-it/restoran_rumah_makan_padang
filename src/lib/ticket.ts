//12 jadi "A-012", sama dengan server/lib/ticket.ts
export function formatTicket(ticketNo: number) {
    return `A-${String(ticketNo).padStart(3, "0")}`;
}
