'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: number
  username: string
  name: string
  organizationId: number
  role: 'superadmin' | 'admin' | 'viewer'
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from cookie
    const checkSession = async () => {
      try {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('session='))?.split('=')[1]
        if (cookieValue) {
          const userData = JSON.parse(Buffer.from(cookieValue, 'base64').toString('utf-8'))
          setUser(userData)
        }
      } catch (e) {
        console.error('Session error:', e)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-white">🏢</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Organisasi</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Selamat datang, {user?.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola organisasi hierarki Anda dengan sistem manajemen terintegrasi.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Organisasi</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Akan diperbarui</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Anggota</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Akan diperbarui</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Pengguna</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Akan diperbarui</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Posisi BPH</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Akan diperbarui</p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Organizations */}
          <Link href="/organizations" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer h-full">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <span className="text-2xl">🏛️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Organisasi</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Kelola struktur hierarki organisasi dari Pusat hingga Ranting
              </p>
              <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:translate-x-1 transition">
                Buka →
              </div>
            </div>
          </Link>

          {/* Members */}
          <Link href="/members" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer h-full">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Anggota</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Daftar dan kelola semua anggota organisasi
              </p>
              <div className="mt-4 text-green-600 dark:text-green-400 font-medium text-sm group-hover:translate-x-1 transition">
                Buka →
              </div>
            </div>
          </Link>

          {/* BPH */}
          <Link href="/bph" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer h-full">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <span className="text-2xl">👔</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">BPH (Pengurus)</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Atur posisi pengurus dan struktur manajemen
              </p>
              <div className="mt-4 text-purple-600 dark:text-purple-400 font-medium text-sm group-hover:translate-x-1 transition">
                Buka →
              </div>
            </div>
          </Link>

          {/* Users */}
          <Link href="/users" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer h-full">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pengguna Sistem</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Kelola akun pengguna dan kontrol akses
              </p>
              <div className="mt-4 text-orange-600 dark:text-orange-400 font-medium text-sm group-hover:translate-x-1 transition">
                Buka →
              </div>
            </div>
          </Link>

          {/* Logs */}
          <Link href="/logs" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer h-full">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Log Audit</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Lihat jejak audit semua aktivitas sistem
              </p>
              <div className="mt-4 text-teal-600 dark:text-teal-400 font-medium text-sm group-hover:translate-x-1 transition">
                Buka →
              </div>
            </div>
          </Link>

          {/* Settings */}
          <Link href="/settings" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer h-full">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pengaturan</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Konfigurasi sistem dan preferensi pengguna
              </p>
              <div className="mt-4 text-gray-600 dark:text-gray-400 font-medium text-sm group-hover:translate-x-1 transition">
                Buka →
              </div>
            </div>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Informasi Sistem</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Sistem manajemen organisasi hierarki ini mendukung struktur 5 tingkat (Pusat → Provinsi → Kabupaten → Kecamatan → Ranting) 
            dengan kontrol akses berbasis peran (Superadmin, Admin, Viewer).
          </p>
        </div>
      </div>
    </div>
  )
}
