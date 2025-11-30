import { createClient } from '@supabase/supabase-js'

// These are safe to expose - they only allow read access via RLS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Post {
  id: string
  reddit_post_id: string
  subreddit: string
  title: string
  score: number
  processed: boolean
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'posted'
  karma_score: number | null
  reddit_comment_id: string | null
  ai_provider: string | null
  created_at: string
  posted_at: string | null
}

export interface SuccessfulPattern {
  id: string
  subreddit: string
  comment_text: string
  karma_score: number
  quality_score: number
  created_at: string
}

export interface DashboardStats {
  totalPosts: number
  totalComments: number
  postedComments: number
  pendingComments: number
  rejectedComments: number
  totalKarma: number
  avgKarma: number
  topSubreddits: { subreddit: string; count: number }[]
  recentActivity: { date: string; posts: number; comments: number }[]
  aiProviderUsage: { provider: string; count: number }[]
}

// Fetch dashboard stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fetch posts count
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('processed', true)

  // Fetch comments by status
  const { data: comments } = await supabase
    .from('comments')
    .select('status, karma_score, ai_provider, created_at')

  const totalComments = comments?.length || 0
  const postedComments = comments?.filter(c => c.status === 'posted').length || 0
  const pendingComments = comments?.filter(c => c.status === 'pending').length || 0
  const rejectedComments = comments?.filter(c => c.status === 'rejected').length || 0

  // Calculate karma
  const postedWithKarma = comments?.filter(c => c.status === 'posted' && c.karma_score !== null) || []
  const totalKarma = postedWithKarma.reduce((sum, c) => sum + (c.karma_score || 0), 0)
  const avgKarma = postedWithKarma.length > 0 ? totalKarma / postedWithKarma.length : 0

  // Fetch top subreddits
  const { data: posts } = await supabase
    .from('posts')
    .select('subreddit')
    .eq('processed', true)

  const subredditCounts: Record<string, number> = {}
  posts?.forEach(p => {
    subredditCounts[p.subreddit] = (subredditCounts[p.subreddit] || 0) + 1
  })
  const topSubreddits = Object.entries(subredditCounts)
    .map(([subreddit, count]) => ({ subreddit, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // AI provider usage
  const providerCounts: Record<string, number> = {}
  comments?.forEach(c => {
    if (c.ai_provider) {
      providerCounts[c.ai_provider] = (providerCounts[c.ai_provider] || 0) + 1
    }
  })
  const aiProviderUsage = Object.entries(providerCounts)
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => b.count - a.count)

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentActivity: { date: string; posts: number; comments: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayPosts = posts?.filter(p => p.subreddit && new Date(dateStr).toDateString() === new Date(dateStr).toDateString()).length || 0
    const dayComments = comments?.filter(c => c.created_at?.startsWith(dateStr)).length || 0
    
    recentActivity.push({ date: dateStr, posts: dayPosts, comments: dayComments })
  }

  return {
    totalPosts: totalPosts || 0,
    totalComments,
    postedComments,
    pendingComments,
    rejectedComments,
    totalKarma,
    avgKarma: Math.round(avgKarma * 10) / 10,
    topSubreddits,
    recentActivity,
    aiProviderUsage,
  }
}

// Fetch recent comments
export async function fetchRecentComments(limit = 10): Promise<Comment[]> {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return data || []
}

// Fetch successful patterns
export async function fetchPatterns(limit = 10): Promise<SuccessfulPattern[]> {
  const { data } = await supabase
    .from('successful_patterns')
    .select('*')
    .order('karma_score', { ascending: false })
    .limit(limit)
  
  return data || []
}

