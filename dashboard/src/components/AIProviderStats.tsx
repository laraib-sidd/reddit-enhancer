import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ProviderData {
  provider: string
  count: number
}

interface AIProviderStatsProps {
  data: ProviderData[]
}

const COLORS = {
  'gemini-pro': '#4285f4',
  'gemini-flash': '#34a853',
  'claude': '#cc785c',
  'default': '#6366f1',
}

export function AIProviderStats({ data }: AIProviderStatsProps) {
  const formattedData = data.map(d => ({
    ...d,
    name: d.provider.charAt(0).toUpperCase() + d.provider.slice(1),
    color: COLORS[d.provider as keyof typeof COLORS] || COLORS.default,
  }))

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a24] p-6">
      <h3 className="mb-4 text-lg font-semibold">AI Provider Usage</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-500">
          No data yet
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="count"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value} (${Math.round(value / total * 100)}%)`, 'Count']}
              />
              <Legend
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

