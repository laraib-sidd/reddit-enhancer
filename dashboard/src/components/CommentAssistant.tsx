import { useState } from 'react'
import { 
  Sparkles, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Link,
  FileText,
  Zap,
  MessageSquare,
  ArrowRight
} from 'lucide-react'

interface Post {
  title: string
  subreddit: string
  selftext: string
  score: number
  num_comments: number
}

interface Props {
  onGenerate: (post: Post) => Promise<string>
}

export function CommentAssistant({ onGenerate }: Props) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [post, setPost] = useState<Post | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchPost = async (inputUrl: string) => {
    if (!inputUrl.includes('reddit.com/r/')) return
    
    setFetching(true)
    setError('')
    
    try {
      const clean = inputUrl.split('?')[0].replace(/\/+$/, '') + '.json'
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(clean)}`)
      const json = await res.json()
      const data = JSON.parse(json.contents)
      const p = data[0]?.data?.children?.[0]?.data
      
      if (p) {
        const newPost: Post = {
          title: p.title,
          subreddit: p.subreddit,
          selftext: p.selftext || '',
          score: p.score,
          num_comments: p.num_comments
        }
        setPost(newPost)
        setTitle(p.title)
      }
    } catch {
      setError('Could not fetch post automatically. Please enter the title manually.')
    } finally {
      setFetching(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value.length > 30 && value.includes('reddit.com')) {
      fetchPost(value)
    }
  }

  const handleGenerate = async () => {
    if (!title.trim()) return
    
    setLoading(true)
    setComment('')
    
    try {
      const p = post || { title, subreddit: '', selftext: '', score: 0, num_comments: 0 }
      const result = await onGenerate(p)
      setComment(result)
    } catch {
      setComment('Failed to generate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(comment)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Comment Generator</h2>
              <p className="text-white/80">Create engaging, human-like comments instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/90">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI-Powered
            </span>
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Human Tone
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Instant Results
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Link className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Post Details</h3>
              <p className="text-sm text-[var(--text-secondary)]">Enter a Reddit post URL or title</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Reddit URL</label>
              <input
                type="url"
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://reddit.com/r/AskReddit/comments/..."
                className="input"
              />
            </div>

            {fetching && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fetching post details...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Post Title {post && <span className="text-[var(--text-secondary)] font-normal">(auto-filled)</span>}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What's the post about?"
                className="input"
              />
            </div>

            {post && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-2">
                  <Check className="w-4 h-4" />
                  Post loaded successfully
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  r/{post.subreddit} • {post.score.toLocaleString()} pts • {post.num_comments.toLocaleString()} comments
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!title.trim() || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Comment
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Generated Comment</h3>
              <p className="text-sm text-[var(--text-secondary)]">AI-crafted response ready to use</p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto mb-4" />
                <p className="text-sm text-[var(--text-secondary)]">Crafting your comment...</p>
              </div>
            </div>
          ) : comment ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                  {comment}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>

              {post && (
                <button
                  onClick={() => window.open(`https://reddit.com/r/${post.subreddit}`, '_blank')}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Reddit
                </button>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[var(--text-secondary)] opacity-50" />
                </div>
                <p className="font-medium text-[var(--text)]">Ready to Generate</p>
                <p className="text-sm text-[var(--text-secondary)]">Enter a post URL or title to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-[var(--text)]">Pro Tips</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg)]">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text)]">Comment early</span> on rising posts for maximum visibility and karma
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg)]">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text)]">Edit slightly</span> after copying to add your personal touch
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg)]">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text)]">Regenerate</span> multiple times if the first comment doesn't fit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
