import { useState } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  Flame,
  Clock,
  MessageSquare,
  ArrowUp,
  Link as LinkIcon
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
  growth_score?: number
}

interface CommentAssistantProps {
  onGenerateComment: (post: RedditPost) => Promise<string>
}

// Target subreddits for rising posts
const TARGET_SUBREDDITS = ['AskReddit', 'NoStupidQuestions', 'explainlikeimfive']

export function CommentAssistant({ onGenerateComment }: CommentAssistantProps) {
  const [activeTab, setActiveTab] = useState<'rising' | 'url'>('rising')
  const [risingPosts, setRisingPosts] = useState<RedditPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null)
  const [generatedComment, setGeneratedComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch rising posts from subreddits
  const fetchRisingPosts = async () => {
    setLoadingPosts(true)
    try {
      const allPosts: RedditPost[] = []
      
      for (const subreddit of TARGET_SUBREDDITS) {
        try {
          // Using Reddit's public JSON endpoint - no auth needed!
          const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/rising.json?limit=10`,
            { headers: { 'User-Agent': 'RedditEnhancer/1.0' } }
          )
          
          if (response.ok) {
            const data = await response.json()
            const posts = data.data.children.map((child: any) => {
              const post = child.data
              const ageMinutes = (Date.now() / 1000 - post.created_utc) / 60
              // Growth score: higher score in less time = more likely to blow up
              const growthScore = ageMinutes > 0 ? (post.score / ageMinutes) * 100 : 0
              
              return {
                id: post.id,
                title: post.title,
                subreddit: post.subreddit,
                score: post.score,
                num_comments: post.num_comments,
                created_utc: post.created_utc,
                permalink: post.permalink,
                selftext: post.selftext || '',
                url: `https://reddit.com${post.permalink}`,
                growth_score: Math.round(growthScore * 10) / 10
              }
            })
            allPosts.push(...posts)
          }
        } catch (e) {
          console.error(`Failed to fetch from r/${subreddit}:`, e)
        }
      }
      
      // Sort by growth score (likely to blow up)
      allPosts.sort((a, b) => (b.growth_score || 0) - (a.growth_score || 0))
      setRisingPosts(allPosts.slice(0, 15))
    } catch (error) {
      console.error('Failed to fetch rising posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  // Fetch post from URL
  const fetchPostFromUrl = async (url: string) => {
    try {
      // Convert URL to JSON endpoint
      let jsonUrl = url.trim()
      if (jsonUrl.includes('?')) {
        jsonUrl = jsonUrl.split('?')[0]
      }
      if (!jsonUrl.endsWith('.json')) {
        jsonUrl = jsonUrl + '.json'
      }
      
      const response = await fetch(jsonUrl)
      if (!response.ok) throw new Error('Failed to fetch post')
      
      const data = await response.json()
      const post = data[0].data.children[0].data
      
      return {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        permalink: post.permalink,
        selftext: post.selftext || '',
        url: `https://reddit.com${post.permalink}`,
      } as RedditPost
    } catch (error) {
      console.error('Failed to fetch post:', error)
      throw error
    }
  }

  // Generate comment for selected post
  const handleGenerateComment = async (post: RedditPost) => {
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

  // Handle URL submit
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    
    setLoadingComment(true)
    try {
      const post = await fetchPostFromUrl(urlInput)
      await handleGenerateComment(post)
    } catch (error) {
      console.error('Error:', error)
      setGeneratedComment('Failed to fetch post. Make sure the URL is a valid Reddit post.')
      setLoadingComment(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedComment)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Open Reddit post
  const openInReddit = () => {
    if (selectedPost) {
      window.open(selectedPost.url, '_blank')
    }
  }

  // Format time ago
  const timeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/20 p-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Comment Assistant</h2>
            <p className="text-sm text-gray-500">Find trending posts & generate comments</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('rising')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'rising'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Flame className="h-4 w-4" />
          Rising Posts
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          Paste URL
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel - Post Selection */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-4">
          {activeTab === 'rising' ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-medium">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  Posts Likely to Blow Up
                </h3>
                <button
                  onClick={fetchRisingPosts}
                  disabled={loadingPosts}
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingPosts ? 'animate-spin' : ''}`} />
                  {risingPosts.length === 0 ? 'Load Posts' : 'Refresh'}
                </button>
              </div>

              {risingPosts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                  <Flame className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Click "Load Posts" to find trending posts</p>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
                  {risingPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handleGenerateComment(post)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedPost?.id === post.id
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <p className="mb-2 line-clamp-2 text-sm font-medium">{post.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="rounded bg-white/10 px-1.5 py-0.5">r/{post.subreddit}</span>
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {post.score}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.num_comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(post.created_utc)}
                        </span>
                        {post.growth_score && post.growth_score > 1 && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <Flame className="h-3 w-3" />
                            {post.growth_score}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="mb-4 flex items-center gap-2 font-medium">
                <LinkIcon className="h-4 w-4 text-blue-400" />
                Enter Reddit Post URL
              </h3>
              <div className="space-y-4">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://reddit.com/r/AskReddit/comments/..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || loadingComment}
                  className="w-full rounded-lg bg-purple-500 px-4 py-3 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                >
                  {loadingComment ? 'Generating...' : 'Generate Comment'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Generated Comment */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-4">
          <h3 className="mb-4 flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Generated Comment
          </h3>

          {selectedPost && (
            <div className="mb-4 rounded-lg border border-white/5 bg-white/5 p-3">
              <p className="mb-1 text-xs text-gray-500">Replying to:</p>
              <p className="line-clamp-2 text-sm">{selectedPost.title}</p>
              <p className="mt-1 text-xs text-gray-500">r/{selectedPost.subreddit}</p>
            </div>
          )}

          {loadingComment ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Generating comment...</span>
              </div>
            </div>
          ) : generatedComment ? (
            <>
              <div className="mb-4 min-h-32 rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{generatedComment}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => handleGenerateComment(selectedPost!)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
                <button
                  onClick={openInReddit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-600"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Reddit
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-gray-500">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Select a post to generate a comment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

