# Awak Punyo

Aplikasi kasir (POS) untuk rumah makan Padang dengan satu outlet. Ada dua peran:

- **Admin (pemilik)**: melihat dashboard, mengelola menu, kategori, stok, akun kasir, dan semua transaksi.
- **Kasir**: mencatat pesanan, menerima pembayaran tunai atau QRIS, mencetak struk, dan melihat riwayat hari ini.

## Teknologi

| Bagian | Yang dipakai |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS, shadcn/ui, Phosphor Icons, Axios, react-router-dom |
| Backend | Node.js + Express 5, Zod, bcrypt, JSON Web Token |
| Database | PostgreSQL (Docker) + Prisma 7 |
| Pembayaran | Midtrans Core API QRIS (mode Sandbox) |

## Cara menjalankan

Yang perlu terpasang: Node.js 20 ke atas dan Docker Desktop.

1. Pasang paket:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env`, lalu isi:
   - `DATABASE_URL` sesuai `docker-compose.yml`, contoh `postgresql://myuser:mypassword@localhost:5432/mydatabase?schema=public`
   - `JWT_SECRET` dengan teks acak yang panjang
   - `MIDTRANS_SERVER_KEY` dengan Server Key dari dashboard Midtrans **Sandbox** (boleh kosong, hanya QRIS yang tidak bisa dipakai)
3. Nyalakan database:
   ```bash
   docker compose up -d
   ```
4. Buat tabel dan isi data contoh:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Jalankan backend dan frontend di dua terminal berbeda:
   ```bash
   npm run dev:server   # backend di http://localhost:5000
   npm run dev          # frontend di http://localhost:5173
   ```
6. Buka http://localhost:5173.

`npx prisma db seed` juga bisa dipakai kapan saja untuk mengembalikan data ke kondisi awal. Perintah ini **menghapus semua data**, termasuk transaksi.

## Akun demo

Semua akun memakai kata sandi `password123`.

| Peran | Email | Keterangan |
|---|---|---|
| Admin | rizal@awakpunyo.com | Rizal Chaniago |
| Kasir | nia@awakpunyo.com | Nia Sari |
| Kasir | dewi@awakpunyo.com | Dewi Anggraini |
| Kasir | fikri@awakpunyo.com | Fikri Hidayat |
| Kasir | rian@awakpunyo.com | Nonaktif, untuk mencoba login yang ditolak |

## Struktur folder

```
server/                 backend
  index.ts              pintu masuk: daftar alamat /api/...
  routes/               satu file per bagian (auth, categories, menus, users, transactions, dashboard)
  middleware/           cek token (auth.ts) dan perapian pesan error (error.ts)
  lib/                  alat bantu: hitung total, nomor tiket, kurangi stok, koneksi Midtrans
prisma/
  schema.prisma         bentuk tabel database
  seed.ts               data contoh
src/                    frontend
  api/                  fungsi pemanggil backend (axios)
  context/              AuthContext (login) dan CartContext (keranjang kasir)
  components/           layout, komponen bersama, komponen shadcn/ui
  pages/                halaman admin, kasir, login, akses ditolak
  lib/                  format rupiah, rumus total (sama dengan server), tipe data
docs/BRIEF.md           brief tugas
```

## Alur penting

**Login dan hak akses.** Login mengirim email dan kata sandi ke `POST /api/auth/login`. Kata sandi dicocokkan dengan bcrypt, lalu server memberi token JWT. Frontend menyimpan token dan menempelkannya di setiap request. Kalau token habis atau tidak valid, server membalas 401 dan muncul modal "Sesi Anda telah berakhir". Kalau kasir membuka halaman admin, server membalas 403 dan muncul halaman "Akses ditolak".

**Harga selalu dari database.** Kasir hanya mengirim `menuId` dan `qty`. Harga, pajak, dan total dihitung ulang di server (`server/lib/order.ts` dan `server/lib/money.ts`), jadi harga tidak bisa diakali dari browser.

**Rumus total.**
```
subtotal  = Σ harga × qty
bungkus   = 2.000 kalau Bungkus, 0 kalau Makan di Tempat
pajak     = bulatkan((subtotal + bungkus) × 10%)
total     = (subtotal + bungkus + pajak), dibulatkan ke atas ke kelipatan Rp 500
```
Contoh: Rendang 19.500 + Ayam Pop 18.000 + 2 Nasi 12.000 + 2 Es Teh 11.000 = 60.500, pajak 6.050, jadi 66.550, dibulatkan menjadi **Rp 67.000**.

**Bayar tunai dalam satu `$transaction`.** Cek harga dan stok, cek uang cukup, ambil nomor tiket, simpan transaksi, lalu kurangi stok dan catat di `StockLog`. Kalau satu langkah gagal (misalnya stok habis), semuanya dibatalkan.

**Anti transaksi dobel.** Setiap pesanan punya `clientRef` (UUID dari browser). Kalau tombol bayar terkirim dua kali, server mengembalikan transaksi yang sudah ada, tidak membuat yang baru.

**QRIS.** Transaksi disimpan `PENDING`, server meminta QR ke Midtrans, lalu frontend menanyakan status setiap 3 detik. Stok baru dikurangi saat Midtrans menyatakan lunas. QR berlaku 15 menit; setelah itu kasir bisa membuat QR baru atau ganti ke tunai.

**Stok.** Stok hanya berubah lewat penjualan atau menu "Atur Stok", dan setiap perubahan tercatat di riwayat stok. Menu yang dihapus hanya diarsipkan supaya riwayat transaksi lama tetap utuh.

## Mencoba pembayaran QRIS

Karena memakai mode Sandbox, QR tidak bisa dibayar dengan aplikasi bank sungguhan. Salin alamat gambar QR, lalu bayar lewat simulator Midtrans Sandbox: https://simulator.sandbox.midtrans.com/v2/qris/index. Dalam beberapa detik layar kasir otomatis berpindah ke "Pembayaran QRIS diterima".
