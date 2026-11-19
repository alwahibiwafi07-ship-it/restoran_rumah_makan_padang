import type { Role } from "./types";

//halaman awal tiap peran
export function homePath(role: Role) {
    return role === "ADMIN" ? "/admin" : "/kasir";
}
