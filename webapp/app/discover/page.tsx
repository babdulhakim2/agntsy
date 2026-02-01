'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BusinessInfo,
  BusinessAnalysis,
  Review,
  PainPoint,
  Workflow,
  DiscoveryStep,
  DiscoveryProgress,
} from '@/lib/types';

// ========================================
// Step configuration
// ========================================
const STEPS: { key: DiscoveryStep; label: string; icon: string }[] = [
  { key: 'connecting', label: 'Launching browser agent...', icon: '🔌' },
  { key: 'loading_maps', label: 'Opening Google Maps...', icon: '🗺️' },
  { key: 'extracting_info', label: 'Extracting business info...', icon: '🏪' },
  { key: 'scraping_reviews', label: 'Scraping reviews...', icon: '⭐' },
  { key: 'sorting_reviews', label: 'Sorting & filtering reviews...', icon: '📊' },
  { key: 'scraping_website', label: 'Scraping business website...', icon: '🌐' },
  { key: 'analyzing', label: 'AI analyzing pain points...', icon: '🧠' },
  { key: 'generating_workflows', label: 'Generating workflows...', icon: '⚡' },
  { key: 'complete', label: 'Discovery complete!', icon: '✅' },
];

const TOOL_ICONS: Record<string, string> = {
  browser: '🌐',
  tts: '🔊',
  voice: '🎙️',
  llm: '🧠',
  image_model: '👁️',
  camera: '📷',
  sms: '📱',
  email: '📧',
  calendar: '📅',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#34D399',
  medium: '#FBBF24',
  high: '#F87171',
  critical: '#EF4444',
};

// ========================================
// Main Page Component
// ========================================
export default function DiscoverPage() {
  const [url, setUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<DiscoveryStep>('idle');
  const [completedSteps, setCompletedSteps] = useState<DiscoveryStep[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [analysis, setAnalysis] = useState<BusinessAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviews' | 'pain_points' | 'workflows'>('reviews');
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});

  const resultsRef = useRef<HTMLDivElement>(null);

  const advanceStep = useCallback((step: DiscoveryStep) => {
    setCompletedSteps((prev) => {
      const currentStepKey = STEPS.find((s) => s.key === step);
      const idx = STEPS.findIndex((s) => s.key === step);
      const previousSteps = STEPS.slice(0, idx).map((s) => s.key);
      return [...new Set([...prev, ...previousSteps])];
    });
    setCurrentStep(step);
  }, []);

  const runDiscovery = useCallback(async () => {
    if (!url.trim()) return;
    setIsRunning(true);
    setError(null);
    setBusiness(null);
    setAnalysis(null);
    setCompletedSteps([]);
    setCurrentStep('connecting');

    try {
      // Simulate step progression
      const stepDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

      advanceStep('connecting');
      await stepDelay(800);

      advanceStep('loading_maps');
      await stepDelay(1000);

      advanceStep('extracting_info');
      await stepDelay(600);

      // Phase 1: Discover
      advanceStep('scraping_reviews');
      const discoverRes = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maps_url: url }),
      });

      if (!discoverRes.ok) {
        throw new Error('Discovery failed');
      }

      const { business: biz } = await discoverRes.json();
      setBusiness(biz);

      advanceStep('sorting_reviews');
      await stepDelay(800);

      advanceStep('scraping_website');
      await stepDelay(1000);

      // Phase 2: Analyze
      advanceStep('analyzing');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: biz.id, business_data: biz }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Analysis failed');
      }

      const { analysis: anal } = await analyzeRes.json();

      advanceStep('generating_workflows');
      await stepDelay(1200);

      setAnalysis(anal);
      advanceStep('complete');
      setCompletedSteps((prev) => [...prev, 'complete']);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    } catch (err) {
      setError(String(err));
      setCurrentStep('error');
    } finally {
      setIsRunning(false);
    }
  }, [url, advanceStep]);

  const handleFeedback = useCallback(
    async (workflowId: string, action: 'thumbs_up' | 'thumbs_down') => {
      if (!business) return;
      setFeedbackState((prev) => ({ ...prev, [workflowId]: action }));

      try {
        await fetch('/api/workflows', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_id: business.id,
            workflow_id: workflowId,
            action,
          }),
        });
      } catch {
        // Feedback is non-critical
      }
    },
    [business]
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/" style={styles.logo}>
          Agentsy<span style={{ color: '#7C5CFC' }}>.</span>
        </a>
        <div style={styles.headerBadge}>
          <span style={styles.badgeDot} />
          Business Discovery
        </div>
      </header>

      {/* Hero Input Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroOrb} />
        <div style={styles.heroOrb2} />
        <h1 style={styles.heroTitle}>
          Discover. Analyze. <span style={{ color: '#7C5CFC' }}>Automate.</span>
        </h1>
        <p style={styles.heroSub}>
          Paste a Google Maps URL and let our AI agent scrape the business, analyze reviews,
          and generate tailored automation workflows.
        </p>

        <div style={styles.inputGroup}>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>🔍</span>
            <input
              type="url"
              placeholder="Paste a Google Maps URL... (or any URL for demo)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isRunning && runDiscovery()}
              style={styles.input}
              disabled={isRunning}
            />
          </div>
          <button
            onClick={runDiscovery}
            disabled={isRunning || !url.trim()}
            style={{
              ...styles.discoverBtn,
              opacity: isRunning || !url.trim() ? 0.5 : 1,
              cursor: isRunning || !url.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isRunning ? (
              <span style={styles.spinner} />
            ) : (
              '⚡'
            )}
            {isRunning ? 'Discovering...' : 'Discover'}
          </button>
        </div>

        {/* Quick demo link */}
        {!isRunning && !business && (
          <button
            style={styles.demoLink}
            onClick={() => {
              setUrl('https://maps.google.com/maps?q=brewhaus+coffee+portland');
              setTimeout(() => runDiscovery(), 100);
            }}
          >
            Try with demo data →
          </button>
        )}
      </section>

      {/* Discovery Progress */}
      {currentStep !== 'idle' && (
        <section style={styles.progressSection}>
          <div style={styles.progressCard}>
            <h3 style={styles.progressTitle}>
              <span style={styles.pulseIcon}>
                {currentStep === 'error' ? '❌' : currentStep === 'complete' ? '✅' : '🔄'}
              </span>
              Agent Pipeline
            </h3>
            <div style={styles.stepList}>
              {STEPS.map((step) => {
                const isComplete = completedSteps.includes(step.key);
                const isCurrent = currentStep === step.key;
                const isPending = !isComplete && !isCurrent;

                return (
                  <div
                    key={step.key}
                    style={{
                      ...styles.stepRow,
                      opacity: isPending ? 0.3 : 1,
                    }}
                  >
                    <div
                      style={{
                        ...styles.stepIcon,
                        background: isComplete
                          ? 'rgba(52, 211, 153, 0.15)'
                          : isCurrent
                          ? 'rgba(124, 92, 252, 0.15)'
                          : 'rgba(107, 107, 128, 0.1)',
                        color: isComplete ? '#34D399' : isCurrent ? '#7C5CFC' : '#6B6B80',
                      }}
                    >
                      {isComplete ? '✓' : step.icon}
                    </div>
                    <span
                      style={{
                        ...styles.stepLabel,
                        color: isComplete ? '#34D399' : isCurrent ? '#E8E8F0' : '#6B6B80',
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                    {isCurrent && !isComplete && (
                      <div style={styles.stepSpinner} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser View Placeholder */}
          <div style={styles.browserFrame}>
            <div style={styles.browserToolbar}>
              <div style={styles.browserDots}>
                <span style={{ ...styles.dot, background: '#F87171' }} />
                <span style={{ ...styles.dot, background: '#FBBF24' }} />
                <span style={{ ...styles.dot, background: '#34D399' }} />
              </div>
              <div style={styles.browserUrl}>
                {url || 'https://maps.google.com/...'}
              </div>
            </div>
            <div style={styles.browserContent}>
              {currentStep === 'complete' && business ? (
                <div style={styles.browserResult}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
                  <h3 style={{ color: '#E8E8F0', margin: '0 0 4px' }}>{business.name}</h3>
                  <p style={{ color: '#6B6B80', margin: 0 }}>
                    {'⭐'.repeat(Math.round(business.rating))} {business.rating} · {business.review_count} reviews
                  </p>
                </div>
              ) : (
                <div style={styles.browserLoading}>
                  <div style={styles.scanline} />
                  <p style={{ color: '#6B6B80', margin: 0 }}>
                    {isRunning ? 'Agent browser active...' : 'Waiting for discovery...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <div style={styles.errorCard}>
          <span>❌</span> {error}
        </div>
      )}

      {/* Results Section */}
      {business && analysis && (
        <section ref={resultsRef} style={styles.resultsSection}>
          {/* Business Card */}
          <div style={styles.businessCard}>
            <div style={styles.businessHeader}>
              <div style={styles.businessAvatar}>
                {business.name.charAt(0)}
              </div>
              <div>
                <h2 style={styles.businessName}>{business.name}</h2>
                <div style={styles.businessMeta}>
                  <span style={styles.businessType}>{business.type}</span>
                  <span style={styles.businessRating}>
                    ⭐ {business.rating}
                  </span>
                  <span style={styles.businessReviewCount}>
                    ({business.review_count} reviews)
                  </span>
                  {business.price_level && (
                    <span style={styles.businessPrice}>{business.price_level}</span>
                  )}
                </div>
                <p style={styles.businessAddress}>📍 {business.address}</p>
              </div>
            </div>

            {/* Strengths */}
            <div style={styles.strengthsRow}>
              {analysis.strengths.slice(0, 4).map((s, i) => (
                <span key={i} style={styles.strengthTag}>✨ {s.label}</span>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={styles.tabBar}>
            {(['reviews', 'pain_points', 'workflows'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === tab ? styles.tabBtnActive : {}),
                }}
              >
                {tab === 'reviews' && `⭐ Reviews (${business.reviews.length})`}
                {tab === 'pain_points' && `🔥 Pain Points (${analysis.pain_points.length})`}
                {tab === 'workflows' && `⚡ Workflows (${analysis.suggested_workflows.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div style={styles.reviewsGrid}>
                {business.reviews.map((review, i) => (
                  <ReviewCard key={i} review={review} />
                ))}
              </div>
            )}

            {/* Pain Points Tab */}
            {activeTab === 'pain_points' && (
              <div style={styles.painPointsGrid}>
                {analysis.pain_points.map((pp, i) => (
                  <PainPointCard key={i} painPoint={pp} />
                ))}

                {/* Unanswered Questions */}
                {analysis.unanswered_questions.length > 0 && (
                  <div style={styles.questionsCard}>
                    <h3 style={styles.questionsTitle}>❓ Unanswered Customer Questions</h3>
                    <ul style={styles.questionsList}>
                      {analysis.unanswered_questions.map((q, i) => (
                        <li key={i} style={styles.questionItem}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Workflows Tab */}
            {activeTab === 'workflows' && (
              <div style={styles.workflowsGrid}>
                {analysis.suggested_workflows.map((wf) => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    feedback={feedbackState[wf.id]}
                    onFeedback={handleFeedback}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={{ color: '#6B6B80', margin: 0 }}>
          Built with Agentsy · Browserbase · Claude · WeaveHacks 3
        </p>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0A0A0F; }
        input:focus { outline: none; }
        button:focus { outline: none; }
        ::selection { background: rgba(124, 92, 252, 0.3); }
      `}</style>
    </div>
  );
}

// ========================================
// Sub-components
// ========================================
function ReviewCard({ review }: { review: Review }) {
  const sentimentColor =
    review.sentiment === 'positive'
      ? '#34D399'
      : review.sentiment === 'negative'
      ? '#F87171'
      : '#FBBF24';

  return (
    <div style={styles.reviewCard}>
      <div style={styles.reviewHeader}>
        <div style={styles.reviewAuthorRow}>
          <div style={{
            ...styles.reviewAvatar,
            background: `linear-gradient(135deg, ${sentimentColor}22, ${sentimentColor}44)`,
            color: sentimentColor,
          }}>
            {review.author.charAt(0)}
          </div>
          <div>
            <div style={styles.reviewAuthor}>{review.author}</div>
            <div style={styles.reviewDate}>{review.date}</div>
          </div>
        </div>
        <div style={styles.reviewStars}>
          {'★'.repeat(review.rating)}
          {'☆'.repeat(5 - review.rating)}
        </div>
      </div>
      <p style={{
        ...styles.reviewText,
        borderLeft: `2px solid ${sentimentColor}33`,
        paddingLeft: 12,
      }}>
        {review.text}
      </p>
      {review.sentiment && (
        <span style={{
          ...styles.sentimentBadge,
          background: `${sentimentColor}15`,
          color: sentimentColor,
          border: `1px solid ${sentimentColor}33`,
        }}>
          {review.sentiment === 'positive' ? '👍' : review.sentiment === 'negative' ? '👎' : '😐'}{' '}
          {review.sentiment}
        </span>
      )}
    </div>
  );
}

function PainPointCard({ painPoint }: { painPoint: PainPoint }) {
  const color = SEVERITY_COLORS[painPoint.severity] || '#6B6B80';
  const barWidth = Math.min((painPoint.frequency / 15) * 100, 100);

  return (
    <div style={styles.painPointCard}>
      <div style={styles.ppHeader}>
        <h3 style={styles.ppTitle}>{painPoint.issue}</h3>
        <span style={{
          ...styles.severityBadge,
          background: `${color}15`,
          color,
          border: `1px solid ${color}33`,
        }}>
          {painPoint.severity}
        </span>
      </div>

      {/* Frequency bar */}
      <div style={styles.ppFreqRow}>
        <span style={styles.ppFreqLabel}>Mentions: {painPoint.frequency}</span>
        <div style={styles.ppBarTrack}>
          <div style={{
            ...styles.ppBarFill,
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }} />
        </div>
      </div>

      {/* Example quotes */}
      <div style={styles.ppQuotes}>
        {painPoint.example_quotes.map((q, i) => (
          <div key={i} style={styles.ppQuote}>
            <span style={{ color: '#6B6B80' }}>&ldquo;</span>
            {q}
            <span style={{ color: '#6B6B80' }}>&rdquo;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowCard({
  workflow,
  feedback,
  onFeedback,
}: {
  workflow: Workflow;
  feedback?: string;
  onFeedback: (id: string, action: 'thumbs_up' | 'thumbs_down') => void;
}) {
  return (
    <div style={styles.workflowCard}>
      <div style={styles.wfHeader}>
        <div>
          <h3 style={styles.wfTitle}>{workflow.name}</h3>
          <span style={{
            ...styles.wfBadge,
            background: workflow.user_facing ? 'rgba(96, 165, 250, 0.12)' : 'rgba(124, 92, 252, 0.12)',
            color: workflow.user_facing ? '#60A5FA' : '#7C5CFC',
          }}>
            {workflow.user_facing ? '👤 User-facing' : '🔧 Internal'}
          </span>
        </div>
      </div>

      <p style={styles.wfDesc}>{workflow.description}</p>

      <div style={styles.wfTrigger}>
        <span style={{ color: '#6B6B80' }}>Trigger:</span>{' '}
        <code style={styles.wfTriggerCode}>{workflow.trigger}</code>
      </div>

      {/* Tools */}
      <div style={styles.wfTools}>
        {workflow.tools_used.map((tool) => (
          <span key={tool} style={styles.wfToolTag}>
            {TOOL_ICONS[tool] || '🔧'} {tool}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={styles.wfActions}>
        <div style={{ color: '#6B6B80', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Actions:</div>
        {workflow.actions.map((action, i) => (
          <div key={i} style={styles.wfAction}>
            <span style={styles.wfActionNum}>{i + 1}</span>
            {action}
          </div>
        ))}
      </div>

      {/* Eval Metrics */}
      <div style={styles.wfMetrics}>
        <div style={{ color: '#6B6B80', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Eval Metrics:</div>
        <div style={styles.wfMetricsGrid}>
          {workflow.eval_metrics.map((m, i) => (
            <div key={i} style={styles.wfMetricTag}>
              <div style={{ fontWeight: 500, color: '#E8E8F0', fontSize: 12 }}>{m.name}</div>
              {m.target && (
                <div style={{ color: '#34D399', fontSize: 11 }}>Target: {m.target}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div style={styles.wfFeedback}>
        <button
          onClick={() => onFeedback(workflow.id, 'thumbs_up')}
          style={{
            ...styles.feedbackBtn,
            background: feedback === 'thumbs_up' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
            borderColor: feedback === 'thumbs_up' ? '#34D399' : '#2A2A3A',
            color: feedback === 'thumbs_up' ? '#34D399' : '#6B6B80',
          }}
        >
          👍
        </button>
        <button
          onClick={() => onFeedback(workflow.id, 'thumbs_down')}
          style={{
            ...styles.feedbackBtn,
            background: feedback === 'thumbs_down' ? 'rgba(248, 113, 113, 0.15)' : 'transparent',
            borderColor: feedback === 'thumbs_down' ? '#F87171' : '#2A2A3A',
            color: feedback === 'thumbs_down' ? '#F87171' : '#6B6B80',
          }}
        >
          👎
        </button>
        <button style={styles.feedbackBtn}>✏️</button>
      </div>
    </div>
  );
}

// ========================================
// Styles
// ========================================
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0A0A0F',
    color: '#E8E8F0',
    fontFamily: "'Inter', -apple-system, sans-serif",
    overflow: 'hidden auto',
  },

  // Header
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10, 10, 15, 0.8)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid #2A2A3A',
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: '#E8E8F0',
    textDecoration: 'none',
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#6B6B80',
    padding: '6px 14px',
    background: '#12121A',
    borderRadius: 20,
    border: '1px solid #2A2A3A',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#34D399',
    display: 'inline-block',
  },

  // Hero
  heroSection: {
    position: 'relative',
    paddingTop: 140,
    paddingBottom: 60,
    textAlign: 'center',
    maxWidth: 720,
    margin: '0 auto',
    padding: '140px 24px 60px',
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    top: -100,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 600,
    background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -200,
    right: -100,
    width: 400,
    height: 400,
    background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1.1,
    margin: '0 0 16px',
    letterSpacing: '-0.03em',
  },
  heroSub: {
    fontSize: 17,
    color: '#6B6B80',
    lineHeight: 1.6,
    margin: '0 0 32px',
    maxWidth: 540,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inputGroup: {
    display: 'flex',
    gap: 12,
    maxWidth: 600,
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: 12,
    color: '#E8E8F0',
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s',
  },
  discoverBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px 28px',
    background: 'linear-gradient(135deg, #7C5CFC, #6B4CE0)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  demoLink: {
    marginTop: 16,
    background: 'none',
    border: 'none',
    color: '#7C5CFC',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    opacity: 0.8,
  },

  // Progress
  progressSection: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px 40px',
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: 24,
  },
  progressCard: {
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: 16,
    padding: 24,
  },
  progressTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 20px',
    color: '#E8E8F0',
  },
  pulseIcon: {
    animation: 'pulse 2s ease-in-out infinite',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    transition: 'opacity 0.3s',
    animation: 'slideIn 0.3s ease',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: 13,
    flex: 1,
  },
  stepSpinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(124,92,252,0.3)',
    borderTopColor: '#7C5CFC',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },

  // Browser frame
  browserFrame: {
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  browserToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#1A1A26',
    borderBottom: '1px solid #2A2A3A',
  },
  browserDots: {
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  browserUrl: {
    flex: 1,
    background: '#12121A',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    color: '#6B6B80',
    fontFamily: "'JetBrains Mono', monospace",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  browserContent: {
    minHeight: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  browserLoading: {
    textAlign: 'center',
    position: 'relative',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), transparent)',
    animation: 'scanline 2s linear infinite',
  },
  browserResult: {
    textAlign: 'center',
    animation: 'fadeInUp 0.5s ease',
  },

  // Error
  errorCard: {
    maxWidth: 600,
    margin: '0 auto 24px',
    padding: '16px 20px',
    background: 'rgba(248, 113, 113, 0.08)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: 12,
    color: '#F87171',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  // Results
  resultsSection: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px 60px',
    animation: 'fadeInUp 0.6s ease',
  },

  // Business Card
  businessCard: {
    background: 'linear-gradient(135deg, #12121A, #1A1A26)',
    border: '1px solid #2A2A3A',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
  },
  businessHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
  },
  businessAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #7C5CFC, #6B4CE0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  businessName: {
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 8px',
  },
  businessMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  businessType: {
    padding: '4px 10px',
    background: 'rgba(124, 92, 252, 0.12)',
    color: '#7C5CFC',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  businessRating: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FBBF24',
  },
  businessReviewCount: {
    fontSize: 13,
    color: '#6B6B80',
  },
  businessPrice: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: 500,
  },
  businessAddress: {
    fontSize: 14,
    color: '#6B6B80',
    marginTop: 8,
  },
  strengthsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid #2A2A3A',
  },
  strengthTag: {
    padding: '6px 12px',
    background: 'rgba(52, 211, 153, 0.08)',
    color: '#34D399',
    borderRadius: 8,
    fontSize: 12,
    border: '1px solid rgba(52, 211, 153, 0.15)',
  },

  // Tabs
  tabBar: {
    display: 'flex',
    gap: 4,
    padding: 4,
    background: '#12121A',
    borderRadius: 12,
    border: '1px solid #2A2A3A',
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#6B6B80',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: '#1A1A26',
    color: '#E8E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tabContent: {
    minHeight: 300,
  },

  // Reviews
  reviewsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16,
    maxHeight: 600,
    overflowY: 'auto',
    paddingRight: 8,
  },
  reviewCard: {
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: 14,
    padding: 18,
    transition: 'border-color 0.2s',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewAuthorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
  },
  reviewAuthor: {
    fontWeight: 600,
    fontSize: 14,
    color: '#E8E8F0',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B6B80',
  },
  reviewStars: {
    color: '#FBBF24',
    fontSize: 14,
    letterSpacing: 1,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#B8B8CC',
    margin: '0 0 10px',
  },
  sentimentBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'capitalize',
  },

  // Pain Points
  painPointsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  painPointCard: {
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: 14,
    padding: 22,
  },
  ppHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ppTitle: {
    fontSize: 17,
    fontWeight: 600,
    margin: 0,
    color: '#E8E8F0',
  },
  severityBadge: {
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ppFreqRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  ppFreqLabel: {
    fontSize: 13,
    color: '#6B6B80',
    whiteSpace: 'nowrap',
    minWidth: 100,
  },
  ppBarTrack: {
    flex: 1,
    height: 6,
    background: '#1A1A26',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ppBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 1s ease',
  },
  ppQuotes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  ppQuote: {
    fontSize: 13,
    color: '#B8B8CC',
    fontStyle: 'italic',
    padding: '8px 12px',
    background: '#1A1A26',
    borderRadius: 8,
    borderLeft: '2px solid #2A2A3A',
  },
  questionsCard: {
    background: 'rgba(96, 165, 250, 0.06)',
    border: '1px solid rgba(96, 165, 250, 0.15)',
    borderRadius: 14,
    padding: 22,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 12px',
    color: '#60A5FA',
  },
  questionsList: {
    margin: 0,
    paddingLeft: 20,
  },
  questionItem: {
    fontSize: 14,
    color: '#B8B8CC',
    lineHeight: 1.8,
  },

  // Workflows
  workflowsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  workflowCard: {
    background: '#12121A',
    border: '1px solid #2A2A3A',
    borderRadius: 16,
    padding: 24,
    transition: 'border-color 0.2s',
  },
  wfHeader: {
    marginBottom: 12,
  },
  wfTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#E8E8F0',
  },
  wfBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  wfDesc: {
    fontSize: 14,
    color: '#B8B8CC',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  wfTrigger: {
    fontSize: 13,
    marginBottom: 14,
    color: '#E8E8F0',
  },
  wfTriggerCode: {
    padding: '3px 8px',
    background: '#1A1A26',
    borderRadius: 4,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: '#22D3EE',
  },
  wfTools: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  wfToolTag: {
    padding: '5px 10px',
    background: 'rgba(124, 92, 252, 0.08)',
    border: '1px solid rgba(124, 92, 252, 0.15)',
    borderRadius: 6,
    fontSize: 12,
    color: '#7C5CFC',
  },
  wfActions: {
    marginBottom: 16,
    padding: 16,
    background: '#1A1A26',
    borderRadius: 10,
  },
  wfAction: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: '#B8B8CC',
    lineHeight: 1.5,
    padding: '4px 0',
  },
  wfActionNum: {
    width: 20,
    height: 20,
    borderRadius: 6,
    background: 'rgba(124, 92, 252, 0.12)',
    color: '#7C5CFC',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    flexShrink: 0,
  },
  wfMetrics: {
    marginBottom: 16,
  },
  wfMetricsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  wfMetricTag: {
    padding: '8px 12px',
    background: '#1A1A26',
    borderRadius: 8,
    border: '1px solid #2A2A3A',
  },
  wfFeedback: {
    display: 'flex',
    gap: 8,
    paddingTop: 16,
    borderTop: '1px solid #2A2A3A',
  },
  feedbackBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #2A2A3A',
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#6B6B80',
    fontFamily: "'Inter', sans-serif",
  },

  // Footer
  footer: {
    textAlign: 'center',
    padding: '40px 24px',
    borderTop: '1px solid #2A2A3A',
  },
};
