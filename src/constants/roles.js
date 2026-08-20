export const TEAM_SERIGALA = [
  { name: "Werewolf", desc: "Memilih 1 target untuk dibunuh setiap malam. Harus berkoordinasi secara rahasia." },
  { name: "Warlock", desc: "Penyihir Bayaran. Bisa menggunakan Vision (Cek Role) atau Poison (Membunuh), WAJIB beli ke Pedagang via Moderator." }
];

export const TEAM_WARGA = [
  { name: "Seer", desc: "Mengetahui role asli 1 pemain setiap malam.", type: "Special" },
  { name: "Guard", desc: "Menjaga 1 pemain agar tidak mati selama 2 malam.", type: "Special" },
  { name: "Hakim", desc: "Memiliki skill Truth (paksa jujur) dan wajib berkata 'WAHAI RAKYATKU' sebelum memberikan keputusan.", type: "Special" },
  { name: "Hunter", desc: "Jika menembak Serigala, ia selamat. Jika salah tembak warga, ia ikut mati.", type: "Special" },
  { name: "Pedagang", desc: "Warga biasa yang menjual dagangan untuk Warlock. Meninggalkan jejak warlock setelah transaksi.", type: "Civilian" }
];

// Peran Independen
export const ROLE_MODERATOR = {
  name: "Moderator",
  desc: "Tuhan dalam permainan. Mengatur siklus hari, memproses transaksi Warlock, memberikan petunjuk, memimpin eksekusi publik, dan narator."
};

export const TEAM_JOKER = [
  { name: "Joker", desc: "Badut pembawa bom yang menang jika berhasil membuat dirinya dieksekusi pada voting siang hari.", type: "Independent" }
];

export const TEAM_LAINNYA = [
  { name: "Lovers", desc: "Mencari pasangan di malam ke-2. Tim dan nasibnya akan terikat dengan pasangannya.", type: "Independent" }
];