import { MessageSquare, CheckCircle, XCircle, Clock, Send } from 'lucide-react'
import type { Comment } from '../lib/data'

interface RecentCommentsProps {
  comments: Comment[]
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  approved: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  posted: { icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

export function RecentComments({ comments }: RecentCommentsProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-semibold">Recent Comments</h3>
      </div>
      
      {comments.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-500">
          No comments yet
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const config = statusConfig[comment.status]
            const StatusIcon = config.icon
            
            return (
              <div 
                key={comment.id}
                className="rounded-lg border border-white/5 bg-white/5 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${config.bg} ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {comment.status}
                  </div>
                  {comment.karma_score !== null && (
                    <span className="text-sm text-gray-400">
                      {comment.karma_score > 0 ? '+' : ''}{comment.karma_score} karma
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-gray-300">
                  {comment.content}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  {comment.ai_provider && (
                    <span className="rounded bg-white/5 px-1.5 py-0.5">
                      {comment.ai_provider}
                    </span>
                  )}
                  {comment.created_at && (
                    <span>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

