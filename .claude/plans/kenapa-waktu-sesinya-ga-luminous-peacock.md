# Plan: Satukan Skip Vote dan Status Suara Terkirim

## Context

Status "✓ Suara Terkirim" saat ini di-render di atas FAB bar sebagai card terpisah. User ingin menyatukannya dengan tombol "Skip Vote":
- Jika belum vote/skip → Tampilkan tombol "Skip Vote" (aktif, abu-abu).
- Jika sudah vote/skip → Tombol tersebut berubah wujud menjadi bar status non-aktif "✓ Suara Terkirim" (emerald theme) dalam posisi yang sama.
- Hapus info vote card terpisah yang lama.

---

## Solusi

Satu file dimodifikasi: **`src/pages/GameBoard.jsx`**

### 1. Hapus info vote lama
Hapus render block `isVotingTime && hasActed` di line 180-188:
```jsx
{isVotingTime && hasActed && (
  <div className="p-4 max-w-2xl mx-auto">
    <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-[2.5rem] ...">
       ...
    </div>
  </div>
)}
```

### 2. Update FAB logic di bottom layer

Di dalam bottom layer layout (`isVotingTime && !isDead`):
- Jika `!hasActed` → render button `Skip Vote` + `Kembali`
- Jika `hasActed` → render bar status `Suara Terkirim` + `Kembali`

```jsx
{isVotingTime && !isDead && (
  <>
    {hasActed ? (
      <div className="w-full py-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg">
        ✓ Suara Terkirim
      </div>
    ) : (
      <button
        onClick={() => handleAction('skip')}
        className="w-full py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-700 active:scale-[0.98] transition-all shadow-lg"
      >
        ⏭️ Skip Vote
      </button>
    )}
    <button
      onClick={onBack}
      className="w-full py-3.5 bg-slate-900 border border-blue-500/30 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:border-blue-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
    >
      <ArrowLeft size={14} /> Kembali
    </button>
  </>
)}
```

Dan untuk kondisi non-siang / mati:
```jsx
{(!isVotingTime || isDead) && (
  <button
    onClick={onBack}
    ...
  >
    Kembali
  </button>
)}
```

## File yang Dimodifikasi
- `src/pages/GameBoard.jsx` — satukan skip vote dan status suara terkirim, hapus info card terpisah

## Verifikasi
1. Masuk siang → card skip vote "Skip Vote" (abu) muncul
2. Klik skip atau klik player → card berubah jadi "✓ Suara Terkirim" (hijau)
3. Spacing, border, dan layout tetap stabil dan konsisten
