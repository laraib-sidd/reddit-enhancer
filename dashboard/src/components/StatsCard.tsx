import type { LucideIcon } from 'lucide-react'
import { TrendingUp } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  change: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const colors = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    icon: 'text-blue-500',
    badge: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-500',
    badge: 'text-emerald-600 dark:text-emerald-400'
  },
  purple: {
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    icon: 'text-violet-500',
    badge: 'text-violet-600 dark:text-violet-400'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    icon: 'text-orange-500',
    badge: 'text-orange-600 dark:text-orange-400'
  }
}

export function StatsCard({ label, value, change, icon: Icon, color }: Props) {
  const c = colors[color]
  
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${c.badge}`}>
          <TrendingUp className="w-3 h-3" />
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-[var(--text)] mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}
