'use client'

import React, { useState, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/useToast'
import { CampaignGovernancePanel } from '@/components/campaign/CampaignGovernancePanel'
import { applyHrefsToHtml, countAnchors, extractAnchorsFromHtml } from '@/lib/campaign/html-anchors'
import { loadActivePresetId, loadPresets, saveActivePresetId, savePresets } from '@/lib/campaign/preset-storage'
import type { AnchorGovernanceRow, CampaignPreset } from '@/lib/campaign/types'
import { buildLinksCsv } from '@/lib/campaign/csv-export'
import { validateHrefAgainstPreset } from '@/lib/campaign/validate-href'
import {
  Link2,
  Copy,
  RotateCcw,
  Loader2,
  Download,
  LayoutGrid,
  LayoutList,
  Settings2,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { html } from '@codemirror/lang-html'
import { EditorView } from '@codemirror/view'

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] min-h-[240px] w-full items-center justify-center bg-muted/60">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span className="text-sm">Loading editor…</span>
      </div>
    </div>
  ),
})

export function LinkWizard() {
  const { toast } = useToast()
  const [mainTab, setMainTab] = useState<'editor' | 'campaign'>('editor')
  const [mobilePage, setMobilePage] = useState<'workspace' | 'governance' | 'export' | 'settings'>('workspace')
  const [originalContent, setOriginalContent] = useState('')
  const [governanceRows, setGovernanceRows] = useState<AnchorGovernanceRow[]>([])
  const [initialPresetState] = useState(() => {
    const loaded = loadPresets()
    const saved = loadActivePresetId()
    const nextId = saved && loaded.some((p) => p.id === saved) ? saved : loaded[0]?.id ?? ''
    return { presets: loaded, activePresetId: nextId }
  })
  const [presets, setPresets] = useState<CampaignPreset[]>(initialPresetState.presets)
  const [activePresetId, setActivePresetId] = useState<string>(initialPresetState.activePresetId)
  const [isLoading, setIsLoading] = useState(false)

  const editorTheme = useMemo(
    () =>
      EditorView.theme(
        {
          '&': {
            backgroundColor: '#F8FCFA',
            color: '#2A7868',
          },
          '.cm-content': {
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: '12px',
            lineHeight: '1.7',
          },
          '.cm-gutters': {
            backgroundColor: '#F8FCFA',
            color: '#C8DED8',
            border: 'none',
          },
          '.cm-activeLine': {
            backgroundColor: '#EEF8F4',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#EEF8F4',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'rgba(26,138,122,0.22)',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: 'rgba(26,138,122,0.28)',
          },
          '&.cm-focused .cm-cursor': {
            borderLeftColor: '#1A8A7A',
          },
        },
        { dark: false }
      ),
    []
  )

  const desktopEditorOptions = useMemo(
    () => ({
      height: '280px',
      width: '100%',
      style: { overflow: 'auto' as const, minHeight: '260px' },
      extensions: [html(), editorTheme],
    }),
    [editorTheme]
  )

  const mobileEditorOptions = useMemo(
    () => ({
      height: '160px',
      width: '100%',
      style: { overflow: 'auto' as const, minHeight: '120px' },
      extensions: [html(), editorTheme],
    }),
    [editorTheme]
  )

  function handlePresetsChange(next: CampaignPreset[]) {
    setPresets(next)
    savePresets(next)
    if (next.length === 0) {
      setActivePresetId('')
      return
    }
    if (!next.some((p) => p.id === activePresetId)) {
      setActivePresetId(next[0].id)
      saveActivePresetId(next[0].id)
    }
  }

  function handleActivePresetChange(id: string) {
    setActivePresetId(id)
    saveActivePresetId(id)
  }

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? presets[0],
    [activePresetId, presets]
  )

  const validations = useMemo(() => {
    if (!activePreset) return []
    return governanceRows.map((r) => validateHrefAgainstPreset(r.finalHref, activePreset))
  }, [activePreset, governanceRows])

  const invalidCount = useMemo(() => validations.filter((v) => !v.ok).length, [validations])
  const validCount = useMemo(() => validations.filter((v) => v.ok).length, [validations])

  const withUtmCount = useMemo(() => {
    const hasUtm = (href: string) => {
      try {
        const url = new URL(href, 'https://example.com')
        return (
          url.searchParams.has('utm_source') ||
          url.searchParams.has('utm_medium') ||
          url.searchParams.has('utm_campaign') ||
          url.searchParams.has('utm_content') ||
          url.searchParams.has('utm_term')
        )
      } catch {
        return false
      }
    }
    return governanceRows.filter((r) => hasUtm(r.finalHref)).length
  }, [governanceRows])

  const handleScanLinks = () => {
    setIsLoading(true)
    try {
      if (!originalContent.trim()) {
        throw new Error('Paste HTML in the editor before scanning.')
      }
      const parsed = extractAnchorsFromHtml(originalContent)
      if (parsed.length === 0) {
        throw new Error('No <a href="…"> links found in this HTML.')
      }
      setGovernanceRows(
        parsed.map((p) => ({
          ...p,
          finalHref: p.href,
        }))
      )
      toast({
        title: 'Links scanned',
        description: `${parsed.length} anchor(s) found. Open Campaign governance to apply presets and validate.`,
      })
    } catch (error) {
      toast({
        title: 'Scan failed',
        description: error instanceof Error ? error.message : 'Could not parse links.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setOriginalContent('')
    setGovernanceRows([])
    toast({
      title: 'Reset',
      description: 'Editor and link inventory cleared.',
    })
  }

  const handleCopyUpdatedContent = () => {
    navigator.clipboard.writeText(governedHtml).then(
      () => {
        toast({
          title: 'Copied',
          description: 'Updated HTML copied to clipboard.',
        })
      },
      () => {
        toast({
          title: 'Error',
          description: 'Failed to copy.',
        })
      }
    )
  }

  const handleExportCsv = () => {
    if (!activePreset) {
      toast({
        title: 'No preset',
        description: 'Create or select a preset first.',
      })
      return
    }
    if (governanceRows.length === 0) {
      toast({
        title: 'No links',
        description: 'Scan HTML for links first.',
      })
      return
    }
    const csv = buildLinksCsv(governanceRows, validations)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `link-governance-${activePreset.brand || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDocs = () => {
    toast({
      title: 'Docs',
      description: 'Docs link not configured yet.',
    })
  }

  const handleDesktopSettings = () => {
    toast({
      title: 'Settings',
      description: 'Settings are available from the mobile bottom menu for now.',
    })
  }

  const governedHtml = (() => {
    if (governanceRows.length === 0) return originalContent
    const n = countAnchors(originalContent)
    if (n !== governanceRows.length) return originalContent
    const hrefs = governanceRows.map((r) => r.finalHref)
    return applyHrefsToHtml(originalContent, hrefs)
  })()

  return (
    <div className="min-h-screen bg-[#E8F0EE] text-[#0E2820]">
      <div className="hidden lg:block">
        <div className="flex items-center justify-between border-b border-[#D8E8E4] bg-white px-7 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A8A7A]">
              <Link2 className="h-4 w-4 text-white" aria-hidden />
            </div>
            <span className="text-sm font-medium tracking-tight text-[#0E2820]">Code Link Editor</span>
            <span className="rounded-full border border-[#B8E8E0] bg-[#E0F5F0] px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] text-[#0E7060]">
              Email &amp; CRM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDocs}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C8DED8] bg-white px-3 py-1.5 text-[11px] text-[#4A7870]"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Docs
            </button>
            <button
              type="button"
              onClick={handleDesktopSettings}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C8DED8] bg-white px-3 py-1.5 text-[11px] text-[#4A7870]"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Settings
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium',
                governanceRows.length > 0
                  ? 'border-[#1A8A7A] bg-[#1A8A7A] text-white'
                  : 'border-[#C8DED8] bg-white text-[#7AA8A0]'
              )}
              disabled={governanceRows.length === 0}
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export CSV
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0E3030_0%,#0A3828_50%,#0C3430_100%)] px-7 py-9">
          <div className="absolute -right-16 -top-20 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(45,200,170,0.12)_0%,transparent_70%)]" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD8B8]" />
              <span className="text-[10px] font-medium tracking-[0.08em] text-[#2DD8B8]">Campaign workspace</span>
            </div>
            <h1 className="text-[26px] font-semibold tracking-tight text-[#F0FAF6]">Campaign link workspace</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6AADA0]">
              Scan HTML, apply brand presets with UTMs and deep-link flags, validate domains and required parameters,
              then export governed markup or a CSV for your review workflow.
            </p>
            <div className="mt-5 flex flex-wrap gap-5 text-[11px] text-[#5A9A8A]">
              {['UTM presets', 'Domain validation', 'Deep-link flags', 'CSV export'].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="inline-flex h-3 w-3 items-center justify-center">
                    <span className="h-2 w-2 rounded-full border-2 border-[#2DD8B8]/80" />
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#D8E8E4] bg-white px-7">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMainTab('editor')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-5 py-3 text-[13px]',
                mainTab === 'editor'
                  ? 'border-[#1A8A7A] font-medium text-[#0E7060]'
                  : 'border-transparent text-[#7AA8A0]'
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              HTML workspace
            </button>
            <button
              type="button"
              onClick={() => setMainTab('campaign')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-5 py-3 text-[13px]',
                mainTab === 'campaign'
                  ? 'border-[#1A8A7A] font-medium text-[#0E7060]'
                  : 'border-transparent text-[#7AA8A0]'
              )}
            >
              <LayoutList className="h-4 w-4" aria-hidden />
              Governance
            </button>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="rounded-md border border-[#A8DDD0] bg-[#E0F5EE] px-2.5 py-1 text-[10px] text-[#0E7060]">
              CodeMirror
            </span>
            <span className="rounded-md border border-[#C8E0D8] bg-[#F0F8F5] px-2.5 py-1 text-[10px] text-[#6A9890]">
              Live sync
            </span>
          </div>
        </div>

        <div className="grid h-[calc(100vh-176px)] grid-cols-[minmax(0,1fr)_260px] overflow-hidden">
          <div className="overflow-y-auto bg-[#EDF5F2] px-6 py-5">
            {mainTab === 'editor' ? (
              <div className="space-y-4">
                <section className="overflow-hidden rounded-2xl border border-[#D0E8E2] bg-white shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                  <div className="flex items-start justify-between gap-6 border-b border-[#E8F2EE] px-5 py-4">
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1A8A7A]">Step 1</div>
                      <h2 className="mt-1 text-[15px] font-medium tracking-tight text-[#0A2820]">Source &amp; preview</h2>
                      <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#6A9890]">
                        Paste or edit HTML on the left. The preview updates when the number of links matches your last scan —
                        re-scan after structural edits.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="border-r border-[#E0EEE8]">
                      <div className="flex items-center justify-between border-b border-[#E8F2EE] bg-[#F5FAF8] px-4 py-2">
                        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">
                          Original HTML
                        </span>
                      </div>
                      <div className="bg-[#F8FCFA]">
                        <Suspense
                          fallback={
                            <div className="flex h-[280px] min-h-[260px] items-center justify-center text-[#7AA8A0]">
                              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            </div>
                          }
                        >
                          <CodeMirror value={originalContent} onChange={setOriginalContent} {...desktopEditorOptions} />
                        </Suspense>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between border-b border-[#E8F2EE] bg-[#F5FAF8] px-4 py-2">
                        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">
                          Governed preview
                        </span>
                        <span className="rounded border border-[#C8E0D8] bg-[#EEF8F4] px-2 py-0.5 text-[9px] text-[#6A9890]">
                          Read-only
                        </span>
                      </div>
                      <div className="bg-[#F8FCFA]">
                        <Suspense
                          fallback={
                            <div className="flex h-[280px] min-h-[260px] items-center justify-center text-[#7AA8A0]">
                              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            </div>
                          }
                        >
                          <CodeMirror value={governedHtml} readOnly {...desktopEditorOptions} />
                        </Suspense>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-[#D0E8E2] bg-white shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                  <div className="border-b border-[#E8F2EE] px-5 py-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1A8A7A]">Step 2</div>
                    <h2 className="mt-1 text-[15px] font-medium tracking-tight text-[#0A2820]">Actions</h2>
                    <p className="mt-1 text-[11px] leading-5 text-[#6A9890]">
                      Scan extracts anchors in order, then use the Governance tab for presets and validation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-4">
                    <Button
                      onClick={handleScanLinks}
                      disabled={isLoading}
                      className="h-10 rounded-xl bg-[#1A8A7A] px-4 text-white hover:bg-[#167B6D]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Scanning…
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-4 w-4" aria-hidden />
                          Scan HTML for links
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCopyUpdatedContent}
                      variant="outline"
                      className="h-10 rounded-xl border-[#C8DED8] bg-white px-4 text-[#4A7870] hover:bg-[#F5FAF8]"
                    >
                      <Copy className="mr-2 h-4 w-4" aria-hidden />
                      Copy governed HTML
                    </Button>
                    <div className="flex-1" />
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="h-10 rounded-xl border-[#F0C8C4] bg-white px-4 text-[#C04840] hover:bg-[#FFF5F4]"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                      Reset all
                    </Button>
                    <span className="ml-2 text-[10px] text-[#A8C0BC]">{governanceRows.length} links scanned</span>
                  </div>
                </section>
              </div>
            ) : presets.length > 0 ? (
              <CampaignGovernancePanel
                html={originalContent}
                rows={governanceRows}
                onChangeRows={setGovernanceRows}
                presets={presets}
                onPresetsChange={handlePresetsChange}
                activePresetId={activePresetId}
                onActivePresetIdChange={handleActivePresetChange}
                onGoToWorkspace={() => setMainTab('editor')}
              />
            ) : (
              <div className="rounded-2xl border border-[#D0E8E2] bg-white p-6 text-sm text-[#6A9890]">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading presets…
                </span>
              </div>
            )}
          </div>

          <div className="overflow-y-auto border-l border-[#D0E8E2] bg-white">
            <div className="border-b border-[#E8F2EE]">
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-medium text-[#3A7870]">Link stats</span>
              </div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: governanceRows.length, l: 'Total links' },
                    { v: withUtmCount, l: 'With UTM' },
                    { v: validCount, l: 'Validated' },
                    { v: invalidCount, l: 'Issues' },
                  ].map((c) => (
                    <div
                      key={c.l}
                      className="rounded-xl border border-[#D8EEE8] bg-[#F5FAF8] px-3 py-2 text-center"
                    >
                      <div className="font-mono text-[15px] font-medium text-[#0A2820]">{c.v}</div>
                      <div className="mt-0.5 text-[9px] text-[#8AB0A8]">{c.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b border-[#E8F2EE] px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#3A7870]">Allowed domains</span>
              </div>
              <div className="pt-3 text-[11px] text-[#8AB0A8]">
                Only these domains pass governance validation.
              </div>
              <div className="pb-2 pt-2">
                {(activePreset?.governance.allowedDomains?.length ?? 0) > 0 ? (
                  activePreset!.governance.allowedDomains.slice(0, 8).map((d) => (
                    <div key={d} className="flex items-center gap-2 border-b border-[#F0F8F5] py-2 last:border-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1A8A7A]" />
                      <span className="flex-1 font-mono text-[11px] text-[#3A8878]">{d}</span>
                      <span className="rounded border border-[#C0DED8] bg-[#EEF8F4] px-1.5 py-0.5 text-[9px] text-[#5A9890]">
                        allowed
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 border-b border-[#F0F8F5] py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C8E8E0]" />
                    <span className="flex-1 font-mono text-[11px] text-[#3A8878]">Any domain</span>
                    <span className="rounded border border-[#C0DED8] bg-[#EEF8F4] px-1.5 py-0.5 text-[9px] text-[#5A9890]">
                      open
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-[#E8F2EE] px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#3A7870]">UTM preset</span>
              </div>
              <div className="pt-3">
                <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#9ABAB4]">Active preset</div>
                {[
                  ['utm_source', activePreset?.utm.source || '—'],
                  ['utm_medium', activePreset?.utm.medium || '—'],
                  ['utm_campaign', activePreset?.utm.campaign || '—'],
                  ['utm_content', activePreset?.utm.content || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-[#F0F8F5] py-2 last:border-0">
                    <span className="font-mono text-[10px] text-[#8ABAB2]">{k}</span>
                    <span className="font-mono text-[10px] text-[#2A7868]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={governanceRows.length === 0}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium',
                  governanceRows.length > 0
                    ? 'border-[#A8DDD0] bg-[#E8F8F4] text-[#0E7060]'
                    : 'border-[#D8EEE8] bg-[#F5FAF8] text-[#8AB0A8]'
                )}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export governed CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="relative overflow-hidden bg-[linear-gradient(150deg,#0A2E28_0%,#0C3830_100%)] px-5 pb-5 pt-6">
          <div className="absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(45,220,185,0.15)_0%,transparent_70%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD8B8]" />
              <span className="text-[9px] font-medium tracking-[0.08em] text-[#2DD8B8]">Email &amp; CRM</span>
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-[#EEF8F4]">Campaign link workspace</h1>
            <p className="mt-2 text-[11px] leading-5 text-[#5A9A8A]">
              Scan HTML, apply UTM presets, validate domains, and export governed markup.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['UTM presets', 'Domain validation', 'CSV export', 'Deep-link flags'].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] text-[#4A9A88]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {(mobilePage === 'workspace' || mobilePage === 'governance') && (
          <div className="flex border-b border-[#D0E8E2] bg-white">
            <button
              type="button"
              onClick={() => {
                setMobilePage('workspace')
                setMainTab('editor')
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-[12px]',
                mobilePage === 'workspace'
                  ? 'border-[#1A8A7A] font-medium text-[#0E7060]'
                  : 'border-transparent text-[#7AB0A8]'
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              HTML workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setMobilePage('governance')
                setMainTab('campaign')
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-[12px]',
                mobilePage === 'governance'
                  ? 'border-[#1A8A7A] font-medium text-[#0E7060]'
                  : 'border-transparent text-[#7AB0A8]'
              )}
            >
              <LayoutList className="h-4 w-4" aria-hidden />
              Governance
            </button>
          </div>
        )}

        {(mobilePage === 'workspace' || mobilePage === 'governance') && (
          <div className="flex gap-2 border-b border-[#D8EEE8] bg-white px-4 py-2.5">
            <span className="rounded-md border border-[#A8DDD0] bg-[#E0F5EE] px-2.5 py-1 text-[10px] text-[#0E7060]">
              CodeMirror
            </span>
            <span className="rounded-md border border-[#C8DED8] bg-[#F0F8F5] px-2.5 py-1 text-[10px] text-[#5A9890]">
              Live sync
            </span>
            <span className="rounded-md border border-[#C8DED8] bg-[#F0F8F5] px-2.5 py-1 text-[10px] text-[#5A9890]">
              Auto-scan
            </span>
          </div>
        )}

        <div className="bg-[#EAF5F0] px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-4">
          {mobilePage === 'workspace' ? (
            <div className="space-y-3">
              <section className="overflow-hidden rounded-2xl border border-[#C8E0D8] bg-white shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="border-b border-[#E0EEE8] px-4 py-3">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1A8A7A]">Step 1</div>
                  <h2 className="mt-1 text-sm font-medium tracking-tight text-[#0A2820]">Source &amp; preview</h2>
                  <p className="mt-1 text-[11px] leading-5 text-[#6A9890]">
                    Paste or edit HTML below. Preview updates when link count matches your last scan.
                  </p>
                </div>
                <div className="border-b border-[#E0EEE8]">
                  <div className="border-b border-[#E8F2EE] bg-[#F5FAF8] px-4 py-2">
                    <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">
                      Original HTML
                    </span>
                  </div>
                  <div className="bg-[#F8FCFA]">
                    <Suspense
                      fallback={
                        <div className="flex h-[160px] min-h-[120px] items-center justify-center text-[#7AA8A0]">
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        </div>
                      }
                    >
                      <CodeMirror value={originalContent} onChange={setOriginalContent} {...mobileEditorOptions} />
                    </Suspense>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between border-b border-[#E8F2EE] bg-[#F5FAF8] px-4 py-2">
                    <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">
                      Governed preview
                    </span>
                    <span className="rounded border border-[#C0DED8] bg-[#EEF8F4] px-2 py-0.5 text-[9px] text-[#6A9890]">
                      Read-only
                    </span>
                  </div>
                  <div className="bg-[#F8FCFA]">
                    <Suspense
                      fallback={
                        <div className="flex h-[160px] min-h-[120px] items-center justify-center text-[#7AA8A0]">
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        </div>
                      }
                    >
                      <CodeMirror value={governedHtml} readOnly {...mobileEditorOptions} />
                    </Suspense>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#C8E0D8] bg-white shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="border-b border-[#E0EEE8] px-4 py-3">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1A8A7A]">Step 2</div>
                  <h2 className="mt-1 text-sm font-medium tracking-tight text-[#0A2820]">Actions</h2>
                  <p className="mt-1 text-[11px] leading-5 text-[#6A9890]">
                    Scan extracts anchors in order, then use the Governance tab for presets and validation.
                  </p>
                </div>
                <div className="space-y-2 px-4 py-3">
                  <Button
                    onClick={handleScanLinks}
                    disabled={isLoading}
                    className="h-11 w-full rounded-2xl bg-[#1A8A7A] text-white hover:bg-[#167B6D]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Scanning…
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" aria-hidden />
                        Scan HTML for links
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyUpdatedContent}
                      variant="outline"
                      className="h-11 flex-1 rounded-2xl border-[#C0DED8] bg-white text-[#4A7870] hover:bg-[#F5FAF8]"
                    >
                      <Copy className="mr-2 h-4 w-4" aria-hidden />
                      Copy HTML
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="h-11 flex-1 rounded-2xl border-[#F0C8C4] bg-white text-[#C04840] hover:bg-[#FFF5F4]"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                      Reset
                    </Button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#C8E0D8] bg-white p-4 shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="mb-3 text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">Link stats</div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: governanceRows.length, l: 'Total' },
                    { v: withUtmCount, l: 'UTM' },
                    { v: validCount, l: 'Valid' },
                    { v: invalidCount, l: 'Issues' },
                  ].map((c) => (
                    <div
                      key={c.l}
                      className="rounded-xl border border-[#D0E8E2] bg-[#F5FAF8] px-2 py-2 text-center"
                    >
                      <div className="font-mono text-[14px] font-medium text-[#0A2820]">{c.v}</div>
                      <div className="mt-0.5 text-[8px] text-[#8AB0A8]">{c.l}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#C8E0D8] bg-white shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="flex items-center justify-between border-b border-[#E0EEE8] px-4 py-3">
                  <span className="text-sm font-medium text-[#3A7870]">Allowed domains</span>
                </div>
                <div className="px-4 pb-3">
                  {(activePreset?.governance.allowedDomains?.length ?? 0) > 0 ? (
                    activePreset!.governance.allowedDomains.slice(0, 6).map((d) => (
                      <div key={d} className="flex items-center gap-2 border-b border-[#F0F8F5] py-2 last:border-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1A8A7A]" />
                        <span className="flex-1 font-mono text-[11px] text-[#2A8878]">{d}</span>
                        <span className="rounded border border-[#C0DED8] bg-[#EEF8F4] px-1.5 py-0.5 text-[9px] text-[#4A9890]">
                          allowed
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C8E8E0]" />
                      <span className="flex-1 font-mono text-[11px] text-[#2A8878]">Any domain</span>
                      <span className="rounded border border-[#C0DED8] bg-[#EEF8F4] px-1.5 py-0.5 text-[9px] text-[#4A9890]">
                        open
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#C8E0D8] bg-white shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="flex items-center justify-between border-b border-[#E0EEE8] px-4 py-3">
                  <span className="text-sm font-medium text-[#3A7870]">UTM preset</span>
                </div>
                <div className="px-4 pb-3">
                  {[
                    ['utm_source', activePreset?.utm.source || '—'],
                    ['utm_medium', activePreset?.utm.medium || '—'],
                    ['utm_campaign', activePreset?.utm.campaign || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between border-b border-[#F0F8F5] py-2 last:border-0">
                      <span className="font-mono text-[10px] text-[#8ABAB2]">{k}</span>
                      <span className="font-mono text-[10px] text-[#1A7868]">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#C8E0D8] bg-white p-4 shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={governanceRows.length === 0}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium',
                    governanceRows.length > 0
                      ? 'border-[#A8DDD0] bg-[#E8F8F4] text-[#0E7060]'
                      : 'border-[#D8EEE8] bg-[#F5FAF8] text-[#8AB0A8]'
                  )}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export governed CSV
                </button>
              </section>
            </div>
          ) : mobilePage === 'governance' ? (
            presets.length > 0 ? (
              <CampaignGovernancePanel
                html={originalContent}
                rows={governanceRows}
                onChangeRows={setGovernanceRows}
                presets={presets}
                onPresetsChange={handlePresetsChange}
                activePresetId={activePresetId}
                onActivePresetIdChange={handleActivePresetChange}
                onGoToWorkspace={() => {
                  setMobilePage('workspace')
                  setMainTab('editor')
                }}
              />
            ) : (
              <div className="rounded-2xl border border-[#C8E0D8] bg-white p-5 text-sm text-[#6A9890]">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading presets…
                </span>
              </div>
            )
          ) : mobilePage === 'export' ? (
            <div className="space-y-3">
              <section className="rounded-2xl border border-[#C8E0D8] bg-white p-4 shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">Export</div>
                <h2 className="mt-1 text-base font-medium tracking-tight text-[#0A2820]">Share governed output</h2>
                <p className="mt-1 text-[11px] leading-5 text-[#6A9890]">
                  Copy the updated HTML, or download a CSV for review.
                </p>
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={handleCopyUpdatedContent}
                    variant="outline"
                    className="h-11 w-full rounded-2xl border-[#C0DED8] bg-white text-[#4A7870] hover:bg-[#F5FAF8]"
                  >
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                    Copy governed HTML
                  </Button>
                  <Button
                    onClick={handleExportCsv}
                    disabled={governanceRows.length === 0}
                    className="h-11 w-full rounded-2xl bg-[#1A8A7A] text-white hover:bg-[#167B6D]"
                  >
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    Export governed CSV
                  </Button>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-3">
              <section className="rounded-2xl border border-[#C8E0D8] bg-white p-4 shadow-[0_1px_4px_rgba(10,60,50,0.04)]">
                <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#7AA8A0]">Settings</div>
                <h2 className="mt-1 text-base font-medium tracking-tight text-[#0A2820]">App preferences</h2>
                <p className="mt-1 text-[11px] leading-5 text-[#6A9890]">
                  Presets and governance settings live inside the Governance page. Install this as a home screen app for the best experience.
                </p>
              </section>
            </div>
          )}
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D0E8E2] bg-white pb-[env(safe-area-inset-bottom)]"
          role="navigation"
          aria-label="Bottom navigation"
        >
          <div className="flex px-2 py-2.5">
            {[
              { id: 'workspace', label: 'Workspace', icon: LayoutGrid },
              { id: 'governance', label: 'Governance', icon: LayoutList },
              { id: 'export', label: 'Export', icon: Download },
              { id: 'settings', label: 'Settings', icon: Settings2 },
            ].map(({ id, label, icon: Icon }) => {
              const on = mobilePage === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === 'workspace') {
                      setMobilePage('workspace')
                      setMainTab('editor')
                      return
                    }
                    if (id === 'governance') {
                      setMobilePage('governance')
                      setMainTab('campaign')
                      return
                    }
                    setMobilePage(id as typeof mobilePage)
                  }}
                  className="flex flex-1 flex-col items-center gap-1"
                  aria-current={on ? 'page' : undefined}
                >
                  <span className={cn('flex h-8 w-12 items-center justify-center rounded-xl', on && 'bg-[#E0F5EE]')}>
                    <Icon className={cn('h-5 w-5', on ? 'text-[#1A8A7A]' : 'text-[#A8C8C0]')} aria-hidden />
                  </span>
                  <span className={cn('text-[10px]', on ? 'font-medium text-[#0E7060]' : 'text-[#A8C8C0]')}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
