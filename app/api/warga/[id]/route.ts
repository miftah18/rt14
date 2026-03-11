import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { Warga } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Next.js 15: params is a Promise
type Params = { params: Promise<{ id: string }> }

const parseId = (id: string) => {
  const n = parseInt(id, 10)
  return isNaN(n) ? null : n
}

export async function GET(_: Request, { params }: Params) {
  const { id: idStr } = await params
  const id = parseId(idStr)
  if (id === null) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  try {
    const rows = await db.select().from(Warga).where(eq(Warga.id, id))
    if (!rows[0]) return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('[GET /api/warga/:id]', err)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { id: idStr } = await params
  const id = parseId(idStr)
  if (id === null) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  try {
    const body = await req.json()
    const nama = body.nama?.trim()
    if (!nama || !body.no_hp) return NextResponse.json({ error: 'Nama dan nomor HP wajib diisi' }, { status: 400 })

    const updated = await db.update(Warga).set({ nama, no_hp: body.no_hp }).where(eq(Warga.id, id)).returning()
    if (!updated[0]) return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 })
    return NextResponse.json(updated[0])
  } catch (err) {
    console.error('[PUT /api/warga/:id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui data' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id: idStr } = await params
  const id = parseId(idStr)
  if (id === null) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  try {
    await db.delete(Warga).where(eq(Warga.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/warga/:id]', err)
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 })
  }
}
