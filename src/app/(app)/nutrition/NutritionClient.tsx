'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FOODS_DB, FOOD_CATEGORIES, type FoodItem } from '@/lib/constants'
import { useRouter } from 'next/navigation'

interface FoodLog { id: string; name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }
interface Profile { calories_goal: number; protein_goal_g: number; carbs_goal_g: number; fat_goal_g: number }
interface Props { foodLogs: FoodLog[]; profile: Profile | null; waterMl: number }
interface ScanResult { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; serving: string; confidence: 'high' | 'medium' | 'low' }

const today = () => new Date().toISOString().slice(0, 10)
const WATER_GOAL_ML = 2500
const WATER_PRESETS = [150, 250, 350, 500]

function MacroBar({ val, goal, color }: { val: number; goal: number; color: string }) {
  const pct = Math.min(100, (val / goal) * 100)
  return (
    <div>
      <div className="text-xl font-black tracking-tight" style={{ color }}>{Math.round(val)}g</div>
      <div className="h-1 rounded-full mt-1 mb-1 overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

const confidenceStyle = {
  high:   { color: '#059669', bg: 'rgba(5,150,105,0.08)',   label: 'High confidence' },
  medium: { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  label: 'Medium confidence' },
  low:    { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   label: 'Low confidence — review values' },
}

export default function NutritionClient({ foodLogs, profile, waterMl: initialWaterMl }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const cameraRef = useRef<HTMLInputElement>(null)
  const p = profile ?? { calories_goal: 1900, protein_goal_g: 150, carbs_goal_g: 180, fat_goal_g: 60 }

  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [customName, setCustomName] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [customP, setCustomP] = useState('')
  const [customC, setCustomC] = useState('')
  const [customF, setCustomF] = useState('')

  const [waterMl, setWaterMl] = useState(initialWaterMl)
  const [waterSaving, setWaterSaving] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState('')
  const [scanPreview, setScanPreview] = useState('')

  const totals = foodLogs.reduce(
    (s, f) => ({ cal: s.cal + f.calories, p: s.p + f.protein_g, c: s.c + f.carbs_g, f: s.f + f.fat_g }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )
  const calPct = Math.min(100, (totals.cal / p.calories_goal) * 100)
  const over = totals.cal > p.calories_goal

  async function addFood(food: Omit<FoodLog, 'id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('food_logs').insert({ ...food, user_id: user.id, date: today() })
    setShowModal(false)
    setSearch('')
    clearScan()
    router.refresh()
  }

  async function removeFood(id: string) {
    await supabase.from('food_logs').delete().eq('id', id)
    router.refresh()
  }

  async function addCustomFood() {
    if (!customName || !customCal) return alert('Enter name and calories')
    await addFood({
      name: customName,
      calories: parseFloat(customCal),
      protein_g: parseFloat(customP) || 0,
      carbs_g: parseFloat(customC) || 0,
      fat_g: parseFloat(customF) || 0,
    })
    setCustomName(''); setCustomCal(''); setCustomP(''); setCustomC(''); setCustomF('')
  }

  async function addWater(ml: number) {
    const newTotal = Math.max(0, waterMl + ml)
    setWaterMl(newTotal)
    setWaterSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('water_logs').upsert(
        { user_id: user.id, date: today(), amount_ml: newTotal },
        { onConflict: 'user_id,date' }
      )
    } finally {
      setWaterSaving(false)
    }
  }

  function clearScan() {
    setScanResult(null)
    setScanError('')
    setScanPreview('')
  }

  function openModal() {
    clearScan()
    setShowModal(true)
  }

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => setScanPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setScanning(true)
    setScanError('')
    setScanResult(null)
    if (!showModal) setShowModal(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const base64 = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
      const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        const msg: string = data.error ?? ''
        if (res.status === 401 || msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('api key')) {
          setScanError('API key invalid — check your .env.local file')
        } else if (res.status === 402 || msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('balance') || msg.toLowerCase().includes('billing')) {
          setScanError('Out of API credits — top up at console.anthropic.com/settings/billing')
        } else if (res.status === 429 || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
          setScanError('Rate limited — wait a moment and try again')
        } else if (res.status === 422 || msg.toLowerCase().includes('no food')) {
          setScanError('No food detected — try a clearer photo')
        } else if (res.status >= 500) {
          setScanError('Server error — please try again')
        } else {
          setScanError(msg || 'Could not analyse image')
        }
      } else {
        setScanResult(data as ScanResult)
        setCustomName(data.name)
        setCustomCal(String(Math.round(data.calories)))
        setCustomP(String(Math.round(data.protein_g)))
        setCustomC(String(Math.round(data.carbs_g)))
        setCustomF(String(Math.round(data.fat_g)))
      }
    } catch {
      setScanError('Network error — check your connection')
    } finally {
      setScanning(false)
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const results: FoodItem[] = FOODS_DB.filter(f => {
    const matchCat = category === 'All' || f.category === category
    const matchSearch = search.length < 2 || f.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }).slice(0, 30)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hidden camera input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* ── Header ────────────────────────────────── */}
      <div className="px-5 pt-10 pb-5 hero-grad-green">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: '#10b981' }}>Daily Tracking</p>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Nutrition</h1>
      </div>

      <div className="px-4 space-y-3 pb-8">

        {/* ── Calorie summary ───────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex justify-between items-baseline mb-3">
            <div>
              <div className="text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{Math.round(totals.cal)}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted2)' }}>of {p.calories_goal} kcal goal</div>
            </div>
            <div className="text-sm font-bold px-3 py-1.5 rounded-lg"
              style={{
                color: over ? '#f43f5e' : '#059669',
                background: over ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
              }}>
              {over ? `+${Math.round(totals.cal - p.calories_goal)} over` : `${Math.round(p.calories_goal - totals.cal)} left`}
            </div>
          </div>

          <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${calPct}%`, background: over ? '#f43f5e' : '#10b981' }} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <MacroBar val={totals.p} goal={p.protein_goal_g} color="#6366f1" />
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Protein · {p.protein_goal_g}g</div>
            </div>
            <div>
              <MacroBar val={totals.c} goal={p.carbs_goal_g} color="#22d3ee" />
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Carbs · {p.carbs_goal_g}g</div>
            </div>
            <div>
              <MacroBar val={totals.f} goal={p.fat_goal_g} color="#f97316" />
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted2)' }}>Fat · {p.fat_goal_g}g</div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={openModal}
            className="text-white font-black py-4 rounded-2xl text-sm tracking-[0.08em] uppercase"
            style={{ background: '#10b981' }}>
            + Add Food
          </button>
          <button onClick={() => cameraRef.current?.click()}
            className="font-black py-4 rounded-2xl text-sm tracking-[0.08em] uppercase flex items-center justify-center gap-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', boxShadow: 'var(--shadow-sm)' }}>
            <CameraIcon />
            Scan Food
          </button>
        </div>

        {/* ── Water tracker ─────────────────────────── */}
        {(() => {
          const pct = Math.min(100, (waterMl / WATER_GOAL_ML) * 100)
          const glasses = Math.round(waterMl / 250)
          const goalGlasses = Math.round(WATER_GOAL_ML / 250)
          const done = waterMl >= WATER_GOAL_ML
          return (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💧</span>
                  <div>
                    <div className="text-sm font-black" style={{ color: 'var(--text)' }}>
                      {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(1)}L` : `${waterMl}ml`}
                      <span className="text-xs font-semibold ml-1.5" style={{ color: 'var(--muted2)' }}>
                        / {WATER_GOAL_ML / 1000}L goal
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--muted2)' }}>
                      {glasses} of {goalGlasses} glasses {done ? '🎉' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black" style={{ color: done ? '#10b981' : '#22d3ee' }}>
                  {Math.round(pct)}%
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface2)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: done ? '#10b981' : 'linear-gradient(90deg, #22d3ee, #0ea5e9)' }} />
              </div>
              <div className="flex gap-2">
                {WATER_PRESETS.map(ml => (
                  <button key={ml} onClick={() => addWater(ml)} disabled={waterSaving}
                    className="flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-opacity"
                    style={{
                      background: 'rgba(34,211,238,0.07)',
                      color: '#0891b2',
                      border: '1px solid rgba(34,211,238,0.2)',
                      opacity: waterSaving ? 0.5 : 1,
                    }}>
                    +{ml < 1000 ? `${ml}` : `${ml / 1000}L`}
                  </button>
                ))}
                {waterMl > 0 && (
                  <button onClick={() => addWater(-250)} disabled={waterSaving}
                    className="px-3 py-2 rounded-xl text-xs font-black"
                    style={{ background: 'var(--surface2)', color: 'var(--muted2)', border: '1px solid var(--border)' }}>
                    −
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── Food log ──────────────────────────────── */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] pt-1" style={{ color: 'var(--muted2)' }}>Today's Log</div>

        {foodLogs.length === 0 ? (
          <div className="text-center py-14 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-3">🍽️</div>
            <div className="font-bold" style={{ color: 'var(--text)' }}>No food logged yet</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted2)' }}>Tap "Add Food" or scan a meal</div>
          </div>
        ) : (
          foodLogs.map(f => (
            <div key={f.id} className="flex items-center justify-between rounded-2xl px-4 py-3.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{f.name}</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--muted2)' }}>
                  {f.calories} kcal · P {f.protein_g}g · C {f.carbs_g}g · F {f.fat_g}g
                </div>
              </div>
              <button onClick={() => removeFood(f.id)}
                className="text-xs px-2.5 py-1 rounded-lg ml-3 font-semibold flex-shrink-0"
                style={{ background: 'rgba(244,63,94,0.07)', color: '#f43f5e' }}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* ── Add Food Modal ────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '92vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-lg font-black" style={{ color: 'var(--text)' }}>Add Food</div>
              <div className="flex items-center gap-2">
                <button onClick={() => cameraRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CameraIcon size={14} />
                  Scan
                </button>
                <button onClick={() => { setShowModal(false); clearScan() }}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── Scan result card ─────────────────── */}
              {(scanning || scanResult || scanError || scanPreview) && (
                <div className="px-5 pt-4">
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>

                    <div className="relative">
                      {scanPreview && (
                        <img src={scanPreview} alt="Scanned food"
                          className="w-full object-cover"
                          style={{ maxHeight: 180 }} />
                      )}
                      {scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
                          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
                          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Analysing…</span>
                        </div>
                      )}
                    </div>

                    {scanError && (
                      <div className="px-4 py-4">
                        <div className="rounded-xl px-4 py-3 flex items-start gap-3"
                          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                          <span className="text-base mt-0.5 shrink-0">⚠️</span>
                          <span className="text-sm font-medium leading-snug flex-1" style={{ color: '#f43f5e' }}>{scanError}</span>
                          <button onClick={clearScan}
                            className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {scanResult && !scanning && (
                      <div className="px-4 py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-base leading-tight" style={{ color: 'var(--text)' }}>{scanResult.name}</div>
                            <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--muted2)' }}>{scanResult.serving}</div>
                          </div>
                          <div className="flex-shrink-0 ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background: confidenceStyle[scanResult.confidence].bg,
                              color: confidenceStyle[scanResult.confidence].color,
                            }}>
                            {confidenceStyle[scanResult.confidence].label}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[
                            { label: 'Cal', val: Math.round(scanResult.calories), color: '#10b981' },
                            { label: 'Protein', val: `${Math.round(scanResult.protein_g)}g`, color: '#6366f1' },
                            { label: 'Carbs', val: `${Math.round(scanResult.carbs_g)}g`, color: '#22d3ee' },
                            { label: 'Fat', val: `${Math.round(scanResult.fat_g)}g`, color: '#f97316' },
                          ].map(m => (
                            <div key={m.label} className="rounded-xl p-2 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                              <div className="text-base font-black" style={{ color: m.color }}>{m.val}</div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted2)' }}>{m.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => addFood({
                              name: scanResult.name,
                              calories: Math.round(scanResult.calories),
                              protein_g: Math.round(scanResult.protein_g),
                              carbs_g: Math.round(scanResult.carbs_g),
                              fat_g: Math.round(scanResult.fat_g),
                            })}
                            className="flex-1 text-white font-black py-3 rounded-xl text-sm tracking-[0.08em] uppercase"
                            style={{ background: '#10b981' }}>
                            Log This
                          </button>
                          <button onClick={clearScan}
                            className="px-4 py-3 rounded-xl text-sm font-semibold"
                            style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {scanResult && (
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-center my-3" style={{ color: 'var(--border2)' }}>
                      — or edit values below before logging —
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              {!scanResult && !scanning && (
                <>
                  <div className="px-5 pt-4 pb-3">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search 150+ foods…"
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium" />
                  </div>

                  {/* Category pills */}
                  <div className="px-5 pb-3 overflow-x-auto">
                    <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                      {FOOD_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                          style={{
                            background: category === cat ? '#10b981' : 'var(--surface2)',
                            color: category === cat ? '#fff' : 'var(--muted)',
                            border: `1px solid ${category === cat ? '#10b981' : 'var(--border)'}`,
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  <div className="px-5 space-y-2 pb-2">
                    {results.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--muted2)' }}>No results found</div>
                    ) : (
                      results.map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{f.name}</div>
                            <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--muted2)' }}>
                              {f.calories} kcal · P {f.protein_g}g · C {f.carbs_g}g · F {f.fat_g}g
                            </div>
                          </div>
                          <button
                            onClick={() => addFood({ name: f.name, calories: f.calories, protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g })}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold shrink-0"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                            + Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Custom food entry */}
              <div className="px-5 pt-2 pb-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--muted2)' }}>
                  {scanResult ? 'Edit & Confirm' : 'Custom Food'}
                </div>
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Food name"
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium mb-2" />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {([
                    ['Calories', customCal, setCustomCal, '#10b981'],
                    ['Protein (g)', customP, setCustomP, '#6366f1'],
                    ['Carbs (g)', customC, setCustomC, '#22d3ee'],
                    ['Fat (g)', customF, setCustomF, '#f97316'],
                  ] as [string, string, (v: string) => void, string][]).map(([label, val, setter, color]) => (
                    <div key={label}>
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color }}>{label}</div>
                      <input type="number" value={val}
                        onChange={e => setter(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl px-3 py-2.5 text-sm font-medium" />
                    </div>
                  ))}
                </div>
                <button onClick={addCustomFood}
                  className="w-full text-white font-black py-4 rounded-2xl text-sm tracking-[0.08em] uppercase"
                  style={{ background: scanResult ? '#6366f1' : '#10b981' }}>
                  {scanResult ? 'Log Edited Values' : 'Add Custom Food'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
