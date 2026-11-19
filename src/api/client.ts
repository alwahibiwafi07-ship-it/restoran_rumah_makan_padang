import axios, { AxiosError } from "axios";

export const TOKEN_KEY = "awak_token";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
    timeout: 20000,
});

//tempel token di setiap request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

//401 = sesi habis, 403 = salah peran
//yang dari halaman login tidak dihitung, karena itu memang salah password / akun nonaktif
api.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
        const isLogin = err.config?.url?.includes("/auth/login");
        if (!isLogin && err.response?.status === 401) {
            window.dispatchEvent(new Event("auth:expired"));
        }
        if (!isLogin && err.response?.status === 403) {
            window.dispatchEvent(new Event("auth:forbidden"));
        }
        return Promise.reject(err);
    },
);

type ApiErrorBody = {message?: string; errors?: {field: string; message: string}[]};

//ambil pesan error dari backend, kalau server mati kasih pesan koneksi
export function errorMessage(err: unknown, fallback = "Terjadi kesalahan, coba lagi") {
    if (axios.isAxiosError(err)) {
        if (!err.response) return "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.";
        const body = err.response.data as ApiErrorBody | undefined;
        if (body?.errors?.length) return body.errors[0].message;
        return body?.message ?? fallback;
    }
    return fallback;
}

//error per field dari zod, contoh {email: "Format email tidak valid"}
export function fieldErrors(err: unknown) {
    const result: Record<string, string> = {};
    if (axios.isAxiosError(err)) {
        const body = err.response?.data as ApiErrorBody | undefined;
        for (const item of body?.errors ?? []) {
            if (item.field && !result[item.field]) result[item.field] = item.message;
        }
    }
    return result;
}

export function statusCode(err: unknown) {
    return axios.isAxiosError(err) ? err.response?.status : undefined;
}
