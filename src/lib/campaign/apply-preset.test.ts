import { describe, expect, it } from 'vitest'
import { applyPresetToHref } from '@/lib/campaign/apply-preset'
import type { CampaignPreset } from '@/lib/campaign/types'

function preset(overrides: Partial<CampaignPreset> = {}): CampaignPreset {
  return {
    id: 'p-1',
    name: 'Test preset',
    brand: 'Test',
    channel: 'email',
    utm: {
      source: 'email',
      medium: 'newsletter',
      campaign: 'q2-launch',
      content: '',
      term: '',
    },
    customParams: { partner_id: '123' },
    deepLink: { enabled: true, useDeepLinksFlag: true, followRedirects: false },
    governance: { allowedDomains: [], requiredParamKeys: [] },
    ...overrides,
  }
}

describe('applyPresetToHref', () => {
  it('overwrites UTM params, merges custom params, and appends deep-link flags', () => {
    const out = applyPresetToHref(
      'https://brand.com/page?utm_source=old&utm_medium=old&x=1',
      preset()
    )
    const url = new URL(out)
    expect(url.origin).toBe('https://brand.com')
    expect(url.searchParams.get('utm_source')).toBe('email')
    expect(url.searchParams.get('utm_medium')).toBe('newsletter')
    expect(url.searchParams.get('utm_campaign')).toBe('q2-launch')
    expect(url.searchParams.get('partner_id')).toBe('123')
    expect(url.searchParams.get('x')).toBe('1')
    expect(url.searchParams.get('$deep_link')).toBe('true')
    expect(url.searchParams.get('$follow_redirect')).toBe('false')
  })

  it('returns non-http(s) URLs unchanged', () => {
    const href = 'mailto:test@brand.com'
    expect(applyPresetToHref(href, preset())).toBe(href)
  })

  it('returns relative or malformed hrefs unchanged', () => {
    expect(applyPresetToHref('/relative/path', preset())).toBe('/relative/path')
    expect(applyPresetToHref('not a url', preset())).toBe('not a url')
  })
})
