export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export interface Workspace {
  id: string
  org_id: string
  name: string
  slug: string
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  org_id: string
  is_active: boolean
}

export interface Domain {
  id: string
  bot_id: string
  domain: string
  is_active: boolean
}

export interface Bot {
  id: string
  workspace_id: string
  name: string
  public_key: string
  brand_color: string
  welcome_message: string
  fallback_email: string | null
  fallback_phone: string | null
  fallback_whatsapp: string | null
  model_name: string | null
  is_active: boolean
  position: 'bottom-right' | 'bottom-left'
  theme: 'light' | 'dark'
  domains: Domain[]
  created_at: string
  updated_at: string
}

export interface WidgetConfig {
  bot_id: string
  name: string
  brand_color: string
  welcome_message: string
  position: 'bottom-right' | 'bottom-left'
  theme: 'light' | 'dark'
}

export interface KnowledgeSource {
  id: string
  workspace_id: string
  bot_id: string
  name: string
  source_type: 'text' | 'faq' | 'upload' | 'crawl'
  status: 'pending' | 'indexing' | 'indexed' | 'failed' | 'disabled'
  chunk_count: number
  indexed_at: string | null
  error_message: string | null
  language: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  retrieved_chunk_ids: string[]
  was_grounded: boolean
  model_used: string | null
  latency_ms: number | null
  created_at: string
}

export interface Conversation {
  id: string
  bot_id: string
  workspace_id: string
  session_id: string
  status: 'active' | 'resolved' | 'lead' | 'unresolved'
  message_count: number
  started_at: string
  last_message_at: string | null
}

export interface Lead {
  id: string
  workspace_id: string
  bot_id: string
  conversation_id: string | null
  name: string
  email: string | null
  phone: string | null
  message: string | null
  page_url: string | null
  status: 'new' | 'contacted' | 'closed'
  created_at: string
}

export interface AnalyticsOverview {
  total_conversations: number
  total_messages: number
  unresolved_count: number
  lead_count: number
  top_queries: Array<{ query: string; count: number }>
  usage_by_day: Array<{ date: string; conversations: number; messages: number }>
}

export interface FaqPair {
  question: string
  answer: string
}

export interface Citation {
  chunk_id: string
  source_name: string
  source_url: string | null
  snippet: string
  score: number
}

export interface ChatMetadata {
  conversation_id: string
  citations: Citation[]
  was_grounded: boolean
  unresolved: boolean
}
