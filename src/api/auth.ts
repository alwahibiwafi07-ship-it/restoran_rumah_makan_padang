import { api } from "./client";
import type { User } from "@/lib/types";

export async function login(email: string, password: string) {
    const res = await api.post<{token: string; user: User}>("/auth/login", {email, password});
    return res.data;
}

export async function getMe() {
    const res = await api.get<{user: User}>("/auth/me");
    return res.data.user;
}
