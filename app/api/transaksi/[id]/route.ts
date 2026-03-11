import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { Transaksi } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Next.js 15: params is a Promise
type Params = { params: Promise<{ id: string }> }

const parseId = (id: string) => {
  const n = parseInt(id, 10)
  return isNaN(n) ? null : n
}

export async function PUT(req: Request, { params }: Params) {
  const { id: idStr } = await params
  const id = parseId(idStr)
  if (id === null) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  try {
    const body = await req.json()
    if (!body.tanggal || body.nominal === undefined || body.isLunas === undefined)
      return NextResponse.json({ error: 'tanggal, nominal, dan isLunas wajib diisi' }, { status: 400 })

    const updated = await db.update(Transaksi)
      .set({ tanggal: new Date(body.tanggal), nominal: Number(body.nominal), isLunas: Boolean(body.isLunas) })
      .where(eq(Transaksi.id, id)).returning()

    if (!updated[0]) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    return NextResponse.json(updated[0])
  } catch (err) {
    console.error('[PUT /api/transaksi/:id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui transaksi' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id: idStr } = await params
  const id = parseId(idStr)
  if (id === null) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  try {
    const deleted = await db.delete(Transaksi).where(eq(Transaksi.id, id)).returning()
    if (!deleted[0]) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/transaksi/:id]', err)
    const isFk = err instanceof Error && err.message.includes('foreign key')
    if (isFk) return NextResponse.json({ error: 'Tidak bisa hapus karena ada relasi data' }, { status: 400 })
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 })
  }
}
