import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <div className="card stat-card p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-zinc-500 mt-1">{title}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}
