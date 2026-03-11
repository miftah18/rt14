# RT 14 Sidorejo — Enterprise App

Aplikasi manajemen warga RT 14 Sidorejo dengan tampilan iOS mobile-style.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Auth**: Clerk
- **Database**: Drizzle ORM + Neon PostgreSQL
- **Styling**: Tailwind CSS + Custom iOS Design System
- **Font**: Plus Jakarta Sans (via next/font)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy dan isi environment variables
cp .env.example .env.local
# Edit .env.local dengan key dari Clerk dan Neon

# 3. Push skema database
npm run db:push

# 4. Jalankan development server
npm run dev
```

## Environment Variables (.env.local)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

## Halaman

| Route | Deskripsi |
|-------|-----------|
| `/` | Dashboard — stats, quick actions, transaksi terbaru |
| `/warga` | Manajemen warga — CRUD + QR Code download |
| `/qrcode` | Input pembayaran — form transaksi + session tracker |
| `/transaksi` | Daftar transaksi per warga (expandable) + edit/hapus/CSV |
| `/laporan` | Laporan tahunan — chart, tabel, ekspor CSV |
| `/pengguna` | Rekap status per warga — progress bar, activity dots |
| `/notifikasi` | Notifikasi tunggakan otomatis |

## Struktur Folder

```
app/
  (auth)/           — Sign in / Sign up
  (root)/           — Dashboard
  warga/            — Manajemen warga
  qrcode/           — Input pembayaran
  transaksi/        — Riwayat transaksi
  laporan/          — Laporan & ekspor
  pengguna/         — Rekap warga
  notifikasi/       — Notifikasi
  api/              — REST API routes
components/
  header.tsx        — iOS tab bar (6 tabs)
  ios-ui.tsx        — Komponen iOS-style reusable
  ui/               — ShadCN UI primitives (button, alert, card)
db/
  schema.ts         — Drizzle schema (Warga + Transaksi)
lib/
  drizzle.ts        — Database client
  utils.ts          — cn() utility (clsx + tailwind-merge)
```

## Bug Fixes (v2)

- ✅ Ditambahkan: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `postcss.config.js`
- ✅ Ditambahkan: `lib/utils.ts`, `lib/drizzle.ts`, `db/schema.ts`, `drizzle.config.ts`, `.env.example`
- ✅ `globals.css` — hapus duplikasi Google Fonts @import (font sudah di-load via next/font)
- ✅ `header.tsx` — ganti `dangerouslySetInnerHTML` dengan proper React SVG components
- ✅ `app/(root)/page.tsx` — ganti `window.location.href` dengan `useRouter()` dari next/navigation
- ✅ `app/warga/page.tsx` — fix QRCodeSVG ref (bungkus dalam div, pakai `containerRef.querySelector('svg')`)
- ✅ `app/api/qrcode/route.ts` — ganti `db.query.Transaksi.findMany` dengan LEFT JOIN (tidak perlu relational config)
- ✅ `app/transaksi/page.tsx` — delete dialog gunakan `id` (number) bukan tanggal string sebagai key
- ✅ `app/transaksi/page.tsx` — konsistenkan `value={String(id)}` pada options SelectField
- ✅ `app/laporan/page.tsx` — hapus import `EmptyState`, `SkeletonList` yang tidak dipakai
- ✅ `app/notifikasi/page.tsx` — hapus `readAll` dari `useCallback` deps (mencegah re-fetch loop); tap individual untuk mark read
