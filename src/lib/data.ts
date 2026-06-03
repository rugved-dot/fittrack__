import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function getTodayFood(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
  return data ?? []
}

export async function getWeightLogs(limit = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)
  return (data ?? []).reverse()
}

export async function getWorkoutLogs(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getLatestSamsungData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const [sleep, hr, steps, stress, spo2, bodyFat] = await Promise.all([
    supabase.from('sleep_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('heart_rate_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('step_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('stress_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('spo2_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('body_fat_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
  ])

  return {
    sleep: sleep.data,
    hr: hr.data,
    steps: steps.data,
    stress: stress.data,
    spo2: spo2.data,
    bodyFat: bodyFat.data,
  }
}
