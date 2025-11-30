import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface ActivityData {
  date: string
  posts: number
  comments: number
}

interface ActivityChartProps {
  data: ActivityData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-purple-500/20 p-2.5 border border-purple-500/20">
          <Activity className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Activity</h3>
          <p className="text-sm text-slate-500">Last 7 days</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1a1d24',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Area 
              type="monotone" 
              dataKey="comments" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorComments)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
