'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { formatText, cn } from '@/lib/utils'
import { CHAT_SUGGESTIONS, type Thread, type Message } from '@/lib/mockData'

interface ChatOverlayProps {
  open: boolean
  thread: Thread | null
  initialPrompt: string | null
  onClose: () => void
  onDelete: () => void
}

export function ChatOverlay({ open, thread, initialPrompt, onClose, onDelete }: ChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputVal, setInputVal] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [showTyping, setShowTyping] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  // Load thread messages
  useEffect(() => {
    if (open && thread) {
      setMessages([...thread.messages])
    } else if (open) {
      setMessages([])
    }
    setMenuOpen(false)
    setShowDeleteConfirm(false)
    setStreaming(false)
    setShowTyping(false)
    setStreamText('')
  }, [open, thread])

  // Set initial prompt
  useEffect(() => {
    if (open && initialPrompt) {
      setInputVal(initialPrompt)
      setTimeout(() => inputRef.current?.focus(), 400)
    } else if (open) {
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [open, initialPrompt])

  // Scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages, streaming, streamText, showTyping])

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [])

  // Streaming text effect
  const doStreamText = useCallback((text: string) => {
    setStreaming(true)
    setStreamText('')
    let i = 0
    const tick = () => {
      if (i < text.length) {
        i++
        setStreamText(text.slice(0, i))
        let delay = 18 + (Math.random() * 12 - 6)
        if ('.!?:'.includes(text[i - 1])) delay += 60
        else if (',;'.includes(text[i - 1])) delay += 30
        setTimeout(tick, delay)
      } else {
        setStreaming(false)
      }
    }
    tick()
  }, [])

  const sendMsg = useCallback(() => {
    const text = inputVal.trim()
    if (!text || streaming) return
    setInputVal('')

    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const userMsg: Message = { role: 'user', text, time: now }
    setMessages((prev) => [...prev, userMsg])

    // Show typing
    setTimeout(() => {
      setShowTyping(true)
      scrollToBottom()
    }, 400)

    // Simulated response
    const response = "I'm on it — let me dig into that for you. Give me a moment to pull together what you need."
    setTimeout(() => {
      setShowTyping(false)
      const agentMsg: Message = { role: 'agent', text: response, time: now }
      setMessages((prev) => [...prev, agentMsg])
      doStreamText(response)
    }, 1800)
  }, [inputVal, streaming, scrollToBottom, doStreamText])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMsg()
    }
  }, [sendMsg])

  const shareChat = useCallback(() => {
    setMenuOpen(false)
    if (navigator.share) {
      navigator.share({ title: 'Agentsy Chat', url: window.location.href })
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
  }, [])

  // Swipe back
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    if (t.clientX < 30) {
      touchStartX.current = t.clientX
      touchStartY.current = t.clientY
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX.current
    const dy = Math.abs(t.clientY - touchStartY.current)
    if (dx > 60 && dx > dy * 1.5 && touchStartX.current < 30) {
      onClose()
    }
  }, [onClose])

  const title = thread?.title || 'New Chat'
  const isEmpty = messages.length === 0 && !showTyping && !streaming

  return (
    <div
      className="absolute inset-0 z-[100] bg-surface flex flex-col"
      style={{
        transform: open ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)',
        transition: 'transform 0.38s cubic-bezier(0.16,1,0.3,1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="px-2 pr-4 py-3.5 safe-top flex items-center gap-2 shrink-0 border-b border-border bg-surface">
        <button onClick={onClose} className="w-10 h-10 rounded-[10px] flex items-center justify-center hover:bg-cream active:bg-stone active:scale-90 transition-all shrink-0">
          <svg className="w-[22px] h-[22px] text-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="w-[34px] h-[34px] rounded-full bg-gold flex items-center justify-center font-serif text-sm text-white shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-dark truncate">{title}</div>
          <div className="text-xs text-sage flex items-center gap-[5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />Online
          </div>
        </div>
        {/* Menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center hover:bg-cream active:scale-90 active:bg-stone transition-all">
            <svg className="w-5 h-5 text-charcoal" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-11 right-0 z-20 bg-surface border border-border rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] min-w-[160px] overflow-hidden">
                <button onClick={shareChat} className="w-full px-4 py-3 text-sm flex items-center gap-2.5 text-dark hover:bg-cream transition-colors">📤 Share</button>
                <div className="h-px bg-border mx-0" />
                <button onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }} className="w-full px-4 py-3 text-sm flex items-center gap-2.5 text-[#D14] hover:bg-[rgba(221,17,68,0.06)] transition-colors">🗑 Delete</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[110] bg-[rgba(45,42,38,0.4)] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-surface rounded-[16px] p-7 text-center max-w-[300px] w-full shadow-[0_16px_48px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-dark mb-1.5">Delete this chat?</h3>
            <p className="text-[13.5px] text-muted leading-relaxed mb-5">This will permanently remove the conversation and all its messages.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-[10px] bg-cream text-dark text-sm font-semibold hover:bg-stone transition-colors">Cancel</button>
              <button onClick={() => { setShowDeleteConfirm(false); onDelete() }} className="flex-1 py-3 rounded-[10px] bg-[#D14] text-white text-sm font-semibold hover:bg-[#b8102e] active:scale-[0.96] transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 flex flex-col thin-scrollbar">
        {isEmpty && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-[fadeUp_0.5s_ease-out_both]">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center font-serif text-[28px] text-gold mb-4">A</div>
              <h2 className="font-serif text-2xl text-dark">What can I help with?</h2>
              <p className="text-sm text-muted mt-1.5 max-w-[280px] leading-relaxed">Research, writing, analysis, planning, code — I can handle it all.</p>
            </div>
            <div className="flex flex-col gap-2 mt-6 w-full max-w-[320px] mx-auto animate-[fadeUp_0.5s_ease-out_0.1s_both]">
              {CHAT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const clean = s.text.replace(/^[^\w]+/, '').trim()
                    setInputVal(clean)
                    inputRef.current?.focus()
                  }}
                  className="px-4 py-3 rounded-[16px] border border-[rgba(0,0,0,0.12)] bg-surface text-[13.5px] text-dark text-left flex items-center gap-2.5 leading-relaxed shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.2)] hover:bg-cream active:scale-[0.97] transition-all"
                >
                  <span className="text-lg shrink-0">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null
          const next = idx < messages.length - 1 ? messages[idx + 1] : null
          const isUser = m.role === 'user'
          const isNewSender = !prev || prev.role !== m.role
          const isLastInGroup = !next || next.role !== m.role
          const showAvatar = !isUser && isNewSender
          const showLabel = !isUser && isNewSender
          const isStreamTarget = idx === messages.length - 1 && m.role === 'agent' && streaming

          return (
            <div
              key={idx}
              className={cn(
                'flex gap-2 max-w-[88%]',
                isUser && 'ml-auto flex-row-reverse',
                isNewSender ? 'mt-3.5' : 'mt-1',
                idx === 0 && 'mt-0'
              )}
            >
              {!isUser && (showAvatar ? (
                <div className="w-7 h-7 rounded-full bg-gold shrink-0 flex items-center justify-center font-serif text-xs text-white mt-0.5">A</div>
              ) : (
                <div className="w-7 shrink-0" />
              ))}
              <div className="min-w-0 max-w-full overflow-hidden">
                {showLabel && <div className="text-[11px] font-semibold text-gold mb-1 pl-1 tracking-wide">Agentsy</div>}
                <div
                  className={cn(
                    'px-4 py-3 text-[14.5px] leading-relaxed break-words',
                    isUser
                      ? 'bg-charcoal text-white rounded-[16px] rounded-tr-[4px]'
                      : 'bg-[#F4F1ED] text-dark rounded-[4px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] border border-[rgba(0,0,0,0.06)]'
                  )}
                  dangerouslySetInnerHTML={{
                    __html: isStreamTarget
                      ? formatText(streamText) + '<span class="streaming-cursor">│</span>'
                      : formatText(m.text),
                  }}
                />

                {/* Attachments */}
                {m.attachments?.map((a, ai) => (
                  <div key={ai} className="mt-2 rounded-[10px] overflow-hidden border border-border bg-surface hover:border-stone hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-px active:scale-[0.98] transition-all cursor-pointer">
                    {a.linkPreview ? (
                      <>
                        <div className="h-[120px]" style={{ background: a.linkPreview.img }} />
                        <div className="p-3">
                          <div className="text-[11px] text-gold font-medium mb-0.5">{a.linkPreview.domain}</div>
                          <div className="text-[13.5px] font-semibold text-dark leading-snug">{a.linkPreview.title}</div>
                          <div className="text-[12.5px] text-muted mt-0.5 leading-snug">{a.linkPreview.desc}</div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3.5 flex items-center gap-3">
                        <div className={cn(
                          'w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-lg shrink-0',
                          a.type === 'pdf' && 'bg-[rgba(201,169,110,0.2)]',
                          a.type === 'sheet' && 'bg-[rgba(163,177,138,0.2)]',
                          a.type === 'doc' && 'bg-[rgba(108,99,255,0.1)]',
                        )}>
                          {a.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-semibold text-dark truncate">{a.name}</div>
                          {a.meta && <div className="text-xs text-muted mt-0.5">{a.meta}</div>}
                        </div>
                        <span className="text-xs text-gold font-semibold shrink-0">Open →</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Table */}
                {m.table && (
                  <div className="mt-2 rounded-[10px] overflow-x-auto border border-border bg-surface">
                    <table className="min-w-[320px] w-full border-collapse text-[12.5px]">
                      <thead>
                        <tr>
                          {m.table.headers.map((h, hi) => (
                            <th key={hi} className="px-3.5 py-2.5 bg-cream text-left font-semibold text-muted text-[11px] uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.table.rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-[rgba(0,0,0,0.015)]">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3.5 py-2.5 border-t border-border text-dark">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isLastInGroup && (
                  <div className={cn('text-[11px] text-muted-light mt-1 px-1', isUser && 'text-right')}>{m.time}</div>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {showTyping && (
          <div className="flex gap-2 mt-3.5">
            <div className="w-7 h-7 rounded-full bg-gold shrink-0 flex items-center justify-center font-serif text-xs text-white mt-0.5">A</div>
            <div className="flex gap-[5px] py-3 px-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-[7px] h-[7px] rounded-full bg-stone" style={{ animation: `typing-bounce 1.2s infinite ${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 py-3 safe-bottom shrink-0 bg-surface border-t border-border">
        <div className="flex items-end gap-2.5 bg-cream rounded-[22px] px-4 py-2 border-[1.5px] border-transparent focus-within:border-stone focus-within:bg-surface focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all">
          <textarea
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Message Agentsy…"
            className="flex-1 bg-transparent text-[14.5px] text-dark leading-relaxed resize-none max-h-[120px] py-1 placeholder:text-muted-light outline-none"
            style={{ height: 'auto', minHeight: '24px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = '0'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMsg}
            className="w-9 h-9 rounded-full bg-charcoal text-white flex items-center justify-center shrink-0 hover:bg-dark hover:scale-105 active:scale-88 transition-all"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
