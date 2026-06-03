import Link from 'next/link'
import { getProfile, getTodayFood, getWeightLogs, getWorkoutLogs, getLatestSamsungData } from '@/lib/data'
import CalorieRing from '@/components/dashboard/CalorieRing'
import StreakDots from '@/components/dashboard/StreakDots'
import SamsungGrid from '@/components/dashboard/SamsungGrid'

const todayStr = () => new Date().toISOString().slice(0, 10)
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default async function DashboardPage() {
  const today = todayStr()
  const [profile, todayFood, weightLogs, workoutLogs, samsung] = await Promise.all([
    getProfile(), getTodayFood(today), getWeightLogs(30), getWorkoutLogs(30), getLatestSamsungData(),
  ])

  const p = profile ?? { name: 'Rugved', calories_goal: 1900, protein_goal_g: 150, weight_kg: 74, target_weight_kg: 70 }
  const todayCal = todayFood.reduce((s: number, f: { calories: number }) => s + f.calories, 0)
  const firstWeight = weightLogs.length ? weightLogs[0].weight_kg : p.weight_kg
  const lastWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight_kg : p.weight_kg
  const lost = +(firstWeight - lastWeight).toFixed(1)
  const calLeft = Math.round(p.calories_goal - todayCal)

  const dates = last7Days()
  const workoutDates = new Set(workoutLogs.map((w: { date: string }) => w.date))
  const streakDays = dates.map(ds => ({
    label: DAY_LABELS[new Date(ds + 'T00:00:00').getDay()],
    worked: workoutDates.has(ds),
    isToday: ds === today,
  }))
  let streak = 0
  for (let i = streakDays.length - 1; i >= 0; i--) {
    if (streakDays[i].worked) streak++; else break
  }
  const todayWorkout = workoutLogs.find((w: { date: string }) => w.date === today)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Hero header ─────────────────────────────── */}
      <div className="hero-grad-green relative overflow-hidden px-5 pt-12 pb-8">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: '#10b981', transform: 'translate(30%, -30%)' }} />

        <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--accent)' }}>
          {greeting()}
        </p>
        <h1 className="text-4xl font-black tracking-tight mb-6" style={{ color: 'var(--text)' }}>
          {p.name}
        </h1>

        {/* Big 3 stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Weight', value: `${lastWeight}`, unit: 'kg', sub: `↓ ${lost}kg`, color: '#10b981' },
            { label: 'Streak', value: String(streak), unit: 'days', sub: todayWorkout ? '✓ trained' : 'rest day', color: streak > 3 ? '#10b981' : 'var(--muted2)' },
            { label: 'Cal left', value: String(Math.abs(calLeft)), unit: 'kcal', sub: calLeft < 0 ? 'over target' : 'remaining', color: calLeft < 0 ? '#f43f5e' : '#10b981' },
          ].map(s => (
            <div key={s.label} className="stat-card rounded-xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted2)' }}>{s.label}</div>
              <div className="text-xl font-black leading-none" style={{ color: 'var(--text)' }}>{s.value}<span className="text-[10px] font-semibold ml-0.5" style={{ color: 'var(--muted2)' }}>{s.unit}</span></div>
              <div className="text-[10px] font-semibold mt-1" style={{ color: s.color }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 pb-8">

        {/* ── Today's calories card ─────────────────── */}
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted2)' }}>Today's Calories</div>
            <CalorieRing consumed={todayCal} goal={p.calories_goal} />
          </div>
        </div>

        {/* ── Workout tiles ─────────────────────────── */}
        <div className="text-[11px] font-semibold uppercase tracking-widest pt-2" style={{ color: 'var(--muted2)' }}>Training</div>

        {todayWorkout ? (
          <div className="tile-green rounded-2xl p-5 relative overflow-hidden" style={{ border: '1px solid rgba(16,185,129,0.25)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: '#10b981', transform: 'translate(20%,-20%)' }} />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#059669' }}>✓ Trained Today</div>
              <div className="text-xl font-black" style={{ color: 'var(--text)' }}>{todayWorkout.template_name}</div>
              <div className="text-sm mt-0.5" style={{ color: '#059669' }}>{todayWorkout.exercises?.length ?? 0} exercises completed</div>
            </div>
          </div>
        ) : (
          <Link href="/workout">
            <div className="card rounded-2xl p-5 relative overflow-hidden active:scale-[0.98] transition-transform">
              <div className="absolute bottom-0 right-4 text-[80px] leading-none opacity-[0.07] select-none">🏋️</div>
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>Ready to train?</div>
                <div className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Log Workout</div>
                <div className="text-sm" style={{ color: 'var(--muted2)' }}>Pick a PPL template →</div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Nutrition + Progress row ──────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/nutrition">
            <div className="tile-yellow rounded-2xl p-4 relative overflow-hidden active:scale-[0.98] transition-transform h-[120px]"
              style={{ border: '1px solid rgba(234,179,8,0.2)' }}>
              <div className="absolute bottom-2 right-3 text-[50px] leading-none opacity-20 select-none">🥗</div>
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#ca8a04' }}>Nutrition</div>
                <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>{Math.round(todayCal)}</div>
                <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>kcal today</div>
              </div>
            </div>
          </Link>

          <Link href="/progress">
            <div className="tile-indigo rounded-2xl p-4 relative overflow-hidden active:scale-[0.98] transition-transform h-[120px]"
              style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="absolute bottom-2 right-3 text-[50px] leading-none opacity-20 select-none">📈</div>
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6366f1' }}>Progress</div>
                <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>↓{lost}<span className="text-sm font-semibold" style={{ color: 'var(--muted2)' }}>kg</span></div>
                <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>total lost</div>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Weekly streak ────────────────────────── */}
        <div className="card rounded-2xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted2)' }}>This Week</div>
          <StreakDots days={streakDays} />
        </div>

        {/* ── Samsung Health ───────────────────────── */}
        <SamsungGrid {...samsung} />

        {!samsung.sleep && !samsung.hr && !samsung.steps && (
          <Link href="/settings">
            <div className="card rounded-2xl p-4 flex items-center gap-4 active:opacity-70"
              style={{ borderStyle: 'dashed' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'var(--surface2)' }}>⌚</div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Connect Samsung Watch</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted2)' }}>Import sleep, HR, steps & more</div>
              </div>
              <div className="ml-auto text-lg" style={{ color: 'var(--muted2)' }}>›</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
