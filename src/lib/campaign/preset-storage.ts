import type { CampaignPreset } from './types'

const STORAGE_KEY = 'code-link-campaign-presets'
const ACTIVE_KEY = 'code-link-campaign-preset-active'

function defaultPresets(): CampaignPreset[] {
  const id = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `preset-${Date.now()}`

  return [
    {
      id: id(),
      name: 'Email · CRM default',
      brand: 'Default',
      channel: 'email',
      utm: {
        source: 'email',
        medium: 'crm',
        campaign: '{{campaign_name}}',
        content: '',
        term: '',
      },
      customParams: {},
      deepLink: {
        enabled: true,
        useDeepLinksFlag: true,
        followRedirects: true,
      },
      governance: {
        allowedDomains: [],
        requiredParamKeys: ['utm_source', 'utm_medium', 'utm_campaign'],
      },
    },
    {
      id: id(),
      name: 'Newsletter · strict domain',
      brand: 'Default',
      channel: 'newsletter',
      utm: {
        source: 'newsletter',
        medium: 'email',
        campaign: 'weekly',
        content: '',
        term: '',
      },
      customParams: {},
      deepLink: {
        enabled: false,
        useDeepLinksFlag: true,
        followRedirects: true,
      },
      governance: {
        allowedDomains: [],
        requiredParamKeys: ['utm_source', 'utm_medium', 'utm_campaign'],
      },
    },
  ]
}

export function loadPresets(): CampaignPreset[] {
  if (typeof window === 'undefined') return defaultPresets()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = defaultPresets()
      savePresets(initial)
      return initial
    }
    const parsed = JSON.parse(raw) as CampaignPreset[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = defaultPresets()
      savePresets(initial)
      return initial
    }
    return parsed
  } catch {
    return defaultPresets()
  }
}

export function savePresets(presets: CampaignPreset[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function loadActivePresetId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActivePresetId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_KEY, id)
}

export function upsertPreset(
  presets: CampaignPreset[],
  preset: CampaignPreset
): CampaignPreset[] {
  const i = presets.findIndex((p) => p.id === preset.id)
  if (i === -1) return [...presets, preset]
  const next = [...presets]
  next[i] = preset
  return next
}

export function deletePreset(
  presets: CampaignPreset[],
  id: string
): CampaignPreset[] {
  return presets.filter((p) => p.id !== id)
}
