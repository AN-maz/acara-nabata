# ◆ Papan Kinerja Panitia

Dashboard statis buat memantau kinerja tim kepanitiaan: **kanban tugas** (To Do → In Progress → Done) + **rekap kehadiran** dengan perhitungan persentase. Data diinput lewat file JSON, jadi gak perlu backend — cukup push, langsung ke-deploy.

> Dibangun dengan vanilla HTML / CSS / JavaScript, tanpa framework dan tanpa build step.

## ✨ Fitur

- **Kanban 3 kolom** — To Do, In Progress, Done; tiap kartu nunjukin divisi, PIC, deadline, prioritas, dan progres checklist mini.
- **Detail tugas** — klik kartu, muncul modal: deskripsi, checklist, catatan, dan flag **Terlambat** kalau deadline lewat tapi belum selesai.
- **Rekap kehadiran** — tabel per anggota: hadir / izin / sakit / alfa + bar persentase kehadiran, plus total dan rata-rata tim.
- **Ringkasan atas** — total tugas, % selesai, yang sedang dikerjakan, jumlah anggota, kehadiran rata-rata.
- **Karakter 3D idle** — robot kecil di pojok kanan bawah (three.js), kedip, goyang, dan nengok ngikutin kursor.

## 📁 Struktur

```
├── index.html          # entry point
├── css/style.css       # tema dark modern
├── js/app.js           # render kanban, modal, rekap kehadiran
├── js/character.js     # karakter 3D idle (three.js via CDN)
└── data/
    ├── tasks.json      # ← input tugas tim di sini
    └── attendance.json # ← input kehadiran di sini
```

## 📝 Cara input data

### Tugas (`data/tasks.json`)

```json
{
  "event": "Nama Acara",
  "period": "Periode kepanitiaan",
  "tasks": [
    {
      "id": "T-11",
      "title": "Judul tugas",
      "division": "Acara",
      "pic": "Nama PIC",
      "status": "todo",          // todo | in_progress | done
      "priority": "high",        // high | medium | low
      "deadline": "2026-12-01",
      "description": "Penjelasan singkat.",
      "notes": "Update terakhir.",
      "checklist": [
        { "item": "Sub-tugas 1", "done": false }
      ]
    }
  ]
}
```

### Kehadiran (`data/attendance.json`)

```json
{
  "period": "November 2026",
  "members": [
    {
      "name": "Nama Anggota",
      "division": "Divisi",
      "records": { "2026-11-22": "hadir" }   // hadir | izin | sakit | alfa
    }
  ]
}
```

**Aturan hitung** (bisa diubah di `js/app.js`, fungsi `attendanceSummary`):

- Total sesi = gabungan semua tanggal yang muncul di seluruh anggota.
- Anggota yang gak mencatat di sebuah tanggal = **alfa**.
- `% kehadiran = hadir / total sesi × 100`.
- Rata-rata tim = rerata `% kehadiran` seluruh anggota.

## 🖥 Menjalankan lokal

`fetch()` diblokir kalau dibuka langsung dari `file://`, jadi jalankan server lokal dulu:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## 🚀 Deploy (GitHub Pages)

1. Push repo ke GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, pilih `main` / `/ (root)`.
3. Selesai — situs live di `https://<username>.github.io/<repo>/`.

Tiap kali edit JSON dan push, situsnya ikut ke-update otomatis.

## 🧰 Tech

| Layer | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript vanilla (ES2022) |
| 3D | three.js r160 (CDN, ES module) |
| Data | JSON statis |
| Deploy | GitHub Pages (gratis) |