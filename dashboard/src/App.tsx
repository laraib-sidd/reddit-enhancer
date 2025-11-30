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
  Sparkles
} from 'lucide-react'
import { StatsCard } from './components/StatsCard'
import { ActivityChart } from './components/ActivityChart'
import { SubredditBreakdown } from './components/SubredditBreakdown'
import { AIProviderStats } from './components/AIProviderStats'
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [data, setData] = useState<DashboardData>(demoData)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isDemo, setIsDemo] = useState(true)

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

  useEffect(() => {
    loadData()
  }, [])

  const stats = data.stats
  const comments = data.recentComments

  const successRate = stats.totalComments > 0 
    ? Math.round((stats.postedComments / stats.totalComments) * 100) 
    : 0

  // Handle comment generation
  const handleGenerateComment = async (post: { title: string; subreddit: string; selftext: string; score: number; num_comments: number }) => {
    return await generateComment(post)
  }

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
                <p className="text-sm text-gray-500">Dashboard & Comment Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Tab Switcher */}
              <div className="flex rounded-lg bg-white/5 p-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'assistant'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Assistant
                </button>
              </div>

              {isDemo && activeTab === 'dashboard' && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  Demo Mode
                </span>
              )}
              {!isAIConfigured() && activeTab === 'assistant' && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  Demo Comments
                </span>
              )}
              {activeTab === 'dashboard' && (
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
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
        {activeTab === 'dashboard' ? (
          <>
            {/* Last Updated */}
            <p className="mb-6 text-sm text-gray-500">
              Last refreshed: {lastUpdated.toLocaleTimeString()}
              {!isDemo && data.generated_at && (
                <span className="ml-2">
                  • Data from: {new Date(data.generated_at).toLocaleString()}
                </span>
              )}
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
          </>
        ) : (
          <CommentAssistant onGenerateComment={handleGenerateComment} />
        )}
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
