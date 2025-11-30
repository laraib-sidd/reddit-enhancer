import { useState } from 'react'
import { Sparkles, Copy, ExternalLink, RefreshCw, Check, AlertCircle } from 'lucide-react'

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
      setError('Could not fetch post. Enter title manually.')
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
      setComment('Failed to generate. Try again.')
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
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Comment Assistant</h1>
            <p className="text-sm text-white/70">Generate human-like comments with AI</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 space-y-4">
          <h2 className="text-sm font-medium text-white">Post Details</h2>
          
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Reddit URL</label>
            <input
              type="url"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://reddit.com/r/..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {fetching && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Fetching post...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">
              Post Title {post ? '(auto-filled)' : '*'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's the post about?"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {post && (
            <div className="bg-neutral-800/50 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Check className="w-3 h-3" />
                Post loaded
              </div>
              <p className="text-neutral-400">
                r/{post.subreddit} • {post.score} pts • {post.num_comments} comments
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!title.trim() || loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
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
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 space-y-4">
          <h2 className="text-sm font-medium text-white">Generated Comment</h2>

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Generating...</p>
              </div>
            </div>
          ) : comment ? (
            <>
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">{comment}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
              {post && (
                <button
                  onClick={() => window.open(`https://reddit.com/r/${post.subreddit}`, '_blank')}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Reddit
                </button>
              )}
            </>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-neutral-500" />
                </div>
                <p className="text-sm text-neutral-400">Enter a post URL or title</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
        <h3 className="text-sm font-medium text-white mb-3">Tips</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-neutral-400">
          <p><span className="text-white">Comment early</span> on rising posts for max visibility</p>
          <p><span className="text-white">Edit slightly</span> to add your personal touch</p>
          <p><span className="text-white">Regenerate</span> if the comment doesn't feel right</p>
        </div>
      </div>
    </div>
  )
}
