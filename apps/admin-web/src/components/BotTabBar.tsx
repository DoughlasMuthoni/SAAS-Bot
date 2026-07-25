interface Bot { id: string; name: string; brand_color: string }

interface Props {
  bots: Bot[]
  activeId: string
  onChange: (id: string) => void
  /** Per-bot record counts shown as a badge on each tab */
  counts?: Record<string, number>
  /** Count shown on the "All" tab */
  totalCount?: number
}

export default function BotTabBar({ bots, activeId, onChange, counts, totalCount }: Props) {
  if (bots.length === 0) return null

  const TAB_BASE: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 13px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: 'pointer', transition: 'background .15s, color .15s',
    whiteSpace: 'nowrap',
  }

  const badge = (n: number | undefined) => n !== undefined ? (
    <span style={{
      fontSize: 10, fontWeight: 700, minWidth: 17, height: 17,
      borderRadius: 99, display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', padding: '0 4px',
      background: 'rgba(0,0,0,.12)',
    }}>{n}</span>
  ) : null

  const tabs: Array<{ id: string; label: string; color: string; count?: number }> = [
    { id: 'all', label: 'All bots', color: '#4f46e5', count: totalCount },
    ...bots.map(b => ({ id: b.id, label: b.name, color: b.brand_color || '#4f46e5', count: counts?.[b.id] })),
  ]

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
      {tabs.map(tab => {
        const active = activeId === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              ...TAB_BASE,
              background: active ? tab.color : '#f1f5f9',
              color: active ? '#fff' : '#64748b',
              boxShadow: active ? `0 2px 8px ${tab.color}44` : 'none',
            }}
          >
            {tab.label}
            {badge(tab.count)}
          </button>
        )
      })}
    </div>
  )
}
