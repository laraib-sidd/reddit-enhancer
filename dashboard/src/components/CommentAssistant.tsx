import { useState, useEffect } from 'react'
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
  Link as LinkIcon,
  AlertCircle
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

// Demo posts for when Reddit API can't be accessed
// These are examples of the types of posts the assistant can help with
const DEMO_POSTS: RedditPost[] = [
  {
    id: 'demo1',
    title: "What's something that's considered normal now but would've been insane 20 years ago?",
    subreddit: 'AskReddit',
    score: 847,
    num_comments: 234,
    created_utc: Date.now() / 1000 - 3600, // 1 hour ago
    permalink: '/r/AskReddit/comments/demo1/',
    selftext: '',
    url: 'https://reddit.com/r/AskReddit/comments/demo1/',
    growth_score: 14.1
  },
  {
    id: 'demo2',
    title: "Why do programmers make so much money compared to other professions?",
    subreddit: 'NoStupidQuestions',
    score: 523,
    num_comments: 189,
    created_utc: Date.now() / 1000 - 7200, // 2 hours ago
    permalink: '/r/NoStupidQuestions/comments/demo2/',
    selftext: "I've always wondered this. Like, they just type on computers right? Why do tech companies pay them 150k+ when teachers and nurses make way less?",
    url: 'https://reddit.com/r/NoStupidQuestions/comments/demo2/',
    growth_score: 8.7
  },
  {
    id: 'demo3',
    title: "ELI5: Why does time seem to go faster as you get older?",
    subreddit: 'explainlikeimfive',
    score: 312,
    num_comments: 87,
    created_utc: Date.now() / 1000 - 5400, // 1.5 hours ago
    permalink: '/r/explainlikeimfive/comments/demo3/',
    selftext: "When I was a kid, summer vacation felt like forever. Now a whole year goes by in what feels like a month.",
    url: 'https://reddit.com/r/explainlikeimfive/comments/demo3/',
    growth_score: 6.9
  },
  {
    id: 'demo4',
    title: "What's a skill that took you way longer to learn than it should have?",
    subreddit: 'AskReddit',
    score: 156,
    num_comments: 42,
    created_utc: Date.now() / 1000 - 1800, // 30 min ago
    permalink: '/r/AskReddit/comments/demo4/',
    selftext: '',
    url: 'https://reddit.com/r/AskReddit/comments/demo4/',
    growth_score: 17.3
  },
  {
    id: 'demo5',
    title: "Why do people say 'sleep on it' when making decisions? Does it actually help?",
    subreddit: 'NoStupidQuestions',
    score: 89,
    num_comments: 28,
    created_utc: Date.now() / 1000 - 2700, // 45 min ago
    permalink: '/r/NoStupidQuestions/comments/demo5/',
    selftext: '',
    url: 'https://reddit.com/r/NoStupidQuestions/comments/demo5/',
    growth_score: 5.9
  }
]

export function CommentAssistant({ onGenerateComment }: CommentAssistantProps) {
  const [activeTab, setActiveTab] = useState<'rising' | 'url'>('rising')
  const [risingPosts, setRisingPosts] = useState<RedditPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null)
  const [generatedComment, setGeneratedComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [customTitle, setCustomTitle] = useState('')

  // Load posts on mount
  useEffect(() => {
    fetchRisingPosts()
  }, [])

  // Load demo posts (in production, these would come from a GitHub Action)
  const fetchRisingPosts = async () => {
    setLoadingPosts(true)
    try {
      // Try to fetch from static data file first
      const response = await fetch('/reddit-enhancer/rising-posts.json')
      if (response.ok) {
        const posts = await response.json()
        setRisingPosts(posts)
      } else {
        // Fall back to demo posts
        setRisingPosts(DEMO_POSTS)
      }
    } catch {
      // Use demo posts if fetch fails
      setRisingPosts(DEMO_POSTS)
    } finally {
      setLoadingPosts(false)
    }
  }

  // Parse post from URL input (creates a post object from user input)
  const parsePostFromUrl = (url: string): RedditPost => {
    // Extract subreddit and post ID from URL
    const match = url.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/)
    const subreddit = match?.[1] || 'unknown'
    const postId = match?.[2] || 'custom'
    
    return {
      id: postId,
      title: 'Custom Post', // User will see this is a custom URL
      subreddit,
      score: 0,
      num_comments: 0,
      created_utc: Date.now() / 1000,
      permalink: url.replace('https://reddit.com', '').replace('https://www.reddit.com', ''),
      selftext: '',
      url: url.startsWith('http') ? url : `https://reddit.com${url}`,
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
    
    // Parse the URL to create a post object
    const post = parsePostFromUrl(urlInput)
    // Use custom title if provided
    if (customTitle.trim()) {
      post.title = customTitle.trim()
    }
    await handleGenerateComment(post)
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
                  Refresh
                </button>
              </div>

              {loadingPosts ? (
                <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                  <RefreshCw className="mb-2 h-8 w-8 animate-spin opacity-50" />
                  <p className="text-sm">Loading rising posts...</p>
                </div>
              ) : risingPosts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                  <Flame className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No posts available</p>
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
                Enter Post Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Reddit URL</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://reddit.com/r/AskReddit/comments/..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Post Title (for better comment generation)</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="What's the post about?"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || loadingComment}
                  className="w-full rounded-lg bg-purple-500 px-4 py-3 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                >
                  {loadingComment ? 'Generating...' : 'Generate Comment'}
                </button>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <AlertCircle className="h-3 w-3" />
                  Paste the title for best results (can't fetch due to CORS)
                </p>
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

