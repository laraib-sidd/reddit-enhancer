import { CheckCircle, Clock, XCircle } from 'lucide-react'

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

const statusMap = {
  posted: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Posted' },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejected' }
}

export function RecentComments({ comments }: Props) {
  if (comments.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800 text-center">
        <p className="text-neutral-400">No comments yet</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800">
      <div className="px-5 py-4 border-b border-neutral-800">
        <h3 className="text-sm font-medium text-white">Recent Comments</h3>
      </div>
      <div className="divide-y divide-neutral-800">
        {comments.map(comment => {
          const status = statusMap[comment.status as keyof typeof statusMap] || statusMap.pending
          const Icon = status.icon

          return (
            <div key={comment.id} className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                  <Icon className="w-3 h-3" />
                  {status.label}
                </span>
                {comment.karma_score !== null && comment.karma_score > 0 && (
                  <span className="text-xs text-green-500">+{comment.karma_score} karma</span>
                )}
              </div>
              <p className="text-sm text-neutral-300 line-clamp-2">{comment.content}</p>
              {comment.created_at && (
                <p className="text-xs text-neutral-500 mt-2">
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
