import { describe, expect, it } from 'vitest'
import { findUnlinkedUrlsInHtml } from '@/lib/campaign/unlinked-urls'

describe('findUnlinkedUrlsInHtml', () => {
  it('returns http(s) URLs that are not inside anchors', () => {
    const html = `
      <div>
        <p>Visit https://example.com/docs for details.</p>
        <a href="https://example.com/linked">https://example.com/linked</a>
      </div>
    `
    const matches = findUnlinkedUrlsInHtml(html)
    expect(matches.map((m) => m.url)).toEqual(['https://example.com/docs'])
  })

  it('ignores URLs in script/style tags', () => {
    const html = `
      <div>
        <script>const url = "https://evil.com/script";</script>
        <style>.x{background:url(https://evil.com/style)}</style>
        <p>https://brand.com/real</p>
      </div>
    `
    const matches = findUnlinkedUrlsInHtml(html)
    expect(matches.map((m) => m.url)).toEqual(['https://brand.com/real'])
  })
})
