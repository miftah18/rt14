'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Organization {
  id: number
  name: string
  level: number
  parentId: number | null
  code: string
  createdAt: string
}

const LEVEL_NAMES: Record<number, string> = {
  0: 'Pusat',
  1: 'Provinsi',
  2: 'Kabupaten',
  3: 'Kecamatan',
  4: 'Ranting',
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    try {
      setLoading(true)
      const res = await fetch('/api/organizations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrganizations(data)
    } catch (err) {
      setError('Failed to load organizations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2 block">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organisasi</h1>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            + Tambah Organisasi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Nama</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Level</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Kode</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                      Belum ada organisasi
                    </td>
                  </tr>
                ) : (
                  organizations.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{org.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {LEVEL_NAMES[org.level] || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{org.code}</td>
                      <td className="px-6 py-3 text-sm">
                        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">Edit</button>
                        <span className="mx-2 text-gray-300">•</span>
                        <button className="text-red-600 dark:text-red-400 hover:underline text-sm">Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
