import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { Transaksi, Warga } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET — semua transaksi dengan data warga (via LEFT JOIN, tidak butuh db.query relational)
export async function GET() {
  try {
    const rows = await db
      .select({
        id:      Transaksi.id,
        wargaId: Transaksi.wargaId,
        tanggal: Transaksi.tanggal,
        nominal: Transaksi.nominal,
        isLunas: Transaksi.isLunas,
        warga:   Warga,
      })
      .from(Transaksi)
      .leftJoin(Warga, eq(Transaksi.wargaId, Warga.id))
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[GET /api/qrcode]', err)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// POST — simpan transaksi baru
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.wargaId)            return NextResponse.json({ error: 'wargaId wajib diisi' },  { status: 400 })
    if (!body.tanggal)            return NextResponse.json({ error: 'tanggal wajib diisi' },  { status: 400 })
    if (body.nominal === undefined) return NextResponse.json({ error: 'nominal wajib diisi' }, { status: 400 })

    const created = await db.insert(Transaksi).values({
      wargaId: Number(body.wargaId),
      tanggal: new Date(body.tanggal),
      nominal: Number(body.nominal),
      isLunas: Boolean(body.isLunas),
    }).returning()

    return NextResponse.json(created[0], { status: 201 })
  } catch (err) {
    console.error('[POST /api/qrcode]', err)
    return NextResponse.json({ error: 'Gagal menyimpan transaksi' }, { status: 500 })
  }
}
