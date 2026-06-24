import { useEffect, useState } from 'react'
import './index.css'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000'
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
        Powered by Claude AI · By {COMPANY}
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

// CTA config per plan slug — display concern only
const PLAN_CTA: Record<string, { cta: string; ctaHref: string; ctaClass: string; popular: boolean; badge: string | null }> = {
  free:       { cta: 'Get started free',  ctaHref: REGISTER_URL,                          ctaClass: 'btn-ghost', popular: false, badge: null },
  pro:        { cta: 'Start Pro trial',   ctaHref: REGISTER_URL,                          ctaClass: 'btn-brand', popular: true,  badge: 'Most popular' },
  enterprise: { cta: 'Contact sales',     ctaHref: 'mailto:info@doughlas.africa',          ctaClass: 'btn-ghost', popular: false, badge: null },
}
const DEFAULT_CTA = { cta: 'Get started', ctaHref: REGISTER_URL, ctaClass: 'btn-ghost', popular: false, badge: null }

function limitLabel(v: number) {
  return v === -1 ? 'Unlimited' : v.toLocaleString()
}

function PricingCardSkeleton() {
  return (
    <div className="col-md-4">
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
        <div className="row g-4 align-items-start justify-content-center">
          {loading
            ? [1, 2, 3].map(i => <PricingCardSkeleton key={i} />)
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
                  <div key={p.id} className="col-md-4">
                    <div className={`ds-pricing-card${ui.popular ? ' popular' : ''}`}>
                      {ui.badge && <div className="ds-plan-badge">{ui.badge}</div>}
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
              {PRODUCT} — AI chat for any website.<br />
              Powered by Claude AI.
            </p>
          </div>

          <div className="col-6 col-md-2 offset-md-2">
            <div className="ds-footer-heading">Product</div>
            <ul className="ds-footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
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
      <HowItWorks />
      <Features />
      <InstallSection />
      <Pricing />
      <FAQ />
      <CtaBanner />
      <Footer />
      <WhatsAppButton />
    </>
  )
}
