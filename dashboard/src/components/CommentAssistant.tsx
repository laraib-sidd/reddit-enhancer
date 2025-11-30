import { useState } from 'react'
import { 
  Sparkles, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  MessageSquare,
  Wand2
} from 'lucide-react'

interface RedditPost {
  id: string
  title: string
  subreddit: string
  score: number
  num_comments: number
  created_utc: number
  permalink: string
  selftext: string
  url: string
}

interface CommentAssistantProps {
  onGenerateComment: (post: RedditPost) => Promise<string>
}

const CORS_PROXY = 'https://api.allorigins.win/get?url='

export function CommentAssistant({ onGenerateComment }: CommentAssistantProps) {
  const [urlInput, setUrlInput] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null)
  const [generatedComment, setGeneratedComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [fetchingPost, setFetchingPost] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchPostFromUrl = async (url: string) => {
    setFetchingPost(true)
    setFetchError('')
    setSelectedPost(null)
    
    try {
      let cleanUrl = url.trim().split('?')[0].replace(/\/+$/, '')
      if (!cleanUrl.includes('reddit.com/r/')) throw new Error('Invalid Reddit URL')
      
      const jsonUrl = cleanUrl + '.json'
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(jsonUrl)}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const proxyData = await response.json()
      const data = JSON.parse(proxyData.contents)
      const postData = data[0]?.data?.children?.[0]?.data
      if (!postData) throw new Error('Could not parse post data')
      
      const post: RedditPost = {
        id: postData.id,
        title: postData.title,
        subreddit: postData.subreddit,
        score: postData.score,
        num_comments: postData.num_comments,
        created_utc: postData.created_utc,
        permalink: postData.permalink,
        selftext: postData.selftext || '',
        url: `https://www.reddit.com${postData.permalink}`,
      }
      
      setSelectedPost(post)
      setTitleInput(post.title)
    } catch {
      setFetchError('Could not auto-fetch. Enter the title manually.')
    } finally {
      setFetchingPost(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    setFetchError('')
    if (/reddit\.com\/r\/\w+\/comments\/\w+/.test(url) && url.length > 30) {
      fetchPostFromUrl(url)
    }
  }

  const handleGenerateComment = async () => {
    if (!titleInput.trim()) return
    
    const post = selectedPost || createManualPost()
    setSelectedPost(post)
    setLoadingComment(true)
    setGeneratedComment('')
    
    try {
      const comment = await onGenerateComment(post)
      setGeneratedComment(comment)
    } catch {
      setGeneratedComment('Failed to generate comment. Please try again.')
    } finally {
      setLoadingComment(false)
    }
  }

  const createManualPost = (): RedditPost => {
    const match = urlInput.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/)
    const subreddit = match?.[1] || 'unknown'
    const postId = match?.[2] || 'manual'
    let cleanUrl = urlInput.split('?')[0].replace(/\/+$/, '')
    
    return {
      id: postId,
      title: titleInput.trim(),
      subreddit,
      score: 0,
      num_comments: 0,
      created_utc: Date.now() / 1000,
      permalink: cleanUrl.replace('https://reddit.com', '').replace('https://www.reddit.com', ''),
      selftext: '',
      url: cleanUrl.startsWith('http') ? cleanUrl : `https://reddit.com${cleanUrl}`,
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedComment)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 p-8 lg:p-10">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Comment Assistant</h1>
                <p className="text-white/70 text-sm">Generate human-like comments with AI</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-300" />
                AI-Powered
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-300" />
                Natural Tone
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-300" />
                Instant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Enter Post Details</h2>
              <p className="text-xs text-zinc-500">Paste a URL or enter manually</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Reddit Post URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://reddit.com/r/AskReddit/comments/..."
                className="input"
              />
            </div>

            {fetchingPost && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fetching post details...
              </div>
            )}

            {fetchError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {fetchError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Post Title {selectedPost ? '(auto-filled)' : '*'}
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="What's the post about?"
                className="input"
              />
            </div>

            {selectedPost && !fetchingPost && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Post loaded
                </div>
                <p className="text-sm text-white font-medium line-clamp-1">{selectedPost.title}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800">r/{selectedPost.subreddit}</span>
                  <span>⬆ {selectedPost.score}</span>
                  <span>💬 {selectedPost.num_comments}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateComment}
              disabled={!titleInput.trim() || loadingComment || fetchingPost}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loadingComment ? (
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

        {/* Output */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Generated Comment</h2>
              <p className="text-xs text-zinc-500">AI-crafted response</p>
            </div>
          </div>

          {loadingComment ? (
            <div className="flex flex-col items-center justify-center h-56 gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-zinc-500">Crafting your comment...</p>
            </div>
          ) : generatedComment ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {generatedComment}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'btn-secondary'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleGenerateComment} className="btn-secondary flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
              
              {selectedPost && (
                <button
                  onClick={() => window.open(selectedPost.url, '_blank')}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Reddit
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-zinc-500">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Ready to Generate</p>
                <p className="text-xs text-zinc-500">Enter a post URL or title</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Pro Tips</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <p className="text-xs text-zinc-400">
              <span className="text-white font-medium">Comment early</span> on rising posts for maximum visibility.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <p className="text-xs text-zinc-400">
              <span className="text-white font-medium">Edit slightly</span> after copying to add your touch.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <p className="text-xs text-zinc-400">
              <span className="text-white font-medium">Regenerate</span> if the first comment doesn't fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
