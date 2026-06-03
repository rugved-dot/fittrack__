'use client'

interface Props { consumed: number; goal: number }

export default function CalorieRing({ consumed, goal }: Props) {
  const pct = Math.min(1, consumed / goal)
  const r = 54
  const circ = 2 * Math.PI * r
  const over = consumed > goal
  const nearTarget = !over && consumed / goal > 0.85
  const ringColor = over ? '#f43f5e' : nearTarget ? '#f97316' : '#10b981'

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-[128px] h-[128px] shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="var(--border)" strokeWidth="11" />
          <circle cx="65" cy="65" r={r} fill="none" stroke={ringColor} strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${pct * circ} ${circ}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-black leading-none" style={{ color: 'var(--text)' }}>{Math.round(consumed)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--muted2)' }}>kcal</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>Remaining</div>
          <div className="text-2xl font-black tracking-tight" style={{ color: over ? '#f43f5e' : 'var(--text)' }}>
            {over ? `-${Math.round(consumed - goal)}` : Math.round(goal - consumed)}
            <span className="text-sm font-semibold ml-1" style={{ color: 'var(--muted)' }}>kcal</span>
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>of {goal} goal</div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide"
          style={{
            background: over ? 'rgba(244,63,94,0.1)' : nearTarget ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
            color: over ? '#f43f5e' : nearTarget ? '#f97316' : '#10b981',
            border: `1px solid ${over ? 'rgba(244,63,94,0.2)' : nearTarget ? 'rgba(249,115,22,0.2)' : 'rgba(16,185,129,0.2)'}`,
          }}>
          {over ? `⚠ Over by ${Math.round(consumed - goal)} kcal`
           : nearTarget ? '⚡ Near target'
           : '✓ In deficit'}
        </div>
      </div>
    </div>
  )
}
