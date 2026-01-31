export interface Message {
  role: 'user' | 'agent'
  text: string
  time: string
  attachments?: Attachment[]
  table?: TableData
}

export interface Attachment {
  type: 'pdf' | 'sheet' | 'doc' | 'link'
  icon: string
  name: string
  meta?: string
  preview?: { title: string; content: string }
  linkPreview?: { img: string; domain: string; title: string; desc: string }
}

export interface TableData {
  headers: string[]
  rows: string[][]
}

export interface Thread {
  id: number
  title: string
  avatarColor: string
  avatarLetter: string
  time: string
  unread: boolean
  messages: Message[]
}

export interface Preset {
  icon: string
  title: string
  desc: string
  prompt: string
}

export interface Memory {
  id: number
  topic: 'strategy' | 'research' | 'project' | 'personal'
  topicLabel: string
  title: string
  body: string
  date: string
  source: string
}

export const PRESETS: Preset[] = [
  {
    icon: '👋',
    title: 'Say hello',
    desc: "See what I can do — you might be surprised",
    prompt: 'Hey! What can you actually do? Surprise me with something cool.',
  },
  {
    icon: '🕵️',
    title: 'Stalk my competitors',
    desc: "I'll find stuff they don't want you to see",
    prompt: "Find everything you can about my competitors. Dig deep — pricing, team, tech stack, weaknesses. Here's my space: ",
  },
  {
    icon: '🧠',
    title: 'Roast my idea',
    desc: 'Honest feedback. No sugarcoating.',
    prompt: "Here's my startup idea. Be brutally honest — poke every hole, find every weakness, then tell me how to fix it: ",
  },
  {
    icon: '⚡',
    title: '10x my morning',
    desc: 'Plan today like a maniac',
    prompt: "I have 8 hours today. Here's what I need to get done — make me a ruthlessly prioritized plan that actually works: ",
  },
]

export const THREADS: Thread[] = [
  {
    id: 1,
    title: 'Market Research: SF Event Tech',
    avatarColor: '#C9A96E',
    avatarLetter: 'M',
    time: '2m',
    unread: true,
    messages: [
      { role: 'user', text: 'Research the SF event tech market. Who are the main players and what gaps exist?', time: '11:02 AM' },
      {
        role: 'agent',
        text: "I researched the SF event tech landscape. Here's what I found:\n\nThe market is dominated by enterprise players — **Bizzabo** ($230M raised), **Swapcard**, and **Grip** ($17M) — all serving 1000+ attendee conferences at $10K+/yr.\n\n**The gap:** Nobody owns the **post-event relationship intelligence** layer for small/mid events (50-200 people). Luma handles RSVPs but drops off after the event ends.\n\nThis is a $90M TAM across tech meetups, VC events, and community orgs.",
        time: '11:03 AM',
        attachments: [
          {
            type: 'pdf',
            icon: '📊',
            name: 'SF Event Tech — Competitive Landscape.pdf',
            meta: 'PDF · 12 pages',
            preview: {
              title: 'SF Event Tech — Competitive Landscape',
              content:
                '<div style="line-height:1.8;color:#7A746D"><h3 style="color:#1A1A1A;margin-bottom:12px;font-size:16px;font-family:Instrument Serif,serif">Executive Summary</h3><p>The SF event tech market is dominated by enterprise players serving 1000+ attendee conferences. The 50–200 person event segment is underserved.</p><h3 style="color:#1A1A1A;margin:20px 0 12px;font-size:16px;font-family:Instrument Serif,serif">The Opportunity</h3><p>Nobody owns the <strong style="color:#C9A96E">post-event relationship intelligence</strong> layer for small/mid events. This is a $90M TAM.</p></div>',
            },
          },
        ],
      },
      { role: 'user', text: 'Perfect. Find me 10 SF event organizers on Luma with 100+ attendees', time: '11:05 AM' },
      {
        role: 'agent',
        text: 'Found them. Here are the top organizers with recurring high-attendance events:',
        time: '11:06 AM',
        table: {
          headers: ['Organizer', 'Type', 'Frequency', 'Avg Size'],
          rows: [
            ['Deep Tech Connections', 'Networking', 'Weekly', '80–120'],
            ['SF Hardware Meetup', 'Industry', 'Monthly', '150–200'],
            ['Venn Social Club', 'Social', 'Bi-weekly', '200–400'],
            ['AI Philosophy Nights', 'Discussion', 'Monthly', '100–150'],
            ['Founders Inc.', 'Hackathons', 'Monthly', '300–600'],
            ['Known', 'Social', 'Bi-weekly', '150–300'],
          ],
        },
      },
    ],
  },
  {
    id: 2,
    title: 'Investor Cold Email',
    avatarColor: '#2D2A26',
    avatarLetter: 'I',
    time: '1h',
    unread: false,
    messages: [
      { role: 'user', text: 'Draft a cold email to a VC partner about our product. Keep it short.', time: '10:15 AM' },
      {
        role: 'agent',
        text: "Here's a 4-sentence cold email — VCs skim fast:\n\n**Subject:** Community intelligence for your portfolio's events\n\nHi [Name],\n\nI noticed [Fund] hosts regular founder dinners and LP events. After the event ends, how does your team track which connections were made and who needs follow-up?\n\nWe're building an AI layer that turns event attendee lists into relationship intelligence. Think of it as the back-office tool Luma doesn't have.\n\nWorth a 10-min call? Happy to demo with your actual event data.\n\n— Hakim",
        time: '10:16 AM',
      },
    ],
  },
  {
    id: 3,
    title: 'Landing Page Copy',
    avatarColor: '#A3B18A',
    avatarLetter: 'L',
    time: '3h',
    unread: false,
    messages: [
      { role: 'user', text: 'Write hero copy targeting event organizers', time: '8:30 AM' },
      {
        role: 'agent',
        text: 'Three angles:\n\n**Option A — The Gap**\n> Your event ends. Then what?\n> Turn attendee lists into relationship intelligence.\n\n**Option B — The Pain**\n> You know who RSVPed. But do you know who connected?\n\n**Option C — The Bold**\n> Luma handles the invite. We handle everything after.',
        time: '8:31 AM',
      },
    ],
  },
  {
    id: 4,
    title: 'YC Application Review',
    avatarColor: '#B5AFA8',
    avatarLetter: 'Y',
    time: 'Yesterday',
    unread: false,
    messages: [
      { role: 'user', text: 'Review my YC application. Be brutally honest.', time: 'Yesterday' },
      {
        role: 'agent',
        text: "Three things need work:\n\n**1. Problem statement is generic.** Lead with a specific pain: *\"After hosting 200-person dinners, I had zero idea who actually talked to whom.\"*\n\n**2. Traction is buried.** Move your 47 pilot organizers to the FIRST line.\n\n**3. \"Why now?\" is weak.** Tie it to the post-COVID event boom — in-person events are back at 2x but tooling hasn't caught up.",
        time: 'Yesterday',
      },
    ],
  },
]

export const MEMORIES: Memory[] = [
  {
    id: 1,
    topic: 'strategy',
    topicLabel: 'Strategy',
    title: 'SF event tech market has a $90M gap',
    body: 'Post-event relationship intelligence is <strong>underserved</strong> for small/mid events (50-200 attendees). Luma handles RSVPs but drops off after. Bizzabo and Grip serve enterprise only. Key opportunity: own the post-event layer.',
    date: 'Today',
    source: 'Market Research thread',
  },
  {
    id: 2,
    topic: 'strategy',
    topicLabel: 'Strategy',
    title: 'Best cold email structure for VCs: 4 sentences max',
    body: 'Lead with <strong>their activity</strong> (not your product). Reference specific events they host. One clear ask. Keep under 100 words. Subject line should be about their portfolio, not you.',
    date: 'Today',
    source: 'Investor Outreach thread',
  },
  {
    id: 3,
    topic: 'project',
    topicLabel: 'Product',
    title: 'YC app needs stronger opening — lead with traction',
    body: 'Move pilot numbers (47 organizers, 12K events) to the <strong>first line</strong>. Problem statement needs specificity: personal anecdote > generic pain. "Why now?" = post-COVID event boom at 2x pre-pandemic pace.',
    date: 'Yesterday',
    source: 'YC Application thread',
  },
  {
    id: 4,
    topic: 'research',
    topicLabel: 'Research',
    title: 'Top SF event organizers to target for pilot',
    body: '6 high-value targets identified on Luma: Deep Tech Connections (weekly, 100+), SF Hardware Meetup (monthly, 150+), Venn Social Club (bi-weekly, 200+). <strong>Venn and Known</strong> are highest volume — start there.',
    date: 'Today',
    source: 'Market Research thread',
  },
  {
    id: 5,
    topic: 'personal',
    topicLabel: 'Preference',
    title: 'Hero copy: "The Bold" angle resonates most',
    body: 'Option C won: <strong>"Luma handles the invite. We handle everything after."</strong> It\'s competitive positioning that immediately clarifies the product\'s role. Options A & B were too generic.',
    date: '3h ago',
    source: 'Landing Page thread',
  },
]

export const CHAT_SUGGESTIONS = [
  { icon: '👋', text: 'Just say hi — see what happens' },
  { icon: '🔥', text: 'Give me the most useful thing you can do in 30 seconds' },
  { icon: '🧪', text: "Test your limits — what's the hardest thing you can do?" },
]

export const TOPIC_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'research', label: 'Research' },
  { key: 'project', label: 'Product' },
  { key: 'personal', label: 'Personal' },
] as const
