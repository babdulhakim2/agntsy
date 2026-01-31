'use client'

import { useState, useCallback } from 'react'
import { THREADS, MEMORIES, type Thread, type Memory } from '@/lib/mockData'
import { AppShell } from '@/components/AppShell'
import { BottomNav } from '@/components/BottomNav'
import { HomeView } from '@/components/HomeView'
import { MemoriesView } from '@/components/MemoriesView'
import { ChatOverlay } from '@/components/ChatOverlay'
import { BottomSheet } from '@/components/BottomSheet'

export default function Page() {
  const [tab, setTab] = useState<'home' | 'memories'>('home')
  const [threads, setThreads] = useState<Thread[]>(THREADS)
  const [memories, setMemories] = useState<Memory[]>(MEMORIES)
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
