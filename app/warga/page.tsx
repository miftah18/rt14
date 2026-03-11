'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Header from '@/components/header'
import {
  PageHeader, SearchBar, AlertBanner,
  Btn, InputField, EmptyState, SkeletonList,
  ConfirmDialog, BottomSheet,
} from '@/components/ios-ui'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Warga { id: number; nama: string; no_hp: string }

// ─── Component ────────────────────────────────────────────────────────────────
export default function WargaPage() {
  const [warga, setWarga]               = useState<Warga[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [alert, setAlert]               = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<Warga | null>(null)
  const [nama, setNama]                 = useState('')
  const [noHp, setNoHp]                 = useState('')
  const [saving, setSaving]             = useState(false)

  // QR state — fix: wrap QRCode in a div and use containerRef
  const [qrOpen, setQrOpen]             = useState(false)
  const [qrWarga, setQrWarga]           = useState<Warga | null>(null)
  const qrContainerRef                  = useRef<HTMLDivElement | null>(null)

  // Delete state
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Warga | null>(null)

  // ── auto dismiss alert ──
  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => setAlert(null), 3500)
    return () => clearTimeout(t)
  }, [alert])

  // ── fetch ──
  const fetchWarga = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/warga')
      if (!r.ok) throw new Error()
      setWarga(await r.json())
    } catch {
      setAlert({ type: 'error', message: 'Gagal memuat data warga' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWarga() }, [fetchWarga])

  // ── open form ──
  const openAdd = () => {
    setEditTarget(null)
    setNama('')
    setNoHp('')
    setFormOpen(true)
  }
  const openEdit = (w: Warga) => {
    setEditTarget(w)
    setNama(w.nama)
    setNoHp(w.no_hp)
    setFormOpen(true)
  }

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nama.trim()
    if (!trimmed)           return setAlert({ type: 'error', message: 'Nama wajib diisi' })
    if (!/^\d+$/.test(noHp)) return setAlert({ type: 'error', message: 'Nomor HP harus berupa angka' })

    setSaving(true)
    try {
      // Use warga id for edit, or timestamp-based for new (unique barcode)
      const barcodeId = `WARGA_${editTarget?.id ?? Date.now()}`
      const url    = editTarget ? `/api/warga/${editTarget.id}` : '/api/warga'
      const method = editTarget ? 'PUT' : 'POST'

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: trimmed, no_hp: noHp, barcodeId }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error ?? 'Gagal menyimpan')
      }

      setAlert({ type: 'success', message: editTarget ? 'Data berhasil diperbarui' : 'Warga berhasil ditambahkan' })
      setFormOpen(false)
      await fetchWarga()
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  // ── delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const r = await fetch(`/api/warga/${deleteTarget.id}`, { method: 'DELETE' })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error ?? 'Gagal menghapus')
      }
      setAlert({ type: 'success', message: `${deleteTarget.nama} berhasil dihapus` })
      await fetchWarga()
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menghapus' })
    } finally {
      setDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  // ── download QR ── (fixed: use div container ref, not SVG ref)
  const downloadQR = () => {
    if (!qrContainerRef.current || !qrWarga) return
    const svgEl = qrContainerRef.current.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas  = document.createElement('canvas')
    const ctx     = canvas.getContext('2d')
    const img     = new Image()
    img.onload = () => {
      canvas.width  = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const a   = document.createElement('a')
      a.href     = canvas.toDataURL('image/png')
      a.download = `qr-warga-${qrWarga.id}.png`
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const filtered = warga.filter(w =>
    w.nama.toLowerCase().includes(search.toLowerCase()) || w.no_hp.includes(search)
  )

  return (
    <div className="page-container anim-slide-up">
      <PageHeader
        title="Daftar Warga"
        subtitle={`${warga.length} warga terdaftar`}
        rightAction={
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold text-white"
            style={{ background: 'var(--ios-blue)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah
          </button>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Cari nama atau nomor HP..." />

      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {loading ? (
        <SkeletonList rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
          title={search ? 'Tidak ditemukan' : 'Belum ada warga'}
          subtitle={search ? 'Coba kata kunci lain' : 'Tap "+ Tambah" untuk mendaftarkan warga'}
          action={!search ? (
            <button onClick={openAdd} className="ios-btn ios-btn-primary ios-btn-md px-6">
              Tambah Warga Pertama
            </button>
          ) : undefined}
        />
      ) : (
        <div className="ios-card mx-4 mb-4">
          {filtered.map(w => (
            <div key={w.id} className="ios-row">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full grad-blue flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm">{w.nama.charAt(0).toUpperCase()}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>{w.nama}</p>
                <p className="caption mt-0.5 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                  {w.no_hp}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => { setQrWarga(w); setQrOpen(true) }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,122,255,0.10)' }}
                  title="QR Code"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ios-blue)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEdit(w)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,149,0,0.10)' }}
                  title="Edit"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ios-orange)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={() => { setDeleteTarget(w); setDeleteOpen(true) }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,59,48,0.10)' }}
                  title="Hapus"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ios-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Sheet ── */}
      <BottomSheet open={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? 'Edit Warga' : 'Tambah Warga'}>
        <form onSubmit={handleSubmit} className="px-5 space-y-4">
          <InputField label="Nama Lengkap" value={nama} onChange={setNama} placeholder="Masukkan nama" required />
          <InputField label="Nomor HP" value={noHp} onChange={setNoHp} placeholder="Contoh: 08123456789" type="tel" hint="Hanya angka, tanpa spasi atau tanda (-)" required />
          <div className="flex gap-3 pt-2 pb-2">
            <Btn variant="secondary" onClick={() => setFormOpen(false)} fullWidth>Batal</Btn>
            <Btn type="submit" loading={saving} fullWidth>{editTarget ? 'Simpan Perubahan' : 'Tambahkan'}</Btn>
          </div>
        </form>
      </BottomSheet>

      {/* ── QR Sheet ── */}
      <BottomSheet open={qrOpen} onClose={() => setQrOpen(false)} title="QR Code Warga">
        <div className="px-5 flex flex-col items-center pb-4">
          <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{qrWarga?.nama}</p>
          <p className="caption mb-6">Scan untuk identifikasi warga</p>
          {/* Wrapped in div — containerRef used to find SVG inside */}
          <div className="p-5 bg-white rounded-2xl shadow-md mb-3" ref={qrContainerRef}>
            {qrWarga && <QRCodeSVG value={`WARGA_${qrWarga.id}`} size={200} />}
          </div>
          <p className="caption mb-6 font-mono">ID: WARGA_{qrWarga?.id}</p>
          <Btn onClick={downloadQR} fullWidth size="lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Download QR Code
          </Btn>
        </div>
      </BottomSheet>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Hapus Warga?"
        message={`Data "${deleteTarget?.nama}" akan dihapus permanen beserta semua transaksinya.`}
        confirmLabel="Hapus"
        confirmVariant="danger"
        icon={
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,59,48,0.12)' }}>
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--ios-red)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
        }
      />

      <Header />
    </div>
  )
}
