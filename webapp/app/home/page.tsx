'use client'

import { useState, useCallback, useEffect } from 'react'
import { THREADS, MEMORIES, type Thread, type Memory } from '@/lib/mockData'
import { AppShell } from '@/components/AppShell'
import { BottomNav } from '@/components/BottomNav'
import { HomeView } from '@/components/HomeView'
import { MemoriesView } from '@/components/MemoriesView'
import { ChatOverlay } from '@/components/ChatOverlay'
import { BottomSheet } from '@/components/BottomSheet'

const AGENT_STEPS = [
  { msg: 'Launching browser agent...', icon: '🔌' },
  { msg: 'Opening Google Maps...', icon: '🗺️' },
  { msg: 'Scraping reviews...', icon: '⭐' },
  { msg: 'Reading customer feedback...', icon: '📖' },
  { msg: 'Generating improvement tasks...', icon: '🧠' },
  { msg: 'Building eval harnesses...', icon: '📊' },
]

function OnboardingModal({ onSubmit, onClose }: { onSubmit: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#FFFCF7', borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
        <h2 style={{ fontFamily: 'serif', fontSize: 22, color: '#1A1A1A', marginBottom: 6 }}>Tell us about your business</h2>
        <p style={{ fontSize: 14, color: '#8C8C8C', marginBottom: 20, lineHeight: 1.5 }}>
          Paste your Google Maps URL and our agent will analyze your reviews, find improvement opportunities, and build an action plan.
        </p>
        <input
          type="text"
          placeholder="Paste Google Maps URL..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 12,
            border: '1.5px solid #E5E0D8', background: '#FAF8F4', outline: 'none',
            boxSizing: 'border-box', marginBottom: 16,
          }}
          onFocus={e => { e.target.style.borderColor = '#C5A44E' }}
          onBlur={e => { e.target.style.borderColor = '#E5E0D8' }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 12,
              border: '1.5px solid #E5E0D8', background: 'transparent', color: '#8C8C8C', cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
          <button
            onClick={() => url.trim() && onSubmit(url.trim())}
            disabled={!url.trim()}
            style={{
              flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 12,
              border: 'none', background: url.trim() ? '#1A1A1A' : '#CCC', color: '#FFF', cursor: url.trim() ? 'pointer' : 'default',
            }}
          >
            Analyze →
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentLoadingOverlay({ step }: { step: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#FFFCF7', borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 20, color: '#1A1A1A', marginBottom: 20 }}>Agent is working...</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {AGENT_STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= step ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                {i < step ? '✅' : i === step ? s.icon : '○'}
              </span>
              <span style={{
                fontSize: 14, color: i <= step ? '#1A1A1A' : '#BCBCBC',
                fontWeight: i === step ? 600 : 400,
              }}>
                {s.msg}
              </span>
              {i === step && (
                <span style={{ marginLeft: 'auto', width: 16, height: 16, border: '2px solid #C5A44E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              )}
            </div>
          ))}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function Page() {
  const [tab, setTab] = useState<'home' | 'memories'>('home')
  const [threads, setThreads] = useState<Thread[]>(THREADS)
  const [memories, setMemories] = useState<Memory[]>(MEMORIES)

  // Onboarding + agent state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [agentStep, setAgentStep] = useState(-1)
  const [agentRunning, setAgentRunning] = useState(false)

  useEffect(() => {
    // Show onboarding on first visit
    if (typeof window !== 'undefined' && !localStorage.getItem('agentsy_business')) {
      const timer = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  const runAgent = useCallback(async (url: string) => {
    setShowOnboarding(false)
    setAgentRunning(true)
    setAgentStep(0)

    // Animate through steps while API runs
    const stepInterval = setInterval(() => {
      setAgentStep(prev => {
        if (prev < AGENT_STEPS.length - 1) return prev + 1
        return prev
      })
    }, 8000)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.profile) {
        localStorage.setItem('agentsy_business', JSON.stringify(data.profile))
        // Jump to final step
        setAgentStep(AGENT_STEPS.length - 1)
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (err) {
      console.error('Agent failed:', err)
    } finally {
      clearInterval(stepInterval)
      setAgentRunning(false)
      setAgentStep(-1)
    }
  }, [])
  const [chatOpen, setChatOpen] = useState(false)
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  const [sheetMemory, setSheetMemory] = useState<Memory | null>(null)

  const openNewChat = useCallback((prompt?: string) => {
    setActiveThread(null)
    setInitialPrompt(prompt || null)
    setChatOpen(true)
  }, [])

  const openThread = useCallback((id: number) => {
    const t = threads.find((t) => t.id === id)
    if (!t) return
    t.unread = false
    setActiveThread({ ...t })
    setInitialPrompt(null)
    setChatOpen(true)
  }, [threads])

  const closeChat = useCallback(() => {
    setChatOpen(false)
    setActiveThread(null)
    setInitialPrompt(null)
  }, [])

  const deleteThread = useCallback(() => {
    if (activeThread) {
      setThreads((prev) => prev.filter((t) => t.id !== activeThread.id))
    }
    closeChat()
  }, [activeThread, closeChat])

  const deleteMemory = useCallback((id: number) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
    setSheetMemory(null)
  }, [])

  return (
    <AppShell>
      <div
        className="flex h-[calc(100dvh-64px)] will-change-transform"
        style={{
          width: '200%',
          transform: tab === 'memories' ? 'translate3d(-50%,0,0)' : 'translate3d(0,0,0)',
          transition: 'transform 0.42s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="w-1/2 h-full flex flex-col overflow-hidden">
          <HomeView threads={threads} onNewChat={openNewChat} onOpenThread={openThread} />
        </div>
        <div className="w-1/2 h-full flex flex-col overflow-hidden">
          <MemoriesView memories={memories} onOpenMemory={setSheetMemory} />
        </div>
      </div>

      <BottomNav tab={tab} onTabChange={setTab} />

      <ChatOverlay
        open={chatOpen}
        thread={activeThread}
        initialPrompt={initialPrompt}
        onClose={closeChat}
        onDelete={deleteThread}
      />

      <BottomSheet memory={sheetMemory} onClose={() => setSheetMemory(null)} onDelete={deleteMemory} />

    </AppShell>
  )
}
