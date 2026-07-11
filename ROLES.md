# 📖 Panduan Lengkap Role — The Merchant's Shadow

---

## 👥 Pembagian Faksi & Peran

---

## 🐺 TIM SERIGALA (Antagonis)

Menang jika **jumlah Serigala = jumlah Warga**.

---

### 🐺 Werewolf — The Predator

**Tim:** Serigala

**Kemampuan — 🗡️ Kill:**
| Malam ke- | Bisa bertindak? |
|---|---|
| Malam 1 | ❌ TIDAK |
| Malam 2+ | ✅ Bisa bunuh 1 target |

- Eksekutor pembunuhan harian mulai Malam 2
- Pilih 1 target untuk dibunuh setiap malam
- Bisa berkoordinasi secara rahasia via chat whisper

**⚠️ Werewolf TIDAK tahu siapa Warlock — dan sebaliknya.** Bisa saja bunuh sesama tim sendiri secara tidak sengaja!

---

### 🧙 Warlock — The Shadow Merchant

**Tim:** Serigala

Tidak bisa membunuh langsung. Harus **berbelanja item** dulu.

#### Item yang bisa dibeli:

| Item | Efek |
|---|---|
| **👁️ Vision** | Cek role asli 1 target |
| **☠️ Poison** | Bunuh 1 target |

**⚠️ Poison tidak tembus proteksi Guard.**

#### Alur Ekonomi — WAJIB ZIGZAG:

Malam 1: **Beli** item (Vision/Poison)
Malam 2: **Action** — pakai item yang sudah dibeli
Malam 3: **Beli** item baru
Malam 4: **Action** — pakai item lagi
...dan seterusnya bergantian.

```
✅  Beli → Action → Beli → Action → Beli → Action
❌  Beli → Beli → Action
❌  Action → Action
❌  Action → Beli → Beli
```

Setelah transaksi:
1. Sistem **pilih Pedagang secara acak** yang masih hidup
2. **Moderator mendapat notifikasi** → WAJIB kirim clue ke Pedagang
3. Warlock baru bisa **pakai item di malam berikutnya** (tidak bisa langsung)

**⚠️ Setiap transaksi meninggalkan jejak —** Pedagang dapat clue dari Moderator.

---

## 👥 TIM WARGA (Protagonis)

Menang jika **semua Serigala mati**.

---

### ⚖️ Hakim — The Grand Justice

**Tim:** Warga (Spesial)

**Perannya TERBUKA sejak awal game** — diumumkan di IntroFable. Semua pemain tahu siapa Hakim.

Hakim punya **2 kemampuan**:

#### 🔹 Truth (Paksa Jujur) — Pasif
- Bisa dipakai **1x setiap malam**
- Bocorkan isi chat private target ke publik secara paksa
- Truth berlaku **berturut-turut** (bisa tiap malam ke target berbeda)

**Apa yang terjadi saat Truth aktif:**
1. `underTruth: true` di-set ke target
2. Target **tidak tahu** sedang di-Truth
3. Saat target chat private (whisper):
   - **⚠️ NAMA BERKATA JUJUR** → notifikasi PUBLIK
   - Isi chat **ditayangkan ke publik paksa**
   - Label: `Nama (TEREKAM)`

#### 🔹 Pistol (Eksekusi) — Aktif
- **Hanya bisa digunakan di SIANG hari**
- **2 peluru** sepanjang game
- Bisa membunuh siapa pun

#### Ringkasan:
| Kemampuan | Kapan | Batasan |
|---|---|---|
| 👁️ Truth | Malam hari | 1x/malam, target beda |
| 🔫 Pistol | Siang hari | 2x sepanjang game |

**⚠️ Risiko:** Karena identitas terbuka, Hakim adalah target utama Serigala.

---

### 👁️ Seer — The Watcher

**Tim:** Warga (Spesial)

**Kemampuan — 🔍 Reveal:**
| Malam ke- | Bisa bertindak? |
|---|---|
| Malam 1 | ✅ Bisa |
| Malam 2+ | ✅ Bisa (unlimited) |

- Mengintip **peran asli 1 pemain** setiap malam
- Hasil dikirim otomatis saat fajar

**⚠️ Risiko:** Ancaman nomor 1 untuk Serigala — biasanya jadi target bunuh pertama jika ketahuan.

---

### 🛡️ Guard — The Protector

**Tim:** Warga (Spesial)

**Kemampuan — 🛡️ Protect:**
| Malam ke- | Bisa bertindak? |
|---|---|
| Malam 1 | ✅ Bisa |
| Malam 2 | ❌ Cooldown |
| Malam 3 | ✅ Bisa |
| Malam 4 | ❌ Cooldown |
| ... | Setiap **2 malam sekali** |

**Aturan Proteksi:**
- Target yang dilindungi akan **aman selama 2 malam** (malam diprotek + malam berikutnya)
- Tidak bisa lindungi target yang sama 2x berturut-turut
- Bisa lindungi diri sendiri (maksimal 1x)

---

### 🎯 Hunter — The Avenger

**Tim:** Warga (Spesial)

**Kemampuan — 🎯 Hunt:**
| Malam ke- | Bisa bertindak? |
|---|---|
| Malam 1 | ❌ Tidak |
| Malam 2+ | ✅ Bisa (**1x sepanjang game**) |

**High Risk - High Reward:**
```
Hunter menembak target...
├── Jika target WARGA → Hunter MATI + Target MATI (salah tembak)
└── Jika target SERIGALA → Hunter SELAMAT + Target MATI (tepat sasaran)
```

---

### 🏪 Pedagang — The Merchant

**Tim:** Warga (Biasa)

**Kemampuan:** ❌ Tidak ada action malam

**Peran KRUSIAL dalam ekonomi game:**
```
Warlock beli item → Sistem pilih Pedagang acak
→ Moderator WAJIB kirim clue rahasia
→ Pedagang baca clue → cari tahu Warlock
→ Bocorkan info ke warga lain saat diskusi
```

**⚠️ Kalau Pedagang mati, Warlock tidak bisa bertransaksi lagi!**

---

## 🏛️ MODERATOR — Pemegang Permainan

**Tim:** Independen (Bukan Pemain)

### 🕐 Pengatur Alur & Waktu
- Mengontrol timer (Start / Pause / Reset)
- Memindahkan fase permainan: **Pagi ☀️ → Siang 🗳️ → Malam 🌙**
- Game sudah punya **auto-advance** dari awal — fase berjalan otomatis ketika timer habis

### ⚖️ Hakim Tertinggi
- Menentukan akhir permainan dan siapa pemenang
- **Cheat mekanik:** bisa membunuh/menghidupkan pemain secara instan
- Berhak **kick** pemain yang melanggar aturan dari lobby

### 🔗 Jembatan Informasi (Krusial)
- Bisa melihat **seluruh peran pemain** dan **log aksi malam** secara transparan
- **WAJIB** kirim clue/petunjuk rahasia ke Pedagang **setiap kali Warlock transaksi**

---

## 📊 Ringkasan Cepat

| Role | Tim | Action | Kapan? | Batasan |
|---|---|---|---|---|
| **Moderator** | Independen | Atur game + lihat semua role | Setiap saat | — |
| **Werewolf** | Serigala | 🗡️ Bunuh 1 target | Malam 2+ | 1x/malam |
| **Warlock** | Serigala | 💰 Beli Vision/Poison | Malam 1: Beli, Malam 2+: Pakai | Zigzag: Beli→Action→Beli→Action |
| **Hakim** | Warga | 👁️ Truth (bocorin chat) | Malam | 1x/malam, berturut-turut |
| | | 🔫 Pistol (bunuh) | **Siang** | **2 peluru** sepanjang game |
| **Seer** | Warga | 🔍 Reveal role target | Setiap malam | Unlimited |
| **Guard** | Warga | 🛡️ Proteksi 1 target | Setiap **2 malam** | Proteksi 2 malam |
| **Hunter** | Warga | 🎯 Tembak target | Malam 2+ | **1x seumur game** |
| **Pedagang** | Warga | 📩 Terima clue Warlock | Pasif | — |

---

## 🎨 Tampilan UI

- Ketika **card action sudah terpakai** atau **tidak tersedia** untuk role tertentu → **di-hide saja** (tidak ditampilkan)

---

## 🔄 Diagram Alur Game

```
HARI 1:
  [Pagi Diskusi] → [Siang Voting] → [Malam]
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                  ▼
               👁️ Seer 🛡️ Guard     🐺 Werewolf    🧙 Warlock
               (reveal) (proteksi)   (belum bisa)   (BELI item)
                    │                 │                  │
                    └─────────────────┼──────────────────┘
                                      ▼
                               [Moderator "Forensik"]
                                      │
                                      ▼
                               ☀️ HARI 2:
                              [Pagi Diskusi]
                         (Death Announcement)
                                      │
                                      ▼
              ┌───────── [Siang Voting] ─────────┐
              │  🔫 Hakim bisa pakai pistol      │
              └──────────────────────────────────┘
                                      │
                                      ▼
                                  [Malam]
                                      │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
    👁️ Seer 🛡️ Guard           🐺 Werewolf 🗡️              🧙 Warlock
    (reveal) (bisa/cooldown)    (BUNUH target)           (PAKAI item)
         └───────────────────── 🎯 Hunter ──────────────────────┘
                                      │
                                      ▼
                               (terus berulang)
```
