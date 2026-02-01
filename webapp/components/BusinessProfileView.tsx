'use client'

import { useState } from 'react'
import type { BusinessProfile, BusinessTask, TaskEval } from '@/lib/task-engine'

interface BusinessProfileViewProps {
  profile: BusinessProfile
  onReset: () => void
  onNewChat: (prompt?: string) => void
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#FEE2E2', text: '#DC2626' },
  high:     { bg: '#FFF3E0', text: '#EA580C' },
  medium:   { bg: '#FEF9E7', text: '#A16207' },
  low:      { bg: '#ECFDF5', text: '#059669' },
}

const CATEGORY_ICONS: Record<string, string> = {
  reviews: '⭐', operations: '⚙️', marketing: '📣',
  competitive: '🎯', customer_experience: '💬',
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.3
  return (
    <span style={{ display: 'inline-flex', gap: 1, fontSize: 16 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < full ? '#C9A96E' : (i === full && half ? '#C9A96E' : '#DDD'), opacity: i < full || (i === full && half) ? 1 : 0.4 }}>
          {i < full ? '★' : (i === full && half ? '★' : '☆')}
        </span>
      ))}
    </span>
  )
}

function TaskCard({ task, onImplement }: { task: BusinessTask; onImplement: (task: BusinessTask) => void }) {
  const [expanded, setExpanded] = useState(false)
  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
  const catIcon = CATEGORY_ICONS[task.category] || '📋'

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, padding: '18px 20px', marginBottom: 12,
      border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', background: pc.bg, color: pc.text,
        }}>
          {task.priority}
        </span>
        <span style={{ fontSize: 11, color: '#9E9891' }}>{catIcon} {task.category.replace(/_/g, ' ')}</span>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px', lineHeight: 1.35 }}>
        {task.title}
      </h3>
      <p style={{ fontSize: 13, color: '#7A746D', lineHeight: 1.5, margin: '0 0 10px' }}>
        {task.description}
      </p>

      {/* Impact */}
      {task.estimated_impact && (
        <div style={{
          padding: '8px 12px', borderRadius: 10, background: 'rgba(201,169,110,0.08)',
          marginBottom: 10, fontSize: 12, color: '#2D2A26', lineHeight: 1.45,
        }}>
          💡 {task.estimated_impact}
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontSize: 12,
          fontWeight: 600, color: '#C9A96E', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
        {expanded ? 'Hide details' : 'Show evidence, actions & evals'}
      </button>

      {expanded && (
        <div style={{ paddingTop: 8 }}>
          {/* Evidence */}
          {task.evidence.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9891', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                📝 Evidence
              </div>
              {task.evidence.map((quote, i) => (
                <div key={i} style={{
                  borderLeft: '3px solid #C9A96E', padding: '6px 12px', margin: '4px 0',
                  background: 'rgba(201,169,110,0.05)', borderRadius: '0 6px 6px 0',
                  fontSize: 12, color: '#7A746D', fontStyle: 'italic', lineHeight: 1.5,
                }}>
                  &ldquo;{quote}&rdquo;
                </div>
              ))}
            </div>
          )}

          {/* Action Steps */}
          {task.actions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9891', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                🎯 Action Steps
              </div>
              {task.actions.map((action, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, color: '#2D2A26', lineHeight: 1.5 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#F5F0EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#C9A96E', flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}

          {/* Eval Harness */}
          {task.eval_harness.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9891', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                ⚡ Eval Harness — LLM as Judge
              </div>
              {task.eval_harness.map((ev, i) => (
                <div key={i} style={{
                  padding: '10px 12px', margin: '4px 0', borderRadius: 10,
                  background: '#FAFAF8', border: '1px solid rgba(0,0,0,0.06)',
                  borderLeft: '3px solid #7C5CFC',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2D2A26' }}>{ev.metric}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: '#EDE9FE', color: '#7C3AED', textTransform: 'uppercase',
                    }}>
                      {ev.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7A746D', lineHeight: 1.4 }}>{ev.description}</div>
                  {ev.target != null && (
                    <div style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>
                      ✓ Target: {ev.target}{ev.type === 'percentage' ? '%' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Implement button */}
      <button
        onClick={() => onImplement(task)}
        style={{
          marginTop: 8, width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700,
          borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #1A1A1A, #2D2A26)', color: '#FFF',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        ⚡ Implement with AI
      </button>
    </div>
  )
}

/* ─── Main Component ─── */

export function BusinessProfileView({ profile, onReset, onNewChat }: BusinessProfileViewProps) {
  if (!profile?.business) {
    if (typeof window !== 'undefined') localStorage.removeItem('agentsy_business')
    return <div style={{ padding: 40, textAlign: 'center', color: '#9E9891' }}>Loading...</div>
  }

  const { business, tasks = [], summary, top_issue, sentiment_score, analyzed_at, browserbaseSessionUrl } = profile

  const handleImplement = (task: BusinessTask) => {
    onNewChat(`Implement this task for ${business.name}:\n\n**${task.title}**\n${task.description}\n\nAction steps:\n${task.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nUse available AI tools (voice agents, code generation, browser automation) to execute this.`)
  }

  const analyzedDate = new Date(analyzed_at)
  const dateStr = analyzedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar" style={{ background: '#FFFCF7' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0' }} className="safe-top">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="font-serif" style={{ fontSize: '1.65rem', color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            Agentsy<span style={{ color: '#C9A96E' }}>.</span>
          </div>
          <button onClick={onReset} style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            border: '1.5px solid #E8E0D8', background: 'transparent', color: '#7A746D', cursor: 'pointer',
          }}>
            + New
          </button>
        </div>
      </div>

      {/* Business Card — compact */}
      <div style={{ margin: '0 16px 12px', padding: '16px 20px', borderRadius: 16, background: '#FFF', border: '1px solid rgba(0,0,0,0.06)' }}>
        <h1 className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {business.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#9E9891' }}>{business.type}</span>
          <Stars rating={business.rating} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2D2A26' }}>{business.rating}</span>
          <span style={{ fontSize: 11, color: '#BCBCBC' }}>· {business.review_count} reviews · {dateStr}</span>
        </div>

        {/* Summary */}
        {summary && (
          <p style={{ fontSize: 13, color: '#7A746D', lineHeight: 1.5, margin: '10px 0 0' }}>{summary}</p>
        )}

        {/* Top issue */}
        {top_issue && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 10,
            background: '#FEF2F2', border: '1px solid #FECACA',
            fontSize: 12, color: '#991B1B', lineHeight: 1.45,
          }}>
            🚨 {top_issue}
          </div>
        )}
      </div>

      {/* Session replay */}
      {browserbaseSessionUrl && (
        <div style={{ margin: '0 16px 12px' }}>
          <a href={browserbaseSessionUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12,
            background: '#1A1A1A', textDecoration: 'none',
          }}>
            <span style={{ fontSize: 16 }}>🎬</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>Watch Agent Session Replay</span>
            <span style={{ marginLeft: 'auto', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>→</span>
          </a>
        </div>
      )}

      {/* Tasks */}
      <div style={{ padding: '4px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9E9891', marginBottom: 12 }}>
          AI Tasks ({tasks.length})
        </div>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onImplement={handleImplement} />
        ))}
      </div>

      {/* Analyze another */}
      <div style={{ padding: '8px 16px 32px' }}>
        <button onClick={onReset} style={{
          width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700, borderRadius: 14,
          background: '#1A1A1A', color: '#FFF', cursor: 'pointer', border: 'none',
        }}>
          🔄 Analyze Another Business
        </button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
