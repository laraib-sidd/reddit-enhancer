import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityData {
  date: string
  posts: number
  comments: number
}

interface ActivityChartProps {
  data: ActivityData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-6">
      <h3 className="mb-4 text-lg font-semibold">Activity (Last 7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f0f0f5' }}
            />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorPosts)"
              name="Posts Scanned"
            />
            <Area
              type="monotone"
              dataKey="comments"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorComments)"
              name="Comments Generated"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

