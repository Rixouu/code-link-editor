import type { CampaignPreset } from './types'

function setUtmParams(params: URLSearchParams, preset: CampaignPreset) {
  const { utm } = preset
  if (utm.source) params.set('utm_source', utm.source)
  if (utm.medium) params.set('utm_medium', utm.medium)
  if (utm.campaign) params.set('utm_campaign', utm.campaign)
  if (utm.content) params.set('utm_content', utm.content)
  if (utm.term) params.set('utm_term', utm.term)

  for (const [k, v] of Object.entries(preset.customParams)) {
    const key = k.trim()
    if (key && v !== undefined && v !== '') params.set(key, v)
  }
}

function setDeepLinkParams(params: URLSearchParams, preset: CampaignPreset) {
  if (!preset.deepLink.enabled) return
  params.set('$deep_link', preset.deepLink.useDeepLinksFlag ? 'true' : 'false')
  params.set('$follow_redirect', preset.deepLink.followRedirects ? 'true' : 'false')
}

/**
 * Merges preset UTM, custom params, and optional deep-link flags onto an http(s) URL.
 * Non-http(s) hrefs are returned unchanged.
 */
export function applyPresetToHref(href: string, preset: CampaignPreset): string {
  const trimmed = href.trim()
  if (!trimmed) return href

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return href
  }

  const proto = url.protocol.toLowerCase()
  if (proto !== 'http:' && proto !== 'https:') {
    return href
  }

  const params = new URLSearchParams(url.search)
  setUtmParams(params, preset)
  setDeepLinkParams(params, preset)
  url.search = params.toString()

  return url.toString()
}
