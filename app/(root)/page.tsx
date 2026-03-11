'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import { StatCard, ListRow, SkeletonList, EmptyState } from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WargaItem { id: number; nama: string; no_hp: string }
interface TransaksiItem {
  id: number; wargaId: number; tanggal: string
  nominal: number; isLunas: boolean
  warga: WargaItem
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

const todayStr = () => new Date().toISOString().split('T')[0]

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const [wargaCount, setWargaCount]   = useState(0)
  const [pendapatan, setPendapatan]   = useState(0)
  const [lunasCount, setLunasCount]   = useState(0)
  const [tunggakCount, setTunggakCount] = useState(0)
  const [recentTrx, setRecentTrx]     = useState<Array<{ id: number; nama: string; nominal: number; tanggal: string; isLunas: boolean }>>([])
  const [todayCount, setTodayCount]   = useState(0)
  const [loading, setLoading]         = useState(true)
  const [greeting, setGreeting]       = useState('Selamat Datang')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12)      setGreeting('Selamat Pagi 🌤')
    else if (h < 15) setGreeting('Selamat Siang ☀️')
    else if (h < 18) setGreeting('Selamat Sore 🌇')
    else             setGreeting('Selamat Malam 🌙')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [wR, tR] = await Promise.all([fetch('/api/warga'), fetch('/api/transaksi')])
      if (!wR.ok || !tR.ok) throw new Error('Fetch failed')
      const [warga, transaksi]: [WargaItem[], TransaksiItem[]] = await Promise.all([wR.json(), tR.json()])

      const today   = todayStr()
      const lunas   = transaksi.filter(t => t.isLunas)
      const tunggak = transaksi.filter(t => !t.isLunas)

      setWargaCount(warga.length)
      setLunasCount(lunas.length)
      setTunggakCount(tunggak.length)
      setPendapatan(tunggak.reduce((s, t) => s + (t.nominal ?? 0), 0))
      setTodayCount(transaksi.filter(t => t.tanggal.startsWith(today)).length)
      setRecentTrx(
        [...transaksi]
          .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
          .slice(0, 6)
          .map(t => ({ id: t.id, nama: t.warga?.nama ?? '-', nominal: t.nominal, tanggal: t.tanggal, isLunas: t.isLunas }))
      )
    } catch (e) {
      console.error('[Dashboard]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const lunasRate = Math.round((lunasCount / Math.max(lunasCount + tunggakCount, 1)) * 100)

  return (
    <div className="page-container anim-slide-up">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div>
          <p className="caption">{greeting}</p>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            RT 14 Sidorejo
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/notifikasi"
            className="relative w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--fill-tertiary)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {tunggakCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: 'var(--ios-red)' }} />
            )}
          </Link>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="px-4 mb-1">
        <div className="grid grid-cols-2 gap-3 stagger">
          <StatCard label="Total Warga" value={loading ? '...' : String(wargaCount)} sublabel="Terdaftar" gradient="grad-blue"
            icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <StatCard label="Total Pendapatan" value={loading ? '...' : `Rp${(pendapatan / 1000).toFixed(0)}K`} sublabel="Terkumpul" gradient="grad-green"
            icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Lunas" value={loading ? '...' : String(lunasCount)} sublabel={`${lunasRate}% dari total`} gradient="grad-purple"
            icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Tunggakan" value={loading ? '...' : String(tunggakCount)} sublabel="Perlu tindakan" gradient="grad-orange"
            icon={<svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="section-header">Aksi Cepat</div>
      <div className="ios-card mx-4">
        <ListRow
          icon={<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
          iconColor="var(--ios-blue)"
          title="Input Pembayaran" subtitle="Rekam transaksi baru" chevron
          onClick={() => router.push('/qrcode')}
        />
        <ListRow
          icon={<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>}
          iconColor="var(--ios-green)"
          title="Tambah Warga" subtitle="Daftarkan warga baru" chevron
          onClick={() => router.push('/warga')}
        />
        <ListRow
          icon={<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
          iconColor="var(--ios-purple)"
          title="Lihat Laporan" subtitle="Analisis & ekspor data" chevron
          onClick={() => router.push('/laporan')}
        />
        <ListRow
          icon={<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          iconColor="var(--ios-teal)"
          title="Rekap Warga" subtitle="Status pembayaran per warga" chevron
          onClick={() => router.push('/pengguna')}
        />
      </div>

      {/* ── Today Activity ── */}
      {!loading && todayCount > 0 && (
        <>
          <div className="section-header">Aktivitas Hari Ini</div>
          <div className="mx-4 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(0,122,255,0.08)' }}>
            <div className="w-10 h-10 rounded-xl grad-blue flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{todayCount}</span>
            </div>
            <div>
              <p className="font-semibold text-[15px]" style={{ color: 'var(--ios-blue)' }}>{todayCount} transaksi hari ini</p>
              <p className="caption">Data terus diperbarui secara real-time</p>
            </div>
          </div>
        </>
      )}

      {/* ── Recent Transactions ── */}
      <div className="section-header">Transaksi Terbaru</div>
      {loading ? (
        <SkeletonList rows={4} />
      ) : recentTrx.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          title="Belum ada transaksi"
          subtitle="Mulai dengan input pembayaran pertama"
        />
      ) : (
        <div className="ios-card mx-4">
          {recentTrx.map(t => (
            <div key={t.id} className="ios-row">
              <div className={`icon-bubble ${t.isLunas ? 'grad-green' : 'grad-orange'}`}>
                {t.isLunas ? (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate">{t.nama}</p>
                <p className="caption mt-0.5">{fmtDate(t.tanggal)}</p>
              </div>
              <div className="ml-2 flex-shrink-0 text-right">
                {t.isLunas
                  ? <span className="ios-badge text-xs font-bold" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--ios-green)' }}>Lunas</span>
                  : <span className="text-sm font-bold" style={{ color: 'var(--ios-orange)' }}>{fmtCurrency(t.nominal)}</span>
                }
              </div>
            </div>
          ))}
          <Link href="/transaksi" className="ios-row justify-center pressable py-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--ios-blue)' }}>Lihat Semua →</span>
          </Link>
        </div>
      )}

      <div className="h-4" />
      <Header />
    </div>
  )
}
