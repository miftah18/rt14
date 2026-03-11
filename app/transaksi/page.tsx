'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import {
  PageHeader, SearchBar, AlertBanner, Btn,
  PillFilter, SkeletonList, EmptyState,
  IOSToggle, BottomSheet, SelectField,
} from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WargaRef  { id: number; nama: string }
interface TrxRaw {
  id: number; wargaId: number; tanggal: string
  nominal: number; isLunas: boolean; warga: WargaRef
}
interface TrxEntry { id: number; tanggal: string; nominal: number | null; isLunas: boolean }
interface GroupRow  { wargaId: number; nama: string; items: TrxEntry[]; total: number; lastDate: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const isoDate = (s: string) => new Date(s).toISOString().split('T')[0]

type FilterMode = 'all' | 'lunas' | 'tunggak'

// ─── Component ────────────────────────────────────────────────────────────────
export default function TransaksiPage() {
  const [groups, setGroups]         = useState<GroupRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<FilterMode>('all')
  const [alert, setAlert]           = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [expanded, setExpanded]     = useState<number | null>(null)

  // edit state
  const [editOpen, setEditOpen]     = useState(false)
  const [editGroup, setEditGroup]   = useState<GroupRow | null>(null)
  const [editEntry, setEditEntry]   = useState<TrxEntry | null>(null)
  const [editLunas, setEditLunas]   = useState(false)
  const [editNominal, setEditNominal] = useState('')
  const [saving, setSaving]         = useState(false)

  // delete state — key on id (number), not tanggal string
  const [delOpen, setDelOpen]       = useState(false)
  const [delGroup, setDelGroup]     = useState<GroupRow | null>(null)
  const [delEntryId, setDelEntryId] = useState<number | null>(null)

  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => setAlert(null), 3500)
    return () => clearTimeout(t)
  }, [alert])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/transaksi')
      if (!r.ok) throw new Error()
      const data: TrxRaw[] = await r.json()

      const map: Record<number, GroupRow> = {}
      data.forEach(t => {
        const d = isoDate(t.tanggal)
        if (!map[t.wargaId]) {
          map[t.wargaId] = { wargaId: t.wargaId, nama: t.warga?.nama ?? '-', items: [], total: 0, lastDate: d }
        }
        map[t.wargaId].items.push({
          id: t.id,
          tanggal: d,
          nominal: t.isLunas ? null : t.nominal,
          isLunas: t.isLunas,
        })
        if (!t.isLunas) map[t.wargaId].total += t.nominal
        if (d > map[t.wargaId].lastDate) map[t.wargaId].lastDate = d
      })

      const sorted = Object.values(map)
        .map(g => ({ ...g, items: g.items.sort((a, b) => b.tanggal.localeCompare(a.tanggal)) }))
        .sort((a, b) => b.lastDate.localeCompare(a.lastDate))

      setGroups(sorted)
    } catch {
      setAlert({ type: 'error', message: 'Gagal memuat data transaksi' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── open edit ──
  const openEdit = (g: GroupRow) => {
    setEditGroup(g)
    const first = g.items[0]
    setEditEntry(first)
    setEditLunas(first.isLunas)
    setEditNominal(first.nominal != null ? String(first.nominal) : '')
    setEditOpen(true)
  }

  // When user picks a different entry in the edit select
  const handleEditEntryChange = (idStr: string) => {
    const found = editGroup?.items.find(i => i.id === parseInt(idStr, 10))
    if (!found) return
    setEditEntry(found)
    setEditLunas(found.isLunas)
    setEditNominal(found.nominal != null ? String(found.nominal) : '')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEntry) return
    setSaving(true)
    try {
      const r = await fetch(`/api/transaksi/${editEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal:  editEntry.tanggal,
          nominal:  editLunas ? 0 : parseFloat(editNominal) || 0,
          isLunas:  editLunas,
        }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error ?? 'Gagal memperbarui')
      }
      setAlert({ type: 'success', message: 'Transaksi berhasil diperbarui' })
      setEditOpen(false)
      await fetchData()
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Gagal memperbarui' })
    } finally {
      setSaving(false)
    }
  }

  // ── open delete ── (fixed: key on id not tanggal)
  const openDelete = (g: GroupRow) => {
    setDelGroup(g)
    // Default to the latest (first after sort desc) item
    setDelEntryId(g.items[0]?.id ?? null)
    setDelOpen(true)
  }

  const handleDelete = async () => {
    if (delEntryId === null) return
    try {
      const r = await fetch(`/api/transaksi/${delEntryId}`, { method: 'DELETE' })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error ?? 'Gagal menghapus')
      }
      setAlert({ type: 'success', message: 'Transaksi berhasil dihapus' })
      setDelOpen(false)
      setDelGroup(null)
      setDelEntryId(null)
      await fetchData()
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menghapus' })
    }
  }

  // ── CSV export ──
  const exportCSV = (g: GroupRow) => {
    const rows = [
      ['Nama', 'Tanggal', 'Nominal', 'Status'],
      ...g.items.map(i => [g.nama, i.tanggal, i.isLunas ? 'Lunas' : String(i.nominal ?? 0), i.isLunas ? 'Lunas' : 'Tunggak']),
    ]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `transaksi_${g.nama}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── filter + search ──
  const filtered = groups.filter(g => {
    const matchSearch = g.nama.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'lunas'   ? g.items.some(i => i.isLunas) :
                             g.items.some(i => !i.isLunas)
    return matchSearch && matchFilter
  })

  const totalAll     = groups.reduce((s, g) => s + g.total, 0)
  const lunasCount   = groups.filter(g => g.items.some(i => i.isLunas)).length
  const tunggakCount = groups.filter(g => g.items.some(i => !i.isLunas)).length

  return (
    <div className="page-container anim-slide-up">
      <PageHeader title="Transaksi" subtitle={`${groups.length} warga · ${fmtCurrency(totalAll)}`} />

      <SearchBar value={search} onChange={setSearch} placeholder="Cari nama warga..." />

      <PillFilter<FilterMode>
        options={[
          { value: 'all',     label: 'Semua' },
          { value: 'lunas',   label: 'Lunas',    color: 'var(--ios-green)' },
          { value: 'tunggak', label: 'Tunggakan', color: 'var(--ios-orange)' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mx-4 mb-4">
        {[
          { label: 'Lunas',   val: lunasCount,   color: 'var(--ios-green)' },
          { label: 'Tunggak', val: tunggakCount, color: 'var(--ios-orange)' },
          { label: 'Total',   val: `Rp${(totalAll/1000).toFixed(0)}K`, color: 'var(--ios-blue)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.val}</p>
            <p className="caption mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          title="Tidak ada transaksi"
          subtitle={filter !== 'all' ? 'Coba ubah filter' : 'Belum ada data transaksi'}
        />
      ) : (
        <div className="space-y-2 mx-4 mb-4">
          {filtered.map(g => {
            const isExp      = expanded === g.wargaId
            const hasLunas   = g.items.some(i => i.isLunas)
            const hasTunggak = g.items.some(i => !i.isLunas)

            return (
              <div key={g.wargaId} className="ios-card overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center px-4 py-3 pressable"
                  onClick={() => setExpanded(isExp ? null : g.wargaId)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm ${hasLunas && !hasTunggak ? 'grad-green' : hasTunggak ? 'grad-orange' : 'grad-blue'}`}>
                    <span className="text-white font-bold text-sm">{g.nama.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>{g.nama}</p>
                    <p className="caption mt-0.5">{g.items.length} transaksi · {fmtDate(g.lastDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {hasLunas && !hasTunggak ? (
                      <span className="ios-badge text-xs" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--ios-green)' }}>Lunas</span>
                    ) : (
                      <span className="text-sm font-bold" style={{ color: 'var(--ios-orange)' }}>{fmtCurrency(g.total)}</span>
                    )}
                    <svg
                      className="w-4 h-4 transition-transform duration-200"
                      style={{ opacity: 0.3, transform: isExp ? 'rotate(90deg)' : 'none' }}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div className="border-t" style={{ borderColor: 'var(--separator-opaque)' }}>
                    <div className="px-4 py-2 space-y-1.5">
                      {g.items.map(item => (
                        <div key={item.id} className="flex items-center py-1">
                          <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${item.isLunas ? 'bg-green-400' : 'bg-orange-400'}`} />
                          <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{fmtDate(item.tanggal)}</span>
                          <span className="text-sm font-semibold" style={{ color: item.isLunas ? 'var(--ios-green)' : 'var(--ios-orange)' }}>
                            {item.isLunas ? 'Lunas' : fmtCurrency(item.nominal ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 px-4 pb-3 pt-1 border-t" style={{ borderColor: 'var(--separator-opaque)' }}>
                      <button
                        onClick={() => openEdit(g)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => openDelete(g)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(255,59,48,0.10)', color: 'var(--ios-red)' }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        Hapus
                      </button>
                      <button
                        onClick={() => exportCSV(g)}
                        className="w-11 flex items-center justify-center py-2.5 rounded-xl"
                        style={{ background: 'var(--fill-tertiary)', color: 'var(--ios-blue)' }}
                        title="Download CSV"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Edit Sheet ── */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit Transaksi">
        <form onSubmit={handleSave} className="px-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Warga</label>
            <input value={editGroup?.nama ?? ''} disabled className="ios-input" />
          </div>

          {/* Fixed: options use id (number as string) as value */}
          <SelectField
            label="Pilih Transaksi"
            value={editEntry ? String(editEntry.id) : ''}
            onChange={handleEditEntryChange}
          >
            {editGroup?.items.map(i => (
              <option key={i.id} value={String(i.id)}>{fmtDate(i.tanggal)}</option>
            ))}
          </SelectField>

          <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--fill-tertiary)' }}>
            <IOSToggle
              checked={editLunas}
              onChange={v => { setEditLunas(v); if (v) setEditNominal('') }}
              label="Tandai Lunas"
            />
          </div>

          {!editLunas && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Nominal (Rp)</label>
              <input
                type="number"
                value={editNominal}
                onChange={e => setEditNominal(e.target.value)}
                className="ios-input"
                min="1"
                placeholder="Masukkan nominal"
              />
            </div>
          )}

          <div className="flex gap-3 pt-1 pb-2">
            <Btn variant="secondary" onClick={() => setEditOpen(false)} fullWidth>Batal</Btn>
            <Btn type="submit" loading={saving} fullWidth>Simpan</Btn>
          </div>
        </form>
      </BottomSheet>

      {/* ── Delete Sheet — keyed on id not tanggal string ── */}
      <BottomSheet open={delOpen} onClose={() => { setDelOpen(false); setDelGroup(null); setDelEntryId(null) }} title="Hapus Transaksi">
        <div className="px-5 space-y-4 pb-4">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Pilih transaksi <strong>{delGroup?.nama}</strong> yang akan dihapus:
          </p>
          <SelectField
            label="Transaksi"
            value={delEntryId ? String(delEntryId) : ''}
            onChange={v => setDelEntryId(parseInt(v, 10))}
          >
            {delGroup?.items.map(i => (
              <option key={i.id} value={String(i.id)}>{fmtDate(i.tanggal)} — {i.isLunas ? 'Lunas' : fmtCurrency(i.nominal ?? 0)}</option>
            ))}
          </SelectField>
          <div className="flex gap-3">
            <Btn variant="secondary" onClick={() => { setDelOpen(false); setDelGroup(null); setDelEntryId(null) }} fullWidth>Batal</Btn>
            <Btn variant="danger" onClick={handleDelete} fullWidth>Hapus</Btn>
          </div>
        </div>
      </BottomSheet>

      <Header />
    </div>
  )
}
