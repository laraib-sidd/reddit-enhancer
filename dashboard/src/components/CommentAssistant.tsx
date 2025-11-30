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
  MessageSquare
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

// CORS proxy for fetching Reddit data
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

  // Fetch post details from Reddit URL
  const fetchPostFromUrl = async (url: string) => {
    setFetchingPost(true)
    setFetchError('')
    setSelectedPost(null)
    
    try {
      let cleanUrl = url.trim().split('?')[0].replace(/\/+$/, '')
      
      if (!cleanUrl.includes('reddit.com/r/')) {
        throw new Error('Invalid Reddit URL')
      }
      
      const jsonUrl = cleanUrl + '.json'
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(jsonUrl)}`
      
      const response = await fetch(proxyUrl)
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
    } catch (error) {
      console.error('Failed to fetch post:', error)
      setFetchError('Could not auto-fetch. Enter the title manually below.')
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
    } catch (error) {
      console.error('Failed to generate comment:', error)
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

  const openInReddit = () => {
    if (selectedPost) {
      window.open(selectedPost.url, '_blank')
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-8 md:p-12">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm animate-float">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Comment Assistant</h1>
              <p className="text-white/70 mt-1">Generate human-like comments for any Reddit post</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-300" />
              <span>Human-like Tone</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-300" />
              <span>Instant Generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2.5 border border-blue-500/20">
              <LinkIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Enter Post Details</h2>
              <p className="text-sm text-slate-500">Paste a Reddit URL or enter manually</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm text-slate-500 mb-2">Reddit Post URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://reddit.com/r/AskReddit/comments/..."
                className="input"
              />
            </div>

            {/* Fetching State */}
            {fetchingPost && (
              <div className="flex items-center gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                <span className="text-sm text-blue-400">Fetching post details...</span>
              </div>
            )}

            {/* Fetch Error / Manual Input */}
            {fetchError && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span className="text-sm text-amber-400">{fetchError}</span>
              </div>
            )}

            {/* Title Input */}
            <div>
              <label className="block text-sm text-slate-500 mb-2">
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

            {/* Post Preview */}
            {selectedPost && !fetchingPost && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Post loaded successfully</span>
                </div>
                <p className="text-sm font-medium text-white line-clamp-2">{selectedPost.title}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="rounded bg-white/10 px-2 py-0.5">r/{selectedPost.subreddit}</span>
                  <span>↑ {selectedPost.score}</span>
                  <span>💬 {selectedPost.num_comments}</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateComment}
              disabled={!titleInput.trim() || loadingComment || fetchingPost}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loadingComment ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Comment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/20 p-2.5 border border-purple-500/20">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Generated Comment</h2>
              <p className="text-sm text-slate-500">AI-crafted, human-like response</p>
            </div>
          </div>

          {loadingComment ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-purple-400" />
              </div>
              <p className="text-slate-500">Crafting your comment...</p>
            </div>
          ) : generatedComment ? (
            <div className="space-y-4">
              {/* Comment Display */}
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-5">
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                  {generatedComment}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'btn-secondary'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleGenerateComment}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>
              
              {selectedPost && (
                <button
                  onClick={openInReddit}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Post in Reddit
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
              <div className="rounded-full bg-purple-500/10 p-6 border border-purple-500/20">
                <Sparkles className="h-10 w-10 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Ready to Generate</p>
                <p className="text-sm mt-1">Enter a post URL or title to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-yellow-400" />
          Pro Tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">
              <span className="font-medium text-white">Comment early</span> on rising posts for maximum visibility and karma.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">
              <span className="font-medium text-white">Edit slightly</span> after copying to add your personal touch.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">
              <span className="font-medium text-white">Regenerate</span> if the first comment doesn't feel right.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
