import type { CampaignPreset, ValidationResult } from './types'

function normalizeDomainRule(rule: string): string {
  return rule.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0] ?? ''
}

function hostAllowed(hostname: string, allowedDomains: string[]): boolean {
  const host = hostname.toLowerCase()
  if (allowedDomains.length === 0) return true

  return allowedDomains.some((rule) => {
    const d = normalizeDomainRule(rule)
    if (!d) return true
    return host === d || host.endsWith(`.${d}`)
  })
}

export function validateHrefAgainstPreset(
  href: string,
  preset: CampaignPreset
): ValidationResult {
  const issues: string[] = []

  if (!href.trim()) {
    issues.push('Empty href')
    return { ok: false, issues }
  }

  let url: URL
  try {
    url = new URL(href)
  } catch {
    issues.push('Not a valid absolute URL (relative or malformed)')
    return { ok: false, issues }
  }

  const proto = url.protocol.toLowerCase()
  if (proto !== 'http:' && proto !== 'https:') {
    return { ok: true, issues: [] }
  }

  if (!hostAllowed(url.hostname, preset.governance.allowedDomains)) {
    issues.push(
      `Domain "${url.hostname}" is not in the allowlist for preset "${preset.name}"`
    )
  }

  const params = new URLSearchParams(url.search)
  for (const key of preset.governance.requiredParamKeys) {
    const k = key.trim()
    if (!k) continue
    if (!params.has(k)) {
      issues.push(`Missing required parameter: ${k}`)
    } else {
      const v = params.get(k)
      if (v === null || v === '') {
        issues.push(`Required parameter empty: ${k}`)
      }
    }
  }

  return { ok: issues.length === 0, issues }
}
