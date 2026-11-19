import { HourglassMediumIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

//muncul kalau backend balas 401 di tengah pemakaian
export function SessionExpiredDialog() {
    const {sessionExpired, relogin, user} = useAuth();

    return (
        <Dialog open={sessionExpired}>
            <DialogContent showCloseButton={false} className="max-w-md p-8 text-center" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                <div className="mx-auto grid size-16 place-items-center rounded-xl bg-kunyit/15 text-kunyit">
                    <HourglassMediumIcon size={32} />
                </div>
                <DialogTitle className="text-2xl">Sesi Anda telah berakhir</DialogTitle>
                <DialogDescription className="text-base">
                    {user?.role === "CASHIER"
                        ? "Silakan masuk kembali. Pesanan yang sedang dibuat tetap tersimpan."
                        : "Demi keamanan, silakan masuk kembali untuk melanjutkan."}
                </DialogDescription>
                <Button size="lg" className="mt-2 h-11 w-full text-base" onClick={relogin}>
                    Masuk Kembali <ArrowRightIcon />
                </Button>
            </DialogContent>
        </Dialog>
    );
}
