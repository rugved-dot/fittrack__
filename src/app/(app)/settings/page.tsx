import { getProfile } from '@/lib/data'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const profile = await getProfile()
  return <SettingsClient profile={profile} />
}
