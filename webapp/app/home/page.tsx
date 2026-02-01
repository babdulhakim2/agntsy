'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Types ─── */
interface EvalHarness {
  metric: string
  description: string
  type: string
  target: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  reasoning: string
  evidence: string[]
  actions: string[]
  eval_harness: EvalHarness[]
  estimated_impact: string
  status: 'pending' | 'in_progress' | 'complete' | 'dismissed'
}

interface Business {
  name: string
  rating: number
  reviewCount: number
  type: string
  address: string
}

interface Profile {
  business: Business
  tasks: Task[]
  summary: string
  top_issue: string
  sentiment_score: number
  browserbaseSessionUrl: string
}

/* ─── Constants ─── */
const BG = '#0A0A12'
const BG_CARD = 'rgba(255,255,255,0.04)'
const BG_CARD_HOVER = 'rgba(255,255,255,0.07)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#E8E8F0'
const TEXT_DIM = 'rgba(232,232,240,0.5)'
const ACCENT = '#7C5CFC'
const ACCENT_GLOW = 'rgba(124,92,252,0.35)'

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#FF4D6A',
  high: '#FF8A4C',
  medium: '#FFD84C',
  low: '#4CDB8A',
}

const CATEGORY_ICONS: Record<string, string> = {
  service: '🎯',
  food: '🍽️',
  ambiance: '✨',
  cleanliness: '🧹',
  pricing: '💰',
  staff: '👥',
  wait_time: '⏱️',
  communication: '💬',
  quality: '⭐',
  default: '📋',
}

const PIPELINE_STEPS = [
  { label: 'Launching browser agent...', icon: '🚀' },
  { label: 'Scraping Google Maps...', icon: '🗺️' },
  { label: 'Reading reviews...', icon: '📖' },
  { label: 'Generating improvement tasks...', icon: '🧠' },
  { label: 'Building eval harnesses...', icon: '📊' },
  { label: 'Done!', icon: '✅' },
]

const EXAMPLE_URLS = [
  {
    label: "Joe's Pizza NYC",
    url: 'https://www.google.com/maps/place/Joe%27s+Pizza/@40.7305067,-74.0021632,17z',
  },
  {
    label: 'Blue Bottle Coffee SF',
    url: 'https://www.google.com/maps/place/Blue+Bottle+Coffee/@37.7821172,-122.4078194,17z',
  },
  {
    label: 'Tatiana NYC',
    url: 'https://www.google.com/maps/place/TATIANA+by+Kwame+Onwuachi/@40.8128404,-73.9471817,17z',
  },
]

/* ─── Keyframe injection ─── */
const KEYFRAMES = `
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px ${ACCENT_GLOW}; }
  50% { box-shadow: 0 0 40px ${ACCENT_GLOW}, 0 0 80px rgba(124,92,252,0.15); }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes gauge-fill {
  from { width: 0%; }
}
@keyframes step-in {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
`

/* ─── Helpers ─── */
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.25
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span style={{ display: 'inline-flex', gap: 2, fontSize: 18 }}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} style={{ color: '#FFD84C' }}>★</span>
      ))}
      {half && <span style={{ color: '#FFD84C', opacity: 0.6 }}>★</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} style={{ color: 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
    </span>
  )
}

function SentimentGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? '#4CDB8A' : pct >= 40 ? '#FFD84C' : '#FF4D6A'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        flex: 1, height: 8, borderRadius: 4,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          animation: 'gauge-fill 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
        }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </span>
    </div>
  )
}

/* ─── Task Card ─── */
function TaskCard({ task, index, onStatusChange }: {
  task: Task; index: number
  onStatusChange: (id: string, status: Task['status']) => void
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [evalOpen, setEvalOpen] = useState(false)
  const priColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low
  const catIcon = CATEGORY_ICONS[task.category] || CATEGORY_ICONS.default

  return (
    <div style={{
      background: BG_CARD,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: 24,
      animation: `slide-up 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s both`,
      transition: 'background 0.2s, border-color 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = BG_CARD_HOVER;
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,252,0.2)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = BG_CARD;
        (e.currentTarget as HTMLElement).style.borderColor = BORDER
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{catIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: priColor, background: `${priColor}18`, padding: '3px 10px',
              borderRadius: 999, border: `1px solid ${priColor}33`,
            }}>
              {task.priority}
            </span>
            <span style={{ fontSize: 11, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {task.category.replace(/_/g, ' ')}
            </span>
            {task.estimated_impact && (
              <span style={{ fontSize: 11, color: ACCENT, marginLeft: 'auto' }}>
                Impact: {task.estimated_impact}
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: TEXT, lineHeight: 1.35 }}>
            {task.title}
          </h3>
        </div>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.6, color: TEXT_DIM }}>
        {task.description}
      </p>

      {/* Evidence (collapsible) */}
      {task.evidence.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setEvidenceOpen(!evidenceOpen)} style={{
            background: 'none', border: 'none', color: ACCENT, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              display: 'inline-block', transition: 'transform 0.2s',
              transform: evidenceOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>▸</span>
            Evidence ({task.evidence.length} review quotes)
          </button>
          {evidenceOpen && (
            <div style={{
              marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8,
              animation: 'fade-in 0.25s ease',
            }}>
              {task.evidence.map((quote, i) => (
                <div key={i} style={{
                  borderLeft: `3px solid ${ACCENT}44`,
                  paddingLeft: 14, fontSize: 13, lineHeight: 1.55,
                  color: 'rgba(232,232,240,0.7)', fontStyle: 'italic',
                }}>
                  &ldquo;{quote}&rdquo;
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Eval Harness (collapsible) */}
      {task.eval_harness.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setEvalOpen(!evalOpen)} style={{
            background: 'none', border: 'none', color: ACCENT, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              display: 'inline-block', transition: 'transform 0.2s',
              transform: evalOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>▸</span>
            Eval Harness ({task.eval_harness.length} metrics)
          </button>
          {evalOpen && (
            <div style={{
              marginTop: 10, background: 'rgba(124,92,252,0.06)',
              border: `1px solid ${ACCENT}22`, borderRadius: 10, overflow: 'hidden',
              animation: 'fade-in 0.25s ease',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ACCENT}18` }}>
                    {['Metric', 'Type', 'Target'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                        color: ACCENT, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {task.eval_harness.map((eh, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <td style={{ padding: '8px 12px', color: TEXT }}>
                        {eh.metric}
                        <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{eh.description}</div>
                      </td>
                      <td style={{ padding: '8px 12px', color: TEXT_DIM }}>{eh.type}</td>
                      <td style={{ padding: '8px 12px', color: '#4CDB8A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {eh.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action steps */}
      {task.actions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Action Steps
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {task.actions.map((a, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(232,232,240,0.75)' }}>
                {a}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Status buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['in_progress', 'complete', 'dismissed'] as const).map(s => {
          const labels: Record<string, string> = { in_progress: '▶ Start', complete: '✓ Complete', dismissed: '✕ Dismiss' }
          const isActive = task.status === s
          return (
            <button
              key={s}
              onClick={() => onStatusChange(task.id, s)}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                border: isActive ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`,
                background: isActive ? `${ACCENT}22` : 'transparent',
                color: isActive ? ACCENT : TEXT_DIM,
              }}
            >
              {labels[s]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Pipeline Loading ─── */
function PipelineLoader({ step }: { step: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 40,
    }}>
      {/* Spinner */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: `3px solid ${BORDER}`,
        borderTopColor: ACCENT,
        animation: 'spin 0.9s linear infinite',
      }} />

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>
        {PIPELINE_STEPS.map((s, i) => {
          const isDone = i < step
          const isCurrent = i === step
          const isFuture = i > step
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: isFuture ? 0.25 : 1,
              animation: isCurrent ? 'step-in 0.4s cubic-bezier(0.16,1,0.3,1) both' : undefined,
              transition: 'opacity 0.4s',
            }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                {isDone ? '✅' : s.icon}
              </span>
              <span style={{
                fontSize: 14, fontWeight: isCurrent ? 600 : 400,
                color: isDone ? '#4CDB8A' : isCurrent ? TEXT : TEXT_DIM,
              }}>
                {s.label}
              </span>
              {isCurrent && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: ACCENT,
                  animation: 'pulse-glow 1.5s ease-in-out infinite', marginLeft: 4,
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function Page() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  /* cleanup */
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  /* scroll to results */
  useEffect(() => {
    if (profile && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [profile])

  const analyze = useCallback(async (inputUrl?: string) => {
    const target = inputUrl || url
    if (!target.trim()) return
    setError(null)
    setProfile(null)
    setLoading(true)
    setPipelineStep(0)

    /* Pipeline step ticker */
    let step = 0
    intervalRef.current = setInterval(() => {
      step++
      if (step < PIPELINE_STEPS.length - 1) {
        setPipelineStep(step)
      }
    }, 3200)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPipelineStep(PIPELINE_STEPS.length - 1)

      await new Promise(r => setTimeout(r, 600))
      setProfile(data.profile)
      setTasks(data.profile.tasks.map((t: Task) => ({ ...t })))
    } catch (err: unknown) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [url])

  const handleStatusChange = useCallback((id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }, [])

  /* ─── Inject keyframes ─── */
  useEffect(() => {
    const id = 'ba-keyframes'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = KEYFRAMES
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100dvh', background: BG, color: TEXT,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ─── Hero / Input ─── */}
      <section style={{
        minHeight: profile ? 'auto' : '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px 60px',
        transition: 'min-height 0.5s',
      }}>
        {!loading && (
          <div style={{ textAlign: 'center', animation: 'fade-in 0.6s ease', maxWidth: 640, width: '100%' }}>
            {/* Logo / Title */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🤖</span>
              <h1 style={{
                margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${TEXT} 0%, ${ACCENT} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Business Agent
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 16, color: TEXT_DIM, lineHeight: 1.5 }}>
                Paste a Google Maps URL. Get an AI-powered improvement plan in seconds.
              </p>
            </div>

            {/* Input */}
            <div style={{
              display: 'flex', gap: 10, marginTop: 32,
              background: BG_CARD, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: 6,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="Paste your Google Maps URL..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: TEXT, fontSize: 15, padding: '12px 16px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => analyze()}
                disabled={!url.trim()}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: url.trim() ? `linear-gradient(135deg, ${ACCENT}, #9B7DFF)` : 'rgba(124,92,252,0.2)',
                  color: '#fff', fontWeight: 700, fontSize: 15, cursor: url.trim() ? 'pointer' : 'default',
                  transition: 'all 0.25s',
                  boxShadow: url.trim() ? `0 4px 20px ${ACCENT_GLOW}` : 'none',
                }}
              >
                Analyze
              </button>
            </div>

            {/* Example chips */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              {EXAMPLE_URLS.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => { setUrl(ex.url); analyze(ex.url) }}
                  style={{
                    background: BG_CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 999, padding: '7px 16px', color: TEXT_DIM,
                    fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
                    (e.currentTarget as HTMLElement).style.color = ACCENT
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
                    (e.currentTarget as HTMLElement).style.color = TEXT_DIM
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 24, padding: '12px 20px', borderRadius: 10,
                background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)',
                color: '#FF4D6A', fontSize: 14,
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading pipeline */}
        {loading && <PipelineLoader step={pipelineStep} />}
      </section>

      {/* ─── Results ─── */}
      {profile && (
        <section ref={resultsRef} style={{
          maxWidth: 860, margin: '0 auto', padding: '0 20px 80px',
          animation: 'slide-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {/* Business Card */}
          <div style={{
            background: BG_CARD, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{profile.business.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <Stars rating={profile.business.rating} />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{profile.business.rating}</span>
                  <span style={{ color: TEXT_DIM, fontSize: 13 }}>
                    ({profile.business.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 999,
                    background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT,
                  }}>{profile.business.type}</span>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 13, color: TEXT_DIM }}>
                  📍 {profile.business.address}
                </p>
              </div>

              {profile.browserbaseSessionUrl && (
                <a
                  href={profile.browserbaseSessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10,
                    background: 'rgba(124,92,252,0.1)', border: `1px solid ${ACCENT}33`,
                    color: ACCENT, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.1)'}
                >
                  🎬 Session Replay
                </a>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{
            background: BG_CARD, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>AI Summary</h3>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.7, color: 'rgba(232,232,240,0.8)' }}>
              {profile.summary}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)',
              }}>
                <span style={{ fontSize: 14 }}>🚨</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#FF4D6A' }}>
                  Top Issue: {profile.top_issue}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Sentiment Score
                </div>
                <SentimentGauge score={profile.sentiment_score} />
              </div>
            </div>
          </div>

          {/* Tasks heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 36 }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              Improvement Tasks
            </h2>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
              background: `${ACCENT}18`, color: ACCENT,
            }}>
              {tasks.length}
            </span>
          </div>

          {/* Task Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} onStatusChange={handleStatusChange} />
            ))}
          </div>

          {/* Session replay footer */}
          {profile.browserbaseSessionUrl && (
            <div style={{
              marginTop: 40, textAlign: 'center', padding: '24px 0',
              borderTop: `1px solid ${BORDER}`,
            }}>
              <a
                href={profile.browserbaseSessionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 12,
                  background: `linear-gradient(135deg, ${ACCENT}, #9B7DFF)`,
                  color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  boxShadow: `0 4px 24px ${ACCENT_GLOW}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${ACCENT_GLOW}`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${ACCENT_GLOW}`
                }}
              >
                🎬 Watch Full Session Replay
              </a>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: TEXT_DIM }}>
                See exactly how the AI agent navigated Google Maps to gather this data
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
