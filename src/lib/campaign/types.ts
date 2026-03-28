export interface CampaignPreset {
  id: string
  name: string
  brand: string
  channel: string
  utm: {
    source: string
    medium: string
    campaign: string
    content: string
    term: string
  }
  /** Extra query keys (e.g. partner ids). Values may include ESP merge tags. */
  customParams: Record<string, string>
  deepLink: {
    enabled: boolean
    /** Serialized as $deep_link query value when enabled */
    useDeepLinksFlag: boolean
    followRedirects: boolean
  }
  governance: {
    /** Empty = no domain restriction */
    allowedDomains: string[]
    /** Each key must appear in final query string (e.g. utm_source) */
    requiredParamKeys: string[]
  }
}

export interface ParsedAnchor {
  index: number
  href: string
  text: string
}

export interface AnchorGovernanceRow extends ParsedAnchor {
  /** User- or preset-derived href written back to HTML */
  finalHref: string
}

export interface ValidationResult {
  ok: boolean
  issues: string[]
}
