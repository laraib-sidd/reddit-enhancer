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
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Posted'
  },
  pending: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Pending'
  },
  rejected: {
    icon: XCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'Rejected'
  }
}

export function RecentComments({ comments }: RecentCommentsProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2.5 border border-blue-500/20">
          <MessageSquare className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold">Recent Comments</h3>
          <p className="text-sm text-[var(--text-muted)]">Latest generated comments</p>
        </div>
      </div>
      
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
          <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
          <p className="font-medium">No comments yet</p>
          <p className="text-sm">Generated comments will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, index) => {
            const status = statusConfig[comment.status as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = status.icon
            
            return (
              <div 
                key={comment.id} 
                className="rounded-xl bg-white/5 border border-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className={`flex items-center gap-2 rounded-lg ${status.bg} ${status.border} border px-2.5 py-1`}>
                    <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                  </div>
                  
                  {comment.karma_score !== null && comment.karma_score > 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">+{comment.karma_score}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {comment.content}
                </p>
                
                {comment.created_at && (
                  <p className="text-xs text-[var(--text-muted)] mt-3">
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
