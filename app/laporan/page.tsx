'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import { PageHeader, StatCard } from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrxRaw {
  id: number; wargaId: number; tanggal: string
  nominal: number; isLunas: boolean
  warga: { id: number; nama: string }
}
interface MonthStat {
  month: number; label: string
  pendapatan: number; lunas: number; tunggak: number
}
interface WargaTunggak { nama: string; total: number; count: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtShort = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)

// ─── Component ────────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [raw, setRaw]               = useState<TrxRaw[]>([])
  const [loading, setLoading]       = useState(true)
  const [year, setYear]             = useState(new Date().getFullYear())
  const [monthly, setMonthly]       = useState<MonthStat[]>([])
  const [topTunggak, setTopTunggak] = useState<WargaTunggak[]>([])

  // Derived year list
  const years = [...new Set(raw.map(t => new Date(t.tanggal).getFullYear()))].sort((a, b) => b - a)
  if (!years.includes(year)) years.unshift(year)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/transaksi')
      if (!r.ok) throw new Error()
      setRaw(await r.json())
    } catch (e) {
      console.error('[Laporan]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (raw.length === 0) return
    const months: MonthStat[] = MONTHS.map((label, m) => ({ month: m, label, pendapatan: 0, lunas: 0, tunggak: 0 }))
    const wargaMap: Record<number, WargaTunggak> = {}

    raw
      .filter(t => new Date(t.tanggal).getFullYear() === year)
      .forEach(t => {
        const m = new Date(t.tanggal).getMonth()
        if (t.isLunas) {
          months[m].lunas++
        } else {
          months[m].tunggak++
          months[m].pendapatan += t.nominal
          if (!wargaMap[t.wargaId]) wargaMap[t.wargaId] = { nama: t.warga?.nama ?? '-', total: 0, count: 0 }
          wargaMap[t.wargaId].total += t.nominal
          wargaMap[t.wargaId].count++
        }
      })

    setMonthly(months)
    setTopTunggak(Object.values(wargaMap).sort((a, b) => b.total - a.total).slice(0, 5))
  }, [raw, year])

  const totalPendapatan = monthly.reduce((s, m) => s + m.pendapatan, 0)
  const totalLunas      = monthly.reduce((s, m) => s + m.lunas, 0)
  const totalTunggak    = monthly.reduce((s, m) => s + m.tunggak, 0)
  const tingkatBayar    = Math.round((totalLunas / Math.max(totalLunas + totalTunggak, 1)) * 100)
  const maxPendapatan   = Math.max(...monthly.map(m => m.pendapatan), 1)
  const activeMonths    = monthly.filter(m => m.pendapatan > 0 || m.lunas > 0)

  // ── Export helpers ──
  const exportCSV = (rows: string[][], filename: string) => {
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const exportRingkasan = () => {
    exportCSV([
      [`Laporan Tahunan RT 14 Sidorejo – ${year}`],
      [''],
      ['Bulan', 'Pendapatan', 'Lunas', 'Tunggak'],
      ...activeMonths.map(m => [m.label, String(m.pendapatan), String(m.lunas), String(m.tunggak)]),
      [''],
      ['TOTAL', String(totalPendapatan), String(totalLunas), String(totalTunggak)],
    ], `laporan_${year}.csv`)
  }

  const exportDetail = () => {
    const filtered = raw.filter(t => new Date(t.tanggal).getFullYear() === year)
    exportCSV([
      ['ID', 'Nama', 'Tanggal', 'Nominal', 'Status'],
      ...filtered.map(t => [String(t.id), t.warga?.nama ?? '-', String(t.tanggal).split('T')[0], String(t.nominal), t.isLunas ? 'Lunas' : 'Tunggak']),
    ], `detail_transaksi_${year}.csv`)
  }

  const exportTopTunggak = () => {
    exportCSV([
      ['Nama', 'Total Tunggakan', 'Jumlah Transaksi'],
      ...topTunggak.map(w => [w.nama, String(w.total), String(w.count)]),
    ], `tunggakan_${year}.csv`)
  }

  return (
    <div className="page-container anim-slide-up">
      <PageHeader
        title="Laporan"
        subtitle={`Analisis keuangan ${year}`}
        rightAction={
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-full text-sm font-bold outline-none"
            style={{ background: 'var(--fill-tertiary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-1 stagger">
        <StatCard
          label="Total Pendapatan"
          value={loading ? '...' : fmtShort(totalPendapatan)}
          sublabel={`Tahun ${year}`}
          gradient="grad-blue"
          icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Tingkat Bayar"
          value={loading ? '...' : `${tingkatBayar}%`}
          sublabel="Lunas vs Total"
          gradient="grad-green"
          icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Total Lunas"
          value={loading ? '...' : String(totalLunas)}
          sublabel="Transaksi"
          gradient="grad-purple"
          icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
        />
        <StatCard
          label="Total Tunggak"
          value={loading ? '...' : String(totalTunggak)}
          sublabel="Perlu tindak lanjut"
          gradient="grad-orange"
          icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
      </div>

      {/* Monthly Chart */}
      <div className="section-header">Pendapatan Per Bulan</div>
      <div className="ios-card mx-4 p-4">
        <div className="flex items-end gap-1 h-36">
          {monthly.map((m, i) => {
            const h = m.pendapatan > 0 ? Math.max((m.pendapatan / maxPendapatan) * 100, 8) : 3
            const isCurrent = i === new Date().getMonth() && year === new Date().getFullYear()
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${h}%`,
                    background: isCurrent
                      ? 'var(--ios-blue)'
                      : m.pendapatan > 0
                        ? 'rgba(0,122,255,0.35)'
                        : 'var(--fill-tertiary)',
                  }}
                />
                <span className="text-[8px] font-semibold leading-none" style={{ color: isCurrent ? 'var(--ios-blue)' : 'var(--text-tertiary)' }}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
        {/* X-axis labels with values */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--separator-opaque)' }}>
          <p className="caption text-center">Total: <strong>{fmtCurrency(totalPendapatan)}</strong></p>
        </div>
      </div>

      {/* Top Tunggakan */}
      {topTunggak.length > 0 && (
        <>
          <div className="section-header">Tunggakan Tertinggi</div>
          <div className="ios-card mx-4">
            {topTunggak.map((w, i) => (
              <div key={i} className="ios-row">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white text-xs font-black ${i === 0 ? 'grad-red' : i === 1 ? 'grad-orange' : ''}`}
                  style={i >= 2 ? { background: 'var(--fill-tertiary)', color: 'var(--text-secondary)' } : {}}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>{w.nama}</p>
                  <p className="caption mt-0.5">{w.count} transaksi tunggak</p>
                </div>
                <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: 'var(--ios-red)' }}>
                  {fmtCurrency(w.total)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Monthly Table */}
      {activeMonths.length > 0 && (
        <>
          <div className="section-header">Detail Per Bulan</div>
          <div className="ios-card mx-4 overflow-hidden mb-2">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[320px]">
                <thead>
                  <tr style={{ background: 'var(--fill-tertiary)' }}>
                    {['Bulan', 'Pendapatan', 'Lunas', 'Tunggak'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeMonths.map((m, i) => (
                    <tr key={i} style={{ borderTop: '0.5px solid var(--separator-opaque)' }}>
                      <td className="px-4 py-2.5 font-semibold text-sm">{m.label}</td>
                      <td className="px-4 py-2.5 text-sm font-bold" style={{ color: 'var(--ios-blue)' }}>{fmtCurrency(m.pendapatan)}</td>
                      <td className="px-4 py-2.5 text-sm font-bold" style={{ color: 'var(--ios-green)' }}>{m.lunas}</td>
                      <td className="px-4 py-2.5 text-sm font-bold" style={{ color: 'var(--ios-orange)' }}>{m.tunggak}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '0.5px solid var(--separator-opaque)', background: 'var(--fill-tertiary)' }}>
                    <td className="px-4 py-2.5 font-black text-sm">TOTAL</td>
                    <td className="px-4 py-2.5 text-sm font-black" style={{ color: 'var(--ios-blue)' }}>{fmtCurrency(totalPendapatan)}</td>
                    <td className="px-4 py-2.5 text-sm font-black" style={{ color: 'var(--ios-green)' }}>{totalLunas}</td>
                    <td className="px-4 py-2.5 text-sm font-black" style={{ color: 'var(--ios-orange)' }}>{totalTunggak}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Export Section */}
      <div className="section-header">Ekspor Data</div>
      <div className="ios-card mx-4 mb-6">
        {[
          { label: 'Laporan Ringkasan Tahunan', sub: `CSV · Per bulan · ${year}`, gradient: 'grad-blue', action: exportRingkasan },
          { label: 'Detail Semua Transaksi',    sub: `CSV · Semua data · ${year}`, gradient: 'grad-green', action: exportDetail },
          { label: 'Daftar Tunggakan',          sub: `CSV · Top warga tunggak · ${year}`, gradient: 'grad-orange', action: exportTopTunggak },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="ios-row pressable w-full text-left"
          >
            <div className={`icon-bubble ${item.gradient}`}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
              <p className="caption mt-0.5">{item.sub}</p>
            </div>
            <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      <Header />
    </div>
  )
}
