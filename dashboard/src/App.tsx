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
      const result = await generateComment({
        title,
        subreddit: '',
        selftext: '',
        score: 0,
        num_comments: 0,
      })
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
  const avgKarma =
    typeof stats.avgKarma === 'number'
      ? stats.avgKarma
      : Number.isFinite(Number(stats.avgKarma))
        ? Number(stats.avgKarma)
        : 0
  const formattedGeneratedAt = data.generated_at ? new Date(data.generated_at).toLocaleString() : 'Not generated yet'
  const activityDays = stats.recentActivity ?? []
  const activityValues = activityDays.map((day) => day.comments ?? 0)
  const activityMax = activityValues.length ? Math.max(...activityValues) : 1
  const topSubreddits = stats.topSubreddits ?? []
  const topSubMax = topSubreddits.length ? topSubreddits[0].count : 1
  const hasUrl = Boolean(url.trim())

  const assistantHighlights = [
    { label: 'Success rate', value: `${successRate}%`, hint: 'Manual approvals' },
    { label: 'Avg karma', value: avgKarma ? avgKarma.toFixed(1) : '0.0', hint: 'Per posted comment' },
    { label: 'Post library', value: stats.totalPosts.toLocaleString(), hint: 'Posts analysed' },
  ]

  const heroStats = [
    { label: 'Posted comments', value: stats.postedComments },
    { label: 'Pending reviews', value: stats.pendingComments },
    { label: 'Rejected', value: stats.rejectedComments },
  ]

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-[160px]" />
        <div className="absolute top-24 -left-10 h-60 w-60 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #71717a 1px, transparent 0)' }} />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-lg font-semibold text-white shadow-[0_10px_40px_rgba(67,56,202,0.35)]">
                RE
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Command center</p>
                <p className="text-xl font-semibold">Reddit Enhancer</p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1 text-sm font-medium shadow-[0_10px_40px_rgba(15,23,42,0.4)]">
              {(['assistant', 'dashboard'] as Tab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 transition-all ${
                    tab === item
                      ? 'bg-slate-900 text-white shadow-[0_8px_30px_rgba(15,23,42,0.45)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {item === 'assistant' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z" />
                    </svg>
                  )}
                  <span className="capitalize">{item}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 text-sm text-white/70 md:flex-row md:items-center md:gap-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  isDemo ? 'bg-amber-400/10 text-amber-200' : 'bg-emerald-400/10 text-emerald-200'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {isDemo ? 'Demo data' : 'Live data'}
              </span>
              <p className="text-xs text-white/60">
                Last sync <span className="text-white">{formattedGeneratedAt}</span>
              </p>
              {tab === 'dashboard' && (
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 disabled:opacity-60"
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {loading ? 'Refreshing' : 'Refresh data'}
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
          {tab === 'assistant' ? (
            <>
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-purple-500/10 to-transparent px-6 py-7 shadow-[0_40px_120px_rgba(88,46,255,0.25)] backdrop-blur-xl md:px-10">
                <div className="absolute -right-16 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full bg-white/10 blur-[90px] md:block" />
                <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/70">Comment studio</p>
                    <h2 className="text-3xl font-semibold leading-tight text-white">
                      Human-sounding Reddit replies in seconds.
                    </h2>
                    <p className="text-sm text-white/70">
                      Paste a link or title, let the assistant craft a casual, empathetic answer that feels native to the
                      subreddit.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-white/80">
                      {['URL cleanup', 'Casual tone', 'Copy-ready'].map((chip) => (
                        <span key={chip} className="rounded-full bg-white/10 px-3 py-1">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid w-full gap-4 sm:grid-cols-2 md:max-w-md">
                    {heroStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.4)]"
                      >
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{item.label}</p>
                        <p className="mt-2 text-2xl font-semibold">{item.value.toLocaleString()}</p>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-white/50" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-white/60">Input</p>
                      <h3 className="text-lg font-semibold text-white">Post canvas</h3>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      Step 1
                    </span>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                        Reddit URL
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://reddit.com/r/..."
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                        Post title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What is the conversation about?"
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-xs text-white/70">
                      Coming soon: paste any Reddit URL and we auto-fetch the title & body even from share links.
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!title.trim() || generating}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(79,70,229,0.45)] transition hover:from-indigo-400 hover:to-purple-400 disabled:opacity-60"
                    >
                      {generating && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {generating ? 'Generating...' : 'Generate comment'}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-white/60">Output</p>
                      <h3 className="text-lg font-semibold text-white">Comment composer</h3>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      Step 2
                    </span>
                  </div>
                  {generating ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 text-white/60">
                      <svg className="h-8 w-8 animate-spin text-indigo-300" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Crafting a natural reply...
                    </div>
                  ) : comment ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/90">
                        {comment}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={handleCopy}
                          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                            copied
                              ? 'border-green-400/50 bg-green-500/20 text-green-100'
                              : 'border-white/15 bg-white/5 text-white hover:border-white/40'
                          }`}
                        >
                          {copied ? (
                            <>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M8 5h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" />
                                <path d="M16 3H8a2 2 0 00-2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Copy comment
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleGenerate}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/40"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 4v5h.6m14.8 2A8.001 8.001 0 004.6 9M4.6 9H9m11 11v-5h-.6m0 0a8.003 8.003 0 01-15.4-2m15.4 2H15" />
                          </svg>
                          Regenerate
                        </button>
                      </div>
                      {hasUrl && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-indigo-200 transition hover:text-white"
                        >
                          Open post on Reddit
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 text-white/60">
                      <svg className="h-10 w-10 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 12h.01M12 12h.01M16 12h.01" strokeLinecap="round" />
                        <path
                          d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Enter a title to generate a comment.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {assistantHighlights.map((highlight) => (
                  <div
                    key={highlight.label}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                  >
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">{highlight.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{highlight.value}</p>
                    <p className="text-xs text-white/50">{highlight.hint}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-purple-500/20 to-slate-900/70 p-8 shadow-[0_50px_150px_rgba(67,56,202,0.4)]">
                  <div className="absolute inset-y-0 right-0 hidden w-48 bg-white/5 blur-[90px] md:block" />
                  <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex flex-col gap-2 text-white">
                      <p className="text-xs uppercase tracking-[0.4em] text-white/70">Operations overview</p>
                      <h2 className="text-3xl font-semibold">Live pulse of your Reddit automation</h2>
                      <p className="text-sm text-white/70">
                        Monitor success rate, karma impact, and ingestion cadence at a glance.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        { label: 'Success rate', value: `${successRate}%`, note: 'Approvals' },
                        { label: 'Total karma', value: stats.totalKarma.toLocaleString(), note: 'Earned so far' },
                        { label: 'Avg karma', value: avgKarma ? avgKarma.toFixed(1) : '0.0', note: 'Per post' },
                      ].map((card) => (
                        <div key={card.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.4em] text-white/60">{card.label}</p>
                          <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                          <p className="text-xs text-white/60">{card.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Data snapshot</h3>
                      <p className="text-xs text-white/60">Last refresh • {formattedGeneratedAt}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isDemo ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
                      }`}
                    >
                      {isDemo ? 'Demo mode' : 'Production'}
                    </span>
                  </div>
                  <div className="mt-6 space-y-4 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span>Comments queued</span>
                      <span className="text-white">{stats.pendingComments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Posts analysed</span>
                      <span className="text-white">{stats.totalPosts.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rejected</span>
                      <span className="text-white/80">{stats.rejectedComments.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-60"
                  >
                    {loading ? 'Syncing...' : 'Sync now'}
                  </button>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Posts scanned', value: stats.totalPosts.toLocaleString(), accent: 'from-blue-500/40 via-blue-400/20' },
                  { label: 'Comments generated', value: stats.totalComments.toLocaleString(), accent: 'from-indigo-500/40 via-indigo-400/20' },
                  { label: 'Posted', value: stats.postedComments.toLocaleString(), accent: 'from-emerald-500/40 via-emerald-400/20' },
                  { label: 'Rejected', value: stats.rejectedComments.toLocaleString(), accent: 'from-rose-500/40 via-rose-400/20' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.accent} to-slate-900/40 p-4 text-white shadow-[0_20px_70px_rgba(2,6,23,0.45)]`}
                  >
                    <p className="text-xs uppercase tracking-[0.4em] text-white/70">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Activity momentum</h3>
                      <p className="text-xs text-white/60">Comments over the last 7 days</p>
                    </div>
                    <p className="text-xs text-white/60">Peak {activityMax} comments</p>
                  </div>
                  {activityDays.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/60">
                      No activity yet.
                    </div>
                  ) : (
                    <div className="mt-8 flex h-40 items-end gap-3">
                      {activityDays.map((day) => {
                        const comments = day.comments ?? 0
                        const ratio = Math.max((comments / activityMax) * 100, 4)
                        return (
                          <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                            <div className="flex h-full w-full items-end rounded-2xl bg-white/5">
                              <div
                                className="w-full rounded-2xl bg-gradient-to-t from-indigo-500 via-purple-500 to-cyan-400"
                                style={{ height: `${ratio}%` }}
                              />
                            </div>
                            <p className="text-xs text-white/60">{day.date.slice(5)}</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{comments} c</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
                  <h3 className="text-lg font-semibold text-white">Top subreddits</h3>
                  <p className="text-xs text-white/60">Where the bot performs best</p>
                  <div className="mt-6 space-y-4">
                    {topSubreddits.length === 0 ? (
                      <p className="text-sm text-white/50">No subreddit data yet.</p>
                    ) : (
                      topSubreddits.map((sub) => (
                        <div key={sub.subreddit}>
                          <div className="flex items-center justify-between text-sm text-white">
                            <span>r/{sub.subreddit}</span>
                            <span className="text-white/70">{sub.count}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 animate-bar"
                              style={{ width: `${Math.max((sub.count / topSubMax) * 100, 6)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_40px_120px_rgba(2,6,23,0.6)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recent comments</h3>
                    <p className="text-xs text-white/60">Newest AI drafts and their status</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">Live</span>
                </div>
                {data.recentComments.length === 0 ? (
                  <div className="p-8 text-center text-white/60">No comments yet.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.recentComments.map((c) => (
                      <div key={c.id} className="px-6 py-5 transition hover:bg-white/5">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              c.status === 'posted'
                                ? 'bg-emerald-500/15 text-emerald-200'
                                : c.status === 'pending'
                                  ? 'bg-amber-500/15 text-amber-200'
                                  : 'bg-rose-500/15 text-rose-200'
                            }`}
                          >
                            {c.status}
                          </span>
                          {c.karma_score && c.karma_score > 0 && (
                            <span className="text-xs text-emerald-200">+{c.karma_score}</span>
                          )}
                        </div>
                        <p className="text-sm text-white/80">{c.content}</p>
                        {c.created_at && (
                          <p className="mt-2 text-xs text-white/50">{new Date(c.created_at).toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        <footer className="border-t border-white/5 px-6 py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Reddit Enhancer</span>
            <a
              href="https://github.com/laraib-sidd/reddit-enhancer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 transition hover:text-white"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
