import { useEffect, useState } from 'react'
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Target,
  RefreshCw,
  Github,
  Sparkles,
  BarChart3
} from 'lucide-react'
import { StatsCard } from './components/StatsCard'
import { ActivityChart } from './components/ActivityChart'
import { SubredditBreakdown } from './components/SubredditBreakdown'
import { RecentComments } from './components/RecentComments'
import { CommentAssistant } from './components/CommentAssistant'
import { fetchDashboardData, demoData, type DashboardData } from './lib/data'
import { generateComment } from './lib/ai'

type Tab = 'assistant' | 'dashboard'

export default function App() {
  const [tab, setTab] = useState<Tab>('assistant')
  const [data, setData] = useState<DashboardData>(demoData)
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchDashboardData()
      setData(result.data)
      setIsDemo(result.isDemo)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const stats = data.stats
  const successRate = stats.totalComments > 0 
    ? Math.round((stats.postedComments / stats.totalComments) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Reddit Enhancer</span>
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1">
            <button
              onClick={() => setTab('assistant')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'assistant' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Assistant
              </span>
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'dashboard' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="px-2 py-1 text-xs font-medium text-amber-500 bg-amber-500/10 rounded">
                Demo
              </span>
            )}
            {tab === 'dashboard' && (
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <a
              href="https://github.com/laraib-sidd/reddit-enhancer"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'dashboard' ? (
          <div className="space-y-6 animate-in">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                label="Posts Scanned"
                value={stats.totalPosts}
                icon={Users}
              />
              <StatsCard
                label="Comments"
                value={stats.totalComments}
                icon={MessageSquare}
              />
              <StatsCard
                label="Total Karma"
                value={stats.totalKarma}
                icon={TrendingUp}
              />
              <StatsCard
                label="Success Rate"
                value={`${successRate}%`}
                icon={Target}
              />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ActivityChart data={stats.recentActivity} />
              <SubredditBreakdown data={stats.topSubreddits} />
            </div>

            {/* Comments */}
            <RecentComments comments={data.recentComments} />
          </div>
        ) : (
          <div className="animate-in">
            <CommentAssistant onGenerate={generateComment} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-neutral-500">
          <span>Built with Python + React</span>
          <a 
            href="https://github.com/laraib-sidd/reddit-enhancer" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            View Source →
          </a>
        </div>
      </footer>
    </div>
  )
}
