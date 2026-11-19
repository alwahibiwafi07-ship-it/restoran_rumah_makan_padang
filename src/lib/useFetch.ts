import { useEffect, useEffectEvent, useState } from "react";
import { errorMessage } from "@/api/client";

type FetchState<T> = {key: string | null; data: T | null; error: string | null};

//hook kecil buat ambil data: ada loading, error, sama reload buat tombol "Coba Lagi"
//data diambil ulang setiap isi deps berubah (contoh: filter diganti)
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]) {
    const [version, setVersion] = useState(0);
    const [state, setState] = useState<FetchState<T>>({key: null, data: null, error: null});
    const key = JSON.stringify([...deps, version]);

    const load = useEffectEvent(() => fetcher());

    useEffect(() => {
        let active = true;
        load()
            .then((data) => {
                if (active) setState({key, data, error: null});
            })
            .catch((err) => {
                if (active) setState((prev) => ({key, data: prev.data, error: errorMessage(err, "Gagal memuat data")}));
            });
        //kalau filter keburu diganti, hasil lama diabaikan
        return () => {
            active = false;
        };
    }, [key]);

    return {
        data: state.data,
        loading: state.key !== key,
        error: state.key === key ? state.error : null,
        reload: () => setVersion((v) => v + 1),
        setData: (data: T) => setState((prev) => ({...prev, data})),
    };
}
