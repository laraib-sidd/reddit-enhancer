import { useState } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  Flame,
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

// Subreddits to browse for good commenting opportunities
const BROWSE_SUBREDDITS = [
  { name: 'AskReddit', description: 'Questions & discussions' },
  { name: 'NoStupidQuestions', description: 'Curious questions' },
  { name: 'explainlikeimfive', description: 'Simple explanations' },
  { name: 'TrueOffMyChest', description: 'Personal stories' },
  { name: 'unpopularopinion', description: 'Hot takes' },
]

export function CommentAssistant({ onGenerateComment }: CommentAssistantProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'url'>('url')
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null)
  const [generatedComment, setGeneratedComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [contentInput, setContentInput] = useState('')

  // Create post object from user inputs
  const createPostFromInputs = (): RedditPost => {
    // Extract subreddit from URL
    const match = urlInput.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/)
    const subreddit = match?.[1] || 'unknown'
    const postId = match?.[2] || 'custom'
    
    // Clean the URL (remove tracking params)
    let cleanUrl = urlInput.trim()
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0]
    }
    
    return {
      id: postId,
      title: titleInput.trim() || 'Untitled Post',
      subreddit,
      score: 0,
      num_comments: 0,
      created_utc: Date.now() / 1000,
      permalink: cleanUrl.replace('https://reddit.com', '').replace('https://www.reddit.com', ''),
      selftext: contentInput.trim(),
      url: cleanUrl.startsWith('http') ? cleanUrl : `https://reddit.com${cleanUrl}`,
    }
  }

  // Generate comment for the post
  const handleGenerateComment = async () => {
    if (!urlInput.trim() || !titleInput.trim()) return
    
    const post = createPostFromInputs()
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

  // Open Reddit post
  const openInReddit = () => {
    if (selectedPost) {
      window.open(selectedPost.url, '_blank')
    }
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
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          Generate Comment
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'browse'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Flame className="h-4 w-4" />
          Browse Reddit
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel - Input or Browse */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-4">
          {activeTab === 'url' ? (
            <>
              <h3 className="mb-4 flex items-center gap-2 font-medium">
                <LinkIcon className="h-4 w-4 text-blue-400" />
                Enter Post Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Reddit URL *</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://reddit.com/r/AskReddit/comments/..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Post Title * (copy from Reddit)</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="What's the post asking/about?"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Post Content (optional - for context)</label>
                  <textarea
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    placeholder="Paste the post body text if it has one..."
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleGenerateComment}
                  disabled={!urlInput.trim() || !titleInput.trim() || loadingComment}
                  className="w-full rounded-lg bg-purple-500 px-4 py-3 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                >
                  {loadingComment ? 'Generating...' : 'Generate Comment'}
                </button>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <AlertCircle className="h-3 w-3" />
                  Copy URL and title from Reddit for best results
                </p>
              </div>
            </>
          ) : (
            <>
              <h3 className="mb-4 flex items-center gap-2 font-medium">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Browse Hot Posts on Reddit
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                Click a subreddit to open Reddit in a new tab. Find a post you like, copy the URL and title, then come back here.
              </p>
              <div className="space-y-2">
                {BROWSE_SUBREDDITS.map((sub) => (
                  <div key={sub.name} className="flex gap-2">
                    <a
                      href={`https://www.reddit.com/r/${sub.name}/hot/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 text-left transition-colors hover:border-orange-500/30 hover:bg-orange-500/10"
                    >
                      <div>
                        <p className="font-medium">r/{sub.name}</p>
                        <p className="text-xs text-gray-500">{sub.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame className="h-4 w-4" />
                        Hot
                      </div>
                    </a>
                    <a
                      href={`https://www.reddit.com/r/${sub.name}/rising/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-gray-400 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Rising
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-400">
                  💡 <strong>Tip:</strong> Look for posts with few comments but growing upvotes - these are the best to comment on early!
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
                  onClick={handleGenerateComment}
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
              <Sparkles className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Enter post details and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

