import { CheckCircle2, Clock, XCircle, TrendingUp, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  content: string
  status: string
  karma_score: number | null
  created_at: string | null
}

interface Props {
  comments: Comment[]
}

const statusStyles = {
  posted: { 
    icon: CheckCircle2, 
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Posted' 
  },
  pending: { 
    icon: Clock, 
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Pending' 
  },
  rejected: { 
    icon: XCircle, 
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    label: 'Rejected' 
  }
}

export function RecentComments({ comments }: Props) {
  if (comments.length === 0) {
    return (
      <div className="card p-12 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
        <p className="text-[var(--text-secondary)]">No comments generated yet</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text)]">Recent Comments</h3>
        <p className="text-sm text-[var(--text-secondary)]">Latest AI-generated comments</p>
      </div>
      
      <div className="divide-y divide-[var(--border)]">
        {comments.map(comment => {
          const status = statusStyles[comment.status as keyof typeof statusStyles] || statusStyles.pending
          const Icon = status.icon

          return (
            <div key={comment.id} className="px-6 py-4 hover:bg-[var(--bg)] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {status.label}
                </span>
                {comment.karma_score !== null && comment.karma_score > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{comment.karma_score} karma
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text)] leading-relaxed line-clamp-2 mb-2">
                {comment.content}
              </p>
              {comment.created_at && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
