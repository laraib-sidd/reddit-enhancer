import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SubredditData {
  subreddit: string
  count: number
}

interface SubredditBreakdownProps {
  data: SubredditData[]
}

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

export function SubredditBreakdown({ data }: SubredditBreakdownProps) {
  const formattedData = data.map(d => ({
    ...d,
    subreddit: `r/${d.subreddit}`
  }))

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-6">
      <h3 className="mb-4 text-lg font-semibold">Top Subreddits</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-500">
          No data yet
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} layout="vertical">
              <XAxis 
                type="number" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="subreddit"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f0f0f5' }}
              />
              <Bar dataKey="count" name="Posts" radius={[0, 4, 4, 0]}>
                {formattedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

