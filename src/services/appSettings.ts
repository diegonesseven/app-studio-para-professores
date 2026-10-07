import pb from '@/lib/pocketbase/client'
import type { AppAppearanceSettings } from '@/types'

export const DEFAULT_APPEARANCE: AppAppearanceSettings = {
  id: '',
  collectionId: '',
  collectionName: 'app_settings',
  key: 'appearance',
  primary_color: '#8B5CF6',
  background_color: '#0F0E17',
  surface_color: '#1A1829',
  studio_name: 'Studio Bru Oliveira',
  logo_url: '',
  logo_file: '',
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
        const rec = records[0]
        let resolvedLogoUrl = rec.logo_url || ''
        // Se houver arquivo anexado no PocketBase, resolve a URL pública real
        if (rec.logo_file) {
          resolvedLogoUrl = pb.files.getURL(rec, rec.logo_file)
        }
        return {
          ...DEFAULT_APPEARANCE,
          ...rec,
          logo_url: resolvedLogoUrl,
        }
      }
      return DEFAULT_APPEARANCE
    } catch (_) {
      return DEFAULT_APPEARANCE
    }
  },

  async saveAppearance(
    settings: Partial<AppAppearanceSettings>,
    fileToUpload?: File | null,
    removeLogoFile?: boolean,
  ): Promise<AppAppearanceSettings> {
    try {
      const records = await pb.collection('app_settings').getFullList<AppAppearanceSettings>({
        filter: 'key = "appearance"',
      })

      const targetId = records.length > 0 ? records[0].id : null

      let updatedRecord: AppAppearanceSettings

      if (fileToUpload) {
        // Envio com FormData nativo para gravação do arquivo de imagem no backend
        const formData = new FormData()
        formData.append('key', 'appearance')
        formData.append('primary_color', settings.primary_color || DEFAULT_APPEARANCE.primary_color)
        formData.append(
          'background_color',
          settings.background_color || DEFAULT_APPEARANCE.background_color,
        )
        formData.append('surface_color', settings.surface_color || DEFAULT_APPEARANCE.surface_color)
        formData.append(
          'studio_name',
          (settings.studio_name ?? DEFAULT_APPEARANCE.studio_name).trim(),
        )
        formData.append('logo_file', fileToUpload)
        // Limpa logo_url legada para priorizar o logo_file do PocketBase
        formData.append('logo_url', '')

        if (targetId) {
          updatedRecord = await pb
            .collection('app_settings')
            .update<AppAppearanceSettings>(targetId, formData)
        } else {
          updatedRecord = await pb
            .collection('app_settings')
            .create<AppAppearanceSettings>(formData)
        }
      } else {
        const payload: Record<string, unknown> = {
          key: 'appearance',
          primary_color: settings.primary_color || DEFAULT_APPEARANCE.primary_color,
          background_color: settings.background_color || DEFAULT_APPEARANCE.background_color,
          surface_color: settings.surface_color || DEFAULT_APPEARANCE.surface_color,
          studio_name: (settings.studio_name ?? DEFAULT_APPEARANCE.studio_name).trim(),
        }

        if (removeLogoFile) {
          payload.logo_file = null
          payload.logo_url = ''
        } else if (settings.logo_url !== undefined) {
          payload.logo_url = settings.logo_url
        }

        if (targetId) {
          updatedRecord = await pb
            .collection('app_settings')
            .update<AppAppearanceSettings>(targetId, payload)
        } else {
          updatedRecord = await pb.collection('app_settings').create<AppAppearanceSettings>(payload)
        }
      }

      let resolvedLogoUrl = updatedRecord.logo_url || ''
      if (updatedRecord.logo_file) {
        resolvedLogoUrl = pb.files.getURL(updatedRecord, updatedRecord.logo_file)
      }

      return {
        ...DEFAULT_APPEARANCE,
        ...updatedRecord,
        logo_url: resolvedLogoUrl,
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
