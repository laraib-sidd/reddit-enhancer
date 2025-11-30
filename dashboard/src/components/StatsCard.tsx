import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose'
}

const colorConfig = {
  indigo: {
    bg: 'from-indigo-500/20 to-blue-500/20',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-400',
    glow: 'group-hover:shadow-indigo-500/20',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-green-500/20',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  amber: {
    bg: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/20',
  },
  rose: {
    bg: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/20',
    icon: 'text-rose-400',
    glow: 'group-hover:shadow-rose-500/20',
  },
}

export function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  const colors = colorConfig[color]
  
  return (
    <div className={`group card p-6 transition-all duration-300 hover:shadow-xl ${colors.glow}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border p-3 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}
