import { api } from "./client";
import type { DashboardToday } from "@/lib/types";

export async function getDashboardToday() {
    const res = await api.get<DashboardToday>("/dashboard/today");
    return res.data;
}
