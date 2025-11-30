import { useEffect, useState } from 'react'
import { 
  MessageSquare, 
  TrendingUp, 
  FileText,
  Target,
  RefreshCw,
  Github,
  Sparkles,
  LayoutDashboard,
  Moon,
  Sun
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
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

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
    <div className="min-h-screen bg-[var(--bg)] transition-colors">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[var(--bg-card)] border-r border-[var(--border)] p-6 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[var(--text)]">Reddit Enhancer</h1>
            <p className="text-xs text-[var(--text-secondary)]">AI Assistant</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setTab('assistant')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === 'assistant'
                ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg)]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Comment Assistant
          </button>
          <button
            onClick={() => setTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === 'dashboard'
                ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg)]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Analytics
          </button>
        </nav>

        {/* Footer */}
        <div className="space-y-3 pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <a
            href="https://github.com/laraib-sidd/reddit-enhancer"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors"
          >
            <Github className="w-4 h-4" />
            View Source
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--border)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">
                {tab === 'assistant' ? 'Comment Assistant' : 'Analytics Dashboard'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {tab === 'assistant' 
                  ? 'Generate human-like comments for Reddit posts' 
                  : 'Track your bot performance and engagement'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isDemo && (
                <span className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  Demo Mode
                </span>
              )}
              {tab === 'dashboard' && (
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {tab === 'dashboard' ? (
            <div className="space-y-6 animate-in">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-5">
                <StatsCard
                  label="Posts Scanned"
                  value={stats.totalPosts}
                  change="+12.5%"
                  icon={FileText}
                  color="blue"
                />
                <StatsCard
                  label="Comments Generated"
                  value={stats.totalComments}
                  change="+8.2%"
                  icon={MessageSquare}
                  color="green"
                />
                <StatsCard
                  label="Total Karma"
                  value={stats.totalKarma}
                  change="+24.1%"
                  icon={TrendingUp}
                  color="purple"
                />
                <StatsCard
                  label="Success Rate"
                  value={`${successRate}%`}
                  change="+5.4%"
                  icon={Target}
                  color="orange"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-5 gap-5">
                <div className="col-span-3">
                  <ActivityChart data={stats.recentActivity} />
                </div>
                <div className="col-span-2">
                  <SubredditBreakdown data={stats.topSubreddits} />
                </div>
              </div>

              {/* Comments */}
              <RecentComments comments={data.recentComments} />
            </div>
          ) : (
            <div className="animate-in">
              <CommentAssistant onGenerate={generateComment} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
