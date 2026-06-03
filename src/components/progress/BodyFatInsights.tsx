'use client'

import { useRef, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────────── */
interface BFLog { date: string; body_fat_pct: number; muscle_mass_kg?: number }
interface WeightLog { date: string; weight_kg: number }
interface WorkoutLog { date: string; template_name: string }
interface FoodDay { calories: number; protein: number }
interface SleepLog { date: string; duration_h: number }
interface Profile {
  weight_kg: number; target_weight_kg: number; calories_goal: number
  protein_goal_g: number; gender?: string; goal?: string; height_cm?: number; age?: number
}

interface Props {
  bodyFatLogs: BFLog[]
  weightLogs: WeightLog[]
  workoutLogs: WorkoutLog[]
  foodByDate: Record<string, FoodDay>
  sleepLogs: SleepLog[]
  profile: Profile
}

/* ─── BF% category lookup ────────────────────────────────────── */
function bfCategory(pct: number, gender: string) {
  const male = [
    { max: 5,   label: 'Essential', color: '#6366f1' },
    { max: 13,  label: 'Athlete',   color: '#10b981' },
    { max: 17,  label: 'Fit',       color: '#34d399' },
    { max: 24,  label: 'Average',   color: '#f97316' },
    { max: 999, label: 'High',      color: '#f43f5e' },
  ]
  const female = [
    { max: 13,  label: 'Essential', color: '#6366f1' },
    { max: 20,  label: 'Athlete',   color: '#10b981' },
    { max: 24,  label: 'Fit',       color: '#34d399' },
    { max: 31,  label: 'Average',   color: '#f97316' },
    { max: 999, label: 'High',      color: '#f43f5e' },
  ]
  const scale = gender === 'female' ? female : male
  return scale.find(s => pct <= s.max) ?? scale[scale.length - 1]
}

function bfGoalPct(gender: string) {
  return gender === 'female' ? 20 : 14  // top of "Athlete" zone
}

/* ─── Score bar ─────────────────────────────────────────────── */
function ScoreBar({ label, score, color, detail }: { label: string; score: number; color: string; detail: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="text-xs font-black" style={{ color }}>{Math.round(score)}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }} />
      </div>
      <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>{detail}</div>
    </div>
  )
}

/* ─── Action card ───────────────────────────────────────────── */
function ActionCard({ priority, icon, title, text, source }: {
  priority: 'high' | 'medium' | 'good'; icon: string; title: string; text: string; source?: string
}) {
  const colors = {
    high:   { border: '#f43f5e', bg: 'rgba(244,63,94,0.06)',   label: 'Action needed', labelColor: '#f43f5e' },
    medium: { border: '#f97316', bg: 'rgba(249,115,22,0.06)',  label: 'Improve',        labelColor: '#f97316' },
    good:   { border: '#10b981', bg: 'rgba(16,185,129,0.06)',  label: 'On track',       labelColor: '#10b981' },
  }
  const c = colors[priority]
  return (
    <div className="rounded-2xl p-4" style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, border: `1px solid ${c.border}30` }}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.labelColor }}>{c.label}</span>
          </div>
          <div className="text-sm font-bold mb-0.5" style={{ color: 'var(--text)' }}>{title}</div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</div>
          {source && <div className="text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--muted2)' }}>📄 {source}</div>}
        </div>
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export default function BodyFatInsights({ bodyFatLogs, weightLogs, workoutLogs, foodByDate, sleepLogs, profile }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const bfTrendRef = useRef<HTMLCanvasElement>(null)

  const gender = profile.gender ?? 'male'
  const wt = profile.weight_kg
  const proteinGoal = profile.protein_goal_g
  const calGoal = profile.calories_goal

  /* ── Derive last 7 dates ────────────────────────────────── */
  function last7() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })
  }
  const dates7 = last7()

  /* ── Latest BF reading ──────────────────────────────────── */
  const latestBF = bodyFatLogs.length ? bodyFatLogs[bodyFatLogs.length - 1] : null
  const prevBF = bodyFatLogs.length >= 2 ? bodyFatLogs[bodyFatLogs.length - 2] : null
  const bfChange = latestBF && prevBF ? +(latestBF.body_fat_pct - prevBF.body_fat_pct).toFixed(1) : null
  const cat = latestBF ? bfCategory(latestBF.body_fat_pct, gender) : null
  const goalPct = bfGoalPct(gender)

  /* ── Muscle Preservation Score ──────────────────────────── */
  // 1. Protein: avg last 7 days vs goal
  const proteinDays = dates7.map(d => foodByDate[d]?.protein ?? 0).filter(p => p > 0)
  const avgProtein = proteinDays.length ? proteinDays.reduce((a, b) => a + b, 0) / proteinDays.length : 0
  const proteinScore = Math.min(100, (avgProtein / proteinGoal) * 100)

  // 2. Workout frequency: ≥4/week = 100, <4 scaled. Exclude rest days.
  const workoutDates = new Set(workoutLogs.map(w => w.date))
  const realWorkouts = dates7.filter(d => workoutDates.has(d) && !workoutLogs.find(w => w.date === d && w.template_name === 'Rest Day')).length
  const workoutScore = Math.min(100, (realWorkouts / 4) * 100)

  // 3. Rate of loss: compare weight 14 days ago vs today
  const weights = weightLogs
  const recentWeight = weights.length ? weights[weights.length - 1].weight_kg : wt
  const twoWeeksAgo = weights.find(w => {
    const d = new Date(); d.setDate(d.getDate() - 14)
    return w.date >= d.toISOString().slice(0, 10)
  })
  const weeklyLossRate = twoWeeksAgo
    ? ((twoWeeksAgo.weight_kg - recentWeight) / 2) / wt * 100  // % per week
    : null
  // Ideal: 0.5–1% per week = 100; <0.3% = 70; >1.5% = 40; >2% = 20
  const lossRateScore = weeklyLossRate === null ? 75
    : weeklyLossRate < 0 ? 60  // gaining weight
    : weeklyLossRate < 0.3 ? 70
    : weeklyLossRate <= 1.0 ? 100
    : weeklyLossRate <= 1.5 ? 65
    : 30
  const lossRateDetail = weeklyLossRate === null ? 'Need more weight data'
    : weeklyLossRate < 0 ? `Gaining ${Math.abs(weeklyLossRate).toFixed(2)}%/wk`
    : weeklyLossRate <= 1.0 ? `${weeklyLossRate.toFixed(2)}%/wk — ideal range`
    : `${weeklyLossRate.toFixed(2)}%/wk — too fast, muscle at risk`

  const muscleScore = Math.round((proteinScore * 0.4) + (workoutScore * 0.35) + (lossRateScore * 0.25))

  /* ── Fat Loss Efficiency ────────────────────────────────── */
  // Expected: logged deficit over 14 days → expected kg lost
  const calDays = dates7.map(d => foodByDate[d]?.calories ?? null).filter(c => c !== null) as number[]
  const avgCal = calDays.length ? calDays.reduce((a, b) => a + b, 0) / calDays.length : null
  const weeklyDeficitKcal = avgCal !== null ? (calGoal - avgCal) * 7 : null
  const expectedLossKg = weeklyDeficitKcal !== null ? weeklyDeficitKcal / 7700 : null // 7700 kcal ≈ 1kg fat

  // Actual weekly loss
  const actualWeeklyLossKg = weeklyLossRate !== null ? (weeklyLossRate / 100) * wt : null

  // Efficiency ratio: actual / expected (1.0 = perfect, >1.5 = losing muscle, <0.3 = calorie undercount)
  const efficiencyRatio = actualWeeklyLossKg !== null && expectedLossKg !== null && expectedLossKg > 0.05
    ? actualWeeklyLossKg / expectedLossKg
    : null

  /* ── Sleep flag ─────────────────────────────────────────── */
  const avgSleep = sleepLogs.length
    ? sleepLogs.reduce((s, l) => s + l.duration_h, 0) / sleepLogs.length
    : null

  /* ── Timeline projection ─────────────────────────────────── */
  let weeksToGoal: number | null = null
  if (latestBF && latestBF.body_fat_pct > goalPct && bfChange !== null && bfChange < 0) {
    const pctToLose = latestBF.body_fat_pct - goalPct
    const pctPerEntry = Math.abs(bfChange)
    // Rough: assume entries ~2 weeks apart
    weeksToGoal = Math.round((pctToLose / pctPerEntry) * 2)
  } else if (weeklyLossRate && weeklyLossRate > 0 && latestBF && latestBF.body_fat_pct > goalPct) {
    // Estimate from weight loss: 1kg weight ≈ reduce BF% by (100 / weight_kg)
    const bfPctPerKgLost = 100 / wt
    const pctToLose = latestBF.body_fat_pct - goalPct
    const kgToLose = pctToLose / bfPctPerKgLost
    const kgPerWeek = (weeklyLossRate / 100) * wt
    weeksToGoal = kgPerWeek > 0 ? Math.round(kgToLose / kgPerWeek) : null
  }

  /* ── Action items ───────────────────────────────────────── */
  type ActionItem = { priority: 'high' | 'medium' | 'good'; icon: string; title: string; text: string; source?: string }
  const actions: ActionItem[] = []

  // Protein
  if (proteinScore < 70) {
    actions.push({
      priority: 'high', icon: '🥩',
      title: `Protein at ${Math.round(avgProtein)}g — needs ${proteinGoal}g`,
      text: `You're averaging ${Math.round(avgProtein)}g protein/day vs your ${proteinGoal}g goal (${(wt * 2.2).toFixed(0)}g = 2.2×bodyweight). Low protein during a deficit is the #1 cause of muscle loss. Add one high-protein meal or shake.`,
      source: 'Helms et al. 2014 — Dietary protein for natural bodybuilders',
    })
  } else if (proteinScore < 90) {
    actions.push({
      priority: 'medium', icon: '🥩',
      title: `Protein close — ${Math.round(avgProtein)}g avg`,
      text: `Averaging ${Math.round(avgProtein)}g vs ${proteinGoal}g goal. Try to hit your target 5+ days/week for optimal muscle retention.`,
    })
  } else {
    actions.push({
      priority: 'good', icon: '🥩',
      title: `Protein on point — ${Math.round(avgProtein)}g avg`,
      text: `Consistently hitting ${proteinGoal}g/day protects lean mass while you lose fat. Keep it up.`,
    })
  }

  // Workout frequency
  if (realWorkouts < 3) {
    actions.push({
      priority: 'high', icon: '🏋️',
      title: `Only ${realWorkouts} sessions this week`,
      text: `Resistance training 4–5×/week is the most evidence-backed way to preserve muscle in a caloric deficit. Each missed session increases risk of losing lean mass alongside fat.`,
      source: 'Schoenfeld 2016 — Resistance training in hypocaloric conditions',
    })
  } else if (realWorkouts < 4) {
    actions.push({
      priority: 'medium', icon: '🏋️',
      title: `${realWorkouts} sessions — one more would be ideal`,
      text: `You're training consistently. Adding one more session (especially a Pull or Legs day) would maximise muscle retention signals.`,
    })
  } else {
    actions.push({
      priority: 'good', icon: '🏋️',
      title: `${realWorkouts} sessions this week 🔥`,
      text: `Training 4–5×/week is optimal for retaining muscle during fat loss. Your workout frequency is excellent.`,
    })
  }

  // Loss rate
  if (weeklyLossRate !== null && weeklyLossRate > 1.2) {
    actions.push({
      priority: 'high', icon: '⚡',
      title: `Losing ${weeklyLossRate.toFixed(2)}%/week — too aggressive`,
      text: `Ideal fat loss is 0.5–1% bodyweight/week. Above 1% consistently means you're likely losing muscle tissue alongside fat. Consider reducing deficit by 200–300 kcal or taking a diet break for 1–2 weeks.`,
      source: 'Trexler et al. 2014 — Metabolic adaptation to weight loss',
    })
  } else if (weeklyLossRate !== null && weeklyLossRate < 0.2 && profile.goal === 'lose') {
    actions.push({
      priority: 'medium', icon: '📉',
      title: `Weight barely moving (${weeklyLossRate.toFixed(2)}%/wk)`,
      text: `If fat loss is the goal, try reducing calories by 100–150 kcal or adding 10–15 min of walking. First check food logging is consistent — underlogged entries are the most common cause.`,
    })
  }

  // Sleep
  if (avgSleep !== null && avgSleep < 6) {
    actions.push({
      priority: 'high', icon: '😴',
      title: `Sleep avg ${avgSleep.toFixed(1)}h — affecting fat loss`,
      text: `Less than 6h sleep increases ghrelin (hunger hormone) by ~15% and reduces fat oxidation. Elevated cortisol from sleep debt promotes visceral fat storage and breaks down muscle. Aim for 7–9h.`,
      source: 'Spiegel et al. 1999 + Van Cauter lab research',
    })
  } else if (avgSleep !== null && avgSleep < 7) {
    actions.push({
      priority: 'medium', icon: '😴',
      title: `Sleep avg ${avgSleep.toFixed(1)}h — room to improve`,
      text: `7–9h is the optimal range for body composition. Even getting 30–45 more minutes improves insulin sensitivity and reduces appetite hormones.`,
    })
  }

  // Efficiency insight
  if (efficiencyRatio !== null) {
    if (efficiencyRatio > 1.6) {
      actions.push({
        priority: 'medium', icon: '⚠️',
        title: 'Losing faster than your deficit explains',
        text: `Your deficit predicts ${expectedLossKg?.toFixed(2)}kg/week but you're losing ~${actualWeeklyLossKg?.toFixed(2)}kg/week. The extra loss is likely muscle or water. Increase protein and consider a small calorie increase on training days.`,
        source: 'Hall et al. — Energy balance and body composition',
      })
    } else if (efficiencyRatio < 0.25 && calDays.length >= 5) {
      actions.push({
        priority: 'medium', icon: '🔍',
        title: 'Deficit logged but weight not dropping',
        text: `You're logging a deficit but weight is stable. Most likely: some meals aren't being logged (restaurant meals, drinks, oils). Try tracking everything for 5 days to find the gap.`,
      })
    }
  }

  /* ── BF trend chart ─────────────────────────────────────── */
  useEffect(() => {
    const canvas = bfTrendRef.current
    if (!canvas || bodyFatLogs.length < 2) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = canvas.parentElement!.clientWidth
    const H = canvas.height = 130
    const pad = { t: 10, r: 12, b: 28, l: 38 }
    const vals = bodyFatLogs.map(l => l.body_fat_pct)
    const minV = Math.min(...vals) - 1, maxV = Math.max(...vals) + 1
    const x = (i: number) => pad.l + (i / (vals.length - 1)) * (W - pad.l - pad.r)
    const y = (v: number) => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b)
    const gridColor = dark ? '#1e2d3d' : '#e2e8f0'
    const labelColor = dark ? '#4a6080' : '#94a3b8'
    const dotFill = dark ? '#0f1923' : '#ffffff'

    ctx.clearRect(0, 0, W, H)

    // Goal line
    if (goalPct >= minV && goalPct <= maxV) {
      const gy = y(goalPct)
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(16,185,129,0.5)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W - pad.r, gy); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 9px Inter,sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`${goalPct}%`, pad.l - 3, gy + 3)
    }

    // Grid
    ;[0, 0.5, 1].forEach(t => {
      const yy = pad.t + t * (H - pad.t - pad.b)
      ctx.strokeStyle = gridColor; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r, yy); ctx.stroke()
      ctx.fillStyle = labelColor; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`${(maxV - t * (maxV - minV)).toFixed(1)}%`, pad.l - 4, yy + 4)
    })

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b)
    grad.addColorStop(0, 'rgba(99,102,241,0.2)'); grad.addColorStop(1, 'rgba(99,102,241,0)')
    ctx.beginPath(); ctx.moveTo(x(0), y(vals[0]))
    vals.forEach((v, i) => i > 0 && ctx.lineTo(x(i), y(v)))
    ctx.lineTo(x(vals.length - 1), H - pad.b); ctx.lineTo(x(0), H - pad.b); ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()

    // Line
    ctx.beginPath(); ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    vals.forEach((v, i) => i === 0 ? ctx.moveTo(x(0), y(v)) : ctx.lineTo(x(i), y(v)))
    ctx.stroke()

    // Dots
    vals.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(x(i), y(v), 3.5, 0, Math.PI * 2)
      ctx.fillStyle = '#6366f1'; ctx.fill()
      ctx.beginPath(); ctx.arc(x(i), y(v), 1.8, 0, Math.PI * 2)
      ctx.fillStyle = dotFill; ctx.fill()
    })

    // Date labels — show first, middle, last
    const indices = [0, Math.floor(vals.length / 2), vals.length - 1].filter((v, i, a) => a.indexOf(v) === i)
    ctx.fillStyle = labelColor; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center'
    indices.forEach(i => ctx.fillText(bodyFatLogs[i].date.slice(5), x(i), H - 6))
  })

  if (!latestBF) {
    return (
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
        <div className="text-3xl">📊</div>
        <div>
          <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>No body fat data yet</div>
          <div className="text-xs" style={{ color: 'var(--muted2)' }}>
            Import from Samsung Health (<Link href="/settings" className="underline">Settings → Body Fat CSV</Link>) or use a smart scale that exports data.
          </div>
        </div>
      </div>
    )
  }

  /* ─── Gauge arc helper ───────────────────────────────────── */
  const gaugeMax = gender === 'female' ? 40 : 32
  const gaugePct = Math.min(1, latestBF.body_fat_pct / gaugeMax)
  const gaugeGoalPct = goalPct / gaugeMax

  return (
    <div className="space-y-3">

      {/* ── BF% Status card ──────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="px-5 pt-5 pb-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted2)' }}>📊 Body Composition</div>

          <div className="flex items-center gap-5">
            {/* Circular gauge */}
            <div className="relative flex-shrink-0">
              <svg width="110" height="110" viewBox="0 0 110 110">
                {/* Track */}
                <circle cx="55" cy="55" r="44" fill="none"
                  stroke={dark ? '#1e2d3d' : '#e2e8f0'} strokeWidth="10"
                  strokeDasharray={`${0.75 * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                  strokeDashoffset={`${-0.125 * 2 * Math.PI * 44}`}
                  strokeLinecap="round" transform="rotate(0 55 55)" />
                {/* Goal marker */}
                <circle cx="55" cy="55" r="44" fill="none"
                  stroke="rgba(16,185,129,0.5)" strokeWidth="3"
                  strokeDasharray={`2 ${2 * Math.PI * 44}`}
                  strokeDashoffset={`${-(gaugeGoalPct * 0.75 - 0.125) * 2 * Math.PI * 44}`}
                  transform="rotate(0 55 55)" />
                {/* Value arc */}
                <circle cx="55" cy="55" r="44" fill="none"
                  stroke={cat?.color ?? '#10b981'} strokeWidth="10"
                  strokeDasharray={`${gaugePct * 0.75 * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                  strokeDashoffset={`${-(-0.125) * 2 * Math.PI * 44}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.7s ease' }}
                  transform="rotate(135 55 55)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black leading-none" style={{ color: cat?.color }}>{latestBF.body_fat_pct}%</span>
                <span className="text-[10px] font-bold mt-0.5" style={{ color: cat?.color }}>{cat?.label}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-2.5">
              {bfChange !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black" style={{ color: bfChange < 0 ? '#10b981' : bfChange > 0 ? '#f43f5e' : 'var(--muted2)' }}>
                    {bfChange < 0 ? '↓' : bfChange > 0 ? '↑' : '='}{Math.abs(bfChange)}%
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted2)' }}>vs last reading</span>
                </div>
              )}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted2)' }}>Goal</div>
                <div className="font-black" style={{ color: '#10b981' }}>{goalPct}% <span className="text-xs font-medium" style={{ color: 'var(--muted2)' }}>(Athlete)</span></div>
              </div>
              {weeksToGoal && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted2)' }}>Est. timeline</div>
                  <div className="font-black text-sm" style={{ color: 'var(--text)' }}>~{weeksToGoal} weeks</div>
                </div>
              )}
              {latestBF.muscle_mass_kg && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted2)' }}>Muscle mass</div>
                  <div className="font-black text-sm" style={{ color: '#6366f1' }}>{latestBF.muscle_mass_kg}kg</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BF range legend */}
        <div className="flex mx-5 mb-4 mt-3 h-2 rounded-full overflow-hidden gap-px">
          {(gender === 'female'
            ? [{ w: 13, c: '#6366f1' }, { w: 7, c: '#10b981' }, { w: 4, c: '#34d399' }, { w: 7, c: '#f97316' }, { w: 9, c: '#f43f5e' }]
            : [{ w: 5, c: '#6366f1' }, { w: 8, c: '#10b981' }, { w: 4, c: '#34d399' }, { w: 7, c: '#f97316' }, { w: 8, c: '#f43f5e' }]
          ).map((seg, i) => (
            <div key={i} className="h-full" style={{ flex: seg.w, background: seg.c }} />
          ))}
        </div>
        <div className="flex justify-between px-5 pb-4 text-[10px] font-semibold" style={{ color: 'var(--muted2)' }}>
          <span>Essential</span><span>Athlete</span><span>Fit</span><span>Average</span><span>High</span>
        </div>
      </div>

      {/* ── BF% trend chart ──────────────────────────────── */}
      {bodyFatLogs.length >= 2 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--muted2)' }}>Body Fat Trend</div>
            <div className="text-[10px] font-semibold" style={{ color: '#10b981' }}>— {goalPct}% goal</div>
          </div>
          <div className="overflow-hidden"><canvas ref={bfTrendRef} /></div>
        </div>
      )}

      {/* ── Muscle Preservation Score ─────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--muted2)' }}>💪 Muscle Preservation Score</div>
          <div className="text-2xl font-black" style={{ color: muscleScore >= 80 ? '#10b981' : muscleScore >= 60 ? '#f97316' : '#f43f5e' }}>
            {muscleScore}
          </div>
        </div>
        <div className="space-y-4">
          <ScoreBar
            label="Protein intake"
            score={proteinScore}
            color={proteinScore >= 80 ? '#10b981' : proteinScore >= 60 ? '#f97316' : '#f43f5e'}
            detail={proteinDays.length ? `${Math.round(avgProtein)}g avg / ${proteinGoal}g goal (${proteinDays.length}/7 days logged)` : 'No food logged this week'}
          />
          <ScoreBar
            label="Training frequency"
            score={workoutScore}
            color={workoutScore >= 80 ? '#10b981' : workoutScore >= 50 ? '#f97316' : '#f43f5e'}
            detail={`${realWorkouts}/7 sessions · goal ≥4/week`}
          />
          <ScoreBar
            label="Rate of loss"
            score={lossRateScore}
            color={lossRateScore >= 80 ? '#10b981' : lossRateScore >= 50 ? '#f97316' : '#f43f5e'}
            detail={lossRateDetail}
          />
        </div>

        {/* Fat Loss Efficiency */}
        {efficiencyRatio !== null && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted2)' }}>⚡ Fat Loss Efficiency</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Expected from deficit: <span className="font-bold" style={{ color: 'var(--text)' }}>{expectedLossKg?.toFixed(2)}kg/wk</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Actual loss: <span className="font-bold" style={{ color: 'var(--text)' }}>{actualWeeklyLossKg?.toFixed(2)}kg/wk</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black" style={{ color: efficiencyRatio >= 0.7 && efficiencyRatio <= 1.3 ? '#10b981' : '#f97316' }}>
                  {Math.round(efficiencyRatio * 100)}%
                </div>
                <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>efficiency</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Action items ─────────────────────────────────── */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] pt-1" style={{ color: 'var(--muted2)' }}>🎯 Research-Backed Actions</div>
      {actions.map((a, i) => <ActionCard key={i} {...a} />)}
    </div>
  )
}
