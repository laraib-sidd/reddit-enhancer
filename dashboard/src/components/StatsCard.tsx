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
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
  },
  rose: {
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/20',
    icon: 'text-rose-400',
  },
}

export function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  const colors = colorConfig[color]
  
  return (
    <div className="card group p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl ${colors.bg} ${colors.border} border p-3 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}
