import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'indigo' | 'emerald' | 'amber' | 'rose'
}

const colorClasses = {
  indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
}

const iconColorClasses = {
  indigo: 'text-indigo-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'indigo' 
}: StatsCardProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl border bg-gradient-to-br p-6
      ${colorClasses[color]}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-2 text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`rounded-lg bg-white/5 p-3 ${iconColorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
    </div>
  )
}

