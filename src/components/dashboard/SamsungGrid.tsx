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

function StatCard({ emoji, label, main, color, sub, date }: {
  emoji: string; label: string; main: string; color: string; sub?: string; date?: string
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-3.5">
      <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">{emoji} {label}</div>
      <div className="text-xl font-black tracking-tight" style={{ color }}>{main}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5 font-medium">{sub}</div>}
      {date && <div className="text-[10px] text-muted2 mt-1.5 font-medium">{date}</div>}
    </div>
  )
}

export default function SamsungGrid({ sleep, hr, steps, stress, spo2, bodyFat }: Props) {
  if (!sleep && !hr && !steps && !stress && !spo2 && !bodyFat) return null

  const sleepColor = !sleep ? '#7d8fa3' : sleep.duration_h >= 7.5 ? '#10b981' : sleep.duration_h >= 6 ? '#f97316' : '#f43f5e'
  const stressColor = !stress ? '#7d8fa3' : stress.avg < 40 ? '#10b981' : stress.avg < 60 ? '#f97316' : '#f43f5e'
  const spo2Val = spo2 ? (spo2.avg ?? spo2.min ?? 0) : 0
  const spo2Color = spo2Val >= 95 ? '#10b981' : '#f97316'

  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted mt-5 mb-3">⌚ Samsung Watch</div>
      <div className="grid grid-cols-2 gap-2">
        {sleep && <StatCard emoji="😴" label="Sleep" main={`${sleep.duration_h.toFixed(1)}h`} color={sleepColor}
          sub={[sleep.deep_h ? `Deep ${sleep.deep_h.toFixed(1)}h` : '', sleep.score ? `Score ${sleep.score}` : ''].filter(Boolean).join(' · ')} date={sleep.date} />}
        {hr && <StatCard emoji="❤️" label="Heart Rate" main={`${hr.resting ?? hr.avg} bpm`} color="#f43f5e"
          sub={[hr.min ? `Min ${hr.min}` : '', hr.max ? `Max ${hr.max}` : ''].filter(Boolean).join(' · ')} date={hr.date} />}
        {steps && <StatCard emoji="👟" label="Steps" main={steps.steps.toLocaleString()} color="#34d399"
          sub={[steps.distance_km ? `${steps.distance_km.toFixed(1)} km` : '', steps.calories ? `${steps.calories} kcal` : ''].filter(Boolean).join(' · ')} date={steps.date} />}
        {stress && <StatCard emoji="🧠" label="Stress" main={String(stress.avg)} color={stressColor}
          sub={`${stress.avg < 40 ? 'Low' : stress.avg < 60 ? 'Medium' : 'High'}${stress.max ? ` · Max ${stress.max}` : ''}`} date={stress.date} />}
        {spo2 && <StatCard emoji="🫁" label="SpO₂" main={`${spo2.avg ?? spo2.min}%`} color={spo2Color} sub="Blood oxygen" date={spo2.date} />}
        {bodyFat && <StatCard emoji="📊" label="Body Fat" main={`${bodyFat.body_fat_pct}%`} color="#10b981"
          sub={[bodyFat.muscle_mass_kg ? `Muscle ${bodyFat.muscle_mass_kg}kg` : '', bodyFat.bmi ? `BMI ${bodyFat.bmi}` : ''].filter(Boolean).join(' · ')} date={bodyFat.date} />}
      </div>
    </>
  )
}
