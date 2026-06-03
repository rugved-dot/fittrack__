'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ACTIVITY_OPTIONS = [
  { value: 1.2,  label: 'Sedentary',       sub: 'Little or no exercise' },
  { value: 1.375, label: 'Lightly Active',  sub: '1–3 days/week' },
  { value: 1.55,  label: 'Moderately Active', sub: '3–5 days/week' },
  { value: 1.725, label: 'Very Active',     sub: '6–7 days/week' },
]

const GOAL_OPTIONS = [
  { value: 'lose',     label: '🔥 Lose Fat',      sub: 'Calorie deficit + high protein' },
  { value: 'maintain', label: '⚖️ Maintain',       sub: 'Eat at TDEE, build habits' },
  { value: 'gain',     label: '💪 Build Muscle',   sub: 'Slight surplus + heavy lifting' },
]

function calcTDEE(weight: number, height: number, age: number, gender: 'male' | 'female', activity: number) {
  // Mifflin-St Jeor
  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161
  return Math.round(bmr * activity)
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [activity, setActivity] = useState(1.55)
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('lose')

  const w = parseFloat(weight) || 70
  const h = parseFloat(height) || 170
  const a = parseInt(age) || 25
  const tdee = calcTDEE(w, h, a, gender, activity)

  const goalAdjust = goal === 'lose' ? -500 : goal === 'gain' ? 300 : 0
  const calories = tdee + goalAdjust
  const protein = Math.round(w * 2.2)
  const fat = Math.round(calories * 0.25 / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)

  async function finish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('profiles').upsert({
      id: user.id,
      name: name.trim() || 'Athlete',
      gender,
      goal,
      weight_kg: w,
      target_weight_kg: parseFloat(targetWeight) || w - 5,
      height_cm: Math.round(h),
      age: a,
      calories_goal: calories,
      protein_goal_g: protein,
      carbs_goal_g: carbs,
      fat_goal_g: fat,
    })
    router.push('/dashboard')
  }

  const steps = [
    /* Step 0 – Who are you */
    <div key={0} className="space-y-5">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>Your name</label>
        <input
          autoFocus
          type="text"
          placeholder="E.g. Rugved"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-2xl px-5 py-4 text-lg font-semibold outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#f1f5f9' }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>Age</label>
          <input
            type="number"
            placeholder="25"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full rounded-2xl px-4 py-4 text-lg font-semibold outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#f1f5f9' }}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>Gender</label>
          <div className="grid grid-cols-2 gap-2 h-[58px]">
            {(['male', 'female'] as const).map(g => (
              <button key={g} onClick={() => setGender(g)}
                className="rounded-2xl text-sm font-bold capitalize transition-all"
                style={{
                  background: gender === g ? '#10b981' : 'rgba(255,255,255,0.06)',
                  border: `1.5px solid ${gender === g ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                  color: gender === g ? '#fff' : '#7d8fa3',
                }}>
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,

    /* Step 1 – Body stats */
    <div key={1} className="space-y-4">
      {[
        { label: 'Height (cm)', val: height, set: setHeight, placeholder: '175' },
        { label: 'Current weight (kg)', val: weight, set: setWeight, placeholder: '75' },
        { label: 'Goal weight (kg)', val: targetWeight, set: setTargetWeight, placeholder: '70' },
      ].map(({ label, val, set, placeholder }) => (
        <div key={label}>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>{label}</label>
          <input
            type="number"
            placeholder={placeholder}
            value={val}
            onChange={e => set(e.target.value)}
            className="w-full rounded-2xl px-5 py-4 text-lg font-semibold outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#f1f5f9' }}
          />
        </div>
      ))}
    </div>,

    /* Step 2 – Activity + Goal */
    <div key={2} className="space-y-4">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>Activity level</label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setActivity(opt.value)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                background: activity === opt.value ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${activity === opt.value ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${activity === opt.value ? 'border-[#10b981]' : 'border-[#4a6080]'}`}
                style={{ background: activity === opt.value ? '#10b981' : 'transparent' }} />
              <div>
                <div className="font-bold text-sm" style={{ color: '#f1f5f9' }}>{opt.label}</div>
                <div className="text-xs" style={{ color: '#7d8fa3' }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>Your goal</label>
        <div className="space-y-2">
          {GOAL_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setGoal(opt.value as typeof goal)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                background: goal === opt.value ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${goal === opt.value ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${goal === opt.value ? 'border-[#10b981]' : 'border-[#4a6080]'}`}
                style={{ background: goal === opt.value ? '#10b981' : 'transparent' }} />
              <div>
                <div className="font-bold text-sm" style={{ color: '#f1f5f9' }}>{opt.label}</div>
                <div className="text-xs" style={{ color: '#7d8fa3' }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,

    /* Step 3 – Review / TDEE */
    <div key={3} className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>Your TDEE</div>
        <div className="text-5xl font-black tracking-tight mb-1" style={{ color: '#f1f5f9' }}>
          {tdee}<span className="text-lg font-semibold ml-1" style={{ color: '#7d8fa3' }}>kcal/day</span>
        </div>
        <div className="text-sm" style={{ color: '#7d8fa3' }}>Total Daily Energy Expenditure</div>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7d8fa3' }}>
          {goal === 'lose' ? 'Fat Loss Plan (–500 kcal deficit)' : goal === 'gain' ? 'Muscle Gain Plan (+300 kcal surplus)' : 'Maintenance Plan'}
        </div>

        {[
          { label: 'Calories', value: `${calories} kcal`, color: '#10b981' },
          { label: 'Protein',  value: `${protein}g`,      color: '#6366f1', note: `${(w * 2.2).toFixed(0)}g = 2.2× bodyweight` },
          { label: 'Carbs',    value: `${carbs}g`,         color: '#22d3ee' },
          { label: 'Fat',      value: `${fat}g`,           color: '#f97316' },
        ].map(({ label, value, color, note }) => (
          <div key={label} className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm" style={{ color: '#f1f5f9' }}>{label}</div>
              {note && <div className="text-[11px]" style={{ color: '#4a6080' }}>{note}</div>}
            </div>
            <div className="text-xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-center" style={{ color: '#4a6080' }}>
        You can always adjust these in Settings → Profile
      </div>
    </div>,
  ]

  const titles = [
    "Let's get started 👋",
    'Your body stats',
    'Activity & goal',
    "Your plan is ready 🎯",
  ]
  const subtitles = [
    'FitTrack personalises everything for you.',
    'We use this to calculate your calorie needs.',
    'This determines your daily targets.',
    "Here's what we recommend based on your stats.",
  ]

  const canNext = [
    name.trim().length > 0 && age.length > 0,
    height.length > 0 && weight.length > 0 && targetWeight.length > 0,
    true,
    true,
  ]

  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto px-5 pb-10"
      style={{ background: '#080b0f' }}>

      {/* Progress bar */}
      <div className="pt-14 pb-6">
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? '#10b981' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: '#10b981' }}>
          Step {step + 1} of {steps.length}
        </p>
        <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#f1f5f9' }}>
          {titles[step]}
        </h1>
        <p className="text-sm font-medium" style={{ color: '#7d8fa3' }}>
          {subtitles[step]}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1">
        {steps[step]}
      </div>

      {/* Navigation */}
      <div className="pt-8 space-y-3">
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext[step]}
            className="w-full text-white font-black py-4 rounded-2xl text-sm tracking-[0.1em] uppercase disabled:opacity-30 transition-opacity"
            style={{ background: '#10b981' }}>
            Continue →
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={saving}
            className="w-full text-white font-black py-4 rounded-2xl text-sm tracking-[0.1em] uppercase disabled:opacity-50 transition-opacity"
            style={{ background: '#10b981' }}>
            {saving ? 'Setting up…' : "Let's go! 🚀"}
          </button>
        )}
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="w-full font-bold py-3.5 rounded-2xl text-sm"
            style={{ color: '#4a6080', background: 'transparent' }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
