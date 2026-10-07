import pb from '@/lib/pocketbase/client'
import type { AppAppearanceSettings } from '@/types'

export const DEFAULT_APPEARANCE: AppAppearanceSettings = {
  id: '',
  collectionId: '',
  collectionName: 'app_settings',
  key: 'appearance',
  primary_color: '#F06A2A',
  background_color: '#121212',
  surface_color: '#1E1E1E',
  studio_name: 'Studio Bru Oliveira',
  logo_url: '',
  created: '',
  updated: '',
}

export const appSettingsService = {
  async getAppearance(): Promise<AppAppearanceSettings> {
    try {
      const records = await pb.collection('app_settings').getFullList<AppAppearanceSettings>({
        filter: 'key = "appearance"',
        sort: '-updated',
      })
      if (records.length > 0) {
        return {
          ...DEFAULT_APPEARANCE,
          ...records[0],
        }
      }
      return DEFAULT_APPEARANCE
    } catch (_) {
      return DEFAULT_APPEARANCE
    }
  },

  async saveAppearance(settings: Partial<AppAppearanceSettings>): Promise<AppAppearanceSettings> {
    try {
      const records = await pb.collection('app_settings').getFullList<AppAppearanceSettings>({
        filter: 'key = "appearance"',
      })

      const payload = {
        key: 'appearance',
        primary_color: settings.primary_color || DEFAULT_APPEARANCE.primary_color,
        background_color: settings.background_color || DEFAULT_APPEARANCE.background_color,
        surface_color: settings.surface_color || DEFAULT_APPEARANCE.surface_color,
        studio_name: (settings.studio_name ?? DEFAULT_APPEARANCE.studio_name).trim(),
        logo_url: settings.logo_url ?? '',
      }

      if (records.length > 0) {
        return await pb
          .collection('app_settings')
          .update<AppAppearanceSettings>(records[0].id!, payload)
      } else {
        return await pb.collection('app_settings').create<AppAppearanceSettings>(payload)
      }
    } catch (error) {
      console.error('Erro ao salvar aparencia no PocketBase:', error)
      throw error
    }
  },

  async resetAppearance(): Promise<AppAppearanceSettings> {
    return this.saveAppearance(DEFAULT_APPEARANCE)
  },
}
