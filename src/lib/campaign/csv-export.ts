import type { AnchorGovernanceRow, ValidationResult } from './types'

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildLinksCsv(
  rows: AnchorGovernanceRow[],
  validations: ValidationResult[]
): string {
  const header = [
    'index',
    'anchor_text',
    'original_href',
    'final_href',
    'valid',
    'issues',
  ]

  const lines = [header.join(',')]

  rows.forEach((row, i) => {
    const v = validations[i] ?? { ok: true, issues: [] }
    lines.push(
      [
        String(row.index),
        escapeCsvCell(row.text),
        escapeCsvCell(row.href),
        escapeCsvCell(row.finalHref),
        v.ok ? 'yes' : 'no',
        escapeCsvCell(v.issues.join('; ')),
      ].join(',')
    )
  })

  return lines.join('\n')
}
