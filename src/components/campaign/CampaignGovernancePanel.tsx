'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { applyPresetToHref } from '@/lib/campaign/apply-preset'
import { buildLinksCsv } from '@/lib/campaign/csv-export'
import {
  deletePreset,
  loadActivePresetId,
  saveActivePresetId,
  upsertPreset,
} from '@/lib/campaign/preset-storage'
import type { AnchorGovernanceRow, CampaignPreset } from '@/lib/campaign/types'
import { validateHrefAgainstPreset } from '@/lib/campaign/validate-href'
import { findUnlinkedUrlsInHtml } from '@/lib/campaign/unlinked-urls'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Copy,
  Trash2,
  ArrowRight,
} from 'lucide-react'

interface CampaignGovernancePanelProps {
  html: string
  rows: AnchorGovernanceRow[]
  onChangeRows: (rows: AnchorGovernanceRow[]) => void
  presets: CampaignPreset[]
  onPresetsChange: (presets: CampaignPreset[]) => void
  /** Switch parent tab to HTML workspace (e.g. when links are missing). */
  onGoToWorkspace: () => void
}

function createEmptyPreset(): CampaignPreset {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${Date.now()}`,
    name: 'New preset',
    brand: '',
    channel: 'email',
    utm: {
      source: '',
      medium: '',
      campaign: '',
      content: '',
      term: '',
    },
    customParams: {},
    deepLink: {
      enabled: false,
      useDeepLinksFlag: true,
      followRedirects: true,
    },
    governance: {
      allowedDomains: [],
      requiredParamKeys: ['utm_source', 'utm_medium', 'utm_campaign'],
    },
  }
}

function presetBehaviorSummary(p: CampaignPreset): string[] {
  const lines: string[] = []
  const utmBits = [p.utm.source, p.utm.medium, p.utm.campaign].filter(Boolean).length
  lines.push(
    utmBits
      ? `Adds or overwrites UTM tags (source / medium / campaign${p.utm.content || p.utm.term ? ' + extras' : ''}).`
      : 'No UTM values set in this preset yet — add them when you edit the preset.'
  )
  if (Object.keys(p.customParams).length > 0) {
    lines.push(`Also merges ${Object.keys(p.customParams).length} custom query parameter(s).`)
  }
  lines.push(
    p.deepLink.enabled
      ? 'Appends deep-link flags ($deep_link, $follow_redirect).'
      : 'Does not append deep-link flags.'
  )
  if (p.governance.allowedDomains.length > 0) {
    lines.push(
      `Only allows these hostnames: ${p.governance.allowedDomains.slice(0, 3).join(', ')}${p.governance.allowedDomains.length > 3 ? '…' : ''}.`
    )
  } else {
    lines.push('Does not restrict destination domains.')
  }
  if (p.governance.requiredParamKeys.length > 0) {
    lines.push(
      `Requires query keys: ${p.governance.requiredParamKeys.join(', ')}.`
    )
  }
  return lines
}

function CollapsibleBlock({
  title,
  subtitle,
  defaultOpen,
  badge,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen: boolean
  badge?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="app-section">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 rounded-lg text-left transition-colors hover:bg-muted/40 -m-1 p-1"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown
            className={cn('h-5 w-5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
            aria-hidden
          />
        </div>
      </button>
      {open ? <div className="mt-5 border-t border-border pt-5">{children}</div> : null}
    </section>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {n}
    </span>
  )
}

interface PresetEditorFieldsProps {
  editingPreset: CampaignPreset
  setEditingPreset: (p: CampaignPreset) => void
  customKeysText: string
  setCustomKeysText: (s: string) => void
  onSave: () => void
  onCancel: () => void
}

function PresetEditorFields({
  editingPreset,
  setEditingPreset,
  customKeysText,
  setCustomKeysText,
  onSave,
  onCancel,
}: PresetEditorFieldsProps) {
  return (
    <div className="space-y-6 rounded-xl border border-primary/20 bg-accent/30 p-5">
      <p className="text-sm text-muted-foreground">
        Changes only affect links after you click <strong className="text-foreground">Apply preset to all links</strong>{' '}
        in the section above.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Preset name</Label>
          <Input
            id="p-name"
            value={editingPreset.name}
            onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-brand">Brand label</Label>
          <Input
            id="p-brand"
            value={editingPreset.brand}
            onChange={(e) => setEditingPreset({ ...editingPreset, brand: e.target.value })}
            placeholder="e.g. Acme"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="p-channel">Channel</Label>
          <Input
            id="p-channel"
            value={editingPreset.channel}
            onChange={(e) => setEditingPreset({ ...editingPreset, channel: e.target.value })}
            placeholder="email, crm, sms…"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">UTM parameters</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Merge tags like {'{{campaign_name}}'} are OK in campaign or custom lines.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['utm_source', editingPreset.utm.source, (v: string) => ({ ...editingPreset, utm: { ...editingPreset.utm, source: v } })],
              ['utm_medium', editingPreset.utm.medium, (v: string) => ({ ...editingPreset, utm: { ...editingPreset.utm, medium: v } })],
              ['utm_campaign', editingPreset.utm.campaign, (v: string) => ({ ...editingPreset, utm: { ...editingPreset.utm, campaign: v } })],
              ['utm_content', editingPreset.utm.content, (v: string) => ({ ...editingPreset, utm: { ...editingPreset.utm, content: v } })],
              ['utm_term', editingPreset.utm.term, (v: string) => ({ ...editingPreset, utm: { ...editingPreset.utm, term: v } })],
            ] as const
          ).map(([key, val, merge]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="font-mono text-xs">
                {key}
              </Label>
              <Input id={key} value={val} onChange={(e) => setEditingPreset(merge(e.target.value))} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="custom-params">Custom params (one per line: key=value)</Label>
        <textarea
          id="custom-params"
          className="app-textarea min-h-[88px] font-mono text-xs"
          value={customKeysText}
          onChange={(e) => setCustomKeysText(e.target.value)}
          placeholder="partner_id=123"
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">Deep-link query flags</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              checked={editingPreset.deepLink.enabled}
              onChange={(e) =>
                setEditingPreset({
                  ...editingPreset,
                  deepLink: { ...editingPreset.deepLink, enabled: e.target.checked },
                })
              }
            />
            Add <code className="rounded bg-muted px-1 text-xs">$deep_link</code> &amp;{' '}
            <code className="rounded bg-muted px-1 text-xs">$follow_redirect</code>
          </label>
          {editingPreset.deepLink.enabled ? (
            <>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  checked={editingPreset.deepLink.useDeepLinksFlag}
                  onChange={(e) =>
                    setEditingPreset({
                      ...editingPreset,
                      deepLink: { ...editingPreset.deepLink, useDeepLinksFlag: e.target.checked },
                    })
                  }
                />
                $deep_link = true
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  checked={editingPreset.deepLink.followRedirects}
                  onChange={(e) =>
                    setEditingPreset({
                      ...editingPreset,
                      deepLink: { ...editingPreset.deepLink, followRedirects: e.target.checked },
                    })
                  }
                />
                $follow_redirect = true
              </label>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="allowed-domains">Allowed domains (one per line; empty = any)</Label>
          <textarea
            id="allowed-domains"
            className="app-textarea min-h-[88px] font-mono text-xs"
            value={editingPreset.governance.allowedDomains.join('\n')}
            onChange={(e) =>
              setEditingPreset({
                ...editingPreset,
                governance: {
                  ...editingPreset.governance,
                  allowedDomains: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                },
              })
            }
            placeholder="yoursite.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="required-keys">Required query keys (comma-separated)</Label>
          <Input
            id="required-keys"
            value={editingPreset.governance.requiredParamKeys.join(', ')}
            onChange={(e) =>
              setEditingPreset({
                ...editingPreset,
                governance: {
                  ...editingPreset.governance,
                  requiredParamKeys: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
            placeholder="utm_source, utm_medium, utm_campaign"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button type="button" onClick={onSave}>
          Save preset
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function CampaignGovernancePanel({
  html,
  rows,
  onChangeRows,
  presets,
  onPresetsChange,
  onGoToWorkspace,
}: CampaignGovernancePanelProps) {
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? loadActivePresetId() : null
    if (saved && presets.some((p) => p.id === saved)) return saved
    return presets[0]?.id ?? ''
  })
  const [editingPreset, setEditingPreset] = useState<CampaignPreset | null>(null)
  const [customKeysText, setCustomKeysText] = useState('')
  const [showOriginalHref, setShowOriginalHref] = useState(false)

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activeId) ?? presets[0],
    [presets, activeId]
  )

  const validations = useMemo(() => {
    if (!activePreset) return []
    return rows.map((r) => validateHrefAgainstPreset(r.finalHref, activePreset))
  }, [rows, activePreset])

  const unlinked = useMemo(() => {
    if (!html.trim()) return []
    return findUnlinkedUrlsInHtml(html)
  }, [html])

  const invalidCount = validations.filter((v) => !v.ok).length
  const hasRows = rows.length > 0

  function persistActiveId(id: string) {
    setActiveId(id)
    saveActivePresetId(id)
  }

  function handleSelectPreset(id: string) {
    persistActiveId(id)
  }

  function handleApplyPresetToAll() {
    if (!activePreset) return
    onChangeRows(
      rows.map((r) => ({
        ...r,
        finalHref: applyPresetToHref(r.href, activePreset),
      }))
    )
  }

  function handleExportCsv() {
    if (!activePreset) return
    const csv = buildLinksCsv(rows, validations)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `link-governance-${activePreset.brand || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openEditPreset(p: CampaignPreset) {
    setEditingPreset({ ...p })
    setCustomKeysText(
      Object.entries(p.customParams)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')
    )
  }

  function closeEditor() {
    setEditingPreset(null)
    setCustomKeysText('')
  }

  function saveEditingPreset() {
    if (!editingPreset) return
    const custom: Record<string, string> = {}
    for (const line of customKeysText.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.includes('=')) continue
      const eq = trimmed.indexOf('=')
      const k = trimmed.slice(0, eq).trim()
      const v = trimmed.slice(eq + 1).trim()
      if (k) custom[k] = v
    }
    const next: CampaignPreset = { ...editingPreset, customParams: custom }
    const isNew = !presets.some((p) => p.id === next.id)
    onPresetsChange(upsertPreset(presets, next))
    if (isNew) persistActiveId(next.id)
    closeEditor()
  }

  function handleDeletePreset(id: string) {
    if (!confirm('Delete this preset? This cannot be undone.')) return
    const list = deletePreset(presets, id)
    onPresetsChange(list)
    if (id === activeId && list[0]) persistActiveId(list[0].id)
    if (editingPreset?.id === id) closeEditor()
  }

  function handleDuplicatePreset(p: CampaignPreset) {
    const copy: CampaignPreset = {
      ...structuredClone(p),
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `p-${Date.now()}`,
      name: `${p.name} (copy)`,
    }
    onPresetsChange([...presets, copy])
    persistActiveId(copy.id)
    closeEditor()
  }

  if (!activePreset) {
    return (
      <p className="text-sm text-muted-foreground">Add a preset to use governance.</p>
    )
  }

  const summaryLines = presetBehaviorSummary(activePreset)

  return (
    <div className="space-y-6">
      {/* Orientation */}
      <div className="rounded-xl border border-border bg-gradient-to-b from-muted/60 to-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">How to use this tab</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Do things in order. You only need the advanced sections at the bottom if you are creating or tweaking presets.
        </p>
        <ol className="mt-5 space-y-4">
          <li className="flex gap-3">
            <StepBadge n={1} />
            <div>
              <p className="font-medium text-foreground">Load links from your HTML</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                On <strong className="text-foreground">HTML workspace</strong>, paste HTML and click{' '}
                <strong className="text-foreground">Scan HTML for links</strong>.
              </p>
              {!hasRows ? (
                <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={onGoToWorkspace}>
                  Go to HTML workspace
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {rows.length} link{rows.length === 1 ? '' : 's'} loaded
                </p>
              )}
            </div>
          </li>
          <li className="flex gap-3">
            <StepBadge n={2} />
            <div>
              <p className="font-medium text-foreground">Choose a preset and apply it once</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pick the rule set below, then press <strong className="text-foreground">Apply preset to all links</strong>
                . That rewrites every final URL in one shot.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <StepBadge n={3} />
            <div>
              <p className="font-medium text-foreground">Fix anything flagged, then export</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Open <strong className="text-foreground">Review links</strong> if something fails validation. Copy HTML
                from the workspace tab, or download a CSV here for your team.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Primary task — always visible */}
      <section className="app-section border-primary/20 ring-1 ring-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Main action</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Apply tracking rules</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select which saved preset to use, then run it across every link you scanned.
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="preset-select" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active preset
          </Label>
          <select
            id="preset-select"
            className="app-select max-w-full sm:max-w-lg"
            value={activeId}
            onChange={(e) => handleSelectPreset(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.brand ? ` · ${p.brand}` : ''} · {p.channel}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What this preset does</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-foreground">
            {summaryLines.map((line, i) => (
              <li key={i} className="pl-1 marker:text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="button" size="lg" disabled={!hasRows} onClick={handleApplyPresetToAll} className="w-full sm:w-auto">
            <Sparkles className="mr-2 h-4 w-4" aria-hidden />
            Apply preset to all links
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!hasRows}
            onClick={handleExportCsv}
            className="w-full border-border bg-background sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Download CSV
          </Button>
        </div>
        {!hasRows ? (
          <p className="mt-3 text-sm text-muted-foreground">Scan links first — these buttons unlock after step 1.</p>
        ) : null}

        <div
          className={cn(
            'mt-6 rounded-lg border px-4 py-3 text-sm',
            !hasRows && 'border-border bg-muted/30 text-muted-foreground',
            hasRows && invalidCount === 0 && 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
            hasRows && invalidCount > 0 && 'border-amber-200 bg-amber-50/90 text-amber-950'
          )}
          role="status"
        >
          {!hasRows ? (
            'Validation will run here after links are loaded and you apply a preset.'
          ) : invalidCount === 0 ? (
            <span className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              All {rows.length} link{rows.length === 1 ? '' : 's'} pass checks for this preset.
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {invalidCount} link{invalidCount === 1 ? '' : 's'} need fixes — open <strong className="mx-0.5">Review links</strong>{' '}
              below.
            </span>
          )}
        </div>
      </section>

      <CollapsibleBlock
        title="Review links"
        subtitle="Edit final URLs one by one. Turn on “original href” only when you need to compare."
        defaultOpen={hasRows}
        badge={
          hasRows ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {rows.length}
            </span>
          ) : null
        }
      >
        {!hasRows ? (
          <p className="text-sm text-muted-foreground">
            Nothing to show yet. Complete step 1 on the HTML workspace tab, then come back here.
          </p>
        ) : (
          <>
            <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary"
                checked={showOriginalHref}
                onChange={(e) => setShowOriginalHref(e.target.checked)}
              />
              Show original href column (technical)
            </label>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 w-10">#</th>
                    <th className="px-3 py-3 min-w-[100px]">Link text</th>
                    {showOriginalHref ? (
                      <th className="px-3 py-3 min-w-[160px]">Original href</th>
                    ) : null}
                    <th className="px-3 py-3 min-w-[200px]">Final URL</th>
                    <th className="px-3 py-3 w-24">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const v = validations[i] ?? { ok: true, issues: [] }
                    return (
                      <tr key={`${row.index}-${i}`} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 tabular-nums text-muted-foreground">{row.index + 1}</td>
                        <td className="px-3 py-3 text-foreground max-w-[200px] break-words">{row.text}</td>
                        {showOriginalHref ? (
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground break-all">{row.href}</td>
                        ) : null}
                        <td className="px-3 py-3">
                          <Input
                            className="font-mono text-xs"
                            value={row.finalHref}
                            onChange={(e) => {
                              const next = [...rows]
                              next[i] = { ...row, finalHref: e.target.value }
                              onChangeRows(next)
                            }}
                          />
                          {!v.ok ? (
                            <ul className="mt-2 space-y-1 text-xs text-amber-900">
                              {v.issues.map((issue) => (
                                <li key={issue} className="flex gap-1.5">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                              v.ok
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-amber-200 bg-amber-100 text-amber-950'
                            )}
                          >
                            {v.ok ? 'OK' : 'Fix'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CollapsibleBlock>

      <CollapsibleBlock
        title="Preset library"
        subtitle="Create, duplicate, or edit presets. You only see the long form when you choose to."
        defaultOpen={false}
        badge={<span className="text-xs text-muted-foreground">{presets.length} saved</span>}
      >
        <p className="text-sm text-muted-foreground">
          Presets are stored in this browser only. Editing does not change links until you use{' '}
          <strong className="text-foreground">Apply preset to all links</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openEditPreset(activePreset)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit current preset
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openEditPreset(createEmptyPreset())}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New preset
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => handleDuplicatePreset(activePreset)}>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Duplicate current
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10"
            disabled={presets.length <= 1}
            onClick={() => handleDeletePreset(activePreset.id)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete current
          </Button>
        </div>

        {editingPreset ? (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {presets.some((p) => p.id === editingPreset.id) ? 'Editing preset' : 'New preset'}
            </h3>
            <PresetEditorFields
              editingPreset={editingPreset}
              setEditingPreset={setEditingPreset}
              customKeysText={customKeysText}
              setCustomKeysText={setCustomKeysText}
              onSave={saveEditingPreset}
              onCancel={closeEditor}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Choose an action above to open the editor.</p>
        )}
      </CollapsibleBlock>

      <CollapsibleBlock
        title="Optional: URLs sitting in plain text"
        subtitle="FYI only — finds http(s) outside of <a> tags. Not a recommendation for where to add buttons."
        defaultOpen={false}
        badge={
          unlinked.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{unlinked.length}</span>
          ) : null
        }
      >
        {unlinked.length === 0 ? (
          <p className="text-sm text-muted-foreground">None found, or paste HTML on the workspace tab first.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {unlinked.map((u) => (
              <li key={u.url} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                <div className="break-all font-mono text-xs text-primary">{u.url}</div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">…{u.context}…</div>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleBlock>
    </div>
  )
}
