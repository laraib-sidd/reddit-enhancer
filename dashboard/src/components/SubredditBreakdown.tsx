import { TrendingUp } from 'lucide-react'

interface SubredditData {
  subreddit: string
  count: number
}

interface SubredditBreakdownProps {
  data: SubredditData[]
}

const COLORS = ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6']

export function SubredditBreakdown({ data }: SubredditBreakdownProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Top Subreddits</h3>
          <p className="text-xs text-zinc-500">By posts scanned</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.subreddit} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                r/{item.subreddit}
              </span>
              <span className="text-sm font-medium text-zinc-400">{item.count}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-90"
                style={{ 
                  width: `${(item.count / maxCount) * 100}%`,
                  background: COLORS[index % COLORS.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
