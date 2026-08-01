import { useEffect, useState } from 'react'
import './index.css'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000'
const API_URL   = import.meta.env.VITE_API_URL   || 'http://localhost:8000'
const LOGIN_URL = `${ADMIN_URL}/login`
const REGISTER_URL = `${ADMIN_URL}/register`
const COMPANY = 'Douglas Githui Tech Creatives'
const PRODUCT = 'DG ChatBot'

const EMBED_SNIPPET = `<script
  src="https://yourdomain.com/widget.js"
  data-bot="YOUR_BOT_KEY">
</script>`

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close mobile menu on link click
  const close = () => setMenuOpen(false)

  return (
    <>
      <nav className={`ds-nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="ds-nav-logo" onClick={close}>
          <img src="/logo.jpeg" alt={COMPANY} />
        </a>
        <div className="ds-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="ds-nav-cta">
          <a href={LOGIN_URL} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }}>
            Sign in
          </a>
          <a href={REGISTER_URL} className="btn-brand" style={{ padding: '8px 18px', fontSize: 14 }}>
            Get started free
          </a>
        </div>
        {/* Hamburger — shown on tablet/mobile */}
        <button
          className="ds-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <div className={`ds-mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#features" onClick={close}>Features</a>
        <a href="#how-it-works" onClick={close}>How it works</a>
        <a href="#services" onClick={close}>Services</a>
        <a href="#pricing" onClick={close}>Pricing</a>
        <a href="#faq" onClick={close}>FAQ</a>
        <div className="ds-mobile-menu-divider" />
        <a href={LOGIN_URL} className="btn-ghost" style={{ fontSize: 14 }} onClick={close}>Sign in</a>
        <a href={REGISTER_URL} className="btn-brand" style={{ fontSize: 14 }} onClick={close}>Get started free</a>
      </div>
    </>
  )
}

// ─── Widget mockup ────────────────────────────────────────────────────────────
function WidgetMockup() {
  return (
    <div className="ds-widget-mockup mx-auto">
      <div className="ds-mockup-browser">
        <div className="ds-mockup-bar">
          <div className="ds-mockup-dot" style={{ background: '#ff5f57' }} />
          <div className="ds-mockup-dot" style={{ background: '#febc2e' }} />
          <div className="ds-mockup-dot" style={{ background: '#28c840' }} />
          <div className="ds-mockup-url">yourwebsite.co.ke</div>
        </div>
        <div className="ds-mockup-body">
          <div className="ds-mockup-page-title">Welcome to our store</div>
          <div className="ds-mockup-page-text">
            <div style={{ width: '100%' }} />
            <div style={{ width: '85%' }} />
            <div style={{ width: '92%' }} />
            <div />
          </div>

          {/* Mini chat panel */}
          <div className="ds-chat-panel">
            <div className="ds-chat-header">
              <div className="ds-chat-avatar">🤖</div>
              <div>
                <div className="ds-chat-header-text">Support Bot</div>
                <div className="ds-chat-header-sub">● Online</div>
              </div>
            </div>
            <div className="ds-chat-messages">
              <div className="ds-chat-msg bot">Hi! How can I help you today? 👋</div>
              <div className="ds-chat-msg user">What's your return policy?</div>
              <div className="ds-chat-msg bot">You can return any item within 30 days of purchase for a full refund.</div>
            </div>
            <div className="ds-chat-input-row">
              <div className="ds-chat-input-fake">Ask anything…</div>
              <div className="ds-chat-send">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>

          {/* Launcher */}
          <div className="ds-chat-bubble">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="ds-hero" id="home">
      <div className="ds-hero-badge">
        <span className="ds-hero-badge-dot" />
        By {COMPANY}
      </div>
      <h1>
        Add AI chat to{' '}
        <span className="gradient-text">any website</span>
        <br />in minutes
      </h1>
      <p>
        One script tag. Answers grounded in your content. No hallucinations.
        Capture leads. Understand your customers.
      </p>
      <div className="ds-hero-actions">
        <a href={REGISTER_URL} className="btn-brand btn-brand-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Start for free
        </a>
        <a href="#how-it-works" className="btn-ghost btn-brand-lg">
          See how it works →
        </a>
      </div>
      <p className="ds-hero-sub">
        Free plan available · <span>No credit card required</span> · Setup in 5 minutes
      </p>
      <WidgetMockup />
    </section>
  )
}

// ─── Logo strip ───────────────────────────────────────────────────────────────
function LogoStrip() {
  const logos = ['WordPress', 'Shopify', 'Webflow', 'Laravel', 'Next.js', 'React', 'Plain HTML']
  return (
    <div className="ds-logos">
      <p>Works with any website or framework</p>
      <div className="ds-logos-row">
        {logos.map((l) => (
          <span key={l} className="ds-logo-item">{l}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '1,200+', label: 'Conversations handled', icon: '💬' },
    { value: '< 5 min', label: 'Average setup time',   icon: '⚡' },
    { value: '24 / 7',  label: 'Always online',        icon: '🟢' },
    { value: '5+',      label: 'Platforms supported',  icon: '🌐' },
    { value: '100%',    label: 'Grounded answers',     icon: '📄' },
  ]

  return (
    <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              flex: '1 1 160px',
              padding: '1.75rem 1.25rem',
              textAlign: 'center',
              borderRight: i < stats.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Create your bot',
      desc: 'Sign up, create a workspace, and configure your bot — name, colors, welcome message — in the admin dashboard.',
    },
    {
      n: '2',
      title: 'Add your knowledge',
      desc: 'Upload PDFs, paste text, add FAQs, or connect your website. The bot will only answer from this approved content.',
    },
    {
      n: '3',
      title: 'Paste one line of code',
      desc: "Copy your embed snippet into your website's HTML. The widget appears instantly — no extra dependencies.",
    },
  ]
  return (
    <section className="ds-steps" id="how-it-works">
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label">How it works</div>
          <h2 className="ds-section-title">Live in three steps</h2>
          <p className="ds-section-sub mx-auto">
            From signup to a live AI chatbot on your website — the whole process takes under 10 minutes.
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          {steps.map((s) => (
            <div key={s.n} className="col-md-4">
              <div className="ds-step">
                <div className="ds-step-num">{s.n}</div>
                <div>
                  <div className="ds-step-title">{s.title}</div>
                  <p className="ds-step-desc">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: '🎯', bg: '#f0fdf4', title: 'Grounded answers only',   desc: 'The bot strictly answers from the content you provide. It will never hallucinate or invent information not in your knowledge base.' },
    { icon: '⚡', bg: '#fffbeb', title: 'Streaming responses',     desc: 'Answers stream token-by-token like ChatGPT, giving visitors immediate feedback and a fast perceived experience.' },
    { icon: '📁', bg: '#ecfeff', title: 'Multiple content types',  desc: 'Ingest PDFs, plain text, FAQ pairs, and manually written content. Your knowledge base stays up to date as you upload more.' },
    { icon: '🔒', bg: '#f0fdf4', title: 'Tenant isolation',        desc: "Each workspace has a completely isolated knowledge base. No content from one bot can ever appear in another's answers." },
    { icon: '📊', bg: '#fdf4ff', title: 'Analytics & gaps',        desc: 'See exactly what visitors ask, which questions go unanswered, and where your knowledge base has gaps — so you can improve it.' },
    { icon: '🙋', bg: '#fff7ed', title: 'Lead capture',            desc: "When a visitor's question can't be answered, the bot offers to take their contact details so your team can follow up." },
    { icon: '🌗', bg: '#f8fafc', title: 'Dark & light themes',     desc: 'The widget adapts to your brand. Choose your color, position, and light or dark theme — no code changes needed.' },
    { icon: '🌐', bg: '#f0fdf4', title: 'Domain allowlist',        desc: 'Your bot only works on domains you explicitly authorize. No one can embed your bot on an unauthorized site.' },
  ]
  return (
    <section id="features" style={{ background: '#fff' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label">Features</div>
          <h2 className="ds-section-title">Everything you need</h2>
          <p className="ds-section-sub mx-auto">
            A complete platform — not just a chat widget. Built for real production deployments.
          </p>
        </div>
        <div className="row g-4">
          {features.map((f) => (
            <div key={f.title} className="col-sm-6 col-lg-3">
              <div className="ds-feature-card">
                <div className="ds-feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="ds-feature-title">{f.title}</div>
                <p className="ds-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Use Cases ───────────────────────────────────────────────────────────────
function UseCases() {
  const WA = '254707264913'
  const cases = [
    {
      emoji: '☀️',
      industry: 'Solar & Energy',
      color: '#d97706',
      bg: '#fffbeb',
      questions: [
        'What size solar system for a 4-bedroom house?',
        'Do you offer installation in Mombasa?',
        'Can I get a PDF quotation today?',
      ],
    },
    {
      emoji: '🛒',
      industry: 'E-commerce & Retail',
      color: '#4f46e5',
      bg: '#eef2ff',
      questions: [
        'What is your return policy?',
        'How long does delivery take to Kisumu?',
        'Do you accept M-Pesa?',
      ],
    },
    {
      emoji: '⚖️',
      industry: 'Law & Professional Services',
      color: '#0f172a',
      bg: '#f8fafc',
      questions: [
        'What areas of law do you specialize in?',
        'How do I book a consultation?',
        'What documents do I need for a land transfer?',
      ],
    },
    {
      emoji: '🏠',
      industry: 'Real Estate',
      color: '#16a34a',
      bg: '#f0fdf4',
      questions: [
        'What 2-bedroom apartments are in Westlands?',
        'How does the buying process work in Kenya?',
        'How long does conveyancing take?',
      ],
    },
    {
      emoji: '🏥',
      industry: 'Healthcare & Clinics',
      color: '#0891b2',
      bg: '#ecfeff',
      questions: [
        'What are your opening hours?',
        'Do you accept NHIF?',
        'How do I book an appointment?',
      ],
    },
    {
      emoji: '🍽️',
      industry: 'Restaurants & Hospitality',
      color: '#dc2626',
      bg: '#fef2f2',
      questions: [
        "What's today's special?",
        'Do you take table reservations?',
        'Do you have vegetarian options?',
      ],
    },
  ]

  return (
    <section id="use-cases" style={{ background: '#fff', padding: '80px 0' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label">Use Cases</div>
          <h2 className="ds-section-title">Works for any business</h2>
          <p className="ds-section-sub mx-auto">
            Whether you sell solar panels or legal services, DG ChatBot handles your customers' real questions — 24/7, from your approved content.
          </p>
        </div>
        <div className="row g-4">
          {cases.map(c => (
            <div key={c.industry} className="col-sm-6 col-lg-4">
              <div style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
                padding: '24px 22px', height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.04)' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 14,
                }}>{c.emoji}</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 14 }}>{c.industry}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Example questions handled</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {c.questions.map(q => (
                    <li key={q} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                      <span style={{ color: c.color, fontSize: 16, lineHeight: 1.25, flexShrink: 0 }}>›</span>
                      <span style={{ lineHeight: 1.5 }}>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center mt-5" style={{ fontSize: 13.5, color: '#94a3b8' }}>
          Don't see your industry?{' '}
          <a
            href={`https://wa.me/${WA}?text=${encodeURIComponent('Hi! I would like to discuss using DG ChatBot for my business.')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
          >
            Let's talk →
          </a>
        </p>
      </div>
    </section>
  )
}

// ─── Install code block ───────────────────────────────────────────────────────
function InstallSection() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(EMBED_SNIPPET)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <section className="ds-code-section">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-5">
            <div className="ds-section-label">One-line install</div>
            <h2 className="ds-section-title">Paste. Done.</h2>
            <p className="ds-section-sub" style={{ color: '#94a3b8' }}>
              Drop one script tag into your HTML — before the closing{' '}
              <code style={{ color: '#f472b6', background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>&lt;/body&gt;</code>
              {' '}tag. No build step, no npm package, no configuration files.
            </p>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: '.75rem', lineHeight: 1.65 }}>
              Works on WordPress, Shopify, plain HTML, Laravel, Webflow, and any React or Next.js site.
            </p>
          </div>
          <div className="col-lg-7">
            <div className="ds-code-block">
              <div className="ds-code-bar">
                <div className="ds-code-bar-dot" style={{ background: '#ff5f57' }} />
                <div className="ds-code-bar-dot" style={{ background: '#febc2e' }} />
                <div className="ds-code-bar-dot" style={{ background: '#28c840' }} />
                <div className="ds-code-bar-label">index.html</div>
              </div>
              <pre className="ds-code-pre" style={{ color: '#e2e8f0' }}>
                <span style={{ color: '#475569' }}>{'<!-- Paste before </body> -->'}{'\n'}</span>
                <span className="tok-tag">{'<script'}</span>{'\n'}
                {'  '}<span className="tok-attr">src</span><span style={{ color: '#e2e8f0' }}>{'='}</span><span className="tok-val">"https://yourdomain.com/widget.js"</span>{'\n'}
                {'  '}<span className="tok-attr">data-bot</span><span style={{ color: '#e2e8f0' }}>{'='}</span><span className="tok-val">"YOUR_BOT_KEY"</span>
                <span className="tok-tag">{'>'}</span><span className="tok-tag">{'</script>'}</span>
              </pre>
            </div>
            <div className="mt-3 d-flex gap-3 align-items-center">
              <button className="btn-ghost" onClick={copy} style={{ fontSize: 13, padding: '8px 16px', color: '#94a3b8', borderColor: '#334155', background: 'transparent' }}>
                {copied ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6 }}><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy code</>
                )}
              </button>
              <span style={{ fontSize: 13, color: '#475569' }}>Your bot key is in the admin Install tab</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing (KES + USD toggle) ───────────────────────────────────────────────
type Currency = 'KES' | 'USD'

interface ApiPlan {
  id: string
  name: string
  slug: string
  price_kes: number
  price_usd: number
  max_bots: number
  max_sources: number
  max_conversations_per_month: number
  features: string[] | null
}

// CTA + accent config per plan slug — display concern only
const PLAN_CTA: Record<string, { cta: string; ctaHref: string; ctaClass: string; popular: boolean; badge: string | null; icon: string; accent: string }> = {
  free:       { cta: 'Get started free',     ctaHref: REGISTER_URL,                 ctaClass: 'btn-ghost', popular: false, badge: null,            icon: '🌱', accent: '#64748b' },
  starter:    { cta: 'Start with Starter',   ctaHref: REGISTER_URL,                 ctaClass: 'btn-ghost', popular: false, badge: null,            icon: '🚀', accent: '#1d4ed8' },
  pro:        { cta: 'Start with Pro',       ctaHref: REGISTER_URL,                 ctaClass: 'btn-ghost', popular: false, badge: null,            icon: '⚙️', accent: '#0891b2' },
  growth:     { cta: 'Start Growth trial',   ctaHref: REGISTER_URL,                 ctaClass: 'btn-brand', popular: true,  badge: 'Most popular', icon: '📈', accent: '#16a34a' },
  business:   { cta: 'Start Business trial', ctaHref: REGISTER_URL,                 ctaClass: 'btn-ghost', popular: false, badge: null,            icon: '🏢', accent: '#7c3aed' },
  enterprise: { cta: 'Contact sales',        ctaHref: 'mailto:info@doughlas.africa', ctaClass: 'btn-ghost', popular: false, badge: null,            icon: '🛡️', accent: '#0f172a' },
}
const DEFAULT_CTA = { cta: 'Get started', ctaHref: REGISTER_URL, ctaClass: 'btn-ghost', popular: false, badge: null, icon: '✨', accent: '#64748b' }

function limitLabel(v: number) {
  return v === -1 ? 'Unlimited' : v.toLocaleString()
}

// ─── Live Demo ───────────────────────────────────────────────────────────────
const DEMO_PAIRS = [
  {
    q: 'What are your business hours?',
    a: "We're open Monday to Friday, 9am–6pm. Outside those hours I can still answer most questions, or leave a message and the team will follow up!",
    src: 'FAQ · Business Hours',
  },
  {
    q: 'Do you offer free installation?',
    a: 'Yes! Professional installation is included with our Standard and Premium packages. We cover Nairobi and surrounding counties — just book a free site assessment.',
    src: 'Services · Installation Policy',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery is 2–4 business days across Kenya. Same-day delivery is available in Nairobi CBD for orders placed before noon.',
    src: 'Shipping · Delivery Times',
  },
  {
    q: 'Can I pay with M-Pesa?',
    a: "Absolutely! We accept M-Pesa, Visa/Mastercard, bank transfer, and cash on delivery. Flexible payment plans are available for larger orders.",
    src: 'Payment · Accepted Methods',
  },
]

function LiveDemoSection() {
  type Pair = typeof DEMO_PAIRS[number]

  const [idx, setIdx] = useState(0)
  const [prev, setPrev] = useState<Pair | null>(null)
  const [showQ, setShowQ] = useState(false)
  const [botTyping, setBotTyping] = useState(false)
  const [showA, setShowA] = useState(false)
  const [displayQ, setDisplayQ] = useState('')
  const [displayA, setDisplayA] = useState('')
  const [displaySrc, setDisplaySrc] = useState('')

  useEffect(() => {
    const pair = DEMO_PAIRS[idx]
    setShowQ(false); setBotTyping(false); setShowA(false)
    setDisplayQ(''); setDisplayA(''); setDisplaySrc('')

    const t1 = setTimeout(() => { setDisplayQ(pair.q); setShowQ(true) }, 700)
    const t2 = setTimeout(() => setBotTyping(true), 1700)
    const t3 = setTimeout(() => {
      setBotTyping(false)
      setDisplayA(pair.a); setDisplaySrc(pair.src); setShowA(true)
    }, 4000)
    const t4 = setTimeout(() => {
      setPrev(pair)
      setIdx(i => (i + 1) % DEMO_PAIRS.length)
    }, 8000)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [idx])

  const BOT_AVATAR = (op = 1) => (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#16a34a,#15803d)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, opacity: op,
    }}>🤖</div>
  )

  const SRC_CHIP = (src: string) => (
    <div style={{ marginTop: 7, paddingTop: 6, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#94a3b8' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      {src}
    </div>
  )

  return (
    <section id="live-demo" style={{ background: '#0f172a', padding: '80px 0', overflow: 'hidden' }}>
      <div className="container">
        <div className="row align-items-center g-5">

          {/* Left — copy */}
          <div className="col-lg-5">
            <div className="ds-section-label" style={{ color: '#4ade80' }}>Live preview</div>
            <h2 className="ds-section-title" style={{ color: '#f8fafc', marginBottom: '1rem' }}>
              Watch your bot handle real questions
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              Your bot answers instantly from your own content — grounded, honest, and always on-brand. When the answer isn't there, it says so and captures the lead.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '⚡', text: 'Streams token-by-token for fast perceived responses' },
                { icon: '📄', text: 'Every answer grounded in your approved content' },
                { icon: '🔗', text: 'Source document cited on every bot reply' },
                { icon: '🤝', text: 'Captures leads when the question is unanswerable' },
              ].map(item => (
                <li key={item.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.65 }}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — animated chat window */}
          <div className="col-lg-7 d-flex justify-content-center">
            <div style={{
              width: '100%', maxWidth: 420,
              background: '#fff', borderRadius: 22, overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,.55), 0 4px 20px rgba(0,0,0,.3)',
              border: '1px solid #1e293b',
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg,#15803d,#16a34a)',
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Support Bot</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'blink 2s infinite' }} />
                    <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>Online · answers from your knowledge base</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 7, padding: '3px 9px', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.06em' }}>LIVE</div>
              </div>

              {/* Messages */}
              <div style={{ padding: '16px 14px', minHeight: 310, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10, background: '#f8fafc' }}>
                {/* Welcome */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {BOT_AVATAR()}
                  <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', padding: '9px 13px', fontSize: 13, color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,.07)', maxWidth: '85%' }}>
                    Hi! I'm here to help. Ask me anything about our products or services 👋
                  </div>
                </div>

                {/* Previous exchange — dimmed */}
                {prev && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#16a34a', color: '#fff', borderRadius: '14px 4px 14px 14px', padding: '9px 13px', fontSize: 13, maxWidth: '85%', opacity: 0.4 }}>
                        {prev.q}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {BOT_AVATAR(0.4)}
                      <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', padding: '9px 13px', fontSize: 13, color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,.07)', maxWidth: '85%', opacity: 0.4 }}>
                        <div>{prev.a}</div>
                        {SRC_CHIP(prev.src)}
                      </div>
                    </div>
                  </>
                )}

                {/* Current user message */}
                {showQ && (
                  <div className="demo-msg-in" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: '#16a34a', color: '#fff', borderRadius: '14px 4px 14px 14px', padding: '9px 13px', fontSize: 13, maxWidth: '85%' }}>
                      {displayQ}
                    </div>
                  </div>
                )}

                {/* Bot typing dots */}
                {botTyping && (
                  <div className="demo-msg-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {BOT_AVATAR()}
                    <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', padding: '11px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
                      <div className="demo-dot" style={{ animationDelay: '0ms' }} />
                      <div className="demo-dot" style={{ animationDelay: '160ms' }} />
                      <div className="demo-dot" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                )}

                {/* Bot answer */}
                {showA && (
                  <div className="demo-msg-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {BOT_AVATAR()}
                    <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', padding: '9px 13px', fontSize: 13, color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,.07)', maxWidth: '85%' }}>
                      <div>{displayA}</div>
                      {SRC_CHIP(displaySrc)}
                    </div>
                  </div>
                )}
              </div>

              {/* Input row */}
              <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', background: '#fff' }}>
                <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#94a3b8' }}>
                  Type a message…
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function PricingCardSkeleton() {
  return (
    <div className="col">
      <div className="ds-pricing-card" style={{ minHeight: 360 }}>
        <div style={{ background: '#e2e8f0', borderRadius: 8, height: 20, width: '40%', marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ background: '#e2e8f0', borderRadius: 8, height: 44, width: '60%', marginBottom: 8 }} />
        <div style={{ background: '#e2e8f0', borderRadius: 8, height: 14, width: '30%', marginBottom: 24 }} />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 6, height: 13, width: `${55 + i * 8}%`, marginBottom: 10 }} />
        ))}
      </div>
    </div>
  )
}

function Pricing() {
  const [currency, setCurrency] = useState<Currency>('KES')
  const [plans, setPlans] = useState<ApiPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/public/plans')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: ApiPlan[]) => { setPlans(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section id="pricing">
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label">Pricing</div>
          <h2 className="ds-section-title">Simple, honest pricing</h2>
          <p className="ds-section-sub mx-auto">
            Start free. Upgrade when you grow. No surprise charges.
          </p>
          <div className="mt-4 d-flex justify-content-center">
            <div className="ds-currency-toggle">
              <button className={currency === 'KES' ? 'active' : ''} onClick={() => setCurrency('KES')}>KES</button>
              <button className={currency === 'USD' ? 'active' : ''} onClick={() => setCurrency('USD')}>USD</button>
            </div>
          </div>
        </div>
        <div className="row g-4 align-items-stretch justify-content-center row-cols-1 row-cols-sm-2 row-cols-lg-3">
          {loading
            ? [1, 2, 3, 4, 5, 6].map(i => <PricingCardSkeleton key={i} />)
            : plans.map((p) => {
                const rawPrice = currency === 'KES' ? p.price_kes : p.price_usd
                const isCustom = rawPrice === 0 && p.slug === 'enterprise'
                const isFreePlan = rawPrice === 0 && p.slug !== 'enterprise'
                const priceDisplay = isCustom ? 'Custom' : isFreePlan ? '0' : rawPrice.toLocaleString()
                const symbol = currency === 'KES' ? 'KES' : '$'
                const period = (isCustom || isFreePlan) ? (isCustom ? 'contact us' : 'forever') : 'per month'
                const ui = PLAN_CTA[p.slug] ?? DEFAULT_CTA

                // Build feature list: limits first, then extra features from DB
                // Features starting with '-' are excluded (shown with ❌), others included (✅)
                const featureList: { ok: boolean; text: string }[] = [
                  { ok: true, text: p.max_bots === -1 ? 'Unlimited chatbots' : `${p.max_bots} chatbot${p.max_bots !== 1 ? 's' : ''}` },
                  { ok: true, text: p.max_sources === -1 ? 'Unlimited sources' : `${p.max_sources} knowledge sources` },
                  { ok: true, text: p.max_conversations_per_month === -1 ? 'Unlimited conversations' : `${limitLabel(p.max_conversations_per_month)} conversations / month` },
                  ...(p.features ?? []).map(f => f.startsWith('-')
                    ? { ok: false, text: f.slice(1).trim() }
                    : { ok: true, text: f }
                  ),
                ]

                return (
                  <div key={p.id} className="col">
                    <div
                      className={`ds-pricing-card${ui.popular ? ' popular' : ''}`}
                      style={{ ['--plan-accent' as any]: ui.accent }}
                    >
                      {ui.badge && <div className="ds-plan-badge">{ui.badge}</div>}
                      <div className="ds-plan-icon" aria-hidden="true">{ui.icon}</div>
                      <div className="ds-plan-name">{p.name}</div>

                      {isCustom ? (
                        <div className="ds-plan-price" style={{ fontSize: '1.8rem' }}>Custom</div>
                      ) : (
                        <div className="ds-plan-price">
                          <span style={{ fontSize: '1rem', fontWeight: 700, verticalAlign: 'top', marginTop: 10, display: 'inline-block', color: '#64748b' }}>
                            {symbol}&nbsp;
                          </span>
                          {priceDisplay}
                        </div>
                      )}

                      <div className="ds-plan-period">{period}</div>
                      <hr className="ds-plan-divider" />
                      <ul className="ds-plan-features">
                        {featureList.map((f, i) => (
                          <li key={i} style={{ opacity: f.ok ? 1 : 0.5 }}>
                            {f.ok ? (
                              <svg className="check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            )}
                            <span style={{ color: f.ok ? 'var(--muted)' : '#9ca3af', textDecoration: f.ok ? 'none' : 'none' }}>{f.text}</span>
                          </li>
                        ))}
                      </ul>
                      <a href={ui.ctaHref} className={ui.ctaClass} style={{ textAlign: 'center', justifyContent: 'center' }}>
                        {ui.cta}
                      </a>
                    </div>
                  </div>
                )
              })
          }
        </div>
        <p className="text-center mt-4" style={{ fontSize: 13, color: '#94a3b8' }}>
          {currency === 'KES'
            ? 'Prices in Kenyan Shillings (KES) · M-Pesa & card accepted · Exclude VAT'
            : 'Prices in US Dollars (USD) · Card payments accepted · Exclude tax'}
        </p>
      </div>
    </section>
  )
}

// ─── Comparison Table ────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows = [
    { feature: 'Answers only from your content',     dg: 'yes',      generic: 'no',       none: 'no' },
    { feature: 'Zero hallucinations / made-up facts', dg: 'yes',      generic: 'partial',  none: 'no' },
    { feature: 'Source citation on every answer',     dg: 'yes',      generic: 'no',       none: 'no' },
    { feature: 'Lead capture when unanswerable',      dg: 'yes',      generic: 'no',       none: 'no' },
    { feature: 'Embeds on any website',               dg: 'yes',      generic: 'partial',  none: 'no' },
    { feature: 'Admin analytics dashboard',           dg: 'yes',      generic: 'partial',  none: 'no' },
    { feature: 'Multi-bot / multi-tenant',            dg: 'yes',      generic: 'no',       none: 'no' },
    { feature: 'Domain access control',               dg: 'yes',      generic: 'no',       none: 'no' },
    { feature: 'Available 24 / 7',                   dg: 'yes',      generic: 'yes',      none: 'no' },
    { feature: 'Average setup time',                  dg: '< 5 min',  generic: 'Hours',    none: 'N/A' },
  ]

  type CellValue = 'yes' | 'no' | 'partial' | string

  function Cell({ value }: { value: CellValue }) {
    if (value === 'yes')     return <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 18 }}>✓</span>
    if (value === 'no')      return <span style={{ color: '#64748b', fontWeight: 700, fontSize: 16 }}>✕</span>
    if (value === 'partial') return <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 12 }}>◐ Partial</span>
    return <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4ade80' }}>{value}</span>
  }

  return (
    <section style={{ background: '#0f172a', padding: '80px 0' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label" style={{ color: '#4ade80' }}>Why DG ChatBot</div>
          <h2 className="ds-section-title" style={{ color: '#f8fafc' }}>See how we compare</h2>
          <p className="ds-section-sub mx-auto" style={{ color: '#94a3b8' }}>
            Most AI chatbots answer from general knowledge — and make things up. DG ChatBot only answers from the content you approve. No surprises.
          </p>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #1e293b' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <th style={{
                  textAlign: 'left', padding: '16px 20px',
                  color: '#475569', fontSize: 11.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.07em', width: '40%',
                }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '16px 20px', background: 'rgba(22,163,74,.1)' }}>
                  <div style={{ color: '#4ade80', fontWeight: 900, fontSize: 14 }}>DG ChatBot</div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 3, fontWeight: 500 }}>Grounded AI</div>
                </th>
                <th style={{ textAlign: 'center', padding: '16px 20px' }}>
                  <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>Generic AI</div>
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 3 }}>chatbot</div>
                </th>
                <th style={{ textAlign: 'center', padding: '16px 20px' }}>
                  <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>No Chatbot</div>
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 3 }}>manual only</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} style={{ borderBottom: i < rows.length - 1 ? '1px solid #1e293b' : 'none' }}>
                  <td style={{ padding: '13px 20px', fontSize: 13.5, color: '#cbd5e1', fontWeight: 500 }}>{row.feature}</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', background: 'rgba(22,163,74,.06)' }}>
                    <Cell value={row.dg} />
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                    <Cell value={row.generic} />
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                    <Cell value={row.none} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-5">
          <a href={REGISTER_URL} className="btn-brand btn-brand-lg">
            Start free — no credit card required →
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Other Services ──────────────────────────────────────────────────────────
function OtherServices() {
  const WA = '254707264913'
  const CONTACT_WA = `https://wa.me/${WA}`
  const services = [
    {
      id: 'whatsapp-agent',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      iconBg: 'linear-gradient(135deg,#25d366,#128c7e)',
      label: 'AI',
      labelColor: '#25d366',
      labelBg: '#f0fdf4',
      title: 'AI WhatsApp Sales Agent',
      desc: 'A fully custom WhatsApp sales agent built around your business — your brand, your products, your voice. Handles leads 24/7 and hands off to your team only when it counts.',
      points: [
        'Built specifically for your niche and product catalog',
        'Answers customer questions in your brand\'s tone and style',
        'Qualifies leads and captures name, location & budget',
        'Generates branded PDF quotations tailored to your offerings',
        'Books site visits and callbacks automatically',
        'Admin dashboard — pause the agent and reply manually anytime',
        'Photo understanding for product or site-related queries',
        'Push notifications + installable PWA for your team',
        'Analytics: conversion rate, escalations, domain breakdown',
        'Fully white-label — your customers will never know what powers it',
      ],
      cta: 'Request a demo',
      ctaHref: `${CONTACT_WA}?text=${encodeURIComponent('Hi! I would like to learn more about the AI WhatsApp Sales Agent.')}`,
      ctaColor: '#25d366',
      ctaBg: '#f0fdf4',
      ctaBorder: '#86efac',
      popular: true,
      badge: 'Live in production',
    },
    {
      id: 'web-dev',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      ),
      iconBg: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
      label: 'Development',
      labelColor: '#4f46e5',
      labelBg: '#eef2ff',
      title: 'Web Development',
      desc: 'Modern, fast, and mobile-first websites and web applications — from landing pages to full business platforms — built to convert visitors into customers.',
      points: [
        'Business websites and landing pages',
        'E-commerce and online stores',
        'Custom web applications (React, Next.js, Laravel)',
        'WordPress, Webflow and CMS-based sites',
        'API integrations (payment, logistics, CRM)',
        'Mobile-responsive and performance-optimized',
        'SEO-ready structure and fast load times',
        'Ongoing maintenance and support',
      ],
      cta: 'Start a project',
      ctaHref: `${CONTACT_WA}?text=${encodeURIComponent('Hi! I would like to discuss a web development project.')}`,
      ctaColor: '#4f46e5',
      ctaBg: '#eef2ff',
      ctaBorder: '#c7d2fe',
      popular: false,
      badge: null,
    },
    {
      id: 'consulting',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
        </svg>
      ),
      iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
      label: 'Strategy',
      labelColor: '#d97706',
      labelBg: '#fffbeb',
      title: 'AI & Tech Consultations',
      desc: 'Not sure where to start with AI or your tech stack? Get clear, practical advice tailored to your business — no jargon, no unnecessary complexity.',
      points: [
        'AI strategy for your business or product',
        'WhatsApp and chatbot integration planning',
        'System architecture and tech stack selection',
        'Digital transformation roadmaps',
        'Vendor and tool evaluation',
        'Team training and AI adoption guidance',
        'MVP scoping for startups and SMEs',
        'One-off or ongoing retainer engagements',
      ],
      cta: 'Book a consultation',
      ctaHref: `${CONTACT_WA}?text=${encodeURIComponent('Hi! I would like to book an AI & tech consultation.')}`,
      ctaColor: '#d97706',
      ctaBg: '#fffbeb',
      ctaBorder: '#fde68a',
      popular: false,
      badge: null,
    },
  ]

  return (
    <section id="services" style={{ background: '#f8fafc', padding: '80px 0' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label">Our Services</div>
          <h2 className="ds-section-title">More than a chatbot platform</h2>
          <p className="ds-section-sub mx-auto">
            We build end-to-end AI solutions that save your team time and help your business grow.
            Every service is delivered by the same team behind DG ChatBot.
          </p>
        </div>

        <div className="row g-4">
          {services.map(s => (
            <div key={s.id} className="col-lg-4">
              <div style={{
                background: '#fff',
                borderRadius: 16,
                border: s.popular ? '2px solid #16a34a' : '1px solid #e2e8f0',
                padding: '28px 26px 26px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                position: 'relative',
                boxShadow: s.popular ? '0 8px 32px rgba(22,163,74,.12)' : '0 2px 8px rgba(0,0,0,.04)',
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = s.popular
                    ? '0 16px 48px rgba(22,163,74,.18)'
                    : '0 8px 32px rgba(0,0,0,.10)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = ''
                  ;(e.currentTarget as HTMLElement).style.boxShadow = s.popular
                    ? '0 8px 32px rgba(22,163,74,.12)'
                    : '0 2px 8px rgba(0,0,0,.04)'
                }}
              >
                {s.badge && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                    letterSpacing: '.04em',
                  }}>{s.badge}</div>
                )}

                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: s.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, flexShrink: 0,
                }}>
                  {s.icon}
                </div>

                {/* Label chip */}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 9px', borderRadius: 20,
                  background: s.labelBg, color: s.labelColor,
                  display: 'inline-block', marginBottom: 10,
                  letterSpacing: '.04em', textTransform: 'uppercase',
                }}>{s.label}</span>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.3 }}>
                  {s.title}
                </h3>

                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, margin: '0 0 18px' }}>
                  {s.desc}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {s.points.map(pt => (
                    <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.labelColor} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ color: '#374151', lineHeight: 1.5 }}>{pt}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={s.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '11px 0', borderRadius: 10, fontWeight: 700,
                    fontSize: 14, textDecoration: 'none',
                    background: s.ctaBg, color: s.ctaColor,
                    border: `1.5px solid ${s.ctaBorder}`,
                    transition: 'background .15s, transform .1s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = s.ctaColor
                    ;(e.currentTarget as HTMLElement).style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = s.ctaBg
                    ;(e.currentTarget as HTMLElement).style.color = s.ctaColor
                  }}
                >
                  {s.cta} →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center mt-5" style={{ fontSize: 13.5, color: '#94a3b8' }}>
          All services delivered by Douglas Githui Tech Creatives · Kenya & Remote ·{' '}
          <a href={CONTACT_WA} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>
            WhatsApp us
          </a>{' '}
          to discuss your project
        </p>
      </div>
    </section>
  )
}

// ─── WhatsApp Demo ───────────────────────────────────────────────────────────
const WA_DEMO_PAIRS = [
  {
    customer: "Hi, I need solar panels for my house 🏠",
    agent: "Hello! 👋 You've come to the right place. Which county are you in and what size is your home? I'll find the best solar package for you.",
    tag: "Product inquiry detected",
  },
  {
    customer: "Nairobi, 4 bedroom house",
    agent: "Perfect! For a 4-bed home in Nairobi our 2kW Solar Kit (KES 220,000) is ideal — panels, inverter & 5hr battery backup. Want me to generate a PDF quotation? 📄",
    tag: "Product matched from catalog",
  },
  {
    customer: "Yes please, send the quotation",
    agent: "Sure! What's your name and best number? I'll generate a branded PDF and send it right here on WhatsApp 😊",
    tag: "Lead capture initiated",
  },
  {
    customer: "Do you work on weekends?",
    agent: "Our human team rests on weekends but I'm available 24/7! 🌙 I can answer questions, send quotes and book site visits anytime. Want a Monday morning assessment?",
    tag: "Off-hours handled automatically",
  },
]

function WhatsAppDemoSection() {
  type WaPair = typeof WA_DEMO_PAIRS[number]
  const [idx, setIdx] = useState(0)
  const [prev, setPrev] = useState<WaPair | null>(null)
  const [showCustomer, setShowCustomer] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const [dispCustomer, setDispCustomer] = useState('')
  const [dispAgent, setDispAgent] = useState('')
  const [dispTag, setDispTag] = useState('')

  useEffect(() => {
    const pair = WA_DEMO_PAIRS[idx]
    setShowCustomer(false); setShowTyping(false); setShowAgent(false)
    setDispCustomer(''); setDispAgent(''); setDispTag('')
    const t1 = setTimeout(() => { setDispCustomer(pair.customer); setShowCustomer(true) }, 700)
    const t2 = setTimeout(() => setShowTyping(true), 1800)
    const t3 = setTimeout(() => {
      setShowTyping(false)
      setDispAgent(pair.agent); setDispTag(pair.tag); setShowAgent(true)
    }, 4200)
    const t4 = setTimeout(() => { setPrev(pair); setIdx(i => (i + 1) % WA_DEMO_PAIRS.length) }, 8200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [idx])

  const WA_DARK   = '#075E54'
  const WA_BG     = '#E5DDD5'
  const SENT_BG   = '#DCF8C6'
  const T         = '14:32'

  const sentBubble = (text: string, op = 1) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: op }}>
      <div style={{ background: SENT_BG, borderRadius: '10px 2px 10px 10px', padding: '7px 10px 4px', fontSize: 12, color: '#111', maxWidth: '83%', boxShadow: '0 1px 1px rgba(0,0,0,.12)' }}>
        <div style={{ lineHeight: 1.45 }}>{text}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, marginTop: 3, fontSize: 10, color: '#94a3b8' }}>
          {T} <span style={{ color: '#53bdeb', fontSize: 13, lineHeight: 1 }}>✓✓</span>
        </div>
      </div>
    </div>
  )

  const recvBubble = (text: string, op = 1) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', opacity: op }}>
      <div style={{ background: '#fff', borderRadius: '2px 10px 10px 10px', padding: '7px 10px 4px', fontSize: 12, color: '#111', maxWidth: '83%', boxShadow: '0 1px 1px rgba(0,0,0,.12)' }}>
        <div style={{ lineHeight: 1.45 }}>{text}</div>
        <div style={{ textAlign: 'right', marginTop: 3, fontSize: 10, color: '#94a3b8' }}>{T}</div>
      </div>
    </div>
  )

  const typingDots = (align: 'left' | 'right' = 'left', label?: string) => (
    <div className="demo-msg-in" style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start', gap: 4 }}>
      {label && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, padding: '0 4px' }}>{label}</div>}
      <div style={{ background: align === 'right' ? SENT_BG : '#fff', borderRadius: align === 'right' ? '10px 2px 10px 10px' : '2px 10px 10px 10px', padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center', boxShadow: '0 1px 1px rgba(0,0,0,.12)' }}>
        <div className="demo-dot" style={{ animationDelay: '0ms', background: '#94a3b8' }} />
        <div className="demo-dot" style={{ animationDelay: '160ms', background: '#94a3b8' }} />
        <div className="demo-dot" style={{ animationDelay: '320ms', background: '#94a3b8' }} />
      </div>
    </div>
  )

  const phoneFrame = (label: string, avatar: string, name: string, sub: string, body: React.ReactNode) => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 10, fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</div>
      <div style={{ width: 255, borderRadius: 36, border: '8px solid #1e293b', overflow: 'hidden', boxShadow: '0 28px 70px rgba(0,0,0,.28), 0 4px 16px rgba(0,0,0,.18)', background: WA_BG }}>
        {/* WA header */}
        <div style={{ background: WA_DARK, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 10.5 }}>{sub}</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 15, display: 'flex', gap: 12 }}>📹 📞</div>
        </div>
        {/* Chat area */}
        <div style={{ padding: '10px 10px', minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 7, background: WA_BG }}>
          {body}
        </div>
        {/* Input row */}
        <div style={{ background: '#F0F0F0', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '7px 14px', fontSize: 12, color: '#94a3b8' }}>Message</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: WA_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </div>
        </div>
      </div>
    </div>
  )

  const customerBody = (
    <>
      {prev && <>{sentBubble(prev.customer, 0.35)}{recvBubble(prev.agent, 0.35)}</>}
      {showCustomer && <div className="demo-msg-in">{sentBubble(dispCustomer)}</div>}
      {showTyping && typingDots('left')}
      {showAgent && <div className="demo-msg-in">{recvBubble(dispAgent)}</div>}
    </>
  )

  const agentBody = (
    <>
      {prev && <>{recvBubble(prev.customer, 0.35)}{sentBubble(prev.agent, 0.35)}</>}
      {showCustomer && <div className="demo-msg-in">{recvBubble(dispCustomer)}</div>}
      {showTyping && typingDots('right', '🤖 AI composing…')}
      {showAgent && (
        <div className="demo-msg-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', paddingRight: 4 }}>🤖 <span style={{ color: '#16a34a', fontWeight: 700 }}>{dispTag}</span></div>
          {sentBubble(dispAgent)}
        </div>
      )}
    </>
  )

  return (
    <section id="wa-demo" style={{ background: '#f8fafc', padding: '80px 0', overflow: 'hidden' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label" style={{ color: '#25d366' }}>AI WhatsApp Agent</div>
          <h2 className="ds-section-title">Both sides of the conversation</h2>
          <p className="ds-section-sub mx-auto">
            The customer sends a WhatsApp message. The AI agent reads it, reasons against your business content, and replies — automatically, 24/7, in your brand's voice.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
          {phoneFrame('📱 Customer\'s WhatsApp', '🏪', 'Solar & Borehole Co.', 'Typically replies instantly', customerBody)}

          {/* Connector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 2, height: 50, background: 'linear-gradient(to bottom, transparent, #d1fae5)' }} />
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fff', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(37,211,102,.15)' }}>⚡</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textAlign: 'center', letterSpacing: '.04em', lineHeight: 1.5 }}>INSTANT<br/>AI REPLY</div>
            <div style={{ width: 2, height: 50, background: 'linear-gradient(to top, transparent, #d1fae5)' }} />
          </div>

          {phoneFrame('🤖 Your AI Agent', '🤖', 'Customer · John', '🟢 AI responding…', agentBody)}
        </div>

        <p className="text-center mt-5" style={{ fontSize: 13, color: '#94a3b8' }}>
          Fully white-label — your customers only see your brand, never the technology behind it.{' '}
          <a href={`https://wa.me/254707264913?text=${encodeURIComponent('Hi! I want to see a live demo of the AI WhatsApp Sales Agent.')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', fontWeight: 700, textDecoration: 'none' }}>
            Request a live demo →
          </a>
        </p>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
interface ApiFaq {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
}

function FAQ() {
  const [open, setOpen] = useState<string | null>(null)
  const [faqs, setFaqs] = useState<ApiFaq[]>([])

  useEffect(() => {
    fetch('/api/v1/public/faqs')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: ApiFaq[]) => setFaqs(data))
      .catch(() => {/* silently fall through to empty list */})
  }, [])

  if (faqs.length === 0) return null

  return (
    <section className="ds-faq" id="faq">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="text-center mb-5">
          <div className="ds-section-label">FAQ</div>
          <h2 className="ds-section-title">Common questions</h2>
        </div>
        {faqs.map((f) => (
          <div key={f.id} className="ds-faq-item">
            <button className="ds-faq-question" onClick={() => setOpen(open === f.id ? null : f.id)}>
              {f.question}
              <svg className={`ds-faq-chevron${open === f.id ? ' open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {open === f.id && <div className="ds-faq-answer">{f.answer}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────────
const FALLBACK_REVIEWS = [
  { id: 'f1', name: 'John Kamau',    role: 'Owner, Nairobi Solar Solutions', quote: "We used to miss leads after hours. Now the bot qualifies them, sends quotations, and books site visits — without anyone on our team doing a thing.", rating: 5 },
  { id: 'f2', name: 'Amina Wanjiku', role: 'Founder, Zawadi Store',          quote: "Setup took under 10 minutes and our support load dropped noticeably. Customers get instant answers about delivery, stock, and returns — any time of day.", rating: 5 },
  { id: 'f3', name: 'David Ochieng', role: 'Partner, Ochieng & Associates',  quote: "The grounded answers are what sold me. The bot only responds from our approved content — no making things up. For a law firm, that reliability is non-negotiable.", rating: 5 },
]

const AVATAR_COLORS = ['#16a34a', '#4f46e5', '#d97706', '#0891b2', '#7c3aed', '#dc2626']
const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

function ReviewCard({ review, idx }: { review: { id: string; name: string; role: string | null; quote: string; rating: number }; idx: number }) {
  const color = avatarColor(idx)
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
      padding: '28px 26px', height: '100%', display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0,0,0,.04)', transition: 'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.04)' }}
    >
      <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
        {Array.from({ length: review.rating }).map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ))}
      </div>
      <div style={{ fontSize: 48, lineHeight: .8, color, opacity: .15, fontFamily: 'Georgia,serif', marginBottom: 8, userSelect: 'none' }}>"</div>
      <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.7, margin: '0 0 auto', paddingBottom: 24 }}>{review.quote}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
          {initials(review.name)}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{review.name}</div>
          {review.role && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{review.role}</div>}
        </div>
      </div>
    </div>
  )
}

function Testimonials() {
  const [liveReviews, setLiveReviews] = useState<typeof FALLBACK_REVIEWS | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formState, setFormState] = useState({ name: '', role: '', quote: '', rating: 5 })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/v1/reviews/public`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: typeof FALLBACK_REVIEWS) => { if (data.length > 0) setLiveReviews(data) })
      .catch(() => {})
  }, [])

  const reviews = liveReviews ?? FALLBACK_REVIEWS

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 5

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formState.quote.trim().length < 10) { setFormError('Please write at least 10 characters.'); return }
    setSubmitting(true); setFormError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formState.name, role: formState.role || null, quote: formState.quote, rating: formState.rating }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ background: '#f8fafc', padding: '80px 0' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="ds-section-label">Testimonials</div>
          <h2 className="ds-section-title">Trusted by businesses across Kenya</h2>
          <p className="ds-section-sub mx-auto">Real results from real business owners who use DG ChatBot to handle customer questions around the clock.</p>
        </div>

        <div className="row g-4">
          {reviews.map((r, i) => (
            <div key={r.id} className="col-lg-4">
              <ReviewCard review={r} idx={i} />
            </div>
          ))}
        </div>

        {/* Rating summary */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 36 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{avgRating}.0</span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>— rated by our customers</span>
        </div>

        {/* Leave a review */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          {!showForm && !submitted && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-ghost"
              style={{ fontSize: 14 }}
            >
              ⭐ Leave a review
            </button>
          )}

          {showForm && !submitted && (
            <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '28px 28px 24px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Share your experience</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Your review will appear after a quick approval check.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Star picker */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Rating</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setFormState(s => ({ ...s, rating: n }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={n <= formState.rating ? '#f59e0b' : '#e2e8f0'}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Your name *</label>
                    <input required className="form-control form-control-sm" placeholder="Jane Wanjiku"
                      value={formState.name} onChange={e => setFormState(s => ({ ...s, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Role / Business</label>
                    <input className="form-control form-control-sm" placeholder="Owner, My Business"
                      value={formState.role} onChange={e => setFormState(s => ({ ...s, role: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Your review *</label>
                  <textarea required rows={4} className="form-control form-control-sm"
                    placeholder="Tell us about your experience with DG ChatBot…"
                    value={formState.quote} onChange={e => setFormState(s => ({ ...s, quote: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>

                {formError && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{formError}</p>}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ fontSize: 13, padding: '8px 18px' }}>Cancel</button>
                  <button type="submit" className="btn-brand" style={{ fontSize: 13, padding: '8px 22px' }} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {submitted && (
            <div style={{ maxWidth: 420, margin: '0 auto', background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1rem', marginBottom: 6 }}>Thank you for your review!</div>
              <p style={{ fontSize: 13.5, color: '#16a34a', margin: 0 }}>It will appear on this page once approved by our team — usually within 24 hours.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ──────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <div className="ds-cta-banner">
      <div className="container">
        <h2>Ready to give your website a voice?</h2>
        <p>Create a free account in 30 seconds. No credit card. No commitment.</p>
        <a href={REGISTER_URL} className="btn-brand btn-brand-lg" style={{ background: '#fff', color: '#16a34a', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
          Get started free →
        </a>
      </div>
    </div>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="ds-footer">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="ds-footer-logo">
              <img src="/logo.jpeg" alt={COMPANY} />
            </div>
            <p className="ds-footer-tagline">
              {PRODUCT} — AI chat for any website.
            </p>
          </div>

          <div className="col-6 col-md-2 offset-md-2">
            <div className="ds-footer-heading">Product</div>
            <ul className="ds-footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#use-cases">Use Cases</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="col-6 col-md-2">
            <div className="ds-footer-heading">Account</div>
            <ul className="ds-footer-links">
              <li><a href={REGISTER_URL}>Sign up free</a></li>
              <li><a href={ADMIN_URL}>Sign in</a></li>
              <li><a href={`${ADMIN_URL}/bots`}>Dashboard</a></li>
            </ul>
          </div>
          <div className="col-6 col-md-2">
            <div className="ds-footer-heading">Legal</div>
            <ul className="ds-footer-links">
              <li><a href={`${ADMIN_URL}/privacy`}>Privacy policy</a></li>
              <li><a href={`${ADMIN_URL}/terms`}>Terms of service</a></li>
              <li><a href={`${ADMIN_URL}/security`}>Security</a></li>
            </ul>
          </div>
        </div>
        <div className="ds-footer-bottom">
          <span>© {year} {COMPANY}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

// ─── WhatsApp Floating Button ─────────────────────────────────────────────────
const WA_NUMBER = '254707264913'
const WA_MESSAGE = encodeURIComponent('Hi! I would like to learn more about DG ChatBot.')

// ─── Back to Top ─────────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: 100,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: '#0f172a',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,.25)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity .25s, transform .25s',
        zIndex: 998,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  )
}

function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
      className="ds-whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span className="ds-whatsapp-tooltip">Chat on WhatsApp</span>
    </a>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <LogoStrip />
      <StatsBar />
      <HowItWorks />
      <Features />
      <UseCases />
      <InstallSection />
      <LiveDemoSection />
      <Pricing />
      <ComparisonTable />
      <OtherServices />
      <WhatsAppDemoSection />
      <FAQ />
      <Testimonials />
      <CtaBanner />
      <Footer />
      <BackToTop />
      <WhatsAppButton />
    </>
  )
}
