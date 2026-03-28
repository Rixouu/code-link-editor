import type { ParsedAnchor } from './types'

function getParser(): DOMParser | null {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return null
  return new DOMParser()
}

export function extractAnchorsFromHtml(html: string): ParsedAnchor[] {
  const parser = getParser()
  if (!parser) return []

  const doc = parser.parseFromString(html, 'text/html')
  const anchors = doc.querySelectorAll('a[href]')
  const out: ParsedAnchor[] = []

  anchors.forEach((el, index) => {
    const href = el.getAttribute('href')?.trim() ?? ''
    const text = el.textContent?.trim() || '(no text)'
    out.push({ index, href, text })
  })

  return out
}

/**
 * Replaces each anchor href in document order. Length must match extract order for same HTML.
 */
export function applyHrefsToHtml(html: string, hrefs: string[]): string {
  const parser = getParser()
  if (!parser) return html

  const doc = parser.parseFromString(html, 'text/html')
  const anchors = doc.querySelectorAll('a[href]')

  if (anchors.length !== hrefs.length) {
    return html
  }

  anchors.forEach((el, i) => {
    el.setAttribute('href', hrefs[i] ?? el.getAttribute('href') ?? '')
  })

  return doc.body.innerHTML
}

export function countAnchors(html: string): number {
  const parser = getParser()
  if (!parser) return 0
  const doc = parser.parseFromString(html, 'text/html')
  return doc.querySelectorAll('a[href]').length
}
