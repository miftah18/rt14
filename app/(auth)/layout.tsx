export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #007AFF 0%, #5856D6 55%, #AF52DE 100%)' }}
    >
      {/* Logo area */}
      <div className="mb-8 text-center anim-slide-up">
        <div
          className="w-20 h-20 rounded-[22px] mx-auto mb-4 flex items-center justify-center shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)' }}
        >
          <span className="text-white text-3xl font-black tracking-tight">RT</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">RT 14 Sidorejo</h1>
        <p className="text-white/70 mt-1 text-sm font-medium">Sistem Manajemen Warga — Enterprise</p>
      </div>

      {/* Auth card */}
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl anim-scale-in"
        style={{ background: 'rgba(255,255,255,0.97)' }}
      >
        {children}
      </div>

      <p className="mt-8 text-white/40 text-xs text-center">
        © {new Date().getFullYear()} RT 14 Sidorejo. All rights reserved.
      </p>
    </main>
  )
}
