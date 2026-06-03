'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

interface Profile {
  name: string; weight_kg: number; target_weight_kg: number; height_cm: number; age: number
  calories_goal: number; protein_goal_g: number; carbs_goal_g: number; fat_goal_g: number
}
interface Props { profile: Profile | null }

const SAMSUNG_FILE_MAP: Record<string, string> = {
  'com.samsung.health.weight': 'weight',
  'com.samsung.shealth.sleep': 'sleep',
  'com.samsung.shealth.sleep.combined': 'sleep',
  'com.samsung.health.heart_rate': 'heart_rate',
  'com.samsung.shealth.heart_rate': 'heart_rate',
  'com.samsung.health.step_daily_trend': 'steps',
  'com.samsung.shealth.step_count': 'steps',
  'com.samsung.health.stress': 'stress',
  'com.samsung.shealth.stress': 'stress',
  'com.samsung.health.oxygen_saturation': 'spo2',
  'com.samsung.shealth.oxygen_saturation': 'spo2',
  'com.samsung.health.body_composition': 'body_composition',
  'com.samsung.shealth.body_composition': 'body_composition',
  'com.samsung.shealth.exercise': 'exercise',
  'com.samsung.health.exercise': 'exercise',
}

export default function SettingsClient({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const p = profile ?? { name: 'Rugved', weight_kg: 74, target_weight_kg: 70, height_cm: 175, age: 25, calories_goal: 1900, protein_goal_g: 150, carbs_goal_g: 180, fat_goal_g: 60 }

  const [sleepDate, setSleepDate] = useState(new Date().toISOString().slice(0, 10))
  const [sleepHours, setSleepHours] = useState('')
  const [sleepDeep, setSleepDeep] = useState('')
  const [sleepRem, setSleepRem] = useState('')
  const [sleepScore, setSleepScore] = useState('')
  const [sleepSaving, setSleepSaving] = useState(false)
  const [sleepStatus, setSleepStatus] = useState('')

  const [name, setName] = useState(p.name)
  const [weight, setWeight] = useState(String(p.weight_kg))
  const [targetWeight, setTargetWeight] = useState(String(p.target_weight_kg))
  const [height, setHeight] = useState(String(p.height_cm))
  const [age, setAge] = useState(String(p.age))
  const [calories, setCalories] = useState(String(p.calories_goal))
  const [protein, setProtein] = useState(String(p.protein_goal_g))
  const [carbs, setCarbs] = useState(String(p.carbs_goal_g))
  const [fat, setFat] = useState(String(p.fat_goal_g))
  const [saving, setSaving] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [importColor, setImportColor] = useState('#10b981')

  const tdee = Math.round((10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) + 5) * 1.55)

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id, name, weight_kg: parseFloat(weight), target_weight_kg: parseFloat(targetWeight),
      height_cm: parseInt(height), age: parseInt(age),
      calories_goal: parseInt(calories), protein_goal_g: parseInt(protein),
      carbs_goal_g: parseInt(carbs), fat_goal_g: parseInt(fat),
    })
    setSaving(false)
    alert('Profile saved!')
    router.refresh()
  }

  async function saveSleep() {
    const h = parseFloat(sleepHours)
    if (!sleepDate || isNaN(h) || h < 0 || h > 24) { setSleepStatus('Enter a valid duration (0–24h)'); return }
    setSleepSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('sleep_logs').upsert({
      user_id: user.id,
      date: sleepDate,
      duration_h: +h.toFixed(2),
      deep_h: sleepDeep ? +parseFloat(sleepDeep).toFixed(2) : null,
      rem_h: sleepRem ? +parseFloat(sleepRem).toFixed(2) : null,
      score: sleepScore ? parseInt(sleepScore) : null,
    }, { onConflict: 'user_id,date' })
    setSleepSaving(false)
    setSleepStatus(`✓ Saved ${h}h sleep for ${sleepDate}`)
    setSleepHours(''); setSleepDeep(''); setSleepRem(''); setSleepScore('')
    router.refresh()
  }

  function status(msg: string, color = '#10b981') { setImportStatus(msg); setImportColor(color) }

  async function importFolder(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.name.endsWith('.csv'))
    if (!files.length) { status('No CSV files found in the selected folder.', '#f97316'); return }
    status(`Reading ${files.length} CSV files…`, '#6366f1')
    let total = 0
    const results: string[] = []
    await Promise.all(files.map(async file => {
      const stem = file.name.replace('.csv', '').toLowerCase()
      let dtype: string | null = null
      for (const [k, v] of Object.entries(SAMSUNG_FILE_MAP)) {
        if (stem.includes(k.toLowerCase())) { dtype = v; break }
      }
      if (!dtype) {
        if (stem.includes('weight')) dtype = 'weight'
        else if (stem.includes('sleep')) dtype = 'sleep'
        else if (stem.includes('heart')) dtype = 'heart_rate'
        else if (stem.includes('step')) dtype = 'steps'
        else if (stem.includes('stress')) dtype = 'stress'
        else if (stem.includes('oxygen') || stem.includes('spo2')) dtype = 'spo2'
        else if (stem.includes('body') || stem.includes('composition')) dtype = 'body_composition'
        else if (stem.includes('exercise') || stem.includes('activity')) dtype = 'exercise'
      }
      if (!dtype) return
      const text = await file.text()
      const n = await parseSamsungCSV(text, dtype)
      if (n > 0) results.push(`${dtype}:${n}`)
      total += n
    }))
    status(total ? `✓ ${total} records imported (${results.join(', ')})` : 'No matching data found in folder.', total ? '#10b981' : '#f97316')
    if (total) router.refresh()
  }

  async function importZip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    status('Reading ZIP…', '#6366f1')
    // @ts-ignore
    if (!window.JSZip) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
        s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load JSZip'))
        document.head.appendChild(s)
      }).catch(() => { status('Could not load ZIP library. Try individual CSV import.', '#f43f5e'); return })
    }
    try {
      // @ts-ignore
      const zip = await window.JSZip.loadAsync(file)
      const tasks: Promise<void>[] = []; let total = 0; const results: string[] = []
      zip.forEach((path: string, entry: any) => {
        if (!path.endsWith('.csv')) return
        const stem = path.split('/').pop()!.replace('.csv', '').toLowerCase()
        let dtype: string | null = null
        for (const [k, v] of Object.entries(SAMSUNG_FILE_MAP)) {
          if (stem.includes(k.toLowerCase())) { dtype = v; break }
        }
        if (!dtype) {
          if (stem.includes('weight')) dtype = 'weight'
          else if (stem.includes('sleep')) dtype = 'sleep'
          else if (stem.includes('heart')) dtype = 'heart_rate'
          else if (stem.includes('step')) dtype = 'steps'
          else if (stem.includes('stress')) dtype = 'stress'
          else if (stem.includes('oxygen') || stem.includes('spo2')) dtype = 'spo2'
          else if (stem.includes('body') || stem.includes('composition')) dtype = 'body_composition'
          else if (stem.includes('exercise') || stem.includes('activity')) dtype = 'exercise'
        }
        if (!dtype) return
        tasks.push(entry.async('string').then(async (text: string) => {
          const n = await parseSamsungCSV(text, dtype!)
          if (n > 0) results.push(`${dtype}:${n}`)
          total += n
        }))
      })
      await Promise.all(tasks)
      status(total ? `✓ ${total} records imported (${results.join(', ')})` : 'No matching data found — try individual CSV import.', total ? '#10b981' : '#f97316')
      if (total) router.refresh()
    } catch (e: any) {
      status('Error: ' + e.message, '#f43f5e')
    }
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>, dtype: string) {
    const file = e.target.files?.[0]; if (!file) return
    status('Reading…', '#6366f1')
    const text = await file.text()
    const n = await parseSamsungCSV(text, dtype)
    status(`✓ ${dtype}: ${n} records`, '#10b981')
    if (n > 0) router.refresh()
  }

  async function parseSamsungCSV(text: string, dtype: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    if (lines.length < 2) return 0
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    function row(line: string): Record<string, string> {
      const r: Record<string, string> = {}; const cols: string[] = []; let cur = '', inQ = false
      for (const ch of line + ',') {
        if (ch === '"') inQ = !inQ
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
        else cur += ch
      }
      headers.forEach((h, i) => r[h] = cols[i] || '')
      return r
    }
    function dateOf(r: Record<string, string>) {
      return (r['start_time'] || r['create_time'] || r['date'] || r['time'] || '').slice(0, 10)
    }
    let count = 0
    const records: any[] = []
    if (dtype === 'weight') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const w = parseFloat(r['weight'] || r['kg'] || '')
        if (!date || isNaN(w) || w < 30 || w > 300) return
        records.push({ user_id: user.id, date, weight_kg: w }); count++
      })
      if (records.length) await supabase.from('weight_logs').upsert(records, { onConflict: 'user_id,date' })
    } else if (dtype === 'sleep') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const raw = parseFloat(r['sleep_duration'] || r['total_sleep_time'] || r['duration'] || '')
        if (!date || isNaN(raw)) return
        const h = raw > 100 ? raw / 3600000 : raw > 24 ? raw / 60 : raw
        records.push({ user_id: user.id, date, duration_h: +h.toFixed(2),
          deep_h: +(parseFloat(r['deep_sleep'] || r['deep_sleep_time'] || '0') / (raw > 100 ? 3600000 : raw > 24 ? 60 : 1)).toFixed(2),
          rem_h: +(parseFloat(r['rem_sleep'] || r['rem_sleep_time'] || '0') / (raw > 100 ? 3600000 : raw > 24 ? 60 : 1)).toFixed(2),
          score: parseInt(r['sleep_score'] || r['score'] || '0') || null })
        count++
      })
      if (records.length) await supabase.from('sleep_logs').upsert(records, { onConflict: 'user_id,date' })
    } else if (dtype === 'heart_rate') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const avg = parseFloat(r['heart_rate'] || r['avg'] || r['mean_heart_rate'] || '')
        if (!date || isNaN(avg)) return
        records.push({ user_id: user.id, date, avg: Math.round(avg),
          min: parseInt(r['min_heart_rate'] || r['min'] || '0') || null,
          max: parseInt(r['max_heart_rate'] || r['max'] || '0') || null,
          resting: parseInt(r['resting_heart_rate'] || '0') || null })
        count++
      })
      if (records.length) await supabase.from('heart_rate_logs').upsert(records, { onConflict: 'user_id,date' })
    } else if (dtype === 'steps') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const steps = parseInt(r['count'] || r['step_count'] || r['steps'] || '')
        if (!date || isNaN(steps)) return
        records.push({ user_id: user.id, date, steps,
          distance_km: +(parseFloat(r['distance'] || '0') / 1000).toFixed(2),
          calories: parseInt(r['calorie'] || r['calories'] || '0') || null })
        count++
      })
      if (records.length) await supabase.from('step_logs').upsert(records, { onConflict: 'user_id,date' })
    } else if (dtype === 'stress') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const avg = parseFloat(r['stress_score'] || r['score_avg'] || r['avg'] || r['mean'] || '')
        if (!date || isNaN(avg)) return
        records.push({ user_id: user.id, date, avg: Math.round(avg), max: parseInt(r['max'] || r['score_max'] || '0') || null })
        count++
      })
      if (records.length) await supabase.from('stress_logs').upsert(records, { onConflict: 'user_id,date' })
    } else if (dtype === 'spo2') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const avg = parseFloat(r['spo2'] || r['oxygen_saturation'] || r['mean'] || r['avg'] || '')
        if (!date || isNaN(avg)) return
        records.push({ user_id: user.id, date, avg: +avg.toFixed(1), min: parseFloat(r['min'] || '0') || null })
        count++
      })
      if (records.length) await supabase.from('spo2_logs').upsert(records, { onConflict: 'user_id,date' })
    } else if (dtype === 'body_composition') {
      lines.slice(1).forEach(line => {
        const r = row(line); const date = dateOf(r)
        const bf = parseFloat(r['body_fat'] || r['fat_mass_percent'] || r['body_fat_percent'] || '')
        if (!date || isNaN(bf)) return
        records.push({ user_id: user.id, date, body_fat_pct: +bf.toFixed(1),
          muscle_mass_kg: +parseFloat(r['muscle_mass'] || r['skeletal_muscle_mass'] || '0').toFixed(1) || null,
          bmi: +parseFloat(r['bmi'] || '0').toFixed(1) || null })
        count++
      })
      if (records.length) await supabase.from('body_fat_logs').upsert(records, { onConflict: 'user_id,date' })
    }
    return count
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const csvButtons = [
    { label: '⚖️ Weight', dtype: 'weight' },
    { label: '😴 Sleep', dtype: 'sleep' },
    { label: '❤️ Heart Rate', dtype: 'heart_rate' },
    { label: '👟 Steps', dtype: 'steps' },
    { label: '🧠 Stress', dtype: 'stress' },
    { label: '🫁 SpO₂', dtype: 'spo2' },
    { label: '📊 Body Fat', dtype: 'body_composition' },
  ]

  const fieldCls = "w-full rounded-xl px-4 py-3 text-sm font-medium"

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-12 pb-8"
        style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, var(--bg) 65%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--muted2)', transform: 'translate(35%,-35%)' }} />
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--muted2)' }}>Account</p>
        <h1 className="text-4xl font-black tracking-tight mb-1.5" style={{ color: 'var(--text)' }}>Profile</h1>
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Goals · Metrics · Samsung Health</p>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* ── Appearance ───────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted2)' }}>Appearance</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{dark ? 'Dark Mode' : 'Light Mode'}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted2)' }}>{dark ? 'Switch to light theme' : 'Switch to dark theme'}</div>
            </div>
            <button
              onClick={toggle}
              className="relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0"
              style={{ background: dark ? '#10b981' : 'var(--border2)' }}
              aria-label="Toggle theme"
            >
              <span
                className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform duration-300"
                style={{
                  background: 'var(--surface)',
                  transform: dark ? 'translateX(28px)' : 'translateX(0)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              >
                {dark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Personal info ─────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted2)' }}>Personal Info</div>
          <div className="space-y-3">
            {[
              { label: 'Name', val: name, set: setName, type: 'text' },
              { label: 'Current Weight (kg)', val: weight, set: setWeight, type: 'number' },
              { label: 'Target Weight (kg)', val: targetWeight, set: setTargetWeight, type: 'number' },
              { label: 'Height (cm)', val: height, set: setHeight, type: 'number' },
              { label: 'Age', val: age, set: setAge, type: 'number' },
            ].map(({ label, val, set, type }) => (
              <div key={label}>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>{label}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)} className={fieldCls} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Daily targets ─────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted2)' }}>Daily Targets</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories (kcal)', val: calories, set: setCalories, color: '#10b981' },
              { label: 'Protein (g)', val: protein, set: setProtein, color: '#6366f1' },
              { label: 'Carbs (g)', val: carbs, set: setCarbs, color: '#22d3ee' },
              { label: 'Fat (g)', val: fat, set: setFat, color: '#f97316' },
            ].map(({ label, val, set, color }) => (
              <div key={label}>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color }}>{label}</label>
                <input type="number" value={val} onChange={e => set(e.target.value)} className={fieldCls} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving}
          className="w-full text-white font-black py-4 rounded-2xl text-sm tracking-[0.1em] uppercase disabled:opacity-50"
          style={{ background: '#10b981' }}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>

        {/* ── TDEE calculator ───────────────────────── */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--hero-indigo) 0%, var(--bg) 100%)', border: '1px solid rgba(99,102,241,0.15)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ background: '#6366f1', transform: 'translate(30%,-30%)' }} />
          <div className="relative">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--muted2)' }}>TDEE Calculator</div>
            <div className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              {age}y · {height}cm · {weight}kg · moderate activity
            </div>
            <div className="text-4xl font-black mb-1" style={{ color: 'var(--text)' }}>{tdee}<span className="text-sm font-semibold ml-1" style={{ color: 'var(--muted2)' }}>kcal/day</span></div>
            <div className="text-sm font-medium mt-3" style={{ color: 'var(--muted)' }}>
              Fat loss target: <span className="font-bold" style={{ color: '#6366f1' }}>{tdee - 500} kcal/day</span>
            </div>
            <div className="text-sm font-medium mt-1" style={{ color: 'var(--muted)' }}>
              Protein goal: <span className="font-bold" style={{ color: '#6366f1' }}>{Math.round(parseFloat(weight) * 2)}g/day</span>
            </div>
          </div>
        </div>

        {/* ── Manual sleep log ─────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--muted2)' }}>😴 Manual Sleep Log</div>
          <div className="text-sm font-medium mt-2 mb-4" style={{ color: 'var(--muted)' }}>
            Log sleep manually if your watch import isn't working.
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>Date</label>
              <input type="date" value={sleepDate} onChange={e => setSleepDate(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#10b981' }}>Total sleep (hours) *</label>
              <input type="number" step="0.5" placeholder="e.g. 7.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className={fieldCls} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>Deep (h)</label>
                <input type="number" step="0.1" placeholder="1.5" value={sleepDeep} onChange={e => setSleepDeep(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>REM (h)</label>
                <input type="number" step="0.1" placeholder="2.0" value={sleepRem} onChange={e => setSleepRem(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>Score</label>
                <input type="number" placeholder="85" value={sleepScore} onChange={e => setSleepScore(e.target.value)} className={fieldCls} />
              </div>
            </div>
          </div>
          <button onClick={saveSleep} disabled={sleepSaving}
            className="w-full mt-4 text-white font-black py-3.5 rounded-xl text-sm tracking-[0.08em] uppercase disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            {sleepSaving ? 'Saving…' : '+ Log Sleep'}
          </button>
          {sleepStatus && (
            <div className="mt-3 text-sm font-semibold px-4 py-3 rounded-xl"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: '#10b981' }}>
              {sleepStatus}
            </div>
          )}
        </div>

        {/* ── Samsung Health import ─────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--muted2)' }}>⌚ Samsung Health</div>
          <div className="text-sm font-medium leading-relaxed mb-4 mt-2" style={{ color: 'var(--muted)' }}>
            Samsung Health → profile photo → <span className="font-semibold" style={{ color: 'var(--text)' }}>Settings → Download personal data</span>. You'll get a folder or ZIP — both work below.
          </div>

          {/* Folder import — primary for phone users */}
          <label className="block mb-3 cursor-pointer">
            <input type="file" accept=".csv" multiple
              // @ts-ignore
              webkitdirectory=""
              onChange={importFolder}
              className="hidden" />
            <div className="text-white font-black py-4 rounded-2xl text-center text-sm tracking-[0.08em] uppercase"
              style={{ background: '#10b981' }}>
              📁 Import Samsung Folder
            </div>
          </label>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-center mb-3" style={{ color: 'var(--muted2)' }}>
            — or if you have the ZIP file —
          </div>

          <label className="block mb-4 cursor-pointer">
            <input type="file" accept=".zip" onChange={importZip} className="hidden" />
            <div className="font-black py-3.5 rounded-2xl text-center text-sm tracking-[0.08em] uppercase"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              📦 Import ZIP File
            </div>
          </label>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-center mb-3" style={{ color: 'var(--muted2)' }}>
            — or pick individual CSV files —
          </div>

          <div className="grid grid-cols-2 gap-2">
            {csvButtons.map(({ label, dtype }) => (
              <label key={dtype} className="cursor-pointer">
                <input type="file" accept=".csv" onChange={e => importCSV(e, dtype)} className="hidden" />
                <div className="py-2.5 rounded-xl text-center text-sm font-semibold"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                  {label}
                </div>
              </label>
            ))}
          </div>

          {importStatus && (
            <div className="mt-4 text-sm font-semibold px-4 py-3 rounded-xl"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: importColor }}>
              {importStatus}
            </div>
          )}
        </div>

        {/* ── Sign out ──────────────────────────────── */}
        <button onClick={signOut}
          className="w-full font-bold py-4 rounded-2xl text-sm tracking-wide"
          style={{ background: 'rgba(244,63,94,0.05)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
