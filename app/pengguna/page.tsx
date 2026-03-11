'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import { PageHeader, SearchBar, PillFilter, SkeletonList, EmptyState } from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrxRaw {
  id: number; wargaId: number; tanggal: string
  nominal: number; isLunas: boolean
  warga: { id: number; nama: string }
}
interface WargaProgress {
  wargaId: number; nama: string
  totalTrx: number; lunas: number; tunggak: number
  totalBayar: number; persentase: number
  dots: Array<{ tanggal: string; isLunas: boolean; nominal: number }>
}

type SortMode = 'nama' | 'bayar' | 'persen'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtShortDate = (s: string) => {
  const d = new Date(s)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PenggunaPage() {
  const [data, setData]     = useState<WargaProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState<SortMode>('nama')
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/transaksi')
      if (!r.ok) throw new Error()
      const raw: TrxRaw[] = await r.json()

      const map: Record<number, WargaProgress> = {}
      raw.forEach(t => {
        const d = new Date(t.tanggal).toISOString().split('T')[0]
        if (!map[t.wargaId]) {
          map[t.wargaId] = { wargaId: t.wargaId, nama: t.warga?.nama ?? '-', totalTrx: 0, lunas: 0, tunggak: 0, totalBayar: 0, persentase: 0, dots: [] }
        }
        const entry = map[t.wargaId]
        entry.totalTrx++
        entry.dots.push({ tanggal: d, isLunas: t.isLunas, nominal: t.nominal })
        if (t.isLunas) { entry.lunas++ }
        else { entry.tunggak++; entry.totalBayar += t.nominal }
      })

      const result = Object.values(map).map(w => ({
        ...w,
        persentase: w.totalTrx > 0 ? Math.round((w.lunas / w.totalTrx) * 100) : 0,
        dots: w.dots.sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
      }))

      setData(result)
    } catch (e) {
      console.error('[Pengguna]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const sorted = [...data]
    .filter(w => w.nama.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'bayar')  return b.totalBayar - a.totalBayar
      if (sort === 'persen') return b.persentase - a.persentase
      return a.nama.localeCompare(b.nama)
    })

  const avgPersen = data.length > 0
    ? Math.round(data.reduce((s, w) => s + w.persentase, 0) / data.length)
    : 0

  const getColor = (p: number) =>
    p >= 80 ? 'var(--ios-green)' : p >= 40 ? 'var(--ios-orange)' : 'var(--ios-red)'

  const getGradient = (p: number) =>
    p >= 80 ? 'grad-green' : p >= 40 ? 'grad-orange' : 'grad-red'

  return (
    <div className="page-container anim-slide-up">
      <PageHeader
        title="Rekap Warga"
        subtitle={`${data.length} warga · Rata-rata ${avgPersen}% lunas`}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Cari nama warga..." />

      <PillFilter<SortMode>
        options={[
          { value: 'nama',   label: 'A–Z' },
          { value: 'persen', label: '% Lunas',     color: 'var(--ios-green)' },
          { value: 'bayar',  label: 'Pembayaran',   color: 'var(--ios-orange)' },
        ]}
        value={sort}
        onChange={setSort}
      />

      {/* Overall Progress */}
      <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>Progres Keseluruhan</span>
          <span className="font-bold text-sm" style={{ color: 'var(--ios-blue)' }}>{avgPersen}%</span>
        </div>
        <div className="ios-progress-track">
          <div className="ios-progress-fill grad-blue" style={{ width: `${avgPersen}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="caption">{data.filter(w => w.lunas > 0).length} ada pembayaran</span>
          <span className="caption">{data.filter(w => w.tunggak > 0).length} ada tunggakan</span>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={6} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title={search ? 'Tidak ditemukan' : 'Belum ada data'}
          subtitle={search ? 'Coba kata kunci lain' : 'Data akan muncul setelah ada transaksi'}
        />
      ) : (
        <div className="space-y-2 mx-4 mb-6">
          {sorted.map(w => {
            const isExp  = expanded === w.wargaId
            const color  = getColor(w.persentase)
            const grad   = getGradient(w.persentase)
            const dotsToShow = w.dots.slice(-24)

            return (
              <div
                key={w.wargaId}
                className="ios-card overflow-hidden"
              >
                {/* Card header – tappable to expand */}
                <div
                  className="p-4 pressable"
                  onClick={() => setExpanded(isExp ? null : w.wargaId)}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm ${grad}`}>
                      <span className="text-white font-bold text-sm">{w.nama.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>{w.nama}</p>
                      <p className="caption mt-0.5">{w.lunas} lunas · {w.tunggak} tunggak</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-xl font-black" style={{ color }}>{w.persentase}%</p>
                      {w.totalBayar > 0 && <p className="caption">{fmtCurrency(w.totalBayar)}</p>}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="ios-progress-track mb-3">
                    <div className={`ios-progress-fill ${grad}`} style={{ width: `${w.persentase}%` }} />
                  </div>

                  {/* Activity dots */}
                  <div className="flex flex-wrap gap-1">
                    {dotsToShow.map((d, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: d.isLunas ? 'rgba(52,199,89,0.15)' : 'rgba(255,149,0,0.15)' }}
                        title={`${fmtShortDate(d.tanggal)} – ${d.isLunas ? 'Lunas' : fmtCurrency(d.nominal)}`}
                      >
                        {d.isLunas ? (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--ios-green)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-[7px] font-black leading-none" style={{ color: 'var(--ios-orange)' }}>Rp</span>
                        )}
                      </div>
                    ))}
                    {w.dots.length > 24 && (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold"
                        style={{ background: 'var(--fill-tertiary)', color: 'var(--text-tertiary)' }}
                      >
                        +{w.dots.length - 24}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded: transaction list */}
                {isExp && (
                  <div className="border-t px-4 py-3" style={{ borderColor: 'var(--separator-opaque)' }}>
                    <p className="caption mb-2">Riwayat {w.dots.length} Transaksi</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                      {w.dots.slice().reverse().map((d, i) => (
                        <div key={i} className="flex items-center py-0.5">
                          <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${d.isLunas ? 'bg-green-400' : 'bg-orange-400'}`} />
                          <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{d.tanggal}</span>
                          <span className="text-xs font-semibold" style={{ color: d.isLunas ? 'var(--ios-green)' : 'var(--ios-orange)' }}>
                            {d.isLunas ? 'Lunas' : fmtCurrency(d.nominal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Header />
    </div>
  )
}
