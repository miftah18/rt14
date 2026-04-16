'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Member {
  id: number
  name: string
  nik: string
  phone: string | null
  address: string | null
  organizationId: number
  createdAt: string
  organization?: { id: number; name: string }
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      setLoading(true)
      const res = await fetch('/api/members')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setMembers(data)
    } catch (err) {
      setError('Failed to load members')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2 block">
              ← Kembali
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anggota</h1>
          </div>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition">
            + Tambah Anggota
          </button>
        </div>
      </div>

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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">NIK</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Telepon</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Organisasi</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                      Belum ada anggota
                    </td>
                  </tr>
                ) : (
                  members.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{member.name}</td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{member.nik}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{member.phone || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{member.organization?.name || '-'}</td>
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
