'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'
import type { NodeData, ClassNodeData, EdgeData, ConnectorType, MarkerStyleType } from '@/lib/types'

interface Props {
  selectedNodes: Node[]
  selectedEdges: Edge[]
  onUpdateNodes: (patch: Record<string, unknown>) => void
  onUpdateEdge: (id: string, patch: Partial<EdgeData>) => void
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, color: '#94a3b8', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: 8, marginTop: 16,
    }}>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}>{children}</div>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 5 }}>
      {children}
    </div>
  )
}

function ColorPicker({
  value,
  onChange,
  allowNone,
}: {
  value: string
  onChange: (v: string) => void
  allowNone?: boolean
}) {
  const isNone = value === 'transparent' || value === 'none'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, border: '1.5px solid #e2e8f0',
        background: isNone
          ? 'repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 / 8px 8px'
          : value,
        cursor: 'pointer', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <input
          type="color"
          value={isNone ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 6,
          padding: '4px 7px', fontSize: 11, color: '#374151',
          fontFamily: 'ui-monospace, monospace', outline: 'none', background: '#fafafa',
          minWidth: 0,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
      />
      {allowNone && (
        <button
          onClick={() => onChange('transparent')}
          title="No fill"
          style={{
            padding: '4px 7px', fontSize: 10, fontWeight: 600,
            border: `1.5px solid ${isNone ? '#4f46e5' : '#e2e8f0'}`,
            borderRadius: 6, background: isNone ? '#ede9fe' : 'none',
            cursor: 'pointer', color: isNone ? '#4f46e5' : '#64748b', flexShrink: 0,
          }}
        >
          None
        </button>
      )}
    </div>
  )
}

function Slider({
  value, onChange, min, max, step = 1,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#4f46e5', cursor: 'pointer' }}
      />
      <span style={{
        fontSize: 11, color: '#374151', minWidth: 26, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  )
}

function Chips<T extends string>({
  value, options, onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '4px 9px', fontSize: 11, fontWeight: active ? 600 : 400,
              border: `1.5px solid ${active ? '#4f46e5' : '#e2e8f0'}`,
              borderRadius: 6,
              background: active ? '#4f46e5' : '#fff',
              color: active ? '#fff' : '#64748b',
              cursor: 'pointer', transition: 'all 0.1s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Class node editing ────────────────────────────────────────────────────────

function ClassEditor({
  data,
  onUpdate,
}: {
  data: ClassNodeData
  onUpdate: (patch: Record<string, unknown>) => void
}) {
  const [localClassName, setLocalClassName] = useState(data.className)
  const [localStereotype, setLocalStereotype] = useState(data.stereotype)
  const [localAttrs, setLocalAttrs] = useState<string[]>(data.attributes)
  const [localMethods, setLocalMethods] = useState<string[]>(data.methods)

  // Sync local state when data changes externally (undo/redo, add/remove)
  useEffect(() => { setLocalClassName(data.className) }, [data.className])
  useEffect(() => { setLocalStereotype(data.stereotype) }, [data.stereotype])
  useEffect(() => { setLocalAttrs(data.attributes) }, [data.attributes])
  useEffect(() => { setLocalMethods(data.methods) }, [data.methods])

  const commitAttr = useCallback(
    (i: number, val: string) => {
      const next = [...localAttrs]
      next[i] = val
      onUpdate({ attributes: next })
    },
    [localAttrs, onUpdate]
  )

  const removeAttr = useCallback(
    (i: number) => {
      onUpdate({ attributes: data.attributes.filter((_, j) => j !== i) })
    },
    [data.attributes, onUpdate]
  )

  const addAttr = useCallback(() => {
    onUpdate({ attributes: [...data.attributes, '- attribute: Type'] })
  }, [data.attributes, onUpdate])

  const commitMethod = useCallback(
    (i: number, val: string) => {
      const next = [...localMethods]
      next[i] = val
      onUpdate({ methods: next })
    },
    [localMethods, onUpdate]
  )

  const removeMethod = useCallback(
    (i: number) => {
      onUpdate({ methods: data.methods.filter((_, j) => j !== i) })
    },
    [data.methods, onUpdate]
  )

  const addMethod = useCallback(() => {
    onUpdate({ methods: [...data.methods, '+ method(): void'] })
  }, [data.methods, onUpdate])

  const inputStyle: React.CSSProperties = {
    flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 6,
    padding: '4px 7px', fontSize: 11, color: '#374151',
    fontFamily: 'ui-monospace, monospace', outline: 'none',
    background: '#fafafa', minWidth: 0,
  }

  const addBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    width: '100%', padding: '5px 8px', marginTop: 4,
    border: '1.5px dashed #cbd5e1', borderRadius: 6,
    background: 'none', cursor: 'pointer', color: '#64748b',
    fontSize: 11, fontWeight: 500,
  }

  const delBtn: React.CSSProperties = {
    flexShrink: 0, padding: '2px 4px', border: 'none', background: 'none',
    cursor: 'pointer', color: '#94a3b8', borderRadius: 4, display: 'flex', alignItems: 'center',
  }

  return (
    <>
      <Row>
        <FieldLabel>Class Name</FieldLabel>
        <input
          value={localClassName}
          onChange={(e) => setLocalClassName(e.target.value)}
          onBlur={() => onUpdate({ className: localClassName })}
          onKeyDown={(e) => { if (e.key === 'Enter') onUpdate({ className: localClassName }) }}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', fontWeight: 600, fontFamily: 'inherit' }}
        />
      </Row>

      <Row>
        <FieldLabel>Stereotype (optional)</FieldLabel>
        <input
          value={localStereotype}
          onChange={(e) => setLocalStereotype(e.target.value)}
          onBlur={() => onUpdate({ stereotype: localStereotype })}
          onKeyDown={(e) => { if (e.key === 'Enter') onUpdate({ stereotype: localStereotype }) }}
          placeholder="e.g. interface"
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
      </Row>

      <SectionLabel>Attributes</SectionLabel>
      {localAttrs.map((attr, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <input
            value={attr}
            onChange={(e) => {
              const next = [...localAttrs]
              next[i] = e.target.value
              setLocalAttrs(next)
            }}
            onBlur={() => commitAttr(i, localAttrs[i])}
            onKeyDown={(e) => { if (e.key === 'Enter') commitAttr(i, localAttrs[i]) }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
            style={inputStyle}
          />
          <button onClick={() => removeAttr(i)} title="Remove" style={delBtn}>
            <X size={12} />
          </button>
        </div>
      ))}
      <button onClick={addAttr} style={addBtn}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
      >
        <Plus size={11} /> Add Attribute
      </button>

      <SectionLabel>Methods</SectionLabel>
      {localMethods.map((method, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <input
            value={method}
            onChange={(e) => {
              const next = [...localMethods]
              next[i] = e.target.value
              setLocalMethods(next)
            }}
            onBlur={() => commitMethod(i, localMethods[i])}
            onKeyDown={(e) => { if (e.key === 'Enter') commitMethod(i, localMethods[i]) }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
            style={inputStyle}
          />
          <button onClick={() => removeMethod(i)} title="Remove" style={delBtn}>
            <X size={12} />
          </button>
        </div>
      ))}
      <button onClick={addMethod} style={addBtn}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
      >
        <Plus size={11} /> Add Method
      </button>
    </>
  )
}

// ── Edge panel ────────────────────────────────────────────────────────────────

const MARKER_OPTIONS: { value: MarkerStyleType; label: string }[] = [
  { value: 'none',         label: '—'  },
  { value: 'arrow',        label: '→'  },
  { value: 'arrowClosed',  label: '▶'  },
  { value: 'triangle',     label: '▷'  },
  { value: 'diamond',      label: '◇'  },
  { value: 'diamondFilled',label: '◆'  },
]

type UmlPreset = {
  label: string
  patch: Partial<EdgeData>
}
const UML_PRESETS: UmlPreset[] = [
  { label: 'Association',  patch: { markerStartType: 'none', markerEndType: 'arrow',        lineStyle: 'solid'  } },
  { label: 'Dependency',   patch: { markerStartType: 'none', markerEndType: 'arrow',        lineStyle: 'dashed' } },
  { label: 'Inheritance',  patch: { markerStartType: 'none', markerEndType: 'triangle',     lineStyle: 'solid'  } },
  { label: 'Realization',  patch: { markerStartType: 'none', markerEndType: 'triangle',     lineStyle: 'dashed' } },
  { label: 'Aggregation',  patch: { markerStartType: 'diamond',       markerEndType: 'none', lineStyle: 'solid' } },
  { label: 'Composition',  patch: { markerStartType: 'diamondFilled', markerEndType: 'none', lineStyle: 'solid' } },
]

function EdgePanel({
  edge,
  onUpdate,
}: {
  edge: Edge
  onUpdate: (id: string, patch: Partial<EdgeData>) => void
}) {
  const raw = (edge.data ?? {}) as Partial<EdgeData>
  const d: EdgeData = {
    label:           raw.label           ?? '',
    lineStyle:       raw.lineStyle       ?? 'solid',
    strokeColor:     raw.strokeColor     ?? '#64748b',
    strokeWidth:     raw.strokeWidth     ?? 1.5,
    connectorType:   raw.connectorType   ?? 'smoothstep',
    markerStartType: raw.markerStartType ?? 'none',
    markerEndType:   raw.markerEndType   ?? 'arrowClosed',
    sourceLabel:     raw.sourceLabel     ?? '',
    targetLabel:     raw.targetLabel     ?? '',
  }

  const [localLabel, setLocalLabel]   = useState(d.label)
  const [localSrc,   setLocalSrc]     = useState(d.sourceLabel)
  const [localTgt,   setLocalTgt]     = useState(d.targetLabel)
  useEffect(() => { setLocalLabel(d.label)       }, [d.label])
  useEffect(() => { setLocalSrc(d.sourceLabel)   }, [d.sourceLabel])
  useEffect(() => { setLocalTgt(d.targetLabel)   }, [d.targetLabel])

  const up = useCallback(
    (patch: Partial<EdgeData>) => onUpdate(edge.id, patch),
    [edge.id, onUpdate],
  )

  const inputStyle: React.CSSProperties = {
    flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 6,
    padding: '4px 7px', fontSize: 11, color: '#374151',
    outline: 'none', background: '#fafafa', minWidth: 0,
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <>
      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 8 }}>Connector</div>

      {/* UML presets */}
      <SectionLabel>UML Presets</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {UML_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => up(p.patch)}
            style={{
              padding: '3px 8px', fontSize: 10, fontWeight: 500,
              border: '1.5px solid #e2e8f0', borderRadius: 6,
              background: '#fff', color: '#475569', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <SectionLabel>Route</SectionLabel>
      <Row>
        <Chips<ConnectorType>
          value={d.connectorType}
          options={[
            { value: 'smoothstep', label: 'Curved' },
            { value: 'straight',   label: 'Straight' },
            { value: 'step',       label: 'Elbow' },
            { value: 'bezier',     label: 'Bezier' },
          ]}
          onChange={(v) => up({ connectorType: v })}
        />
      </Row>

      <SectionLabel>Line</SectionLabel>
      <Row>
        <Chips<EdgeData['lineStyle']>
          value={d.lineStyle}
          options={[
            { value: 'solid',  label: 'Solid'  },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ]}
          onChange={(v) => up({ lineStyle: v })}
        />
      </Row>

      <SectionLabel>Start Marker</SectionLabel>
      <Row>
        <Chips<MarkerStyleType>
          value={d.markerStartType}
          options={MARKER_OPTIONS}
          onChange={(v) => up({ markerStartType: v })}
        />
      </Row>

      <SectionLabel>End Marker</SectionLabel>
      <Row>
        <Chips<MarkerStyleType>
          value={d.markerEndType}
          options={MARKER_OPTIONS}
          onChange={(v) => up({ markerEndType: v })}
        />
      </Row>

      <SectionLabel>Multiplicity</SectionLabel>
      <Row>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Source</FieldLabel>
            <input
              value={localSrc}
              onChange={(e) => setLocalSrc(e.target.value)}
              onBlur={() => up({ sourceLabel: localSrc })}
              onKeyDown={(e) => { if (e.key === 'Enter') up({ sourceLabel: localSrc }) }}
              placeholder="e.g. 1"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Target</FieldLabel>
            <input
              value={localTgt}
              onChange={(e) => setLocalTgt(e.target.value)}
              onBlur={() => up({ targetLabel: localTgt })}
              onKeyDown={(e) => { if (e.key === 'Enter') up({ targetLabel: localTgt }) }}
              placeholder="e.g. *"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
            />
          </div>
        </div>
      </Row>

      <SectionLabel>Color</SectionLabel>
      <Row>
        <ColorPicker value={d.strokeColor} onChange={(v) => up({ strokeColor: v })} />
      </Row>

      <SectionLabel>Thickness</SectionLabel>
      <Row>
        <Slider value={d.strokeWidth} onChange={(v) => up({ strokeWidth: v })} min={0.5} max={8} step={0.5} />
      </Row>

      <SectionLabel>Label</SectionLabel>
      <Row>
        <input
          type="text"
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; up({ label: localLabel }) }}
          onKeyDown={(e) => { if (e.key === 'Enter') up({ label: localLabel }) }}
          placeholder="Edge label"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1.5px solid #e2e8f0', borderRadius: 6,
            padding: '5px 8px', fontSize: 12, outline: 'none',
            color: '#374151', background: '#fafafa',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
        />
      </Row>
    </>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function PropertiesPanel({ selectedNodes, selectedEdges, onUpdateNodes, onUpdateEdge }: Props) {
  const total = selectedNodes.length + selectedEdges.length

  if (total === 0) {
    return (
      <aside style={{
        width: 240, minWidth: 240, background: '#fff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ color: '#cbd5e1', fontSize: 12, textAlign: 'center', lineHeight: 1.7 }}>
          Select a shape or connector to edit its properties.
        </div>
      </aside>
    )
  }

  // Edge only
  if (selectedEdges.length > 0 && selectedNodes.length === 0) {
    return (
      <aside style={{
        width: 240, minWidth: 240, background: '#fff',
        borderLeft: '1px solid #e2e8f0',
        padding: '12px 14px', overflowY: 'auto',
      }}>
        <EdgePanel edge={selectedEdges[0]} onUpdate={onUpdateEdge} />
      </aside>
    )
  }

  // Node(s)
  const first = selectedNodes[0]
  const isClass = first.type === 'class'
  const classData = isClass ? (first.data as ClassNodeData) : null
  const nodeData = isClass ? null : (first.data as NodeData)

  const fillColor = (first.data as NodeData | ClassNodeData).fillColor ?? '#ffffff'
  const borderColor = (first.data as NodeData | ClassNodeData).borderColor ?? '#94a3b8'
  const borderWidth = (first.data as NodeData | ClassNodeData).borderWidth ?? 1.5
  const textColor = (first.data as NodeData | ClassNodeData).textColor ?? '#1e293b'
  const fontSize = (first.data as NodeData | ClassNodeData).fontSize ?? 14

  const countLabel = selectedNodes.length === 1
    ? (isClass ? 'UML Class' : (nodeData?.shapeType ?? 'Shape'))
    : `${selectedNodes.length} shapes`

  return (
    <aside style={{
      width: 240, minWidth: 240, background: '#fff',
      borderLeft: '1px solid #e2e8f0',
      padding: '12px 14px', overflowY: 'auto',
    }}>
      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 4, textTransform: 'capitalize' }}>
        {countLabel}
      </div>

      {/* Class-specific editing */}
      {isClass && classData && selectedNodes.length === 1 && (
        <ClassEditor data={classData} onUpdate={onUpdateNodes} />
      )}

      {/* Appearance */}
      <SectionLabel>Appearance</SectionLabel>

      <Row>
        <FieldLabel>Fill</FieldLabel>
        <ColorPicker value={fillColor} onChange={(v) => onUpdateNodes({ fillColor: v })} allowNone />
      </Row>

      <Row>
        <FieldLabel>Border Color</FieldLabel>
        <ColorPicker value={borderColor} onChange={(v) => onUpdateNodes({ borderColor: v })} allowNone />
      </Row>

      <Row>
        <FieldLabel>Border Width</FieldLabel>
        <Slider value={borderWidth} onChange={(v) => onUpdateNodes({ borderWidth: v })} min={0} max={8} step={0.5} />
      </Row>

      {!isClass && nodeData && (
        <Row>
          <FieldLabel>Border Style</FieldLabel>
          <Chips<NodeData['borderStyle']>
            value={nodeData.borderStyle ?? 'solid'}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
            ]}
            onChange={(v) => onUpdateNodes({ borderStyle: v })}
          />
        </Row>
      )}

      <SectionLabel>Text</SectionLabel>

      <Row>
        <FieldLabel>Color</FieldLabel>
        <ColorPicker value={textColor} onChange={(v) => onUpdateNodes({ textColor: v })} />
      </Row>

      <Row>
        <FieldLabel>Font Size</FieldLabel>
        <Slider value={fontSize} onChange={(v) => onUpdateNodes({ fontSize: v })} min={8} max={40} />
      </Row>

      {!isClass && nodeData && (
        <>
          <Row>
            <FieldLabel>Weight</FieldLabel>
            <Chips<NodeData['fontWeight']>
              value={nodeData.fontWeight ?? 'normal'}
              options={[
                { value: 'normal', label: 'Regular' },
                { value: 'bold', label: 'Bold' },
              ]}
              onChange={(v) => onUpdateNodes({ fontWeight: v })}
            />
          </Row>

          <Row>
            <FieldLabel>Alignment</FieldLabel>
            <Chips<NodeData['textAlign']>
              value={nodeData.textAlign ?? 'center'}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
              onChange={(v) => onUpdateNodes({ textAlign: v })}
            />
          </Row>
        </>
      )}
    </aside>
  )
}
