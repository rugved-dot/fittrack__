import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/data'
import NutritionClient from './NutritionClient'

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { foodLogs: [], profile: null, waterMl: 0 }

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: foodLogs }, profile, { data: waterRow }] = await Promise.all([
    supabase.from('food_logs').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
    getProfile(),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('date', today).single(),
  ])

  return { foodLogs: foodLogs ?? [], profile, waterMl: waterRow?.amount_ml ?? 0 }
}

export default async function NutritionPage() {
  const { foodLogs, profile, waterMl } = await getData()
  return <NutritionClient foodLogs={foodLogs} profile={profile} waterMl={waterMl} />
}
