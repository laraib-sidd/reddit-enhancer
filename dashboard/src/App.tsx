import { useEffect, useState } from 'react'
import { fetchDashboardData, demoData, type DashboardData } from './lib/data'
import { generateComment } from './lib/ai'

type Tab = 'assistant' | 'dashboard'

// Simple icons as SVG components
const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

export default function App() {
  const [tab, setTab] = useState<Tab>('assistant')
  const [data, setData] = useState<DashboardData>(demoData)
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(true)
  
  // Assistant state
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleGenerate = async () => {
    if (!title.trim()) return
    setGenerating(true)
    setComment('')
    try {
      const result = await generateComment({ title, subreddit: '', selftext: '', score: 0, num_comments: 0 })
      setComment(result)
    } catch {
      setComment('Failed to generate. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(comment)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = data.stats
  const successRate = stats.totalComments > 0 ? Math.round((stats.postedComments / stats.totalComments) * 100) : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-6 py-4 backdrop-blur-sm bg-zinc-950/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Reddit Enhancer</h1>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg">
            <button
              onClick={() => setTab('assistant')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                tab === 'assistant' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <SparklesIcon />
              Assistant
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                tab === 'dashboard' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <ChartIcon />
              Dashboard
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 animate-pulse">
                Demo
              </span>
            )}
            {tab === 'dashboard' && (
              <button 
                onClick={loadData} 
                disabled={loading} 
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshIcon spinning={loading} />
                {loading ? 'Loading' : 'Refresh'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        <div 
          key={tab} 
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {tab === 'assistant' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 tracking-tight">Comment Assistant</h2>
                <p className="text-zinc-400">Generate human-like comments for Reddit posts</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Input */}
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-colors duration-300">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Post Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Reddit URL (optional)</label>
                      <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://reddit.com/r/..."
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200 placeholder:text-zinc-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Post Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="What's the post about?"
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200 placeholder:text-zinc-600"
                      />
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!title.trim() || generating}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {generating ? (
                        <>
                          <LoaderIcon />
                          Generating...
                        </>
                      ) : (
                        <>
                          <SparklesIcon />
                          Generate Comment
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Output */}
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-colors duration-300">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Generated Comment
                  </h3>
                  {generating ? (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-500 gap-3">
                      <LoaderIcon />
                      <span className="text-sm">Crafting your comment...</span>
                    </div>
                  ) : comment ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopy}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
                            copied 
                              ? 'bg-green-600 text-white' 
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          {copied ? <CheckIcon /> : <CopyIcon />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={handleGenerate}
                          className="flex-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-700 active:scale-[0.98]"
                        >
                          <RefreshIcon />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-500 gap-2">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                        <SparklesIcon />
                      </div>
                      <span className="text-sm">Enter a title to generate</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 tracking-tight">Dashboard</h2>
                <p className="text-zinc-400">Track your bot performance</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Posts Scanned', value: stats.totalPosts, color: 'bg-blue-500' },
                  { label: 'Comments', value: stats.totalComments, color: 'bg-indigo-500' },
                  { label: 'Total Karma', value: stats.totalKarma, color: 'bg-green-500' },
                  { label: 'Success Rate', value: `${successRate}%`, color: 'bg-amber-500' },
                ].map((stat, i) => (
                  <div 
                    key={stat.label}
                    className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:translate-y-[-2px] group"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 ${stat.color} rounded-full group-hover:animate-pulse`}></span>
                      <p className="text-sm text-zinc-400">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold tracking-tight">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subreddits */}
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-colors duration-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Top Subreddits
                </h3>
                <div className="space-y-3">
                  {stats.topSubreddits.map((sub, i) => (
                    <div 
                      key={sub.subreddit} 
                      className="flex items-center justify-between group"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <span className="text-sm group-hover:text-white transition-colors duration-200">r/{sub.subreddit}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${(sub.count / stats.topSubreddits[0].count) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-zinc-400 w-8 text-right tabular-nums">{sub.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors duration-300 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Recent Comments
                  </h3>
                </div>
                {data.recentComments.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <ChartIcon />
                    </div>
                    No comments yet
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {data.recentComments.map((c, i) => (
                      <div 
                        key={c.id} 
                        className="p-6 hover:bg-zinc-800/20 transition-colors duration-200"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.status === 'posted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            c.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {c.status}
                          </span>
                          {c.karma_score && c.karma_score > 0 && (
                            <span className="text-xs text-green-400 font-medium">+{c.karma_score}</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">{c.content}</p>
                        {c.created_at && (
                          <p className="text-xs text-zinc-500 mt-2">{new Date(c.created_at).toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-4 mt-auto bg-zinc-950/50">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-sm text-zinc-500">
          <span>Reddit Enhancer</span>
          <a 
            href="https://github.com/laraib-sidd/reddit-enhancer" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition-colors duration-200 flex items-center gap-1.5"
          >
            <GithubIcon />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
