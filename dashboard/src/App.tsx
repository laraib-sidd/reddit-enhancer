import { useEffect, useState } from 'react'
import { 
  MessageSquare, 
  Send, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Github,
  Bot,
  BarChart3,
  Sparkles,
  Zap,
  ExternalLink
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
import { generateComment, isAIConfigured } from './lib/ai'

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
    <div className="min-h-screen bg-[#06070a] bg-grid relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Noise overlay */}
      <div className="noise" />

      {/* Header */}
      <header className={`sticky top-0 z-50 glass transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2.5">
                  <Bot className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Reddit Enhancer</h1>
                <p className="text-sm text-slate-500">AI-Powered Comment Assistant</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              {/* Tab Switcher */}
              <nav className="relative flex rounded-xl bg-white/5 p-1">
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeTab === 'assistant'
                      ? 'text-white'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Assistant
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeTab === 'dashboard'
                      ? 'text-white'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </button>
                {/* Animated indicator */}
                <div 
                  className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 transition-all duration-300"
                  style={{
                    left: activeTab === 'assistant' ? '4px' : '50%',
                    width: 'calc(50% - 8px)',
                  }}
                />
              </nav>

              {/* Status badges */}
              <div className="hidden md:flex items-center gap-3">
                {isDemo && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                    <Zap className="h-3 w-3" />
                    Demo Mode
                  </span>
                )}
                {!isAIConfigured() && activeTab === 'assistant' && (
                  <span className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 border border-purple-500/20">
                    <Sparkles className="h-3 w-3" />
                    Demo AI
                  </span>
                )}
              </div>

              {/* Actions */}
              {activeTab === 'dashboard' && (
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300 disabled:opacity-50 border border-white/5 hover:border-white/10"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}

              <a
                href="https://github.com/laraib-sidd/reddit-enhancer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-xl bg-white/5 p-2.5 text-slate-500 hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/10"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' ? (
          <div className={`space-y-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
                <p className="text-slate-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {!isDemo && data.generated_at && (
                    <span className="ml-2">• Data from: {new Date(data.generated_at).toLocaleString()}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="animate-fade-in stagger-1">
                <StatsCard
                  title="Posts Scanned"
                  value={stats.totalPosts.toLocaleString()}
                  subtitle="Total processed"
                  icon={Users}
                  color="indigo"
                />
              </div>
              <div className="animate-fade-in stagger-2">
                <StatsCard
                  title="Comments Generated"
                  value={stats.totalComments.toLocaleString()}
                  subtitle={`${stats.postedComments} posted`}
                  icon={MessageSquare}
                  color="emerald"
                />
              </div>
              <div className="animate-fade-in stagger-3">
                <StatsCard
                  title="Total Karma"
                  value={stats.totalKarma.toLocaleString()}
                  subtitle={`Avg: ${stats.avgKarma}/comment`}
                  icon={TrendingUp}
                  color="amber"
                />
              </div>
              <div className="animate-fade-in stagger-4">
                <StatsCard
                  title="Success Rate"
                  value={`${successRate}%`}
                  subtitle={`${stats.pendingComments} pending`}
                  icon={Send}
                  color="rose"
                />
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="animate-fade-in stagger-2">
                <ActivityChart data={stats.recentActivity} />
              </div>
              <div className="animate-fade-in stagger-3">
                <SubredditBreakdown data={stats.topSubreddits} />
              </div>
            </div>

            {/* Recent Comments */}
            <div className="animate-fade-in stagger-4">
              <RecentComments comments={comments} />
            </div>

            {/* Status Bar */}
            <div className="glass rounded-2xl p-4 animate-fade-in stagger-5">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-500">Anti-Detection: <span className="text-emerald-400">Active</span></span>
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="text-slate-500">Rate Limit: <span className="text-white">{20 - (stats.postedComments % 20)}/20</span></span>
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  AI: <span className="text-white">Gemini Pro → Flash → Claude</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <CommentAssistant onGenerateComment={handleGenerateComment} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Reddit Enhancer • Built with{' '}
              <span className="text-red-400">♥</span>
              {' '}using Python + React
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/laraib-sidd/reddit-enhancer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" />
                View Source
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
