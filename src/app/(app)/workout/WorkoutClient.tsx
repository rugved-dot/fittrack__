'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ALL_EXERCISES, EXERCISE_LIBRARY } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

interface SetData { weight: number; reps: number; done: boolean }
interface ExerciseData { name: string; sets: SetData[]; isCustom?: boolean }
interface WorkoutLog { id: string; date: string; template_name: string; exercises: ExerciseData[] }
interface TemplateExercise { name: string; sets: number; reps: number }
interface Props { workoutLogs: WorkoutLog[]; templates: Record<string, TemplateExercise[]> }

const today = () => new Date().toISOString().slice(0, 10)

function templateMeta(name: string, dark: boolean) {
  const n = name.toLowerCase()
  if (n.includes('push') || n.includes('chest'))
    return {
      grad: dark ? 'linear-gradient(135deg, #1e1535 0%, #251a48 100%)' : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      accent: '#7c3aed', border: 'rgba(124,58,237,0.18)', glow: 'rgba(124,58,237,0.1)', muscles: 'Chest · Shoulders · Triceps',
    }
  if (n.includes('pull') || n.includes('back'))
    return {
      grad: dark ? 'linear-gradient(135deg, #0f1e35 0%, #162540 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      accent: '#1d4ed8', border: 'rgba(29,78,216,0.18)', glow: 'rgba(29,78,216,0.1)', muscles: 'Back · Biceps · Rear Delts',
    }
  if (n.includes('leg') || n.includes('lower'))
    return {
      grad: dark ? 'linear-gradient(135deg, #0a1e18 0%, #0f2820 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      accent: '#059669', border: 'rgba(5,150,105,0.2)', glow: 'rgba(5,150,105,0.1)', muscles: 'Quads · Hamstrings · Glutes',
    }
  if (n.includes('upper'))
    return {
      grad: dark ? 'linear-gradient(135deg, #1e1208 0%, #261808 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
      accent: '#ea580c', border: 'rgba(234,88,12,0.18)', glow: 'rgba(234,88,12,0.1)', muscles: 'Upper Body Compound',
    }
  if (n.includes('arm'))
    return {
      grad: dark ? 'linear-gradient(135deg, #1a0f2e 0%, #22143a 100%)' : 'linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)',
      accent: '#9333ea', border: 'rgba(147,51,234,0.18)', glow: 'rgba(147,51,234,0.1)', muscles: 'Biceps · Triceps',
    }
  return {
    grad: dark ? 'linear-gradient(135deg, #0d1228 0%, #131830 100%)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    accent: '#4f46e5', border: 'rgba(79,70,229,0.18)', glow: 'rgba(79,70,229,0.1)', muscles: 'Full Training Session',
  }
}

export default function WorkoutClient({ workoutLogs, templates }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [exercises, setExercises] = useState<ExerciseData[]>([])
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showAddEx, setShowAddEx] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const [exCat, setExCat] = useState('')
  const [viewLog, setViewLog] = useState<WorkoutLog | null>(null)
  const [saving, setSaving] = useState(false)

  const todayWorkout = workoutLogs.find(w => w.date === today())

  function startWorkout(template: string) {
    const lastSession = workoutLogs.find(w => w.template_name === template)
    const exs: ExerciseData[] = templates[template].map(t => {
      const prev = lastSession?.exercises?.find(e => e.name === t.name)
      return {
        name: t.name,
        sets: Array.from({ length: t.sets }, (_, i) => ({
          weight: prev?.sets?.[i]?.weight ?? 0,
          reps: prev?.sets?.[i]?.reps ?? t.reps,
          done: false,
        })),
      }
    })
    setActiveTemplate(template)
    setExercises(exs)
    setShowWorkoutModal(true)
  }

  function updateSet(ei: number, si: number, field: 'weight' | 'reps' | 'done', val: number | boolean) {
    setExercises(prev => prev.map((ex, i) =>
      i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => j !== si ? s : { ...s, [field]: val }) }
    ))
  }

  function addSet(ei: number) {
    setExercises(prev => prev.map((ex, i) =>
      i !== ei ? ex : { ...ex, sets: [...ex.sets, { weight: 0, reps: 10, done: false }] }
    ))
  }

  function removeExercise(ei: number) {
    setExercises(prev => prev.filter((_, i) => i !== ei))
  }

  function addExerciseToSession(name: string, sets = 3, reps = 10) {
    setExercises(prev => [...prev, { name, sets: Array.from({ length: sets }, () => ({ weight: 0, reps, done: false })), isCustom: true }])
    setShowAddEx(false)
  }

  async function saveWorkout() {
    if (!activeTemplate) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('workout_logs').upsert({
      user_id: user.id,
      date: today(),
      template_name: activeTemplate,
      exercises: exercises.map(({ isCustom: _, ...ex }) => ex),
    }, { onConflict: 'user_id,date,template_name' })
    setSaving(false)
    setShowWorkoutModal(false)
    router.refresh()
  }

  async function deleteWorkout(id: string) {
    if (!confirm('Delete this workout?')) return
    await supabase.from('workout_logs').delete().eq('id', id)
    router.refresh()
  }

  const filteredExercises = ALL_EXERCISES.filter(ex =>
    (!exCat || ex.cat === exCat) &&
    (!exSearch || ex.name.toLowerCase().includes(exSearch.toLowerCase()))
  )

  function overloadBadge(w: WorkoutLog) {
    const prev = workoutLogs.find(x => x.template_name === w.template_name && x.date < w.date)
    if (!prev) return null
    const vol = (log: WorkoutLog) => log.exercises.reduce((s, e) => s + e.sets.reduce((ss, st) => ss + (st.weight || 0) * (st.reps || 0), 0), 0)
    const diff = vol(w) - vol(prev)
    if (diff > 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>↑ +{diff}kg</span>
    if (diff < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>↓ {diff}kg</span>
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>= Same</span>
  }

  const activeMeta = activeTemplate ? templateMeta(activeTemplate, dark) : templateMeta('', dark)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-12 pb-8 hero-grad-green">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: '#10b981', transform: 'translate(40%,-40%)' }} />
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: '#10b981' }}>PPL PROGRAM</p>
        <h1 className="text-4xl font-black tracking-tight mb-1.5" style={{ color: 'var(--text)' }}>Train Hard.</h1>
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          {Object.keys(templates).length} templates · {workoutLogs.length} sessions logged
        </p>

        {todayWorkout && (
          <div className="flex items-center gap-3 mt-5 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
            <span className="text-sm font-bold flex-1" style={{ color: '#059669' }}>
              Trained today · {todayWorkout.template_name}
            </span>
            <button onClick={() => deleteWorkout(todayWorkout.id)}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>Delete</button>
          </div>
        )}
      </div>

      <div className="px-4 pb-28 space-y-6">

        {/* ── Template cards ────────────────────────── */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 pt-1" style={{ color: 'var(--muted2)' }}>
            Start a Session
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(templates).map(t => {
              const meta = templateMeta(t, dark)
              return (
                <button key={t} onClick={() => startWorkout(t)}
                  className="relative overflow-hidden rounded-2xl p-4 text-left active:scale-[0.95] transition-transform"
                  style={{ background: meta.grad, border: `1px solid ${meta.border}`, minHeight: 136, boxShadow: 'var(--shadow-sm)' }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl"
                    style={{ background: meta.glow, transform: 'translate(30%,-30%)' }} />
                  <div className="relative flex flex-col justify-between h-full">
                    <div className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: meta.accent }}>
                      {t}
                    </div>
                    <div className="mt-auto pt-6">
                      <div className="font-black text-lg leading-tight tracking-tight" style={{ color: 'var(--text)' }}>{t}</div>
                      <div className="text-[11px] font-medium mt-1" style={{ color: meta.accent, opacity: 0.8 }}>{meta.muscles}</div>
                      <div className="text-[11px] font-semibold mt-2" style={{ color: 'var(--muted2)' }}>
                        {templates[t].length} exercises
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Recent sessions ───────────────────────── */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--muted2)' }}>History</div>
          {workoutLogs.length === 0 ? (
            <div className="text-center py-14 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-5xl mb-3">🏋️</div>
              <div className="font-bold" style={{ color: 'var(--text)' }}>No workouts yet</div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted2)' }}>Start your first session above</div>
            </div>
          ) : (
            workoutLogs.map(w => {
              const meta = templateMeta(w.template_name, dark)
              return (
                <div key={w.id} onClick={() => setViewLog(w)}
                  className="rounded-2xl px-4 py-3.5 mb-2.5 cursor-pointer active:opacity-75 flex items-center gap-3.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-base font-black"
                    style={{ background: meta.grad, color: meta.accent, border: `1px solid ${meta.border}` }}>
                    {w.template_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{w.template_name}</div>
                    <div className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--muted2)' }}>
                      {w.date} · {w.exercises?.length ?? 0} exercises
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {overloadBadge(w)}
                    <span className="text-lg font-thin" style={{ color: 'var(--border2)' }}>›</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Workout Logger Modal ──────────────────── */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '93vh' }}>

            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: activeMeta.accent }}>
                  {activeTemplate}
                </div>
                <div className="text-xl font-black" style={{ color: 'var(--text)' }}>{exercises.length} Exercises</div>
              </div>
              <button onClick={() => setShowWorkoutModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {exercises.map((ex, ei) => {
                const lastSession = workoutLogs.find(w => w.template_name === activeTemplate)
                const lastEx = lastSession?.exercises?.find(e => e.name === ex.name)
                return (
                  <div key={ei} className="rounded-2xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold" style={{ color: 'var(--text)' }}>{ex.name}</div>
                        {lastEx && (
                          <div className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--muted2)' }}>
                            Last: {lastEx.sets[0]?.weight ?? '—'}kg × {lastEx.sets[0]?.reps ?? '—'}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => addSet(ei)}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                          +Set
                        </button>
                        {ex.isCustom && (
                          <button onClick={() => removeExercise(ei)}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>✕</button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider px-0.5" style={{ color: 'var(--muted2)' }}>
                      <span className="text-center">#</span><span className="text-center">KG</span><span className="text-center">REPS</span><span />
                    </div>
                    {ex.sets.map((s, si) => (
                      <div key={si} className="grid grid-cols-[28px_1fr_1fr_40px] gap-1.5 mb-1.5 items-center">
                        <span className="text-xs text-center font-bold" style={{ color: 'var(--muted2)' }}>{si + 1}</span>
                        <input type="number" value={s.weight || ''} onChange={e => updateSet(ei, si, 'weight', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full min-w-0 rounded-xl px-2 py-2 text-sm text-center font-black"
                          style={{
                            background: s.done ? 'rgba(16,185,129,0.08)' : 'var(--surface3)',
                            border: `1px solid ${s.done ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                            color: s.done ? '#059669' : 'var(--text)',
                          }} />
                        <input type="number" value={s.reps || ''} onChange={e => updateSet(ei, si, 'reps', parseInt(e.target.value) || 0)}
                          placeholder={String(ex.sets[si]?.reps ?? 10)}
                          className="w-full min-w-0 rounded-xl px-2 py-2 text-sm text-center font-black"
                          style={{
                            background: s.done ? 'rgba(16,185,129,0.08)' : 'var(--surface3)',
                            border: `1px solid ${s.done ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                            color: s.done ? '#059669' : 'var(--text)',
                          }} />
                        <button onClick={() => updateSet(ei, si, 'done', !s.done)}
                          className="rounded-xl py-2 text-sm font-black transition-all"
                          style={{
                            background: s.done ? '#10b981' : 'var(--surface3)',
                            color: s.done ? 'white' : 'var(--muted2)',
                            border: `1px solid ${s.done ? '#10b981' : 'var(--border)'}`,
                          }}>
                          {s.done ? '✓' : '○'}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}

              <button onClick={() => setShowAddEx(true)}
                className="w-full py-4 rounded-2xl text-sm font-bold"
                style={{ border: '1px dashed rgba(16,185,129,0.3)', color: '#10b981', background: 'rgba(16,185,129,0.04)' }}>
                + Add Exercise
              </button>
            </div>

            <div className="shrink-0 px-4 pb-8 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={saveWorkout} disabled={saving}
                className="w-full text-white font-black py-4 rounded-2xl text-sm tracking-[0.1em] uppercase disabled:opacity-50"
                style={{ background: '#10b981' }}>
                {saving ? 'Saving…' : 'Save Workout ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Exercise Modal ────────────────────── */}
      {showAddEx && (
        <div className="fixed inset-0 z-[60] flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '88vh' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
              <div className="text-lg font-black" style={{ color: 'var(--text)' }}>Add Exercise</div>
              <button onClick={() => setShowAddEx(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>✕</button>
            </div>

            <div className="px-5 shrink-0 space-y-3 pb-3">
              <input type="text" value={exSearch} onChange={e => setExSearch(e.target.value)}
                placeholder="Search exercises…"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium" />
              <div className="flex gap-2 flex-wrap">
                {['', ...Object.keys(EXERCISE_LIBRARY)].map(cat => (
                  <button key={cat} onClick={() => setExCat(cat)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                    style={{
                      background: exCat === cat ? '#10b981' : 'var(--surface2)',
                      color: exCat === cat ? 'white' : 'var(--muted)',
                      border: `1px solid ${exCat === cat ? '#10b981' : 'var(--border)'}`,
                    }}>
                    {cat || 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2">
              {filteredExercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{ex.name}</div>
                    <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--muted2)' }}>{ex.cat}</div>
                  </div>
                  <button onClick={() => addExerciseToSession(ex.name)}
                    className="text-xs px-3 py-1.5 rounded-lg font-bold"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── View Log Modal ────────────────────────── */}
      {viewLog && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '88vh' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-0.5"
                  style={{ color: templateMeta(viewLog.template_name, dark).accent }}>
                  {viewLog.template_name}
                </div>
                <div className="text-lg font-black" style={{ color: 'var(--text)' }}>{viewLog.date}</div>
              </div>
              <button onClick={() => setViewLog(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-8">
              {viewLog.exercises?.map((ex, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div className="font-bold mb-3" style={{ color: 'var(--text)' }}>{ex.name}</div>
                  {ex.sets?.map((s, j) => (
                    <div key={j} className="flex items-center gap-3 py-1.5" style={{ borderTop: j > 0 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--muted2)' }}>{j + 1}</span>
                      <span className="font-black text-sm" style={{ color: 'var(--text)' }}>{s.weight}kg</span>
                      <span className="text-sm" style={{ color: 'var(--border2)' }}>×</span>
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{s.reps} reps</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
