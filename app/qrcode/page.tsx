'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/header'
import { PageHeader, AlertBanner, Btn, InputField, SelectField, IOSToggle, BottomSheet } from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Warga { id: number; nama: string; no_hp: string }
interface SessionEntry {
  key: number
  nama: string
  nominal: number
  isLunas: boolean
  waktu: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const todayStr = () => new Date().toISOString().split('T')[0]
const timeNow  = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

// ─── Component ────────────────────────────────────────────────────────────────
export default function QRCodePage() {
  const [warga, setWarga]           = useState<Warga[]>([])
  const [formOpen, setFormOpen]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert]           = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [session, setSession]       = useState<SessionEntry[]>([])

  // form fields
  const [selWarga, setSelWarga] = useState('')
  const [nominal, setNominal]   = useState('')
  const [tanggal, setTanggal]   = useState(todayStr())
  const [isLunas, setIsLunas]   = useState(false)

  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => setAlert(null), 3500)
    return () => clearTimeout(t)
  }, [alert])

  const fetchWarga = useCallback(async () => {
    try {
      const r = await fetch('/api/warga')
      if (!r.ok) throw new Error()
      setWarga(await r.json())
    } catch {
      setAlert({ type: 'error', message: 'Gagal memuat data warga' })
    } finally {
      // setLoadingWarga(false)
    }
  }, [])

  useEffect(() => { fetchWarga() }, [fetchWarga])

  const resetForm = () => {
    setSelWarga('')
    setNominal('')
    setIsLunas(false)
    setTanggal(todayStr())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selWarga) return setAlert({ type: 'error', message: 'Pilih nama warga terlebih dahulu' })
    if (!isLunas && (!nominal || parseFloat(nominal) <= 0))
      return setAlert({ type: 'error', message: 'Masukkan nominal pembayaran yang valid' })

    setSubmitting(true)
    try {
      const r = await fetch('/api/qrcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wargaId: parseInt(selWarga),
          nominal: isLunas ? 0 : parseFloat(nominal),
          tanggal,
          isLunas,
        }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error ?? 'Gagal menyimpan')
      }

      const found = warga.find(w => w.id === parseInt(selWarga))
      setSession(prev => [{
        key: Date.now(),
        nama:    found?.nama ?? '-',
        nominal: parseFloat(nominal) || 0,
        isLunas,
        waktu:   timeNow(),
      }, ...prev.slice(0, 9)])

      setAlert({ type: 'success', message: `Pembayaran ${found?.nama} berhasil disimpan` })
      setFormOpen(false)
      resetForm()
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menyimpan' })
    } finally {
      setSubmitting(false)
    }
  }

  const sessionTotal = session.filter(s => !s.isLunas).reduce((sum, s) => sum + s.nominal, 0)

  return (
    <div className="page-container anim-slide-up">
      <PageHeader title="Input Pembayaran" subtitle="Rekam transaksi warga" />

      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* CTA Card */}
      <div className="mx-4">
        <button
          onClick={() => setFormOpen(true)}
          className="w-full py-6 rounded-2xl flex items-center justify-center gap-4 grad-blue shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-lg leading-tight">Tambah Transaksi</p>
            <p className="text-white/70 text-sm mt-0.5">Tap untuk input pembayaran baru</p>
          </div>
        </button>
      </div>

      {/* Session Summary */}
      <div className="section-header">Ringkasan Sesi Ini</div>
      <div className="grid grid-cols-3 gap-3 mx-4 mb-2">
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--ios-blue)' }}>{session.length}</p>
          <p className="caption mt-0.5">Input</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--ios-green)' }}>{session.filter(s => s.isLunas).length}</p>
          <p className="caption mt-0.5">Lunas</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--ios-orange)' }}>{session.filter(s => !s.isLunas).length}</p>
          <p className="caption mt-0.5">Tunggak</p>
        </div>
      </div>

      {sessionTotal > 0 && (
        <div className="mx-4 mb-1 px-4 py-3 rounded-xl" style={{ background: 'rgba(52,199,89,0.10)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--ios-green)' }}>
            Total terkumpul sesi ini: <strong>{fmtCurrency(sessionTotal)}</strong>
          </p>
        </div>
      )}

      {/* Session List */}
      {session.length > 0 && (
        <>
          <div className="section-header">Baru Diinput</div>
          <div className="ios-card mx-4 mb-4">
            {session.map(s => (
              <div key={s.key} className="ios-row">
                <div className={`icon-bubble ${s.isLunas ? 'grad-green' : 'grad-orange'}`}>
                  {s.isLunas ? (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>{s.nama}</p>
                  <p className="caption mt-0.5">{s.waktu}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {s.isLunas ? (
                    <span className="ios-badge text-xs" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--ios-green)' }}>Lunas</span>
                  ) : (
                    <span className="text-sm font-bold" style={{ color: 'var(--ios-orange)' }}>{fmtCurrency(s.nominal)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form Bottom Sheet */}
      <BottomSheet open={formOpen} onClose={() => { setFormOpen(false); resetForm() }} title="Form Pembayaran">
        <form onSubmit={handleSubmit} className="px-5 space-y-4">
          {/* Warga select */}
          <SelectField label="Nama Warga" value={selWarga} onChange={setSelWarga} required placeholder="Pilih warga...">
            {warga.map(w => <option key={w.id} value={String(w.id)}>{w.nama}</option>)}
          </SelectField>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Tanggal <span style={{ color: 'var(--ios-red)' }}>*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              required
              className="ios-input"
            />
          </div>

          {/* Toggle Lunas */}
          <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--fill-tertiary)' }}>
            <IOSToggle checked={isLunas} onChange={setIsLunas} label="Tandai Lunas" />
          </div>

          {/* Nominal – only show when not lunas */}
          {!isLunas && (
            <InputField
              label="Nominal (Rp)"
              value={nominal}
              onChange={setNominal}
              type="number"
              placeholder="Contoh: 50000"
              min="1"
              required
            />
          )}

          <div className="flex gap-3 pt-1 pb-2">
            <Btn variant="secondary" onClick={() => { setFormOpen(false); resetForm() }} fullWidth>Batal</Btn>
            <Btn type="submit" loading={submitting} fullWidth>Simpan</Btn>
          </div>
        </form>
      </BottomSheet>

      <Header />
    </div>
  )
}
