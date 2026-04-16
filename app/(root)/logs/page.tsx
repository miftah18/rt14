'use client'

import Link from 'next/link'

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2 block">
            ← Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Audit</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Fitur audit log akan menampilkan semua aktivitas sistem</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Sedang dikembangkan...</p>
        </div>
      </div>
    </div>
  )
}
