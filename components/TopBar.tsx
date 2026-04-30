'use client'

import { useState, useRef } from 'react'
import { Undo2, Redo2, Download, Grid3x3, Map, ChevronDown, ZoomIn, Link2, Share2, Check } from 'lucide-react'
import type { ExportFormat, PdfPageSize } from '@/lib/types'

interface TopBarProps {
  diagramName: string
  onDiagramNameChange: (name: string) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onFitView: () => void
  showGrid: boolean
  onToggleGrid: () => void
  showMiniMap: boolean
  onToggleMiniMap: () => void
  onExport: (format: ExportFormat, pageSize: PdfPageSize) => void
  exporting: boolean
  // cloud / sharing
  shareUrl?: string
  onSaveToCloud?: () => void
  cloudSaving?: boolean
}

export default function TopBar({
  diagramName,
  onDiagramNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFitView,
  showGrid,
  onToggleGrid,
  showMiniMap,
  onToggleMiniMap,
  onExport,
  exporting,
  shareUrl,
  onSaveToCloud,
  cloudSaving,
}: TopBarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(diagramName)
  const [copied, setCopied] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const commitName = () => {
    setEditingName(false)
    onDiagramNameChange(nameDraft.trim() || 'Untitled Diagram')
  }

  const handleCopyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const btn = (
    onClick: () => void,
    disabled: boolean,
    children: React.ReactNode,
    label: string,
    active?: boolean
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '5px 9px',
        background: active ? '#ede9fe' : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#cbd5e1' : active ? '#4f46e5' : '#475569',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background = active ? '#ddd6fe' : '#f1f5f9'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = active ? '#ede9fe' : 'transparent'
      }}
    >
      {children}
    </button>
  )

  return (
    <header
      style={{
        height: 48,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Diagram name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingName ? (
          <input
            ref={nameRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') {
                setNameDraft(diagramName)
                setEditingName(false)
              }
            }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#0f172a',
              border: '1.5px solid #4f46e5',
              borderRadius: 6,
              padding: '3px 8px',
              outline: 'none',
              background: '#fff',
              width: 240,
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameDraft(diagramName)
              setEditingName(true)
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '3px 8px',
              borderRadius: 6,
              cursor: 'text',
              fontSize: 14,
              fontWeight: 500,
              color: '#0f172a',
              maxWidth: 280,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#f8fafc')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          >
            {diagramName}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {btn(onUndo, !canUndo, <Undo2 size={15} />, 'Undo (Ctrl+Z)')}
        {btn(onRedo, !canRedo, <Redo2 size={15} />, 'Redo (Ctrl+Y)')}

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        {btn(onFitView, false, <ZoomIn size={15} />, 'Fit to view')}
        {btn(onToggleGrid, false, <Grid3x3 size={15} />, 'Toggle grid', showGrid)}
        {btn(onToggleMiniMap, false, <Map size={15} />, 'Toggle minimap', showMiniMap)}

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        {/* Share / Copy link */}
        {shareUrl ? (
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy shareable link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: copied ? '#f0fdf4' : '#f1f5f9',
              border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`,
              borderRadius: 7,
              cursor: 'pointer',
              color: copied ? '#16a34a' : '#475569',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        ) : onSaveToCloud ? (
          <button
            type="button"
            onClick={onSaveToCloud}
            disabled={cloudSaving}
            title="Save to cloud and get a shareable link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#f8faff',
              border: '1px solid #c7d2fe',
              borderRadius: 7,
              cursor: cloudSaving ? 'wait' : 'pointer',
              color: '#4f46e5',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!cloudSaving) {
                (e.currentTarget as HTMLButtonElement).style.background = '#ede9fe'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#a5b4fc'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#f8faff'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'
            }}
          >
            <Share2 size={14} />
            {cloudSaving ? 'Saving...' : 'Share'}
          </button>
        ) : null}

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        {/* Export button */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#4f46e5',
              border: 'none',
              borderRadius: 7,
              cursor: exporting ? 'wait' : 'pointer',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!exporting) (e.currentTarget as HTMLButtonElement).style.background = '#4338ca'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#4f46e5'
            }}
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export'}
            <ChevronDown size={13} />
          </button>

          {exportOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setExportOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 50,
                  minWidth: 200,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '6px 12px 4px', color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Image
                </div>
                {[
                  { label: 'PNG (transparent-safe)', format: 'png' as ExportFormat, pageSize: 'fit' as PdfPageSize },
                  { label: 'JPEG', format: 'jpeg' as ExportFormat, pageSize: 'fit' as PdfPageSize },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => { setExportOpen(false); onExport(opt.format, opt.pageSize) }}
                    style={{ display: 'block', width: '100%', padding: '9px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#1e293b', fontSize: 13 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#f8fafc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
                  >
                    {opt.label}
                  </button>
                ))}

                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                <div style={{ padding: '4px 12px 4px', color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  PDF
                </div>
                {[
                  { label: 'PDF (fit to content)', pageSize: 'fit' as PdfPageSize },
                  { label: 'PDF A4 Portrait', pageSize: 'a4-portrait' as PdfPageSize },
                  { label: 'PDF A4 Landscape', pageSize: 'a4-landscape' as PdfPageSize },
                  { label: 'PDF Letter Portrait', pageSize: 'letter-portrait' as PdfPageSize },
                  { label: 'PDF Letter Landscape', pageSize: 'letter-landscape' as PdfPageSize },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.pageSize}
                    onClick={() => { setExportOpen(false); onExport('pdf', opt.pageSize) }}
                    style={{ display: 'block', width: '100%', padding: '9px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#1e293b', fontSize: 13 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#f8fafc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
                  >
                    {opt.label}
                  </button>
                ))}
                <div style={{ height: 8 }} />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
