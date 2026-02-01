'use client'

import { useState, useCallback } from 'react'
import s from './discover.module.css'
import { MOCK_BUSINESS, MOCK_REVIEWS, MOCK_ANALYSIS } from '@/lib/mock-discover'
import { TOOL_META } from '@/lib/discover-types'
import type { DiscoveryState, Workflow } from '@/lib/discover-types'

const STEPS = [
  { key: 'opening', label: 'Opening Google Maps...' },
  { key: 'scraping_info', label: 'Extracting business info...' },
  { key: 'scraping_reviews', label: 'Scraping reviews (newest + lowest)...' },
  { key: 'scraping_website', label: 'Scanning business website...' },
  { key: 'analyzing', label: 'Analyzing pain points with Claude...' },
  { key: 'generating', label: 'Generating smart workflows...' },
]

export default function DiscoverPage() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<DiscoveryState>({
    step: 'idle',
    progress: 0,
    message: '',
  })
  const [workflows, setWorkflows] = useState<Workflow[]>([])

  const runDiscovery = useCallback(async () => {
    if (!url.trim()) return

    // Simulate the discovery pipeline with mock data
    const steps: DiscoveryState['step'][] = ['opening', 'scraping_info', 'scraping_reviews', 'scraping_website', 'analyzing', 'generating']
    
    for (let i = 0; i < steps.length; i++) {
      setState({
        step: steps[i],
        progress: ((i + 1) / steps.length) * 100,
        message: STEPS[i].label,
      })
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    }

    // "Done" — load mock data
    setState({
      step: 'done',
      progress: 100,
      message: 'Discovery complete!',
      business: MOCK_BUSINESS,
      reviews: MOCK_REVIEWS,
      analysis: MOCK_ANALYSIS,
    })
    setWorkflows(MOCK_ANALYSIS.workflows)
  }, [url])

  const handleFeedback = useCallback((wfId: string, feedback: 'good' | 'bad') => {
    setWorkflows(prev => prev.map(w => 
      w.id === wfId ? { ...w, feedback, confidence: feedback === 'good' ? Math.min(w.confidence + 0.03, 1) : Math.max(w.confidence - 0.05, 0.5) } : w
    ))
  }, [])

  const isRunning = !['idle', 'done', 'error'].includes(state.step)
  const isDone = state.step === 'done'

  return (
    <div className={s.page}>
      {/* ─── Topbar ─── */}
      <div className={s.topbar}>
        <div className={s.brand}>
          <div className={s.logo}>A</div>
          <span className={s.brandName}>Agentsy</span>
          <span className={s.tag}>Discovery</span>
        </div>
        <a href="/" style={{ color: '#6B6B80', fontSize: '13px', textDecoration: 'none' }}>← Back to home</a>
      </div>

      <div className={s.main}>
        {/* ─── Left: Main Content ─── */}
        <div className={s.left}>
          {/* Input */}
          <div className={s.inputSection}>
            <h1 className={s.inputTitle}>
              Discover any <em>business</em>
            </h1>
            <p className={s.inputSub}>
              Paste a Google Maps URL — we&apos;ll analyze reviews, find pain points, and generate AI workflows.
            </p>
            <div className={s.inputWrap}>
              <input
                className={s.inputField}
                type="text"
                placeholder="https://maps.google.com/maps?q=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runDiscovery()}
                disabled={isRunning}
              />
              <button
                className={s.discoverBtn}
                onClick={runDiscovery}
                disabled={isRunning || !url.trim()}
              >
                {isRunning ? '⏳ Discovering...' : '🔍 Discover'}
              </button>
            </div>
          </div>

          {/* Progress */}
          {(isRunning || isDone) && (
            <div className={s.progressWrap}>
              {STEPS.map((step, i) => {
                const stepIndex = STEPS.findIndex(s => s.key === state.step)
                const isDoneStep = isDone || i < stepIndex
                const isActive = i === stepIndex && !isDone
                return (
                  <div key={step.key} className={s.progressStep}>
                    <div className={`${s.stepDot} ${isDoneStep ? s.stepDotDone : isActive ? s.stepDotActive : s.stepDotPending}`} />
                    <span className={`${s.stepLabel} ${isDoneStep ? s.stepLabelDone : isActive ? s.stepLabelActive : ''}`}>
                      {step.label}
                    </span>
                    {isDoneStep && <span className={s.stepTime}>✓</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Business Card */}
          {isDone && state.business && (
            <>
              <div className={s.bizCard}>
                <div className={s.bizHeader}>
                  <div>
                    <div className={s.bizName}>{state.business.name}</div>
                    <div className={s.bizType}>{state.business.type}</div>
                  </div>
                  <div className={s.bizRating}>
                    <span className={s.bizRatingStar}>⭐</span>
                    {state.business.rating}
                    <span style={{ fontSize: '12px', color: '#6B6B80', fontWeight: 400 }}>
                      ({state.business.reviewCount})
                    </span>
                  </div>
                </div>
                <div className={s.bizMeta}>
                  <span className={s.bizMetaItem}>📍 {state.business.address}</span>
                  {state.business.phone && <span className={s.bizMetaItem}>📞 {state.business.phone}</span>}
                  {state.business.hours && <span className={s.bizMetaItem}>🕐 {state.business.hours}</span>}
                  {state.business.priceLevel && <span className={s.bizMetaItem}>💰 {state.business.priceLevel}</span>}
                </div>
              </div>

              {/* Pain Points */}
              <div>
                <div className={s.sectionHeader}>
                  <span className={s.sectionIcon}>🔥</span>
                  <span className={s.sectionTitle}>Pain Points</span>
                  <span className={s.sectionCount}>{state.analysis?.painPoints.length} found</span>
                </div>
                <div className={s.painPoints}>
                  {state.analysis?.painPoints.map((pp, i) => (
                    <div key={pp.issue} className={s.painCard} style={{ animationDelay: `${i * 80}ms` }}>
                      <div className={s.painHeader}>
                        <span className={s.painLabel}>{pp.label}</span>
                        <span className={`${s.painSeverity} ${pp.severity === 'high' ? s.severityHigh : pp.severity === 'medium' ? s.severityMedium : s.severityLow}`}>
                          {pp.severity}
                        </span>
                      </div>
                      <div className={s.painFreq}>Mentioned {pp.frequency}× in reviews</div>
                      <div className={s.painQuote}>&ldquo;{pp.exampleQuotes[0]}&rdquo;</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Workflows */}
              <div>
                <div className={s.sectionHeader}>
                  <span className={s.sectionIcon}>⚡</span>
                  <span className={s.sectionTitle}>Generated Workflows</span>
                  <span className={s.sectionCount}>{workflows.length} workflows</span>
                </div>
                {workflows.map((wf, i) => (
                  <div key={wf.id} className={s.workflowCard} style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={s.wfHeader}>
                      <div className={s.wfName}>{wf.name}</div>
                      <div className={s.wfConfidence}>{(wf.confidence * 100).toFixed(0)}%</div>
                    </div>
                    <div className={s.wfDesc}>{wf.description}</div>
                    <div className={s.wfMeta}>
                      <span className={s.wfTrigger}>⏱ {wf.trigger}</span>
                      <span className={`${s.wfFacing} ${wf.userFacing ? s.wfFacingUser : s.wfFacingInternal}`}>
                        {wf.userFacing ? '👤 User-Facing' : '🔧 Internal'}
                      </span>
                    </div>
                    <div className={s.wfTools}>
                      {wf.toolsUsed.map(tool => (
                        <span key={tool} className={s.wfTool} style={{ borderColor: TOOL_META[tool].color + '40', color: TOOL_META[tool].color }}>
                          {TOOL_META[tool].icon} {TOOL_META[tool].label}
                        </span>
                      ))}
                    </div>
                    <div className={s.wfActions}>
                      {wf.actions.map((action, j) => (
                        <div key={j} className={s.wfAction}>
                          <span className={s.wfActionDot}>→</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                    <div className={s.wfEvals}>
                      {wf.evalMetrics.map(m => (
                        <span key={m.name} className={s.wfEval}>
                          📊 {m.name}{m.target ? ` ≥${m.target}${m.type === 'percentage' ? '%' : ''}` : ''}
                        </span>
                      ))}
                    </div>
                    <div className={s.wfFeedback}>
                      <button
                        className={`${s.feedbackBtn} ${wf.feedback === 'good' ? s.feedbackBtnGood : ''}`}
                        onClick={() => handleFeedback(wf.id, 'good')}
                      >
                        👍 Useful
                      </button>
                      <button
                        className={`${s.feedbackBtn} ${wf.feedback === 'bad' ? s.feedbackBtnBad : ''}`}
                        onClick={() => handleFeedback(wf.id, 'bad')}
                      >
                        👎 Not helpful
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── Right: Panels ─── */}
        <div className={s.right}>
          {/* Browser Frame */}
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <div className={s.panelTitle}>
                <span>🖥️</span> Browserbase
                <span className={s.panelBadge} style={{ background: 'rgba(34,211,238,0.15)', color: '#22D3EE' }}>
                  {isRunning ? 'LIVE' : 'READY'}
                </span>
              </div>
            </div>
            <div className={s.browserFrame}>
              <div className={s.browserBar}>
                <div className={s.browserDots}>
                  <span className={s.browserDot} style={{ background: '#FF5F57' }} />
                  <span className={s.browserDot} style={{ background: '#FFBD2E' }} />
                  <span className={s.browserDot} style={{ background: '#28CA41' }} />
                </div>
                <div className={s.browserUrl}>
                  {isDone ? state.business?.mapsUrl : isRunning ? 'maps.google.com' : 'Waiting for URL...'}
                </div>
              </div>
              <div className={`${s.browserContent} ${(isRunning || isDone) ? s.browserContentActive : ''}`}>
                {!isRunning && !isDone && 'Paste a Google Maps URL to start'}
                {isRunning && (
                  <div>
                    <div style={{ color: '#7C5CFC', marginBottom: 8, fontWeight: 600 }}>🔍 Agent is browsing...</div>
                    <div style={{ color: '#6B6B80' }}>{state.message}</div>
                  </div>
                )}
                {isDone && state.business && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{state.business.name}</div>
                    <div style={{ color: '#FBBF24', marginBottom: 4 }}>⭐ {state.business.rating} ({state.business.reviewCount} reviews)</div>
                    <div style={{ color: '#6B6B80', fontSize: 11 }}>{state.business.address}</div>
                    <div style={{ color: '#34D399', fontSize: 11, marginTop: 8 }}>✓ {state.reviews?.length} reviews scraped</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Panel */}
          {isDone && state.reviews && (
            <div className={s.panel}>
              <div className={s.panelHeader}>
                <div className={s.panelTitle}>
                  <span>💬</span> Reviews
                </div>
                <span style={{ fontSize: 10, color: '#6B6B80' }}>{state.reviews.length} scraped</span>
              </div>
              <div className={s.reviewsList}>
                {state.reviews.slice(0, 10).map((r, i) => (
                  <div key={i} className={s.reviewItem} style={{
                    borderColor: r.sentiment === 'negative' ? 'rgba(248,113,113,0.2)' : r.sentiment === 'positive' ? 'rgba(52,211,153,0.2)' : undefined,
                    background: r.sentiment === 'negative' ? 'rgba(248,113,113,0.04)' : r.sentiment === 'positive' ? 'rgba(52,211,153,0.04)' : undefined,
                  }}>
                    <div className={s.reviewHeader}>
                      <span className={s.reviewAuthor}>{r.author}</span>
                      <span className={s.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <div className={s.reviewText}>{r.text.slice(0, 120)}{r.text.length > 120 ? '...' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths Panel */}
          {isDone && state.analysis && (
            <div className={s.panel}>
              <div className={s.panelHeader}>
                <div className={s.panelTitle}>
                  <span>💪</span> Strengths
                </div>
              </div>
              {state.analysis.strengths.map((str, i) => (
                <div key={i} className={s.strengthBar}>
                  <span className={s.strengthLabel}>{str.label}</span>
                  <div className={s.strengthTrack}>
                    <div className={s.strengthFill} style={{ width: `${(str.mentions / 20) * 100}%` }} />
                  </div>
                  <span className={s.strengthCount}>{str.mentions}</span>
                </div>
              ))}
            </div>
          )}

          {/* Unanswered Questions */}
          {isDone && state.analysis && (
            <div className={s.panel}>
              <div className={s.panelHeader}>
                <div className={s.panelTitle}>
                  <span>❓</span> Unanswered Questions
                </div>
              </div>
              {state.analysis.unansweredQuestions.map((q, i) => (
                <div key={i} style={{ fontSize: 12, color: '#E8E8F0', padding: '6px 0', borderBottom: '1px solid #2A2A3A' }}>
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
