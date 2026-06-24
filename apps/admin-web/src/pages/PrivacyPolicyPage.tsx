import { useQuery } from '@tanstack/react-query'

interface Page { slug: string; title: string; content: string; updated_at: string }

export default function PrivacyPolicyPage() {
  const { data, isLoading, isError } = useQuery<Page>({
    queryKey: ['public-page', 'privacy'],
    queryFn: () => fetch('/api/v1/public/pages/privacy').then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 60_000,
  })

  if (isLoading) return <div className="cb-spinner" />
  if (isError || !data) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0 80px' }}>
      <p style={{ color: '#dc2626' }}>Unable to load Privacy Policy. Please try again later.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, marginBottom: 10 }}>
          {data.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
          Last updated: {new Date(data.updated_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div
        style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </div>
  )
}
