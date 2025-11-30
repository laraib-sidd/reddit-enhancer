import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; posts: number; comments: number }[]
}

export function ActivityChart({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))

  return (
    <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
      <h3 className="text-sm font-medium text-white mb-4">Activity (Last 7 Days)</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 12 }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: '#171717',
                border: '1px solid #262626',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Area
              type="monotone"
              dataKey="comments"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#gradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
