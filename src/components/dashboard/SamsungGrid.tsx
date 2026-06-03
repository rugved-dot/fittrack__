interface SleepLog { duration_h: number; deep_h?: number; score?: number; date: string }
interface HRLog { resting?: number; avg: number; min?: number; max?: number; date: string }
interface StepLog { steps: number; distance_km?: number; calories?: number; date: string }
interface StressLog { avg: number; max?: number; date: string }
interface Spo2Log { avg: number; min?: number; date: string }
interface BodyFatLog { body_fat_pct: number; muscle_mass_kg?: number; bmi?: number; date: string }

interface Props {
  sleep?: SleepLog | null; hr?: HRLog | null; steps?: StepLog | null
  stress?: StressLog | null; spo2?: Spo2Log | null; bodyFat?: BodyFatLog | null
}

function sleepLabel(h: number) {
  if (h >= 7.5) return { text: 'Great', color: '#10b981' }
  if (h >= 6) return { text: 'Fair', color: '#f97316' }
  return { text: 'Short', color: '#f43f5e' }
}

function stressLabel(v: number) {
  if (v < 40) return { text: 'Low', color: '#10b981' }
  if (v < 60) return { text: 'Medium', color: '#f97316' }
  return { text: 'High', color: '#f43f5e' }
}

function StatCard({ emoji, label, main, mainColor, badge, badgeColor, sub, date }: {
  emoji: string; label: string; main: string; mainColor: string
  badge?: string; badgeColor?: string; sub?: string; date?: string
}) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>{emoji} {label}</div>
        {badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${badgeColor}18`, color: badgeColor }}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-xl font-black tracking-tight" style={{ color: mainColor }}>{main}</div>
      {sub && <div className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--muted2)' }}>{sub}</div>}
      {date && <div className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--muted2)' }}>{date}</div>}
    </div>
  )
}

export default function SamsungGrid({ sleep, hr, steps, stress, spo2, bodyFat }: Props) {
  if (!sleep && !hr && !steps && !stress && !spo2 && !bodyFat) return null

  const sleepQuality = sleep ? sleepLabel(sleep.duration_h) : null
  const stressQuality = stress ? stressLabel(stress.avg) : null
  const spo2Val = spo2 ? (spo2.avg ?? spo2.min ?? 0) : 0
  const hrVal = hr ? (hr.resting ?? hr.avg) : 0
  const hrColor = hrVal < 60 ? '#10b981' : hrVal < 80 ? '#f97316' : '#f43f5e'

  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-widest pt-1 mb-3" style={{ color: 'var(--muted2)' }}>⌚ Samsung Watch</div>
      <div className="grid grid-cols-2 gap-2">
        {sleep && sleepQuality && (
          <StatCard emoji="😴" label="Sleep" main={`${sleep.duration_h.toFixed(1)}h`}
            mainColor={sleepQuality.color}
            badge={sleepQuality.text} badgeColor={sleepQuality.color}
            sub={[sleep.deep_h ? `Deep ${sleep.deep_h.toFixed(1)}h` : '', sleep.score ? `Score ${sleep.score}` : ''].filter(Boolean).join(' · ')}
            date={sleep.date} />
        )}
        {hr && (
          <StatCard emoji="❤️" label="Heart Rate" main={`${hrVal} bpm`}
            mainColor={hrColor}
            badge={hrVal < 60 ? 'Athletic' : hrVal < 80 ? 'Normal' : 'Elevated'} badgeColor={hrColor}
            sub={[hr.min ? `Min ${hr.min}` : '', hr.max ? `Max ${hr.max}` : ''].filter(Boolean).join(' · ')}
            date={hr.date} />
        )}
        {steps && (
          <StatCard emoji="👟" label="Steps" main={steps.steps.toLocaleString()}
            mainColor={steps.steps >= 10000 ? '#10b981' : steps.steps >= 6000 ? '#f97316' : '#94a3b8'}
            badge={steps.steps >= 10000 ? '🎯 Goal' : `${Math.round(steps.steps / 100)}%`}
            badgeColor={steps.steps >= 10000 ? '#10b981' : '#f97316'}
            sub={[steps.distance_km ? `${steps.distance_km.toFixed(1)} km` : '', steps.calories ? `${steps.calories} kcal` : ''].filter(Boolean).join(' · ')}
            date={steps.date} />
        )}
        {stress && stressQuality && (
          <StatCard emoji="🧠" label="Stress" main={String(stress.avg)}
            mainColor={stressQuality.color}
            badge={stressQuality.text} badgeColor={stressQuality.color}
            sub={stress.max ? `Peak ${stress.max}` : undefined}
            date={stress.date} />
        )}
        {spo2 && (
          <StatCard emoji="🫁" label="SpO₂" main={`${spo2.avg ?? spo2.min}%`}
            mainColor={spo2Val >= 95 ? '#10b981' : '#f97316'}
            badge={spo2Val >= 95 ? 'Normal' : 'Low'} badgeColor={spo2Val >= 95 ? '#10b981' : '#f97316'}
            sub="Blood oxygen" date={spo2.date} />
        )}
        {bodyFat && (
          <StatCard emoji="📊" label="Body Fat" main={`${bodyFat.body_fat_pct}%`}
            mainColor="#10b981"
            sub={[bodyFat.muscle_mass_kg ? `Muscle ${bodyFat.muscle_mass_kg}kg` : '', bodyFat.bmi ? `BMI ${bodyFat.bmi}` : ''].filter(Boolean).join(' · ')}
            date={bodyFat.date} />
        )}
      </div>
    </>
  )
}
