import { MessageSquare, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react'

interface Comment {
  id: string
  content: string
  status: string
  karma_score: number | null
  created_at: string | null
}

interface RecentCommentsProps {
  comments: Comment[]
}

const statusConfig = {
  posted: {
    icon: CheckCircle2,
    label: 'Posted',
    className: 'badge-success'
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'badge-warning'
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: 'bg-red-500/15 text-red-400 border border-red-500/20'
  }
}

export function RecentComments({ comments }: RecentCommentsProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Comments</h3>
          <p className="text-xs text-zinc-500">Latest generated comments</p>
        </div>
      </div>
      
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No comments yet</p>
          <p className="text-xs text-zinc-600">Generated comments will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const status = statusConfig[comment.status as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = status.icon
            
            return (
              <div 
                key={comment.id} 
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className={`badge ${status.className}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                  
                  {comment.karma_score !== null && comment.karma_score > 0 && (
                    <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{comment.karma_score}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">
                  {comment.content}
                </p>
                
                {comment.created_at && (
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
