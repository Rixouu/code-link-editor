import { describe, expect, it } from 'vitest'
import { validateHrefAgainstPreset } from '@/lib/campaign/validate-href'
import type { CampaignPreset } from '@/lib/campaign/types'

const preset: CampaignPreset = {
  id: 'p-1',
  name: 'Strict brand',
  brand: 'Brand',
  channel: 'email',
  utm: { source: '', medium: '', campaign: '', content: '', term: '' },
  customParams: {},
  deepLink: { enabled: false, useDeepLinksFlag: true, followRedirects: true },
  governance: {
    allowedDomains: ['brand.com'],
    requiredParamKeys: ['utm_source', 'utm_medium'],
  },
}

describe('validateHrefAgainstPreset', () => {
  it('accepts http(s) URLs on allowed domains with required params', () => {
    const result = validateHrefAgainstPreset(
      'https://campaigns.brand.com/x?utm_source=email&utm_medium=crm',
      preset
    )
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('flags disallowed domains', () => {
    const result = validateHrefAgainstPreset(
      'https://evil.com/x?utm_source=email&utm_medium=crm',
      preset
    )
    expect(result.ok).toBe(false)
    expect(result.issues.join(' ')).toContain('not in the allowlist')
  })

  it('flags missing required params', () => {
    const result = validateHrefAgainstPreset('https://brand.com/x?utm_source=email', preset)
    expect(result.ok).toBe(false)
    expect(result.issues).toContain('Missing required parameter: utm_medium')
  })

  it('treats non-http(s) schemes as OK', () => {
    const result = validateHrefAgainstPreset('mailto:test@brand.com', preset)
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })
})
