/**
 * Finds http(s) URLs appearing in text nodes that are not inside an <a> element.
 * Heuristic only — not a substitute for human review.
 */

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/gi

function isInsideAnchor(node: Node | null): boolean {
  let cur: Node | null = node
  while (cur) {
    if (cur.nodeName === 'A') return true
    cur = cur.parentNode
  }
  return false
}

export interface UnlinkedUrlMatch {
  url: string
  /** Truncated surrounding text for context */
  context: string
}

export function findUnlinkedUrlsInHtml(html: string): UnlinkedUrlMatch[] {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return []

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentNode
      if (!parent) return NodeFilter.FILTER_REJECT
      const name = parent.nodeName
      if (name === 'SCRIPT' || name === 'STYLE' || name === 'NOSCRIPT') {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const seen = new Set<string>()
  const results: UnlinkedUrlMatch[] = []

  let n: Node | null = walker.nextNode()
  while (n) {
    const textNode = n as Text
    if (!isInsideAnchor(textNode.parentNode)) {
      const text = textNode.data ?? ''
      URL_RE.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = URL_RE.exec(text)) !== null) {
        const url = m[0].replace(/[.,;:!?)]+$/, '')
        if (seen.has(url)) continue
        seen.add(url)
        const start = Math.max(0, m.index - 24)
        const context = text.slice(start, m.index + url.length + 24).replace(/\s+/g, ' ')
        results.push({ url, context: context.trim() })
      }
    }
    n = walker.nextNode()
  }

  return results
}
