import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
}

export function StatsCard({ label, value, icon: Icon }: Props) {
  return (
    <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">{label}</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-violet-500" />
        </div>
      </div>
    </div>
  )
}
