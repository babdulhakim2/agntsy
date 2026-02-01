'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import s from './landing.module.css'

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="7" y1="2" x2="7" y2="12" />
    <line x1="2" y1="7" x2="12" y2="7" />
  </svg>
)

const FAQ_DATA = [
  { q: 'How does Agentsy work with WhatsApp?', a: 'Agentsy connects to WhatsApp through the official Business API. You\'ll get a dedicated number for your agent. Just save it to your contacts and start texting — no app installation or special setup required. It works just like messaging a friend.' },
  { q: 'Is my data private and secure?', a: 'Absolutely. Your conversations and data are encrypted and never shared with third parties. Your agent\'s memory is private to you — we don\'t use your data to train models. You can delete your data at any time.' },
  { q: 'What can the agent actually do?', a: 'Your agent can research topics on the web, write and edit content, manage files and documents, plan and organize projects, draft emails, create summaries, repurpose content across platforms, and much more. Think of it as a capable assistant that\'s always available in your pocket.' },
  { q: 'How is this different from ChatGPT?', a: 'ChatGPT is a conversation tool — you ask, it answers. Agentsy is an agent that takes action. It has persistent memory across all conversations, executes multi-step tasks autonomously, and lives where you already spend time (WhatsApp). It\'s less "chat" and more "get stuff done."' },
  { q: 'When will Agentsy be available?', a: 'We\'re currently in private beta with a small group of creators. Join the waitlist and you\'ll be among the first to get access as we expand. Early waitlist members get priority access and a special founding member rate.' },
]

const AGENT_STEPS = [
  { msg: 'Launching browser agent...', icon: '🔌' },
  { msg: 'Opening Google Maps...', icon: '🗺️' },
  { msg: 'Scraping reviews...', icon: '⭐' },
  { msg: 'Reading customer feedback...', icon: '📖' },
  { msg: 'Generating improvement tasks...', icon: '🧠' },
  { msg: 'Building eval harnesses...', icon: '📊' },
]

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [chatInView, setChatInView] = useState(false)
  const [bizUrl, setBizUrl] = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentStep, setAgentStep] = useState(0)

  const chatMockRef = useRef<HTMLDivElement>(null)
  const faqRefs = useRef<(HTMLDivElement | null)[]>([])

  const runAgent = useCallback(async () => {
    if (!bizUrl.trim()) return
    setAgentRunning(true)
    setAgentStep(0)

    const stepTimer = setInterval(() => {
      setAgentStep(prev => prev < AGENT_STEPS.length - 1 ? prev + 1 : prev)
    }, 8000)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bizUrl.trim() }),
      })
      const data = await res.json()
      if (data.profile) {
        localStorage.setItem('agentsy_business', JSON.stringify(data.profile))
        setAgentStep(AGENT_STEPS.length - 1)
        await new Promise(r => setTimeout(r, 800))
        window.location.href = '/home'
      } else {
        setAgentRunning(false)
      }
    } catch {
      setAgentRunning(false)
    } finally {
      clearInterval(stepTimer)
    }
  }, [bizUrl])

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.revealVisible)
            if (entry.target === chatMockRef.current) {
              setChatInView(true)
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    const els = document.querySelectorAll(`.${s.reveal}`)
    els.forEach((el) => observer.observe(el))

    if (chatMockRef.current) {
      observer.observe(chatMockRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Nav scroll handler
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // FAQ toggle
  const toggleFaq = useCallback((idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx))
  }, [])

  // Smooth scroll for anchor links
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className={s.page}>
      {/* ==================== NAV ==================== */}
      <nav className={`${s.nav} ${navScrolled ? s.navScrolled : ''}`}>
        <div className={s.navInner}>
          <a href="#" className={s.navLogo} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            Agentsy<span className={s.navLogoAccent}>.</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="/discover" style={{ fontSize: '0.85rem', fontWeight: 500, color: '#7C5CFC' }}>Demo</a>
            <a href="/home" className={s.navCta}>
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className={s.hero} id="hero">
        <div className={s.heroOrbBefore} />
        <div className={s.heroOrbAfter} />
        <div className={s.heroContent}>
          <div className={s.heroBadge}>
            <span className={s.heroBadgeDot} />
            Try it free — no signup required
          </div>
          <h1 className={s.heroTitle}>
            <span className={`${s.heroWord} ${s.heroWord1}`}>Your </span>
            <span className={`${s.heroWord} ${s.heroWord2}`}>AI </span>
            <span className={`${s.heroWord} ${s.heroWord3}`}>agent</span>
            <span className={s.lineBreak} />
            <span className={`${s.heroWord} ${s.heroWord5}`}>for your </span>
            <span className={`${s.heroWord} ${s.heroWord6}`}><em className={s.heroEm}>business</em>.</span>
          </h1>
          <p className={s.heroSub}>
            Paste your Google Maps link and our agent scrapes your reviews, finds what to improve, and builds a measurable action plan — powered by AI that learns.
          </p>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FAF8F4', borderRadius: 16, padding: '6px 6px 6px 18px', border: '1.5px solid #E5E0D8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <input
                type="text"
                placeholder="Paste your Google Maps URL..."
                value={bizUrl}
                onChange={e => setBizUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runAgent()}
                disabled={agentRunning}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#1A1A1A', padding: '10px 0' }}
              />
              <button
                onClick={runAgent}
                disabled={!bizUrl.trim() || agentRunning}
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 14,
                  background: bizUrl.trim() && !agentRunning ? '#1A1A1A' : '#CCC', color: '#FFF',
                  cursor: bizUrl.trim() && !agentRunning ? 'pointer' : 'default', whiteSpace: 'nowrap',
                }}
              >
                {agentRunning ? 'Analyzing...' : 'Analyze →'}
              </button>
            </div>
          </div>
        </div>
        <div className={s.scrollHint}>
          <svg className={s.chevron} viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className={s.features} id="features">
        <div className={s.container}>
          <div className={s.featuresHeader}>
            <div className={`${s.sectionLabel} ${s.reveal}`}>What is Agentsy?</div>
            <h2 className={`${s.sectionTitle} ${s.reveal} ${s.revealDelay1}`}>
              An AI that actually<br /><em className={s.heroEm}>gets things done</em>
            </h2>
            <p className={`${s.sectionSubtitle} ${s.reveal} ${s.revealDelay2}`}>
              Not another chatbot. A persistent, capable agent that remembers your context, executes tasks, and fits into your existing workflow.
            </p>
          </div>
          <div className={s.featuresGrid}>
            <div className={`${s.featureCard} ${s.reveal}`}>
              <div className={s.featureIcon}>🧠</div>
              <h3>Persistent Memory</h3>
              <p>Your agent remembers everything — your preferences, past conversations, ongoing projects. No more repeating yourself.</p>
            </div>
            <div className={`${s.featureCard} ${s.reveal} ${s.revealDelay1}`}>
              <div className={`${s.featureIcon} ${s.featureIconGold}`}>⚡</div>
              <h3>Task Execution</h3>
              <p>Beyond just answering questions. Your agent researches, writes drafts, manages files, and delivers real outputs.</p>
            </div>
            <div className={`${s.featureCard} ${s.reveal} ${s.revealDelay2}`}>
              <div className={`${s.featureIcon} ${s.featureIconDark}`}>✨</div>
              <h3>Zero Setup</h3>
              <p>No apps to install, no dashboards to learn. Just text your agent on WhatsApp and start getting things done.</p>
            </div>
            <div className={`${s.featureCard} ${s.reveal} ${s.revealDelay3}`}>
              <div className={s.featureIcon}>🎯</div>
              <h3>Creator Workflows</h3>
              <p>Built-in understanding of content creation. From research to repurposing, your agent knows the creator playbook.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className={s.howItWorks} id="how">
        <div className={s.howItWorksBg} />
        <div className={s.container}>
          <div className={s.howHeader}>
            <div className={`${s.sectionLabel} ${s.reveal}`}>How It Works</div>
            <h2 className={`${s.sectionTitle} ${s.reveal} ${s.revealDelay1}`} style={{ color: 'var(--white)' }}>
              Three steps. That&apos;s it.
            </h2>
            <p className={`${s.sectionSubtitle} ${s.howHeaderSubtitle} ${s.reveal} ${s.revealDelay2}`}>
              No onboarding. No tutorial videos. Just text and go.
            </p>
          </div>
          <div className={s.howContent}>
            <div className={s.steps}>
              <div className={`${s.step} ${s.reveal}`}>
                <div className={s.stepNum}>1</div>
                <div className={s.stepText}>
                  <h3>Text your agent</h3>
                  <p>Open WhatsApp and send a message — just like texting a friend. Ask a question, give a task, share an idea.</p>
                </div>
              </div>
              <div className={`${s.step} ${s.reveal} ${s.revealDelay1}`}>
                <div className={s.stepNum}>2</div>
                <div className={s.stepText}>
                  <h3>It gets to work</h3>
                  <p>Your agent researches the web, drafts content, organizes information, and handles the heavy lifting in the background.</p>
                </div>
              </div>
              <div className={`${s.step} ${s.reveal} ${s.revealDelay2}`}>
                <div className={s.stepNum}>3</div>
                <div className={s.stepText}>
                  <h3>Results delivered</h3>
                  <p>Get polished results right in your chat — drafts, summaries, plans, files. Ready to use, no formatting needed.</p>
                </div>
              </div>
            </div>
            <div className={`${s.chatMock} ${s.reveal}`} ref={chatMockRef}>
              <div className={s.chatHeader}>
                <div className={s.chatAvatar}>A</div>
                <div className={s.chatName}>Agentsy <small className={s.chatNameSmall}>online</small></div>
              </div>
              <div className={s.chatBody}>
                <div className={`${s.bubble} ${s.bubbleUser} ${chatInView ? s.bubbleVisible : ''} ${s.bubbleDelay1}`}>
                  Research the top 10 productivity tools for creators in 2026 and summarize the key features
                </div>
                <div className={`${s.typingIndicator} ${chatInView ? s.typingIndicatorVisible : ''}`}>
                  <span className={s.typingDot} />
                  <span className={s.typingDot} />
                  <span className={s.typingDot} />
                </div>
                <div className={`${s.bubble} ${s.bubbleAgent} ${chatInView ? s.bubbleVisible : ''} ${s.bubbleDelay3}`}>
                  On it! I&apos;ll research the latest tools and compile a summary for you. Give me a minute 🔍
                </div>
                <div className={`${s.bubble} ${s.bubbleAgent} ${chatInView ? s.bubbleVisible : ''} ${s.bubbleDelay4}`}>
                  Done! Here&apos;s your summary of the top 10 creator productivity tools for 2026:<br /><br />
                  📝 I&apos;ve included pricing, key features, and which creator type each tool is best for. Want me to turn this into a newsletter draft?
                  <span className={s.bubbleTime}>Just now</span>
                </div>
                <div className={`${s.bubble} ${s.bubbleUser} ${chatInView ? s.bubbleVisible : ''} ${s.bubbleDelay5}`}>
                  Yes, write the newsletter intro too
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CREATORS ==================== */}
      <section className={s.creators} id="creators">
        <div className={s.container}>
          <div className={s.creatorsHeader}>
            <div className={`${s.sectionLabel} ${s.reveal}`}>Built for Creators</div>
            <h2 className={`${s.sectionTitle} ${s.reveal} ${s.revealDelay1}`}>
              Whatever you create,<br /><em className={s.heroEm}>Agentsy handles the rest</em>
            </h2>
            <p className={`${s.sectionSubtitle} ${s.reveal} ${s.revealDelay2}`}>
              Your agent adapts to your creative workflow — no templates, no rigid structures. Just describe what you need.
            </p>
          </div>
          <div className={s.creatorsGrid}>
            <div className={`${s.creatorCard} ${s.reveal}`}>
              <span className={s.creatorEmoji}>🎬</span>
              <h3>YouTubers</h3>
              <p>Research video topics, draft scripts, generate titles and thumbnails ideas, summarize competitor videos, and plan your content calendar.</p>
              <div className={s.creatorTasks}>
                <span className={s.creatorTaskTag}>Script drafts</span>
                <span className={s.creatorTaskTag}>SEO research</span>
                <span className={s.creatorTaskTag}>Title ideas</span>
                <span className={s.creatorTaskTag}>Competitor analysis</span>
              </div>
            </div>
            <div className={`${s.creatorCard} ${s.reveal} ${s.revealDelay1}`}>
              <span className={s.creatorEmoji}>📧</span>
              <h3>Newsletter Writers</h3>
              <p>Curate links, research topics, draft editions, manage your idea backlog, and repurpose content across platforms.</p>
              <div className={s.creatorTasks}>
                <span className={s.creatorTaskTag}>Link curation</span>
                <span className={s.creatorTaskTag}>Draft writing</span>
                <span className={s.creatorTaskTag}>Repurposing</span>
                <span className={s.creatorTaskTag}>Idea management</span>
              </div>
            </div>
            <div className={`${s.creatorCard} ${s.reveal} ${s.revealDelay2}`}>
              <span className={s.creatorEmoji}>🎙️</span>
              <h3>Podcasters</h3>
              <p>Research guests, prep interview questions, generate show notes, create episode summaries, and draft social clips.</p>
              <div className={s.creatorTasks}>
                <span className={s.creatorTaskTag}>Guest research</span>
                <span className={s.creatorTaskTag}>Interview prep</span>
                <span className={s.creatorTaskTag}>Show notes</span>
                <span className={s.creatorTaskTag}>Social clips</span>
              </div>
            </div>
            <div className={`${s.creatorCard} ${s.reveal} ${s.revealDelay3}`}>
              <span className={s.creatorEmoji}>📚</span>
              <h3>Course Creators</h3>
              <p>Outline modules, research topics in depth, draft lesson content, create quizzes, and organize your course materials.</p>
              <div className={s.creatorTasks}>
                <span className={s.creatorTaskTag}>Module outlines</span>
                <span className={s.creatorTaskTag}>Lesson drafts</span>
                <span className={s.creatorTaskTag}>Quiz creation</span>
                <span className={s.creatorTaskTag}>Research</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className={s.faq} id="faq">
        <div className={s.container}>
          <div className={s.faqHeader}>
            <div className={`${s.sectionLabel} ${s.reveal}`}>FAQ</div>
            <h2 className={`${s.sectionTitle} ${s.reveal} ${s.revealDelay1}`}>Questions? Answers.</h2>
          </div>
          <div className={s.faqList}>
            {FAQ_DATA.map((item, idx) => {
              const isOpen = openFaq === idx
              const delayClass = idx === 1 ? s.revealDelay1 : idx === 2 ? s.revealDelay2 : idx === 3 ? s.revealDelay3 : idx === 4 ? s.revealDelay4 : ''
              return (
                <div
                  key={idx}
                  className={`${s.faqItem} ${isOpen ? s.faqItemOpen : ''} ${s.reveal} ${delayClass}`}
                  ref={(el) => { faqRefs.current[idx] = el }}
                >
                  <button className={s.faqQ} onClick={() => toggleFaq(idx)}>
                    <span>{item.q}</span>
                    <span className={`${s.faqIcon} ${isOpen ? s.faqIconOpen : ''}`}><PlusIcon /></span>
                  </button>
                  <div
                    className={s.faqA}
                    style={{ maxHeight: isOpen ? `${faqRefs.current[idx]?.querySelector(`.${s.faqAInner}`)?.scrollHeight ?? 200}px` : '0' }}
                  >
                    <div className={s.faqAInner}>{item.a}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className={s.finalCta} id="cta">
        <div className={s.finalCtaOrb} />
        <div className={`${s.container} ${s.finalCtaContainer}`}>
          <div className={`${s.sectionLabel} ${s.reveal}`} style={{ justifyContent: 'center' }}>Ready?</div>
          <h2 className={`${s.reveal} ${s.revealDelay1}`}>
            Try <em className={s.heroEm}>Agentsy</em><br />right now
          </h2>
          <p className={`${s.sectionSubtitle} ${s.finalCtaSubtitle} ${s.reveal} ${s.revealDelay2}`}>
            No signup. No credit card. Just start talking to your agent.
          </p>
          <div className={`${s.reveal} ${s.revealDelay3}`} style={{ textAlign: 'center' }}>
            <a href="/home" className={s.finalCtaGetStarted}>Get Started →</a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerInner}>
            <div className={s.footerLeft}>
              <strong className={s.footerBrand}>Agentsy</strong><br />
              © 2026 Agentsy. All rights reserved.
            </div>
            <div className={s.footerLinks}>
              <a href="#" className={s.footerLink}>Twitter</a>
              <a href="#" className={s.footerLink}>Instagram</a>
              <a href="#" className={s.footerLink}>Privacy</a>
              <a href="#" className={s.footerLink}>Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Agent Loading Overlay */}
      {agentRunning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#FFFCF7', borderRadius: 20, padding: '36px 32px', maxWidth: 400, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontFamily: 'serif', fontSize: 22, color: '#1A1A1A', marginBottom: 8 }}>Agent is analyzing your business</h2>
            <p style={{ fontSize: 13, color: '#8C8C8C', marginBottom: 24 }}>This takes about 60 seconds. Hang tight.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {AGENT_STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= agentStep ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                    {i < agentStep ? '✅' : i === agentStep ? step.icon : '○'}
                  </span>
                  <span style={{ fontSize: 14, color: i <= agentStep ? '#1A1A1A' : '#BCBCBC', fontWeight: i === agentStep ? 600 : 400, flex: 1 }}>
                    {step.msg}
                  </span>
                  {i === agentStep && (
                    <span style={{ width: 16, height: 16, border: '2px solid #C5A44E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'agentspin 0.8s linear infinite' }} />
                  )}
                </div>
              ))}
            </div>
            <style>{`@keyframes agentspin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
    </div>
  )
}
