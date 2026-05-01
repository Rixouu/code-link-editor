import { describe, expect, it } from 'vitest'
import { buildLinksCsv } from '@/lib/campaign/csv-export'
import type { AnchorGovernanceRow, ValidationResult } from '@/lib/campaign/types'

describe('buildLinksCsv', () => {
  it('escapes commas, quotes, and newlines', () => {
    const rows: AnchorGovernanceRow[] = [
      {
        index: 0,
        text: 'Hello, "World"\nLine',
        href: 'https://brand.com/a',
        finalHref: 'https://brand.com/a?utm_source=email',
      },
    ]
    const validations: ValidationResult[] = [{ ok: false, issues: ['Missing required parameter: utm_medium'] }]

    const csv = buildLinksCsv(rows, validations)
    expect(csv.startsWith('index,anchor_text,original_href,final_href,valid,issues\n')).toBe(true)
    expect(csv).toContain('"Hello, ""World""\nLine"')
    expect(csv).toContain(',no,')
    expect(csv).toContain('Missing required parameter: utm_medium')
  })
})
