import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  Flame,
  ArrowUp,
  MessageSquare,
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Search,
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
  category?: string
}

interface CommentAssistantProps {
  onGenerateComment: (post: RedditPost) => Promise<string>
}

export function CommentAssistant({ onGenerateComment }: CommentAssistantProps) {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null)
  const [generatedComment, setGeneratedComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<'all' | 'rising' | 'new'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Fetch posts from static JSON (populated by GitHub Action)
  const fetchPosts = async () => {
    setLoadingPosts(true)
    try {
      const response = await fetch('/reddit-enhancer/rising-posts.json')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setLastUpdated(data.generated_at)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.category === filter
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subreddit.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Generate comment
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

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedComment)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format time ago
  const timeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  // Get subreddit color
  const getSubredditColor = (subreddit: string) => {
    const colors: Record<string, string> = {
      'AskReddit': 'from-orange-500 to-red-500',
      'NoStupidQuestions': 'from-blue-500 to-cyan-500',
      'explainlikeimfive': 'from-green-500 to-emerald-500',
      'TrueOffMyChest': 'from-purple-500 to-pink-500',
      'unpopularopinion': 'from-yellow-500 to-orange-500',
      'LifeProTips': 'from-teal-500 to-green-500',
      'Showerthoughts': 'from-indigo-500 to-purple-500',
    }
    return colors[subreddit] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Comment Assistant</h1>
              <p className="text-white/70">Find trending posts & generate engaging comments</p>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2 text-white/80">
              <Flame className="h-4 w-4 text-orange-300" />
              <span className="text-sm">{posts.length} Hot Posts</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <TrendingUp className="h-4 w-4 text-green-300" />
              <span className="text-sm">7 Subreddits</span>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-xl bg-white/5 p-1">
          {(['all', 'rising', 'new'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'rising' && <Flame className="h-4 w-4" />}
              {f === 'new' && <Zap className="h-4 w-4" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <button
          onClick={fetchPosts}
          disabled={loadingPosts}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadingPosts ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Posts List */}
        <div className="lg:col-span-3 space-y-3">
          {loadingPosts ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm text-gray-400">Loading trending posts...</p>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Flame className="mb-3 h-12 w-12 text-gray-600" />
              <p className="text-gray-400">No posts found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPosts.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => handleGenerateComment(post)}
                  className={`group w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                    selectedPost?.id === post.id
                      ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                      : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getSubredditColor(post.subreddit)} text-white font-bold text-sm`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                        {post.title}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className={`rounded-lg bg-gradient-to-r ${getSubredditColor(post.subreddit)} bg-opacity-20 px-2 py-0.5 text-xs font-medium text-white/80`}>
                          r/{post.subreddit}
                        </span>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ArrowUp className="h-3.5 w-3.5" />
                            {post.score}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {post.num_comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(post.created_utc)}
                          </span>
                        </div>
                        
                        {post.growth_score && post.growth_score > 5 && (
                          <span className="flex items-center gap-1 rounded-lg bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400">
                            <Flame className="h-3 w-3" />
                            {post.growth_score}
                          </span>
                        )}
                      </div>
                      
                      {post.selftext && (
                        <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                          {post.selftext}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Generator Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2.5">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Generated Comment</h3>
                <p className="text-xs text-gray-500">AI-powered, human-like</p>
              </div>
            </div>

            {selectedPost ? (
              <div className="space-y-4">
                {/* Selected Post Preview */}
                <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Replying to:</p>
                  <p className="text-sm font-medium text-white/80 line-clamp-2">{selectedPost.title}</p>
                  <p className="text-xs text-gray-500 mt-1">r/{selectedPost.subreddit}</p>
                </div>

                {/* Generated Comment */}
                {loadingComment ? (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-400">Crafting your comment...</p>
                    </div>
                  </div>
                ) : generatedComment ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4 border border-purple-500/20">
                      <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                        {generatedComment}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleCopy}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          copied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
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
                        onClick={() => handleGenerateComment(selectedPost)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 border border-white/10 transition-all"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </button>
                    </div>
                    
                    <a
                      href={selectedPost.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all w-full"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Reddit
                    </a>
                  </div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-white/5 border border-dashed border-white/10">
                    <Sparkles className="mb-2 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-500">Click a post to generate</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-white/5 border border-dashed border-white/10">
                <div className="rounded-full bg-purple-500/10 p-4 mb-4">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-gray-400 font-medium">Select a post</p>
                <p className="text-sm text-gray-500 mt-1">Choose from the trending posts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  )
}
