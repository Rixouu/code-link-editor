import { describe, expect, it } from 'vitest'
import { applyHrefsToHtml, countAnchors, extractAnchorsFromHtml } from '@/lib/campaign/html-anchors'

describe('html anchors helpers', () => {
  const html = `
    <div>
      <a href="https://brand.com/a">First</a>
      <p>Text</p>
      <a href="https://brand.com/b">Second</a>
    </div>
  `

  it('extractAnchorsFromHtml returns anchors in document order with indexes', () => {
    const anchors = extractAnchorsFromHtml(html)
    expect(anchors).toHaveLength(2)
    expect(anchors[0]).toMatchObject({ index: 0, href: 'https://brand.com/a', text: 'First' })
    expect(anchors[1]).toMatchObject({ index: 1, href: 'https://brand.com/b', text: 'Second' })
  })

  it('countAnchors returns number of anchors', () => {
    expect(countAnchors(html)).toBe(2)
  })

  it('applyHrefsToHtml replaces hrefs when lengths match', () => {
    const updated = applyHrefsToHtml(html, ['https://brand.com/1', 'https://brand.com/2'])
    expect(updated).toContain('href="https://brand.com/1"')
    expect(updated).toContain('href="https://brand.com/2"')
  })

  it('applyHrefsToHtml returns original html when lengths mismatch', () => {
    const updated = applyHrefsToHtml(html, ['https://brand.com/only-one'])
    expect(updated).toBe(html)
  })
})
