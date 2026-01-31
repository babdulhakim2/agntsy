'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Memory } from '@/lib/mockData'

const topicColors: Record<string, string> = {
  strategy: 'bg-[rgba(201,169,110,0.15)] text-gold',
  research: 'bg-[rgba(163,177,138,0.15)] text-sage',
  project: 'bg-[rgba(124,100,255,0.1)] text-[#6C63FF]',
  personal: 'bg-[rgba(45,42,38,0.08)] text-charcoal',
}

interface BottomSheetProps {
  memory: Memory | null
  onClose: () => void
  onDelete: (id: number) => void
}

export function BottomSheet({ memory, onClose, onDelete }: BottomSheetProps) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragging = useRef(false)

  const isOpen = memory !== null

  useEffect(() => {
    setCopied(false)
    setConfirmDelete(false)
  }, [memory])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleCopy = useCallback(() => {
    if (!memory) return
    const plain = memory.title + '\n\n' + memory.body.replace(/<[^>]+>/g, '')
    navigator.clipboard.writeText(plain).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [memory])

  const handleDelete = useCallback(() => {
    if (!memory) return
    onDelete(memory.id)
  }, [memory, onDelete])

  // Touch drag to dismiss (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    dragging.current = true
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || !sheetRef.current) return
    const dy = e.touches[0].clientY - dragStartY.current
    if (dy > 0) {
      sheetRef.current.style.transform = `translate(-50%, ${dy}px)`
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || !sheetRef.current) return
    dragging.current = false
    sheetRef.current.style.transition = ''
    sheetRef.current.style.transform = '' // Clear inline style, let CSS classes handle it
    const dy = e.changedTouches[0].clientY - dragStartY.current
    if (dy > 100) {
      onClose()
    }
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[250] bg-[rgba(45,42,38,0.4)] backdrop-blur-sm transition-opacity duration-250',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed z-[260] bg-surface flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.12)] touch-none',
          // Mobile: bottom sheet
          'bottom-0 left-1/2 w-full max-w-[600px] h-[85dvh] rounded-t-[20px]',
          // Desktop: right panel
          'sm:left-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[380px] sm:max-w-[65%] sm:!h-full sm:rounded-none sm:shadow-[-8px_0_40px_rgba(0,0,0,0.12)]',
          // Transition
          'transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          // Transforms: mobile uses -translate-x-1/2 for centering, desktop resets it
          isOpen
            ? '-translate-x-1/2 translate-y-0 sm:translate-x-0 sm:translate-y-0'
            : '-translate-x-1/2 translate-y-full sm:translate-x-full sm:translate-y-0',
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle (mobile only) */}
        <div className="flex items-center justify-center py-2.5 cursor-grab shrink-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-stone" />
        </div>

        {/* Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-border shrink-0">
          <span className="font-serif text-lg text-dark">Memory</span>
          <div className="flex items-center gap-0.5">
            {/* Copy */}
            <button
              onClick={handleCopy}
              title="Copy"
              className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-all', copied ? 'text-sage' : 'text-muted hover:bg-cream hover:text-dark active:scale-88 active:bg-stone')}
            >
              {copied ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              )}
            </button>
            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#D14] hover:bg-[rgba(221,17,68,0.06)] active:scale-88 transition-all"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            </button>
            {/* Close */}
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-cream hover:text-dark active:scale-90 transition-all">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-5">
          {confirmDelete ? (
            <div className="text-center py-8">
              <div className="text-[32px] mb-3">🗑</div>
              <h3 className="font-serif text-xl text-dark mb-1.5">Delete this memory?</h3>
              <p className="text-[13.5px] text-muted mb-5">This can&apos;t be undone.</p>
              <div className="flex gap-2.5 max-w-[260px] mx-auto">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-[10px] bg-cream text-dark text-sm font-semibold hover:bg-stone transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-[10px] bg-[#D14] text-white text-sm font-semibold hover:bg-[#b8102e] active:scale-[0.96] transition-all">Delete</button>
              </div>
            </div>
          ) : memory ? (
            <>
              <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md mb-3', topicColors[memory.topic])}>
                {memory.topicLabel}
              </span>
              <h2 className="text-lg font-bold text-dark leading-snug mb-2">{memory.title}</h2>
              <div className="text-[14.5px] text-muted leading-relaxed [&_strong]:text-dark [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: memory.body }} />
              <div className="mt-4 pt-3.5 border-t border-border flex items-center gap-1.5 text-xs text-muted-light">
                💬 From {memory.source} · {memory.date}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
