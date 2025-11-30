interface Props {
  data: { subreddit: string; count: number }[]
}

export function SubredditBreakdown({ data }: Props) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
      <h3 className="text-sm font-medium text-white mb-4">Top Subreddits</h3>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={item.subreddit}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-300">r/{item.subreddit}</span>
              <span className="text-neutral-500">{item.count}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.count / max) * 100}%`,
                  background: `hsl(${270 - i * 15}, 70%, 60%)`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
