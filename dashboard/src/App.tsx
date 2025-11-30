import { useEffect, useState } from 'react'
import { 
  MessageSquare, 
  Send, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Github,
  Bot
} from 'lucide-react'
import { StatsCard } from './components/StatsCard'
import { ActivityChart } from './components/ActivityChart'
import { SubredditBreakdown } from './components/SubredditBreakdown'
import { AIProviderStats } from './components/AIProviderStats'
import { RecentComments } from './components/RecentComments'
import { 
  fetchDashboardStats, 
  fetchRecentComments,
  type DashboardStats,
  type Comment 
} from './lib/supabase'

// Demo data for when Supabase is not configured
const demoStats: DashboardStats = {
  totalPosts: 156,
  totalComments: 89,
  postedComments: 67,
  pendingComments: 12,
  rejectedComments: 10,
  totalKarma: 1234,
  avgKarma: 18.4,
  topSubreddits: [
    { subreddit: 'AskReddit', count: 45 },
    { subreddit: 'NoStupidQuestions', count: 32 },
    { subreddit: 'explainlikeimfive', count: 28 },
    { subreddit: 'programming', count: 15 },
    { subreddit: 'webdev', count: 12 },
  ],
  recentActivity: [
    { date: '2025-11-24', posts: 12, comments: 8 },
    { date: '2025-11-25', posts: 18, comments: 14 },
    { date: '2025-11-26', posts: 15, comments: 11 },
    { date: '2025-11-27', posts: 22, comments: 16 },
    { date: '2025-11-28', posts: 19, comments: 13 },
    { date: '2025-11-29', posts: 25, comments: 18 },
    { date: '2025-11-30', posts: 28, comments: 21 },
  ],
  aiProviderUsage: [
    { provider: 'gemini-pro', count: 45 },
    { provider: 'gemini-flash', count: 32 },
    { provider: 'claude', count: 12 },
  ],
}

const demoComments: Comment[] = [
  {
    id: '1',
    post_id: 'post1',
    content: 'python. ngl i tried starting with something else and it was a nightmare of semicolons. python just lets you build stuff fast.',
    status: 'posted',
    karma_score: 42,
    reddit_comment_id: 'abc123',
    ai_provider: 'gemini-pro',
    created_at: '2025-11-30T10:00:00Z',
    posted_at: '2025-11-30T10:05:00Z',
  },
  {
    id: '2',
    post_id: 'post2',
    content: 'tbh i think it\'s because their work scales like crazy. one person can write a program that a million people use.',
    status: 'posted',
    karma_score: 28,
    reddit_comment_id: 'def456',
    ai_provider: 'gemini-pro',
    created_at: '2025-11-30T09:30:00Z',
    posted_at: '2025-11-30T09:35:00Z',
  },
  {
    id: '3',
    post_id: 'post3',
    content: 'in software, when a manager asks for \'one tiny little change\' it\'s almost never tiny lol',
    status: 'pending',
    karma_score: null,
    reddit_comment_id: null,
    ai_provider: 'gemini-flash',
    created_at: '2025-11-30T08:00:00Z',
    posted_at: null,
  },
]

function App() {
  const [stats, setStats] = useState<DashboardStats>(demoStats)
  const [comments, setComments] = useState<Comment[]>(demoComments)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isDemo, setIsDemo] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (supabaseUrl) {
        const [statsData, commentsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentComments(5),
        ])
        setStats(statsData)
        setComments(commentsData)
        setIsDemo(false)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const successRate = stats.totalComments > 0 
    ? Math.round((stats.postedComments / stats.totalComments) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/20 p-2">
                <Bot className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Reddit Enhancer</h1>
                <p className="text-sm text-gray-500">Observability Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isDemo && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  Demo Mode
                </span>
              )}
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <a
                href="https://github.com/laraib-sidd/reddit-enhancer"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Last Updated */}
        <p className="mb-6 text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Posts Scanned"
            value={stats.totalPosts.toLocaleString()}
            subtitle="Total processed"
            icon={Users}
            color="indigo"
          />
          <StatsCard
            title="Comments Generated"
            value={stats.totalComments.toLocaleString()}
            subtitle={`${stats.postedComments} posted`}
            icon={MessageSquare}
            color="emerald"
          />
          <StatsCard
            title="Total Karma"
            value={stats.totalKarma.toLocaleString()}
            subtitle={`Avg: ${stats.avgKarma}/comment`}
            icon={TrendingUp}
            color="amber"
          />
          <StatsCard
            title="Success Rate"
            value={`${successRate}%`}
            subtitle={`${stats.pendingComments} pending`}
            icon={Send}
            color="rose"
          />
        </div>

        {/* Charts Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <ActivityChart data={stats.recentActivity} />
          <SubredditBreakdown data={stats.topSubreddits} />
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AIProviderStats data={stats.aiProviderUsage} />
          <RecentComments comments={comments} />
        </div>

        {/* Status Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-white/10 bg-[#1a1a24] p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-gray-400">Anti-Detection: Active</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-gray-400">
              Rate Limit: {20 - (stats.postedComments % 20)}/20 remaining
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="text-sm text-gray-400">
            AI: Gemini Pro → Flash → Claude
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Reddit Enhancer Bot • Built with 🧡 using Python + React
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
