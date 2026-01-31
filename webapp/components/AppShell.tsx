'use client'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-dvh sm:h-screen sm:flex sm:items-center sm:justify-center">
      <div className="w-full h-full max-w-[600px] relative overflow-hidden bg-surface shadow-[0_0_80px_rgba(0,0,0,0.08)] sm:h-[min(100dvh,900px)] sm:rounded-3xl sm:border sm:border-border sm:m-4">
        {children}
      </div>
    </div>
  )
}
