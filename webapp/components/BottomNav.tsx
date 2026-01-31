'use client'

import { cn } from '@/lib/utils'

interface BottomNavProps {
  tab: 'home' | 'memories'
  onTabChange: (tab: 'home' | 'memories') => void
}

export function BottomNav({ tab, onTabChange }: BottomNavProps) {
  return (
    <div className="h-16 flex border-t border-border shrink-0 safe-bottom bg-surface relative z-50">
      {/* Indicator */}
      <div
        className="absolute top-0 left-0 w-1/2 h-0.5 bg-gold transition-transform duration-300"
        style={{
          transform: tab === 'memories' ? 'translateX(100%)' : 'translateX(0)',
          transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      <button
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-200',
          tab === 'home' ? 'text-gold' : 'text-muted-light'
        )}
        onClick={() => onTabChange('home')}
      >
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Home
      </button>

      <button
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-200',
          tab === 'memories' ? 'text-gold' : 'text-muted-light'
        )}
        onClick={() => onTabChange('memories')}
      >
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
        Memories
      </button>
    </div>
  )
}
