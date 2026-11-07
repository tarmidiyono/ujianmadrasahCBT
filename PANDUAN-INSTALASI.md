# Panduan Instalasi — CBT Madrasah Kotaanyar

## A. Backend (Google Apps Script) — pakai akun Google pemilik data
1. Buka https://script.google.com → **Proyek baru**. Ganti nama `Code.gs` menjadi `Kode`, tempel seluruh isi `Kode.gs`.
2. ⚙️ **Setelan proyek** → centang *Tampilkan file manifes appsscript.json* → ganti isinya dengan `appsscript.json`.
3. Pilih fungsi `setupAppEnvironment` → ▶ **Run** (HANYA SEKALI; aman diulang). Izinkan akses Drive & Sheets.
4. Buka **Execution log** dan **catat**: `admin / <kata sandi>` (tampil sekali). Spreadsheet database & folder Drive terbuat otomatis.
   Lupa sandi? Jalankan `resetAdmin()`. Setelah login pertama, ganti dengan menjalankan `resetAdmin()` lagi bila perlu.
5. **Deploy → Deployment baru → Aplikasi web**: *Jalankan sebagai* **Saya**, *Akses* **Siapa saja** → Deploy → salin URL `/exec`.
6. Update kode di kemudian hari: **Kelola deployment → Edit → Versi baru** (URL tetap sama).

## B. Frontend (GitHub Pages)
1. Ekstrak ZIP. **Folder `cbt-kotaanyar` hasil ekstrak adalah folder yang di-`git init`** (di dalamnya langsung terlihat `index.html`, `css`, `js`).
2. Edit `js/config.js`: ganti `GANTI_DENGAN_ID_DEPLOYMENT` dengan URL `/exec` dari langkah A5.
3. Buka PowerShell di folder itu, lalu `dir` — pastikan `index.html` ada di baris teratas. Baru jalankan:
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
4. GitHub → repo → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → ✅ Enforce HTTPS → Save.
5. Update: `git add .` → `git commit -m "update"` → `git push` (lalu Ctrl+Shift+R).
Butuh panduan Git langkah demi langkah (token, error push)? Tanyakan di chat.

## C. Mulai memakai
1. Masuk sebagai `admin`. **Pengaturan**: `TAMPIL_NILAI` (YA/TIDAK), `BATAS_PELANGGARAN` (default 3).
2. **Mata Pelajaran** → **Pengguna** (Impor CSV: `role,username,nama,lembaga,kelas,ruang,mapel,password`; `mapel` hanya untuk guru, pisahkan koma) → guru mengisi **Bank Soal** → admin membuat **Jadwal** (`tanggal` `2026-11-05`, `mulai/selesai` `08:00`, `durasi` menit, `soalIds` id soal dipisah koma) → klik **Token baru** pada baris jadwal.
3. Format soal: pg `opsi=[{"k":"A","t":"teks"}]` `kunci=B` · pgk `kunci=["A","C"]` · bs `opsi=["p1","p2"]` `kunci={"0":true,"1":false}` · jodoh `opsi={"kiri":[…],"kanan":[…]}` `kunci={"0":2,"1":0}` · esai tanpa kunci.

## D. Keamanan (wajib dibaca)
- Rahasia (`SESSION_SECRET`, kredensial admin) dibangkitkan otomatis dan hanya ada di **Script Properties**; tidak ada di kode, Sheets, atau frontend. Kunci jawaban tidak pernah dikirim ke browser siswa.
- Kata sandi pengguna disimpan sebagai **hash + salt** di sheet `Pengguna`. **Jangan bagikan spreadsheet database** dan jangan menambah editor proyek Apps Script sembarangan (editor bisa melihat Script Properties).
- Sandi 5× salah → akun terkunci 15 menit. Rotasi sesi: jalankan `rotasiSecretSesi()` (semua pengguna login ulang).
- Impor pengguna diproses per 25 baris karena hash sengaja lambat; batas eksekusi GAS 6 menit.

## E. Uji beban sebelum hari-H
Simulasikan ±150 siswa login bersamaan dan mengerjakan 40 soal. Jawaban disimpan ke cache tiap ±20 detik dan ke Sheets hanya saat selesai.
