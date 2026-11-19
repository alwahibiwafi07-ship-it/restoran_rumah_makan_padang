import { api } from "./client";
import type { Category } from "@/lib/types";

export type CategoryInput = {code?: string; name: string; sortOrder?: number};

export async function getCategories() {
    const res = await api.get<Category[]>("/categories");
    return res.data;
}

export async function createCategory(data: CategoryInput) {
    const res = await api.post<Category>("/categories", data);
    return res.data;
}

//kode kategori tidak bisa diubah, jadi yang dikirim cuma nama dan urutan
export async function updateCategory(id: string, data: {name?: string; sortOrder?: number}) {
    const res = await api.patch<Category>(`/categories/${id}`, data);
    return res.data;
}

export async function deleteCategory(id: string) {
    const res = await api.delete<{message: string}>(`/categories/${id}`);
    return res.data;
}
