interface DayInfo { label: string; worked: boolean; isToday: boolean }

export default function StreakDots({ days }: { days: DayInfo[] }) {
  return (
    <div className="flex gap-2">
      {days.map((d, i) => (
        <div key={i} className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
          d.isToday
            ? 'border-2 border-accent text-accent bg-accent/10'
            : d.worked
            ? 'bg-accent text-white'
            : 'bg-surface2 text-muted2'
        }`}>
          {d.label}
        </div>
      ))}
    </div>
  )
}
