'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface WeightLog { date: string; weight_kg: number }
interface WorkoutLog { date: string; template_name: string }
interface Profile { calories_goal: number; protein_goal_g: number; weight_kg: number; target_weight_kg: number }
interface Props {
  weightLogs: WeightLog[]
  workoutLogs: WorkoutLog[]
  foodByDate: Record<string, { calories: number; protein: number }>
  profile: Profile | null
}

function today() { return new Date().toISOString().slice(0, 10) }
function last7Dates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function ProgressClient({ weightLogs, workoutLogs, foodByDate, profile }: Props) {
  const weightRef = useRef<HTMLCanvasElement>(null)
  const calRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const p = profile ?? { calories_goal: 1900, protein_goal_g: 150, weight_kg: 74, target_weight_kg: 70 }
  const START_WEIGHT = weightLogs.length ? weightLogs[0].weight_kg : p.weight_kg

  const last7 = last7Dates()
  const calData = last7.map(d => foodByDate[d]?.calories ?? 0)
  const workoutDates = new Set(workoutLogs.map(w => w.date))
  const workoutsThisWeek = last7.filter(d => workoutDates.has(d)).length
  const avgCal = calData.filter(c => c > 0).reduce((a, b) => a + b, 0) / (calData.filter(c => c > 0).length || 1)
  const weeklyDeficit = Math.round((p.calories_goal - avgCal) * 7)
  const currentWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight_kg : p.weight_kg
  const totalLost = +(START_WEIGHT - currentWeight).toFixed(1)
  const progressPct = Math.min(100, Math.max(0, (totalLost / (START_WEIGHT - p.target_weight_kg)) * 100))

  const gridColor = dark ? '#1e2d3d' : '#e2e8f0'
  const labelColor = dark ? '#4a6080' : '#94a3b8'
  const emptyBarColor = dark ? '#1e2d3d' : '#e2e8f0'
  const dotFill = dark ? '#0f1923' : '#ffffff'

  useEffect(() => { drawWeightChart(); drawCalChart() })

  function drawWeightChart() {
    const canvas = weightRef.current
    if (!canvas || weightLogs.length < 2) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = canvas.parentElement!.clientWidth
    const H = canvas.height = 180
    const pad = { t: 10, r: 10, b: 30, l: 38 }
    const vals = weightLogs.map(w => w.weight_kg)
    const minV = Math.min(...vals) - 0.5, maxV = Math.max(...vals) + 0.5
    const x = (i: number) => pad.l + (i / (vals.length - 1)) * (W - pad.l - pad.r)
    const y = (v: number) => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b)

    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1
    ;[0, 0.25, 0.5, 0.75, 1].forEach(t => {
      const yy = pad.t + t * (H - pad.t - pad.b)
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r, yy); ctx.stroke()
      ctx.fillStyle = labelColor; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'right'
      ctx.fillText((maxV - t * (maxV - minV)).toFixed(1), pad.l - 4, yy + 4)
    })

    const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b)
    grad.addColorStop(0, 'rgba(99,102,241,0.15)'); grad.addColorStop(1, 'rgba(99,102,241,0)')
    ctx.beginPath(); ctx.moveTo(x(0), y(vals[0]))
    vals.forEach((v, i) => i > 0 && ctx.lineTo(x(i), y(v)))
    ctx.lineTo(x(vals.length - 1), H - pad.b); ctx.lineTo(x(0), H - pad.b); ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()

    ctx.beginPath(); ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5
    vals.forEach((v, i) => i === 0 ? ctx.moveTo(x(0), y(v)) : ctx.lineTo(x(i), y(v)))
    ctx.stroke()

    vals.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(x(i), y(v), 3.5, 0, Math.PI * 2)
      ctx.fillStyle = '#6366f1'; ctx.fill()
      ctx.beginPath(); ctx.arc(x(i), y(v), 2, 0, Math.PI * 2)
      ctx.fillStyle = dotFill; ctx.fill()
    })

    ctx.fillStyle = labelColor; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(vals.length / 5))
    weightLogs.forEach((w, i) => {
      if (i % step === 0 || i === vals.length - 1) ctx.fillText(w.date.slice(5), x(i), H - 6)
    })
  }

  function drawCalChart() {
    const canvas = calRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = canvas.parentElement!.clientWidth
    const H = canvas.height = 150
    const pad = { t: 10, r: 10, b: 28, l: 38 }
    const maxV = Math.max(p.calories_goal * 1.2, ...calData)
    const n = calData.length
    const barW = (W - pad.l - pad.r) / n * 0.6
    const barGap = (W - pad.l - pad.r) / n
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const todayIdx = new Date().getDay()

    ctx.clearRect(0, 0, W, H)

    const targetY = pad.t + (1 - p.calories_goal / maxV) * (H - pad.t - pad.b)
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(16,185,129,0.4)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad.l, targetY); ctx.lineTo(W - pad.r, targetY); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#10b981'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(String(p.calories_goal), pad.l - 4, targetY + 3)

    calData.forEach((cal, i) => {
      const bx = pad.l + i * barGap + (barGap - barW) / 2
      const barH = (cal / maxV) * (H - pad.t - pad.b)
      const by = H - pad.b - barH
      const isOver = cal > p.calories_goal
      ctx.fillStyle = cal === 0 ? emptyBarColor : isOver ? '#f43f5e' : '#6366f1'
      ctx.beginPath()
      const r = 4
      ctx.moveTo(bx + r, by); ctx.lineTo(bx + barW - r, by)
      ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + r)
      ctx.lineTo(bx + barW, by + barH); ctx.lineTo(bx, by + barH)
      ctx.lineTo(bx, by + r); ctx.quadraticCurveTo(bx, by, bx + r, by)
      ctx.closePath(); ctx.fill()

      const dayIdx = (todayIdx - (n - 1 - i) + 7) % 7
      ctx.fillStyle = i === n - 1 ? '#6366f1' : labelColor
      ctx.font = i === n - 1 ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(days[dayIdx], bx + barW / 2, H - 6)
    })
  }

  const insights: { icon: string; text: string; type: 'green' | 'orange' | 'red' }[] = []
  const loggedDays = last7.filter(d => (foodByDate[d]?.calories ?? 0) > 0).length
  if (loggedDays < 4) insights.push({ icon: '📊', text: `Only logged food ${loggedDays}/7 days. Consistent tracking is the #1 factor for hitting a deficit.`, type: 'orange' })
  else insights.push({ icon: '✅', text: `Great consistency — logged food ${loggedDays}/7 days this week.`, type: 'green' })

  if (workoutsThisWeek < 3) insights.push({ icon: '💪', text: `${workoutsThisWeek} workouts this week. Aim for 4–5 PPL sessions.`, type: 'orange' })
  else insights.push({ icon: '🔥', text: `${workoutsThisWeek} workouts this week — solid!`, type: 'green' })

  const todayProtein = foodByDate[today()]?.protein ?? 0
  if (todayProtein < p.protein_goal_g * 0.7) insights.push({ icon: '🥩', text: `Today's protein: ${Math.round(todayProtein)}g of ${p.protein_goal_g}g goal. Hit protein to preserve muscle.`, type: 'red' })

  if (weightLogs.length >= 7) {
    const change = +(weightLogs[weightLogs.length - 1].weight_kg - weightLogs[weightLogs.length - 7].weight_kg).toFixed(1)
    if (change > 0) insights.push({ icon: '⚠️', text: `Weight up ${change}kg this week. Check if you're truly in a deficit.`, type: 'red' })
    else if (change < -1) insights.push({ icon: '🎯', text: `Down ${Math.abs(change)}kg this week! Keep hitting protein to preserve muscle.`, type: 'green' })
    else insights.push({ icon: '📉', text: `Down ${Math.abs(change)}kg — steady progress. 0.3–0.5kg/week is ideal.`, type: 'green' })
  }

  const borderColor = (t: string) => t === 'green' ? '#10b981' : t === 'orange' ? '#f97316' : '#f43f5e'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-12 pb-8"
        style={{ background: 'linear-gradient(135deg, var(--hero-indigo) 0%, var(--bg) 65%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: '#6366f1', transform: 'translate(35%,-35%)' }} />
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: '#6366f1' }}>Analytics</p>
        <h1 className="text-4xl font-black tracking-tight mb-1.5" style={{ color: 'var(--text)' }}>Progress</h1>
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          {totalLost > 0 ? `↓ ${totalLost}kg lost so far` : 'Start tracking to see your journey'}
        </p>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* ── Key stats ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted2)' }}>This Week</div>
            <div className="text-4xl font-black tracking-tight" style={{ color: '#6366f1' }}>{workoutsThisWeek}</div>
            <div className="text-xs font-medium mt-1" style={{ color: 'var(--muted2)' }}>sessions · goal 4–5</div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted2)' }}>Cal Deficit</div>
            <div className="text-4xl font-black tracking-tight" style={{ color: weeklyDeficit > 0 ? '#10b981' : '#f43f5e' }}>
              {weeklyDeficit > 0 ? '-' : '+'}{Math.abs(weeklyDeficit)}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: weeklyDeficit > 3500 ? '#10b981' : 'var(--muted2)' }}>
              {weeklyDeficit > 3500 ? '≈ 0.5kg fat loss' : 'kcal this week'}
            </div>
          </div>
        </div>

        {/* ── Weight chart ──────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted2)' }}>Weight Trend</div>
          {weightLogs.length < 2 ? (
            <div className="text-center py-8 text-sm font-medium" style={{ color: 'var(--muted2)' }}>
              Log your weight daily to see the trend chart
            </div>
          ) : (
            <div className="overflow-hidden"><canvas ref={weightRef} /></div>
          )}
        </div>

        {/* ── Calorie chart ─────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted2)' }}>7-Day Calories</div>
          <div className="overflow-hidden"><canvas ref={calRef} /></div>
        </div>

        {/* ── Body stats ────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--muted2)' }}>Body Stats</div>

          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted2)' }}>Start</div>
              <div className="text-3xl font-black" style={{ color: 'var(--text)' }}>{START_WEIGHT}<span className="text-sm font-semibold ml-0.5" style={{ color: 'var(--muted2)' }}>kg</span></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#10b981' }}>↓ {totalLost}kg</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#10b981' }}>total lost</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted2)' }}>Now</div>
              <div className="text-3xl font-black" style={{ color: '#10b981' }}>{currentWeight}<span className="text-sm font-semibold ml-0.5" style={{ color: 'var(--muted2)' }}>kg</span></div>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-[11px] font-semibold mb-2" style={{ color: 'var(--muted2)' }}>
              <span>{START_WEIGHT}kg</span>
              <span className="font-bold" style={{ color: '#10b981' }}>{progressPct.toFixed(0)}% to goal</span>
              <span>{p.target_weight_kg}kg</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-black" style={{ color: '#6366f1' }}>15–17%</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted2)' }}>Body fat goal</div>
            </div>
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-black" style={{ color: '#10b981' }}>{p.target_weight_kg}<span className="text-xs font-semibold ml-0.5" style={{ color: 'var(--muted2)' }}>kg</span></div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted2)' }}>Target weight</div>
            </div>
          </div>
        </div>

        {/* ── Insights ──────────────────────────────── */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] pt-1" style={{ color: 'var(--muted2)' }}>Insights</div>
        {insights.map((ins, i) => (
          <div key={i} className="rounded-2xl p-4 flex gap-3 items-start"
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              borderLeft: `3px solid ${borderColor(ins.type)}`,
              boxShadow: 'var(--shadow-sm)',
            }}>
            <span className="text-xl flex-shrink-0">{ins.icon}</span>
            <span className="text-sm leading-relaxed font-medium" style={{ color: 'var(--muted)' }}>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
