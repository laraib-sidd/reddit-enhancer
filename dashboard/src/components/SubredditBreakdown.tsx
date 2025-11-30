interface Props {
  data: { subreddit: string; count: number }[]
}

const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe']

export function SubredditBreakdown({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="card p-6 h-full">
      <div className="mb-6">
        <h3 className="font-semibold text-[var(--text)]">Top Subreddits</h3>
        <p className="text-sm text-[var(--text-secondary)]">Most active communities</p>
      </div>
      
      <div className="space-y-4">
        {data.map((item, i) => {
          const percent = Math.round((item.count / total) * 100)
          return (
            <div key={item.subreddit}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: colors[i % colors.length] }}
                  />
                  <span className="text-sm font-medium text-[var(--text)]">
                    r/{item.subreddit}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  {item.count} ({percent}%)
                </span>
              </div>
              <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percent}%`,
                    background: colors[i % colors.length]
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
