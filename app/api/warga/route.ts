import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { Warga } from '@/db/schema'

export async function GET() {
  try {
    const result = await db.select().from(Warga)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/warga]', err)
    return NextResponse.json({ error: 'Gagal mengambil data warga' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nama = body.nama?.trim()

    if (!nama)                      return NextResponse.json({ error: 'Nama wajib diisi' },               { status: 400 })
    if (!body.no_hp)                return NextResponse.json({ error: 'Nomor HP wajib diisi' },           { status: 400 })
    if (!/^\d+$/.test(body.no_hp)) return NextResponse.json({ error: 'Nomor HP harus berupa angka' },    { status: 400 })
    if (!body.barcodeId)            return NextResponse.json({ error: 'barcodeId wajib diisi' },          { status: 400 })

    const created = await db.insert(Warga).values({ nama, no_hp: body.no_hp, barcodeId: body.barcodeId }).returning()
    return NextResponse.json(created[0], { status: 201 })
  } catch (err) {
    console.error('[POST /api/warga]', err)
    const isDup = err instanceof Error && err.message.includes('duplicate key value')
    if (isDup) return NextResponse.json({ error: 'Nomor HP atau barcodeId sudah terdaftar' }, { status: 409 })
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 })
  }
}
