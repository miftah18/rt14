'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import { PageHeader, EmptyState } from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrxRaw {
  id: number; wargaId: number; tanggal: string
  nominal: number; isLunas: boolean
  warga: { id: number; nama: string }
}
interface Notif {
  id: string
  type: 'tunggak' | 'lunas' | 'info'
  title: string
  body: string
  time: string
  read: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotifikasiPage() {
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  // Fixed: loadData does NOT depend on notif state, preventing re-fetch loop
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const r    = await fetch('/api/transaksi')
      const raw: TrxRaw[] = await r.json()

      const generated: Notif[] = []

      // Group tunggakan by warga
      const byWarga: Record<number, TrxRaw[]> = {}
      raw.forEach(t => {
        if (!byWarga[t.wargaId]) byWarga[t.wargaId] = []
        byWarga[t.wargaId].push(t)
      })

      Object.values(byWarga).forEach(trxs => {
        const tunggak = trxs.filter(t => !t.isLunas)
        if (tunggak.length === 0) return
        const latest = [...tunggak].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0]
        const total  = tunggak.reduce((s, t) => s + t.nominal, 0)
        generated.push({
          id:    `tunggak-${latest.wargaId}`,
          type:  'tunggak',
          title: `Tunggakan – ${latest.warga?.nama ?? '-'}`,
          body:  `${tunggak.length} transaksi belum lunas, total ${fmtCurrency(total)}`,
          time:  fmtDate(latest.tanggal),
          read:  false,
        })
      })

      // 3 transaksi lunas terbaru sebagai konfirmasi
      const recentLunas = raw
        .filter(t => t.isLunas)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, 3)

      recentLunas.forEach(t => {
        generated.push({
          id:    `lunas-${t.id}`,
          type:  'lunas',
          title: `Lunas – ${t.warga?.nama ?? '-'}`,
          body:  `Pembayaran pada ${fmtDate(t.tanggal)} telah dikonfirmasi lunas`,
          time:  fmtDate(t.tanggal),
          read:  true, // lunas notifs already "read"
        })
      })

      // System info
      generated.push({
        id:    'info-system',
        type:  'info',
        title: 'Sistem RT 14 Enterprise',
        body:  `Data terakhir diperbarui: ${new Date().toLocaleString('id-ID')}`,
        time:  'Baru saja',
        read:  false,
      })

      // Sort: unread first
      setNotifs(generated.sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0)))
    } catch (e) {
      console.error('[Notifikasi]', e)
    } finally {
      setLoading(false)
    }
  }, []) // Fixed: empty deps — no state in deps

  useEffect(() => { loadData() }, [loadData])

  // Fixed: mark all read only updates local state, no re-fetch
  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  const typeConfig = {
    tunggak: { icon: '⚠', bgIcon: 'rgba(255,149,0,0.15)',  colorIcon: 'var(--ios-orange)' },
    lunas:   { icon: '✓', bgIcon: 'rgba(52,199,89,0.15)',  colorIcon: 'var(--ios-green)' },
    info:    { icon: 'ℹ', bgIcon: 'rgba(0,122,255,0.15)', colorIcon: 'var(--ios-blue)' },
  }

  return (
    <div className="page-container anim-slide-up">
      <PageHeader
        title="Notifikasi"
        subtitle={unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="text-sm font-semibold px-3 py-1.5 rounded-full"
              style={{ color: 'var(--ios-blue)', background: 'rgba(0,122,255,0.10)' }}
            >
              Tandai Semua
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="ios-card mx-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ios-row">
              <div className="ios-skeleton w-10 h-10 rounded-xl mr-3 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="ios-skeleton h-4 rounded w-3/4" />
                <div className="ios-skeleton h-3 rounded w-full" />
                <div className="ios-skeleton h-3 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          }
          title="Tidak ada notifikasi"
          subtitle="Semua transaksi sudah berjalan lancar"
        />
      ) : (
        <div className="ios-card mx-4 mb-4">
          {notifs.map(n => {
            const cfg = typeConfig[n.type]
            return (
              <div
                key={n.id}
                className="ios-row pressable"
                style={{ background: n.read ? 'var(--bg-card)' : 'rgba(0,122,255,0.04)' }}
                onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 text-base font-bold"
                  style={{ background: cfg.bgIcon, color: cfg.colorIcon }}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[15px] leading-tight" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--ios-blue)' }} />
                    )}
                  </div>
                  <p className="caption mt-1" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{n.body}</p>
                  <p className="mt-1" style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>{n.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Header />
    </div>
  )
}
