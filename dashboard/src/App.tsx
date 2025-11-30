import { useEffect, useState } from 'react'
import { 
  MessageSquare, 
  Send, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Github,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react'
import { StatsCard } from './components/StatsCard'
import { ActivityChart } from './components/ActivityChart'
import { SubredditBreakdown } from './components/SubredditBreakdown'
import { RecentComments } from './components/RecentComments'
import { CommentAssistant } from './components/CommentAssistant'
import { 
  fetchDashboardData, 
  demoData,
  type DashboardData,
} from './lib/data'
import { generateComment } from './lib/ai'

type TabType = 'dashboard' | 'assistant'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('assistant')
  const [data, setData] = useState<DashboardData>(demoData)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isDemo, setIsDemo] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchDashboardData()
      setData(result.data)
      setIsDemo(result.isDemo)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = data.stats
  const comments = data.recentComments

  const successRate = stats.totalComments > 0 
    ? Math.round((stats.postedComments / stats.totalComments) * 100) 
    : 0

  const handleGenerateComment = async (post: { title: string; subreddit: string; selftext: string; score: number; num_comments: number }) => {
    return await generateComment(post)
  }

  return (
    <div className="min-h-screen bg-[#09090b] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-orb w-[500px] h-[500px] bg-purple-600/30 -top-48 -left-48" />
      <div className="glow-orb w-[400px] h-[400px] bg-violet-600/20 top-1/2 -right-32" />
      <div className="glow-orb w-[300px] h-[300px] bg-indigo-600/20 -bottom-24 left-1/3" />

      {/* Header */}
      <header className={`sticky top-0 z-50 glass transition-all duration-300 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-purple flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Reddit Enhancer</h1>
              <p className="text-xs text-zinc-500">AI Comment Assistant</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'assistant'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Assistant
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              Analytics
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="badge badge-warning">
                <Zap className="w-3 h-3" />
                Demo
              </span>
            )}
            {activeTab === 'dashboard' && (
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            <a
              href="https://github.com/laraib-sidd/reddit-enhancer"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`relative z-10 max-w-7xl mx-auto px-6 py-8 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-zinc-500 mt-1 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="animate-fade-in delay-1">
                <StatsCard
                  title="Posts Scanned"
                  value={stats.totalPosts.toLocaleString()}
                  subtitle="Total processed"
                  icon={Users}
                  trend="+12%"
                  trendUp={true}
                />
              </div>
              <div className="animate-fade-in delay-2">
                <StatsCard
                  title="Comments"
                  value={stats.totalComments.toLocaleString()}
                  subtitle={`${stats.postedComments} posted`}
                  icon={MessageSquare}
                  trend="+8%"
                  trendUp={true}
                />
              </div>
              <div className="animate-fade-in delay-3">
                <StatsCard
                  title="Total Karma"
                  value={stats.totalKarma.toLocaleString()}
                  subtitle={`${stats.avgKarma} avg`}
                  icon={TrendingUp}
                  trend="+24%"
                  trendUp={true}
                />
              </div>
              <div className="animate-fade-in delay-4">
                <StatsCard
                  title="Success Rate"
                  value={`${successRate}%`}
                  subtitle={`${stats.pendingComments} pending`}
                  icon={Send}
                  trend="+5%"
                  trendUp={true}
                />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-fade-in delay-2">
                <ActivityChart data={stats.recentActivity} />
              </div>
              <div className="animate-fade-in delay-3">
                <SubredditBreakdown data={stats.topSubreddits} />
              </div>
            </div>

            {/* Recent Comments */}
            <div className="animate-fade-in delay-4">
              <RecentComments comments={comments} />
            </div>

            {/* Status Bar */}
            <div className="animate-fade-in delay-5 glass rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-zinc-400">Anti-Detection</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Rate Limit:</span>
                  <span className="text-white font-medium">{20 - (stats.postedComments % 20)}/20</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-zinc-400">AI:</span>
                  <span className="text-white font-medium">Gemini Pro</span>
                  <ChevronRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-400">Flash</span>
                  <ChevronRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-400">Claude</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CommentAssistant onGenerateComment={handleGenerateComment} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Built with <span className="text-red-400">♥</span> using Python + React
          </p>
          <a
            href="https://github.com/laraib-sidd/reddit-enhancer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
          >
            View Source
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
