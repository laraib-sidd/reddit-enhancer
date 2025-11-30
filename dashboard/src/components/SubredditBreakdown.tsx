import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface SubredditData {
  subreddit: string
  count: number
}

interface SubredditBreakdownProps {
  data: SubredditData[]
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981']

export function SubredditBreakdown({ data }: SubredditBreakdownProps) {
  const formattedData = data.map(item => ({
    name: `r/${item.subreddit}`,
    value: item.count
  }))

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-emerald-500/20 p-2.5 border border-emerald-500/20">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Top Subreddits</h3>
          <p className="text-sm text-slate-500">By posts scanned</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              width={120}
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
              cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {formattedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
