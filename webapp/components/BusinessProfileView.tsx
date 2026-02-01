'use client'

import { useState } from 'react'
import type { BusinessProfile, BusinessTask, TaskEval } from '@/lib/task-engine'

interface BusinessProfileViewProps {
  profile: BusinessProfile
  onReset: () => void
  onNewChat: (prompt?: string) => void
}

/* ─── Helpers ─── */

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  high:     { bg: '#FFF3E0', text: '#EA580C', border: '#FED7AA' },
  medium:   { bg: '#FEF9E7', text: '#A16207', border: '#FDE68A' },
  low:      { bg: '#ECFDF5', text: '#059669', border: '#BBF7D0' },
}

const CATEGORY_ICONS: Record<string, string> = {
  reviews: '⭐',
  operations: '⚙️',
  marketing: '📣',
  competitive: '🎯',
  customer_experience: '💬',
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

function SentimentGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#059669' : score >= 45 ? '#C9A96E' : '#DC2626'
  const label = score >= 70 ? 'Positive' : score >= 45 ? 'Mixed' : 'Negative'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 6, borderRadius: 3, background: '#E8E0D8', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{score}/100</span>
      <span style={{ fontSize: 11, color: '#9E9891' }}>{label}</span>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {priority}
    </span>
  )
}

function CategoryTag({ category }: { category: string }) {
  const icon = CATEGORY_ICONS[category] || '📋'
  const label = category.replace(/_/g, ' ')
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 500, background: '#F5F0EB', color: '#7A746D', textTransform: 'capitalize',
    }}>
      {icon} {label}
    </span>
  )
}

function EvalHarnessGrid({ evals }: { evals: TaskEval[] }) {
  if (!evals.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
      {evals.map((ev, i) => {
        const typeIcon = ev.type === 'boolean' ? '✓/✗' : ev.type === 'percentage' ? '%' : '#'
        return (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: 10, background: '#FAFAF8',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2D2A26', fontFamily: 'var(--font-mono)' }}>
                {ev.metric}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                background: '#E8E0D8', color: '#7A746D',
              }}>
                {typeIcon}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#7A746D', lineHeight: 1.4, marginBottom: 6 }}>
              {ev.description}
            </div>
            {ev.target != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#9E9891' }}>Target:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#C9A96E' }}>
                  {ev.target}{ev.type === 'percentage' ? '%' : ''}
                </span>
                {ev.current != null && (
                  <>
                    <span style={{ fontSize: 11, color: '#9E9891' }}>Now:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
                      {ev.current}{ev.type === 'percentage' ? '%' : ''}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({ task, onChat }: { task: BusinessTask; onChat: (prompt: string) => void }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [evalOpen, setEvalOpen] = useState(false)

  const statusColors: Record<string, string> = {
    pending: '#9E9891',
    in_progress: '#C9A96E',
    completed: '#059669',
    dismissed: '#DC2626',
  }

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, padding: '20px', marginBottom: 12,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <PriorityBadge priority={task.priority} />
        <CategoryTag category={task.category} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[task.status] || '#9E9891' }} />
          <span style={{ fontSize: 10, color: '#9E9891', textTransform: 'capitalize' }}>{task.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Title + description */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px 0', lineHeight: 1.35 }}>
        {task.title}
      </h3>
      <p style={{ fontSize: 13, color: '#7A746D', lineHeight: 1.55, margin: '0 0 12px 0' }}>
        {task.description}
      </p>

      {/* Impact */}
      {task.estimated_impact && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(201,169,110,0.08)', marginBottom: 12,
        }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span style={{ fontSize: 12, color: '#2D2A26', lineHeight: 1.45, fontWeight: 500 }}>
            {task.estimated_impact}
          </span>
        </div>
      )}

      {/* Collapsible sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Evidence */}
        {task.evidence.length > 0 && (
          <div>
            <button
              onClick={() => setEvidenceOpen(!evidenceOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', fontSize: 12,
                fontWeight: 600, color: '#7A746D', width: '100%', textAlign: 'left',
                cursor: 'pointer', background: 'none', border: 'none',
              }}
            >
              <span style={{ transform: evidenceOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
              📝 Evidence ({task.evidence.length} quotes)
            </button>
            {evidenceOpen && (
              <div style={{ paddingLeft: 8, paddingBottom: 8 }}>
                {task.evidence.map((quote, i) => (
                  <div key={i} style={{
                    borderLeft: '3px solid #C9A96E', padding: '6px 12px', margin: '6px 0',
                    background: 'rgba(201,169,110,0.05)', borderRadius: '0 6px 6px 0',
                    fontSize: 12, color: '#7A746D', fontStyle: 'italic', lineHeight: 1.5,
                  }}>
                    &ldquo;{quote}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {task.actions.length > 0 && (
          <div>
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', fontSize: 12,
                fontWeight: 600, color: '#7A746D', width: '100%', textAlign: 'left',
                cursor: 'pointer', background: 'none', border: 'none',
              }}
            >
              <span style={{ transform: actionsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
              🎯 Action Steps ({task.actions.length})
            </button>
            {actionsOpen && (
              <div style={{ paddingLeft: 8, paddingBottom: 8 }}>
                {task.actions.map((action, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '6px 0', fontSize: 13, color: '#2D2A26', lineHeight: 1.5,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#F5F0EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#C9A96E', flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Eval Harness */}
        {task.eval_harness.length > 0 && (
          <div>
            <button
              onClick={() => setEvalOpen(!evalOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', fontSize: 12,
                fontWeight: 600, color: '#7A746D', width: '100%', textAlign: 'left',
                cursor: 'pointer', background: 'none', border: 'none',
              }}
            >
              <span style={{ transform: evalOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
              📊 Eval Harness ({task.eval_harness.length} metrics)
            </button>
            {evalOpen && <EvalHarnessGrid evals={task.eval_harness} />}
          </div>
        )}
      </div>

      {/* Chat about this task */}
      <button
        onClick={() => onChat(`Help me with this task: "${task.title}" — ${task.description}`)}
        style={{
          marginTop: 12, width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 600,
          borderRadius: 10, border: '1.5px solid #E8E0D8', background: 'transparent',
          color: '#7A746D', cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D8'; e.currentTarget.style.color = '#7A746D' }}
      >
        💬 Chat about this task
      </button>
    </div>
  )
}

/* ─── Main Component ─── */

export function BusinessProfileView({ profile, onReset, onNewChat }: BusinessProfileViewProps) {
  if (!profile?.business) {
    // Invalid profile data — trigger reset
    if (typeof window !== 'undefined') localStorage.removeItem('agentsy_business')
    return <div style={{ padding: 40, textAlign: 'center', color: '#9E9891' }}>Loading...</div>
  }

  const { business, tasks = [], summary, top_issue, sentiment_score, analyzed_at, browserbaseSessionUrl } = profile

  const criticalCount = tasks.filter(t => t.priority === 'critical').length
  const highCount = tasks.filter(t => t.priority === 'high').length
  const analyzedDate = new Date(analyzed_at)
  const dateStr = analyzedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = analyzedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar" style={{ background: '#FFFCF7' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0' }} className="safe-top">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="font-serif" style={{ fontSize: '1.65rem', color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            Agentsy<span style={{ color: '#C9A96E' }}>.</span>
          </div>
          <button
            onClick={onReset}
            style={{
              padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1.5px solid #E8E0D8', background: 'transparent', color: '#7A746D',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D8'; e.currentTarget.style.color = '#7A746D' }}
          >
            + New Analysis
          </button>
        </div>
      </div>

      {/* Business Header Card */}
      <div style={{ margin: '0 16px 12px', padding: '20px', borderRadius: 18, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Business icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #C9A96E 0%, #E8D5B0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
          }}>
            🏪
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {business.name}
            </h1>
            <div style={{ fontSize: 13, color: '#9E9891', marginTop: 2 }}>{business.type}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Stars rating={business.rating} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2D2A26' }}>{business.rating}</span>
              <span style={{ fontSize: 12, color: '#9E9891' }}>({business.review_count} reviews)</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 13, color: '#7A746D', lineHeight: 1.4 }}>{business.address}</span>
        </div>

        {/* Sentiment */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9E9891', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Sentiment Score
          </div>
          <SentimentGauge score={sentiment_score} />
        </div>

        {/* Analyzed date */}
        <div style={{ fontSize: 11, color: '#BCBCBC', marginTop: 10 }}>
          Analyzed {dateStr} at {timeStr} · {business.reviews.length} reviews scraped
        </div>
      </div>

      {/* Summary Card */}
      <div style={{ margin: '0 16px 12px', padding: '18px 20px', borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9E9891', marginBottom: 8 }}>
          Summary
        </div>
        <p style={{ fontSize: 14, color: '#2D2A26', lineHeight: 1.6, margin: 0 }}>{summary}</p>

        {/* Top issue */}
        {top_issue && (
          <div style={{
            marginTop: 14, padding: '12px 14px', borderRadius: 12,
            background: '#FEF2F2', border: '1px solid #FECACA',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚨</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                Top Issue
              </div>
              <p style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5, margin: 0 }}>{top_issue}</p>
            </div>
          </div>
        )}
      </div>

      {/* Session replay link */}
      {browserbaseSessionUrl && (
        <div style={{ margin: '0 16px 12px' }}>
          <a
            href={browserbaseSessionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14,
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2A26 100%)', textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>🎬</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>Watch Session Replay</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>See exactly how the agent scraped this business</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>→</span>
          </a>
        </div>
      )}

      {/* Task Overview */}
      <div style={{ margin: '8px 16px 8px', display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, padding: '14px', borderRadius: 14, background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A' }}>{tasks.length}</div>
          <div style={{ fontSize: 11, color: '#9E9891', fontWeight: 500 }}>Tasks</div>
        </div>
        {criticalCount > 0 && (
          <div style={{
            flex: 1, padding: '14px', borderRadius: 14, background: '#FEF2F2',
            border: '1px solid #FECACA', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626' }}>{criticalCount}</div>
            <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>Critical</div>
          </div>
        )}
        {highCount > 0 && (
          <div style={{
            flex: 1, padding: '14px', borderRadius: 14, background: '#FFF3E0',
            border: '1px solid #FED7AA', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#EA580C' }}>{highCount}</div>
            <div style={{ fontSize: 11, color: '#EA580C', fontWeight: 500 }}>High</div>
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9E9891', marginBottom: 12 }}>
          Improvement Tasks
        </div>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onChat={onNewChat} />
        ))}
      </div>

      {/* Analyze another button */}
      <div style={{ padding: '8px 16px 32px' }}>
        <button
          onClick={onReset}
          style={{
            width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 700, borderRadius: 14,
            background: '#1A1A1A', color: '#FFFFFF', cursor: 'pointer',
            border: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2D2A26'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          🔄 Analyze Another Business
        </button>
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
}
