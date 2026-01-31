'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'
import { TOPIC_FILTERS, type Memory } from '@/lib/mockData'

interface MemoriesViewProps {
  memories: Memory[]
  onOpenMemory: (memory: Memory) => void
}

const topicColors: Record<string, string> = {
  strategy: 'bg-[rgba(201,169,110,0.15)] text-gold',
  research: 'bg-[rgba(163,177,138,0.15)] text-sage',
  project: 'bg-[rgba(124,100,255,0.1)] text-[#6C63FF]',
  personal: 'bg-[rgba(45,42,38,0.08)] text-charcoal',
}

export function MemoriesView({ memories, onOpenMemory }: MemoriesViewProps) {
  const [filter, setFilter] = useState<string>('all')
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = filter === 'all' ? memories : memories.filter((m) => m.topic === filter)

  useEffect(() => {
    if (listRef.current && listRef.current.children.length > 0) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      )
    }
  }, [filter])

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="px-6 pt-6 safe-top">
        <h1 className="font-serif text-[26px] text-dark tracking-tight">Memories</h1>
        <p className="text-sm text-muted mt-1">Auto-organized from your conversations</p>
      </div>

      {/* Search */}
      <div className="px-6 pt-4 pb-2">
        <input
          type="text"
          placeholder="Search memories…"
          className="w-full py-[11px] px-4 rounded-[10px] bg-cream border border-transparent text-sm text-dark placeholder:text-muted-light focus:border-stone focus:bg-surface transition-all outline-none"
        />
      </div>

      {/* Topic filters */}
      <div className="px-6 pt-1 flex gap-2 flex-wrap">
        {TOPIC_FILTERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              'px-3.5 py-[7px] rounded-full text-xs font-semibold border transition-all whitespace-nowrap active:scale-[0.94]',
              filter === t.key
                ? 'bg-charcoal text-white border-charcoal'
                : 'bg-cream text-muted border-border hover:bg-charcoal hover:text-white hover:border-charcoal'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Memory list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-10">
          <div className="text-[40px] mb-3">🧠</div>
          <h3 className="font-serif text-xl text-dark">No memories yet</h3>
          <p className="text-[13px] text-muted mt-1.5 max-w-[240px] mx-auto">
            Start chatting and I&apos;ll automatically organize key takeaways here.
          </p>
        </div>
      ) : (
        <div ref={listRef} className="px-6 pt-4 pb-6 flex flex-col gap-3">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => onOpenMemory(m)}
              className="p-4 rounded-[16px] border border-border bg-surface text-left hover:border-stone hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md', topicColors[m.topic])}>
                  {m.topicLabel}
                </span>
                <span className="text-[11px] text-muted-light">{m.date}</span>
              </div>
              <div className="text-sm font-semibold text-dark mb-1 leading-relaxed">{m.title}</div>
              <div
                className="text-[13px] text-muted leading-relaxed line-clamp-2"
                dangerouslySetInnerHTML={{ __html: m.body }}
              />
              <div className="mt-2.5 pt-2.5 border-t border-border flex items-center gap-1.5 text-[11px] text-muted-light">
                💬 From {m.source}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
