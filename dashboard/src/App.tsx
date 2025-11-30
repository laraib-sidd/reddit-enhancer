import { useEffect, useState } from 'react'
import { fetchDashboardData, demoData, type DashboardData } from './lib/data'
import { generateComment } from './lib/ai'

type Tab = 'assistant' | 'dashboard'

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Reddit Enhancer</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('assistant')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'assistant' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Assistant
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Dashboard
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isDemo && <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">Demo</span>}
            {tab === 'dashboard' && (
              <button onClick={loadData} disabled={loading} className="text-sm text-zinc-400 hover:text-white">
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {tab === 'assistant' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Comment Assistant</h2>
              <p className="text-zinc-400">Generate human-like comments for Reddit posts</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Input */}
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h3 className="font-semibold mb-4">Post Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Reddit URL (optional)</label>
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://reddit.com/r/..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Post Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="What's the post about?"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={!title.trim() || generating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg"
                  >
                    {generating ? 'Generating...' : 'Generate Comment'}
                  </button>
                </div>
              </div>

              {/* Output */}
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h3 className="font-semibold mb-4">Generated Comment</h3>
                {generating ? (
                  <div className="h-40 flex items-center justify-center text-zinc-500">
                    Generating...
                  </div>
                ) : comment ? (
                  <div className="space-y-4">
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{comment}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${copied ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-zinc-500">
                    Enter a title to generate
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
              <p className="text-zinc-400">Track your bot performance</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <p className="text-sm text-zinc-400">Posts Scanned</p>
                <p className="text-2xl font-bold mt-1">{stats.totalPosts.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <p className="text-sm text-zinc-400">Comments</p>
                <p className="text-2xl font-bold mt-1">{stats.totalComments.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <p className="text-sm text-zinc-400">Total Karma</p>
                <p className="text-2xl font-bold mt-1">{stats.totalKarma.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <p className="text-sm text-zinc-400">Success Rate</p>
                <p className="text-2xl font-bold mt-1">{successRate}%</p>
              </div>
            </div>

            {/* Subreddits */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="font-semibold mb-4">Top Subreddits</h3>
              <div className="space-y-3">
                {stats.topSubreddits.map((sub) => (
                  <div key={sub.subreddit} className="flex items-center justify-between">
                    <span className="text-sm">r/{sub.subreddit}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(sub.count / stats.topSubreddits[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400 w-8">{sub.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h3 className="font-semibold">Recent Comments</h3>
              </div>
              {data.recentComments.length === 0 ? (
                <div className="p-6 text-center text-zinc-500">No comments yet</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {data.recentComments.map(c => (
                    <div key={c.id} className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.status === 'posted' ? 'bg-green-500/10 text-green-400' :
                          c.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {c.status}
                        </span>
                        {c.karma_score && c.karma_score > 0 && (
                          <span className="text-xs text-green-400">+{c.karma_score}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2">{c.content}</p>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 mt-auto">
        <div className="max-w-5xl mx-auto flex justify-between text-sm text-zinc-500">
          <span>Reddit Enhancer</span>
          <a href="https://github.com/laraib-sidd/reddit-enhancer" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
