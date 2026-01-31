'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { getGreeting, stripMarkdown } from '@/lib/utils'
import { PRESETS, type Thread } from '@/lib/mockData'

interface HomeViewProps {
  threads: Thread[]
  onNewChat: (prompt?: string) => void
  onOpenThread: (id: number) => void
}

export function HomeView({ threads, onNewChat, onOpenThread }: HomeViewProps) {
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      )
    }
  }, [])

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
      {/* Header */}
      <div className="px-6 pt-6 safe-top flex items-center justify-between">
        <div className="font-serif text-[1.65rem] text-dark tracking-tight">
          Agentsy<span className="text-gold">.</span>
        </div>
        <button
          onClick={() => onNewChat()}
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center hover:bg-cream active:scale-90 active:bg-stone transition-all"
        >
          <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>

      {/* Greeting */}
      <div className="px-6 pt-7 pb-2">
        <h1 className="font-serif text-[28px] text-dark leading-tight tracking-tight">{getGreeting()}</h1>
        <p className="text-[15px] text-muted mt-1.5">What should we work on?</p>
      </div>

      {/* Input */}
      <div className="px-6 pt-5 pb-1">
        <div
          className="flex items-center gap-2.5 bg-cream rounded-[22px] px-5 py-1.5 border-[1.5px] border-transparent hover:border-stone transition-all cursor-text"
          onClick={() => onNewChat()}
        >
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-[15px] text-dark py-2.5 placeholder:text-muted-light outline-none"
            onFocus={() => onNewChat()}
            readOnly
          />
          <button className="w-[38px] h-[38px] rounded-full bg-charcoal text-white flex items-center justify-center shrink-0 hover:bg-dark hover:scale-105 active:scale-88 transition-all">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="px-6 pt-5 pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-light mb-3.5">Try something</div>
        <div ref={cardsRef} className="grid grid-cols-2 gap-2.5">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => onNewChat(preset.prompt)}
              className="p-4 rounded-[16px] border border-[rgba(0,0,0,0.12)] bg-surface text-left flex flex-col gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-px active:scale-[0.97] active:shadow-none transition-all"
            >
              <span className="text-2xl leading-none">{preset.icon}</span>
              <span className="text-sm font-semibold text-dark leading-snug">{preset.title}</span>
              <span className="text-xs text-muted leading-relaxed">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent */}
      {threads.length > 0 && (
        <div className="px-6 pt-6 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-light mb-3">Recent</div>
          <div className="flex flex-col">
            {threads.map((t, idx) => {
              const lastMsg = t.messages.length
                ? stripMarkdown(t.messages[t.messages.length - 1].text).slice(0, 60)
                : ''
              return (
                <button
                  key={t.id}
                  onClick={() => onOpenThread(t.id)}
                  className={`flex items-center gap-3 px-3 py-3.5 rounded-[10px] text-left hover:bg-cream active:bg-stone-light active:scale-[0.98] transition-all ${idx < threads.length - 1 ? 'border-b border-[rgba(0,0,0,0.1)]' : ''} ${t.unread ? '' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-serif text-base text-white"
                    style={{ background: t.avatarColor }}
                  >
                    {t.avatarLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm text-dark truncate ${t.unread ? 'font-bold' : 'font-semibold'}`}>{t.title}</div>
                    <div className="text-[12.5px] text-muted truncate mt-px">{lastMsg}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[11px] ${t.unread ? 'text-gold font-semibold' : 'text-muted-light'}`}>{t.time}</span>
                    {t.unread && <div className="w-2 h-2 rounded-full bg-gold" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="h-6 shrink-0" />
    </div>
  )
}
