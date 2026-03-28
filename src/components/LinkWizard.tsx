'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/useToast'
import { CampaignGovernancePanel } from '@/components/campaign/CampaignGovernancePanel'
import { applyHrefsToHtml, countAnchors, extractAnchorsFromHtml } from '@/lib/campaign/html-anchors'
import { loadPresets, savePresets } from '@/lib/campaign/preset-storage'
import type { AnchorGovernanceRow, CampaignPreset } from '@/lib/campaign/types'
import {
  Link2,
  Copy,
  RotateCcw,
  FileCode2,
  LayoutList,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'

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
  const [mainTab, setMainTab] = useState('editor')
  const [originalContent, setOriginalContent] = useState('')
  const [updatedContent, setUpdatedContent] = useState('')
  const [governanceRows, setGovernanceRows] = useState<AnchorGovernanceRow[]>([])
  const [presets, setPresets] = useState<CampaignPreset[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  const editorOptions = useMemo(
    () => ({
      theme: oneDark,
      height: '320px',
      width: '100%',
      style: { overflow: 'auto' as const, minHeight: '240px' },
      extensions: [html()],
    }),
    []
  )

  function handlePresetsChange(next: CampaignPreset[]) {
    setPresets(next)
    savePresets(next)
  }

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
    setUpdatedContent('')
    setGovernanceRows([])
    toast({
      title: 'Reset',
      description: 'Editor and link inventory cleared.',
    })
  }

  const handleCopyUpdatedContent = () => {
    navigator.clipboard.writeText(updatedContent).then(
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

  useEffect(() => {
    if (governanceRows.length === 0) {
      setUpdatedContent(originalContent)
      return
    }
    const n = countAnchors(originalContent)
    if (n !== governanceRows.length) {
      setUpdatedContent(originalContent)
      return
    }
    const hrefs = governanceRows.map((r) => r.finalHref)
    setUpdatedContent(applyHrefsToHtml(originalContent, hrefs))
  }, [governanceRows, originalContent])

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <p className="app-kicker">Email &amp; CRM</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Campaign link workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              Scan HTML, apply brand presets with UTMs and deep-link flags, validate domains and required
              parameters, then export governed markup or a CSV for your review workflow.
            </p>
          </div>
        </header>

        <div className="app-main">
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList
              className={cn(
                'mb-6 grid h-auto w-full max-w-xl grid-cols-2 gap-1 p-1.5 sm:inline-flex sm:w-auto sm:max-w-none'
              )}
            >
              <TabsTrigger value="editor" className="gap-2 px-4 py-2.5 sm:flex-initial">
                <FileCode2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                HTML workspace
              </TabsTrigger>
              <TabsTrigger value="campaign" className="gap-2 px-4 py-2.5 sm:flex-initial">
                <LayoutList className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Governance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-0 space-y-6 focus-visible:outline-none">
              <section className="app-section">
                <div className="app-section-header">
                  <div>
                    <p className="app-section-eyebrow">Step 1</p>
                    <h2 className="app-section-title">Source &amp; preview</h2>
                    <p className="app-section-desc mt-1 max-w-2xl">
                      Paste or edit HTML on the left. The preview updates when the number of links matches your
                      last scan—re-scan after structural edits.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="app-pill">CodeMirror</span>
                    <span className="app-pill">Live sync</span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Original HTML
                      </span>
                    </div>
                    <div className="app-editor-chrome">
                      <Suspense
                        fallback={
                          <div className="flex h-[320px] min-h-[240px] items-center justify-center bg-muted/60">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        }
                      >
                        <CodeMirror
                          value={originalContent}
                          onChange={setOriginalContent}
                          {...editorOptions}
                        />
                      </Suspense>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Governed preview
                      </span>
                      <span className="text-[11px] text-muted-foreground">Read-only</span>
                    </div>
                    <div className="app-editor-chrome opacity-[0.98] ring-1 ring-primary/10">
                      <Suspense
                        fallback={
                          <div className="flex h-[320px] min-h-[240px] items-center justify-center bg-muted/60">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        }
                      >
                        <CodeMirror value={updatedContent} readOnly {...editorOptions} />
                      </Suspense>
                    </div>
                  </div>
                </div>
              </section>

              <section className="app-section">
                <div className="app-section-header border-0 pb-0">
                  <div>
                    <p className="app-section-eyebrow">Step 2</p>
                    <h2 className="app-section-title">Actions</h2>
                    <p className="app-section-desc mt-1">
                      Scan extracts anchors in order, then use the Governance tab for presets and validation.
                    </p>
                  </div>
                </div>
                <div className="app-toolbar">
                  <Button
                    onClick={handleScanLinks}
                    size="lg"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
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
                    size="lg"
                    className="w-full border-border bg-background sm:w-auto"
                  >
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                    Copy governed HTML
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="destructive"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                    Reset all
                  </Button>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="campaign" className="mt-0 focus-visible:outline-none">
              {presets.length > 0 ? (
                <CampaignGovernancePanel
                  html={originalContent}
                  rows={governanceRows}
                  onChangeRows={setGovernanceRows}
                  presets={presets}
                  onPresetsChange={handlePresetsChange}
                  onGoToWorkspace={() => setMainTab('editor')}
                />
              ) : (
                <div className="app-section flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  Loading presets…
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
