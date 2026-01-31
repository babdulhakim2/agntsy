'use client'

import s from './landing.module.css'

export default function LandingPage() {
  return (
    <div className={s.app}>
      {/* ─── Top Bar ─── */}
      <div className={s.topbar}>
        <div className={s['topbar-brand']}>
          <div className={s['topbar-logo']}>A</div>
          <span className={s['topbar-name']}>Agentsy</span>
          <span className={s['topbar-tag']}>Self-Improving</span>
        </div>
        <div className={s['topbar-stats']}>
          <div className={s['topbar-stat']}>
            <div className={s['topbar-stat-val']} style={{ color: 'var(--green)' }}>80%</div>
            <div className={s['topbar-stat-label']}>Success Rate</div>
          </div>
          <div className={s['topbar-stat']}>
            <div className={s['topbar-stat-val']} style={{ color: 'var(--accent2)' }}>3</div>
            <div className={s['topbar-stat-label']}>Skills Learned</div>
          </div>
          <div className={s['topbar-stat']}>
            <div className={s['topbar-stat-val']} style={{ color: 'var(--orange)' }}>5</div>
            <div className={s['topbar-stat-label']}>Tasks Run</div>
          </div>
        </div>
      </div>

      {/* ─── Main Area ─── */}
      <div className={s.main}>
        {/* Chat */}
        <div className={s['chat-panel']}>
          <div className={s['chat-header']}>
            <h2>💬 Agent Chat</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 600 }}>● LIVE</span>
            </div>
          </div>
          <div className={s['chat-messages']}>
            {/* Task 1: Web scraping */}
            <div className={`${s.msg} ${s['msg-user']}`}>
              <div className={s['msg-avatar']}>👤</div>
              <div className={s['msg-bubble']}>Find the top 3 stories on Hacker News right now</div>
            </div>
            <div className={`${s.msg} ${s['msg-agent']}`}>
              <div className={s['msg-avatar']}>A</div>
              <div>
                <div className={s['msg-bubble']}>
                  I&apos;ll look that up for you... Hmm, I don&apos;t have a web browsing skill yet. Let me check my failure trace and learn how.
                </div>
                <div className={s['msg-skill']}>
                  <div className={s['msg-skill-header']}>
                    <span className={s['msg-skill-badge']}>🔧 New Skill Created</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>web_scrape via Browserbase</span>
                  </div>
                  <pre>{`// skill: web_scrape
// learned from: Weave trace #47
// stored in: Redis memory

import Stagehand from "@browserbasehq/stagehand"

const browser = new Stagehand()
await browser.init()
await browser.goto(url)
const data = await browser.extract(schema)`}</pre>
                </div>
              </div>
            </div>
            <div className={`${s.msg} ${s['msg-agent']}`}>
              <div className={s['msg-avatar']}>A</div>
              <div className={s['msg-bubble']}>
                Got it! Here are the top stories from Hacker News:
                <br /><br />
                <strong>1.</strong> Show HN: I built a self-improving agent framework<br />
                <strong>2.</strong> Redis just released vector search 2.0<br />
                <strong>3.</strong> Why AI agents need better memory systems
              </div>
            </div>

            {/* Task 2: Voice */}
            <div className={`${s.msg} ${s['msg-user']}`}>
              <div className={s['msg-avatar']}>👤</div>
              <div className={s['msg-bubble']}>Call my teammate and tell them about these stories</div>
            </div>
            <div className={`${s.msg} ${s['msg-agent']}`}>
              <div className={s['msg-avatar']}>A</div>
              <div>
                <div className={s['msg-bubble']}>
                  I don&apos;t have a calling skill yet. Let me learn from the trace...
                </div>
                <div className={s['msg-skill']}>
                  <div className={s['msg-skill-header']}>
                    <span className={s['msg-skill-badge']}>🔧 New Skill Created</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>voice_call via Daily/Pipecat</span>
                  </div>
                  <pre>{`// skill: voice_call
// learned from: Weave trace #48
// stored in: Redis memory

import { DailyClient } from "@daily-co/daily-js"
import { PipecatAgent } from "pipecat-ai"

const agent = new PipecatAgent({ voice: "nova" })
await agent.call(phoneNumber, { script })`}</pre>
                </div>
              </div>
            </div>
            <div className={`${s.msg} ${s['msg-agent']}`}>
              <div className={s['msg-avatar']}>A</div>
              <div className={s['msg-bubble']}>
                📞 Calling your teammate now...
                <div style={{ marginTop: '10px' }}>
                  <div className={s['voice-wave']}>
                    <span /><span /><span /><span /><span /><span />
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center', marginTop: '6px' }}>
                    Connected via Daily · 0:34
                  </p>
                </div>
              </div>
            </div>

            {/* Task 3: Data analysis */}
            <div className={`${s.msg} ${s['msg-user']}`}>
              <div className={s['msg-avatar']}>👤</div>
              <div className={s['msg-bubble']}>Now analyze this CSV of our user signups and find patterns</div>
            </div>
            <div className={`${s.msg} ${s['msg-agent']}`}>
              <div className={s['msg-avatar']}>A</div>
              <div>
                <div className={s['msg-bubble']}>
                  Let me learn data analysis... Found a similar pattern in my memory from the web_scrape skill. Adapting it for data work.
                </div>
                <div className={s['msg-skill']}>
                  <div className={s['msg-skill-header']}>
                    <span className={s['msg-skill-badge']}>🔧 New Skill Created</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>data_analysis via Marimo + Google Cloud</span>
                  </div>
                  <pre>{`// skill: data_analysis
// learned from: Weave trace #49
// similarity: 0.72 to web_scrape (Redis)

import marimo as mo
from google.cloud import aiplatform

notebook = mo.create()
df = notebook.read_csv(file_path)
insights = aiplatform.predict(
  model="gemini-pro", prompt=f"Analyze: {df.describe()}"
)`}</pre>
                </div>
              </div>
            </div>
            <div className={`${s.msg} ${s['msg-agent']}`}>
              <div className={s['msg-avatar']}>A</div>
              <div className={s['msg-bubble']}>
                📊 Analysis complete:
                <br /><br />
                <strong>Key findings:</strong><br />
                • 73% of signups come from Twitter/X referrals<br />
                • Tuesday 2-4pm is the peak signup window<br />
                • Users who complete onboarding in {'<'}5 min have 3x retention
                <br /><br />
                <em style={{ color: 'var(--muted)', fontSize: '11px' }}>Full notebook deployed to Vercel →</em>
              </div>
            </div>
          </div>

          <div className={s['chat-input-wrap']}>
            <div className={s['chat-input']}>
              <input
                type="text"
                placeholder="Give Agentsy a task it's never done before..."
                readOnly
              />
              <button>→</button>
            </div>
          </div>
        </div>

        {/* ─── Right Panels ─── */}
        <div className={s.panels}>
          {/* Weave Trace */}
          <div className={s.panel}>
            <div className={s['panel-header']}>
              <div className={s['panel-title']}>
                <span style={{ color: 'var(--orange)' }}>🔍</span> Weave Trace
                <span className={s['panel-badge']} style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--orange)' }}>LIVE</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Trace #49</span>
            </div>
            <div className={s['trace-steps']}>
              <div className={`${s['trace-step']} ${s['trace-step-ok']}`}>
                <div className={`${s['trace-dot']} ${s['trace-dot-ok']}`} />
                <span className={s['trace-label']} style={{ color: 'var(--green)' }}>PARSE</span>
                <span className={s['trace-text']}>Identified intent: data_analysis</span>
                <span className={s['trace-time']}>12ms</span>
              </div>
              <div className={`${s['trace-step']} ${s['trace-step-fail']}`}>
                <div className={`${s['trace-dot']} ${s['trace-dot-fail']}`} />
                <span className={s['trace-label']} style={{ color: 'var(--red)' }}>EXEC</span>
                <span className={s['trace-text']}>No data_analysis skill found</span>
                <span className={s['trace-time']}>3ms</span>
              </div>
              <div className={`${s['trace-step']} ${s['trace-step-active']}`}>
                <div className={`${s['trace-dot']} ${s['trace-dot-active']}`} />
                <span className={s['trace-label']} style={{ color: 'var(--accent2)' }}>SEARCH</span>
                <span className={s['trace-text']}>Redis → web_scrape (0.72 similarity)</span>
                <span className={s['trace-time']}>8ms</span>
              </div>
              <div className={`${s['trace-step']} ${s['trace-step-learn']}`}>
                <div className={`${s['trace-dot']} ${s['trace-dot-learn']}`} />
                <span className={s['trace-label']} style={{ color: 'var(--orange)' }}>LEARN</span>
                <span className={s['trace-text']}>Reading own trace → writing skill</span>
                <span className={s['trace-time']}>1.2s</span>
              </div>
              <div className={`${s['trace-step']} ${s['trace-step-ok']}`}>
                <div className={`${s['trace-dot']} ${s['trace-dot-ok']}`} />
                <span className={s['trace-label']} style={{ color: 'var(--green)' }}>STORE</span>
                <span className={s['trace-text']}>data_analysis → Redis memory</span>
                <span className={s['trace-time']}>4ms</span>
              </div>
              <div className={`${s['trace-step']} ${s['trace-step-ok']}`}>
                <div className={`${s['trace-dot']} ${s['trace-dot-ok']}`} />
                <span className={s['trace-label']} style={{ color: 'var(--green)' }}>EXEC</span>
                <span className={s['trace-text']}>Skill executed successfully ✓</span>
                <span className={s['trace-time']}>3.4s</span>
              </div>
            </div>
          </div>

          {/* Redis Memory */}
          <div className={s.panel}>
            <div className={s['panel-header']}>
              <div className={s['panel-title']}>
                <span style={{ color: 'var(--red)' }}>🧠</span> Redis Memory
              </div>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>3 skills</span>
            </div>
            <div className={s['skills-list']}>
              <div className={s['skill-item']}>
                <div className={s['skill-icon']} style={{ background: 'rgba(34,211,238,0.1)' }}>🌐</div>
                <div className={s['skill-info']}>
                  <div className={s['skill-name']}>web_scrape</div>
                  <div className={s['skill-meta']}>Browserbase · Learned from trace #47 · Used 3x</div>
                </div>
                <div className={s['skill-score']} style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)' }}>0.95</div>
              </div>
              <div className={s['skill-item']}>
                <div className={s['skill-icon']} style={{ background: 'rgba(124,92,252,0.1)' }}>📞</div>
                <div className={s['skill-info']}>
                  <div className={s['skill-name']}>voice_call</div>
                  <div className={s['skill-meta']}>Daily/Pipecat · Learned from trace #48 · Used 1x</div>
                </div>
                <div className={s['skill-score']} style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--orange)' }}>0.87</div>
              </div>
              <div className={`${s['skill-item']} ${s['skill-item-new']}`}>
                <div className={s['skill-icon']} style={{ background: 'rgba(96,165,250,0.1)' }}>📊</div>
                <div className={s['skill-info']}>
                  <div className={s['skill-name']} style={{ color: 'var(--accent2)' }}>
                    data_analysis <span style={{ fontSize: '9px', color: 'var(--orange)' }}>● NEW</span>
                  </div>
                  <div className={s['skill-meta']}>Marimo + GCP · Learned from trace #49 · Used 1x</div>
                </div>
                <div className={s['skill-score']} style={{ background: 'rgba(124,92,252,0.1)', color: 'var(--accent2)' }}>0.72</div>
              </div>
            </div>
          </div>

          {/* Browserbase Preview */}
          <div className={s.panel}>
            <div className={s['panel-header']}>
              <div className={s['panel-title']}>
                <span>🖥️</span> Browserbase
                <span className={s['panel-badge']} style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--cyan)' }}>STAGEHAND</span>
              </div>
            </div>
            <div className={s['browser-frame']}>
              <div className={s['browser-bar']}>
                <div className={s['browser-dots']}>
                  <span style={{ background: '#FF5F57' }} />
                  <span style={{ background: '#FFBD2E' }} />
                  <span style={{ background: '#28CA41' }} />
                </div>
                <div className={s['browser-url']}>news.ycombinator.com</div>
              </div>
              <div className={s['browser-content']}>
                <div className={s['hn-item']}>
                  <span className={s['hn-rank']}>1.</span>
                  <span className={s['hn-title']}>Show HN: Self-improving agent framework</span>
                </div>
                <div className={s['hn-item']} style={{ paddingLeft: '28px' }}>
                  <span className={s['hn-meta']}>342 points · 127 comments · 3h ago</span>
                </div>
                <div className={s['hn-item']}>
                  <span className={s['hn-rank']}>2.</span>
                  <span className={s['hn-title']}>Redis vector search 2.0 released</span>
                </div>
                <div className={s['hn-item']} style={{ paddingLeft: '28px' }}>
                  <span className={s['hn-meta']}>218 points · 89 comments · 5h ago</span>
                </div>
                <div className={s['hn-item']}>
                  <span className={s['hn-rank']}>3.</span>
                  <span className={s['hn-title']}>Why AI agents need better memory</span>
                </div>
                <div className={s['hn-item']} style={{ paddingLeft: '28px' }}>
                  <span className={s['hn-meta']}>156 points · 64 comments · 6h ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvement Chart */}
          <div className={s.panel}>
            <div className={s['panel-header']}>
              <div className={s['panel-title']}>
                <span>📈</span> Self-Improvement
              </div>
              <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 600 }}>↑ 60% improvement</span>
            </div>
            <div className={s['chart-container']}>
              <div className={s['chart-bar-wrap']}>
                <div className={s['chart-bar']} style={{ height: '20%', background: 'var(--red)' }} />
                <div className={s['chart-bar']} style={{ height: '20%', background: 'var(--red)' }} />
                <div className={s['chart-bar']} style={{ height: '45%', background: 'var(--orange)' }} />
                <div className={s['chart-bar']} style={{ height: '60%', background: 'var(--orange)' }} />
                <div className={s['chart-bar']} style={{ height: '75%', background: 'var(--green)' }} />
                <div className={s['chart-bar']} style={{ height: '80%', background: 'var(--green)' }} />
                <div className={s['chart-bar']} style={{ height: '80%', background: 'var(--green)' }} />
                <div className={s['chart-bar']} style={{ height: '90%', background: 'var(--green)' }} />
                <div className={s['chart-bar']} style={{ height: '100%', background: 'var(--accent)', animation: 'glow 2s infinite' }} />
              </div>
              <div className={s['chart-labels']}>
                <span>Task 1</span>
                <span>Task 5</span>
                <span>Task 9</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sponsor Bar ─── */}
      <div className={s['sponsor-bar']}>
        <div className={s['sponsor-item']} title="Weave by W&B — Traces & Observability">
          <span className={s['sponsor-dot']} style={{ background: 'var(--orange)' }} /> Weave
        </div>
        <div className={s['sponsor-item']} title="Redis — Memory & Vector Search">
          <span className={s['sponsor-dot']} style={{ background: 'var(--red)' }} /> Redis
        </div>
        <div className={s['sponsor-item']} title="Browserbase — Web Automation">
          <span className={s['sponsor-dot']} style={{ background: 'var(--cyan)' }} /> Browserbase
        </div>
        <div className={s['sponsor-item']} title="Daily — Voice AI">
          <span className={s['sponsor-dot']} style={{ background: 'var(--blue)' }} /> Daily
        </div>
        <div className={s['sponsor-item']} title="Vercel — Deployment">
          <span className={s['sponsor-dot']} style={{ background: '#fff' }} /> Vercel
        </div>
        <div className={s['sponsor-item']} title="Marimo — Notebooks">
          <span className={s['sponsor-dot']} style={{ background: 'var(--green)' }} /> Marimo
        </div>
        <div className={s['sponsor-item']} title="Google Cloud — Inference">
          <span className={s['sponsor-dot']} style={{ background: 'var(--blue)' }} /> Google Cloud
        </div>
      </div>
    </div>
  )
}
