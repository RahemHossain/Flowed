'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react'
import type { NodeData, ShapeType } from '@/lib/types'

type Props = NodeProps & { data: NodeData }

// All shapes use a fixed viewBox so SVG presentation attributes are plain numbers —
// no calc() which is unreliable in SVG 1.1.
function ShapeSvg({
  shape,
  fill,
  stroke,
  strokeWidth,
  strokeDasharray,
}: {
  shape: ShapeType
  fill: string
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
}) {
  const sw = strokeWidth
  const common = { fill, stroke, strokeWidth: sw, ...(strokeDasharray ? { strokeDasharray } : {}) }

  switch (shape) {
    case 'process':
      return (
        <svg viewBox="0 0 200 80" width="100%" height="100%" preserveAspectRatio="none">
          <rect x={sw / 2} y={sw / 2} width={200 - sw} height={80 - sw} rx="6" {...common} />
        </svg>
      )

    case 'decision':
      return (
        <svg viewBox="0 0 200 120" width="100%" height="100%" preserveAspectRatio="none">
          <polygon points={`100,${sw} ${200 - sw},60 100,${120 - sw} ${sw},60`} {...common} />
        </svg>
      )

    case 'terminal':
      return (
        <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
          <rect x={sw / 2} y={sw / 2} width={200 - sw} height={60 - sw} rx="999" {...common} />
        </svg>
      )

    case 'data':
      return (
        <svg viewBox="0 0 200 80" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`${20 + sw},${sw} ${200 - sw},${sw} ${180 - sw},${80 - sw} ${sw},${80 - sw}`}
            {...common}
          />
        </svg>
      )

    case 'hexagon':
      return (
        <svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`${28 + sw},${sw} ${172 - sw},${sw} ${198 - sw},45 ${172 - sw},${90 - sw} ${28 + sw},${90 - sw} ${sw},45`}
            {...common}
          />
        </svg>
      )

    case 'cylinder': {
      const rx = 57 - sw / 2
      return (
        <svg viewBox="0 0 120 110" width="100%" height="100%" preserveAspectRatio="none">
          {/* body fill (no stroke so side lines don't double) */}
          <rect x={sw + 2} y="22" width={116 - sw * 2} height="70" fill={fill} stroke="none" />
          {/* bottom ellipse */}
          <ellipse cx="60" cy="92" rx={rx} ry="16" {...common} />
          {/* side lines */}
          <line x1={sw + 2} y1="22" x2={sw + 2} y2="92" stroke={stroke} strokeWidth={sw} {...(strokeDasharray ? { strokeDasharray } : {})} />
          <line x1={118 - sw} y1="22" x2={118 - sw} y2="92" stroke={stroke} strokeWidth={sw} {...(strokeDasharray ? { strokeDasharray } : {})} />
          {/* top ellipse (covers top of body rect) */}
          <ellipse cx="60" cy="22" rx={rx} ry="16" {...common} />
        </svg>
      )
    }

    case 'circle':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
          <ellipse cx="50" cy="50" rx={50 - sw} ry={50 - sw} {...common} />
        </svg>
      )

    case 'actor':
      return (
        // Preserve aspect ratio so the figure doesn't look squashed
        <svg viewBox="0 0 80 90" width="100%" height="75%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <circle cx="40" cy="14" r="11" fill={fill} stroke={stroke} strokeWidth={sw} />
          <line x1="40" y1="25" x2="40" y2="60" stroke={stroke} strokeWidth={sw} />
          <line x1="14" y1="42" x2="66" y2="42" stroke={stroke} strokeWidth={sw} />
          <line x1="40" y1="60" x2="18" y2="85" stroke={stroke} strokeWidth={sw} />
          <line x1="40" y1="60" x2="62" y2="85" stroke={stroke} strokeWidth={sw} />
        </svg>
      )

    case 'note':
      return (
        <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`${sw},${sw} 168,${sw} ${198 - sw},32 ${198 - sw},${128 - sw} ${sw},${128 - sw}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
            {...(strokeDasharray ? { strokeDasharray } : {})}
          />
          <polyline points={`168,${sw} 168,32 ${198 - sw},32`} fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      )

    case 'arrowRight':
      return (
        <svg viewBox="0 0 200 80" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`${sw},22 132,22 132,${sw} ${200 - sw},40 132,${80 - sw} 132,58 ${sw},58`}
            {...common}
          />
        </svg>
      )

    case 'arrowLeft':
      return (
        <svg viewBox="0 0 200 80" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`${200 - sw},22 68,22 68,${sw} ${sw},40 68,${80 - sw} 68,58 ${200 - sw},58`}
            {...common}
          />
        </svg>
      )

    case 'arrowUp':
      return (
        <svg viewBox="0 0 80 200" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`22,${200 - sw} 22,68 ${sw},68 40,${sw} ${80 - sw},68 58,68 58,${200 - sw}`}
            {...common}
          />
        </svg>
      )

    case 'arrowDown':
      return (
        <svg viewBox="0 0 80 200" width="100%" height="100%" preserveAspectRatio="none">
          <polygon
            points={`22,${sw} 22,132 ${sw},132 40,${200 - sw} ${80 - sw},132 58,132 58,${sw}`}
            {...common}
          />
        </svg>
      )

    case 'text':
      return null
  }
}

function DiagramNodeComponent({ id, data, selected, isConnectable }: Props) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync draft if label is changed externally (undo/redo or panel)
  useEffect(() => {
    if (!editing) setDraft(data.label)
  }, [data.label, editing])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  const commitEdit = useCallback(() => {
    setEditing(false)
    updateNodeData(id, { label: draft })
  }, [id, draft, updateNodeData])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(true)
  }, [])

  const fill = data.fillColor ?? '#ffffff'
  const stroke = data.borderColor ?? '#94a3b8'
  const strokeWidth = data.borderWidth ?? 1.5
  const textColor = data.textColor ?? '#1e293b'
  const fontSize = data.fontSize ?? 14
  const fontWeight = data.fontWeight ?? 'normal'
  const textAlign = (data.textAlign ?? 'center') as 'left' | 'center' | 'right'
  const borderStyle = data.borderStyle ?? 'solid'
  const shape = data.shapeType

  // undefined = no strokeDasharray attribute (solid line). '0' would render broken dashes.
  const strokeDasharray =
    borderStyle === 'dashed' ? '6 3' : borderStyle === 'dotted' ? '2 4' : undefined

  const isActor = shape === 'actor'
  const isText = shape === 'text'

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'default' }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={40}
        lineStyle={{ border: '1.5px dashed #4f46e5' }}
        handleStyle={{ width: 8, height: 8, background: '#4f46e5', border: '1.5px solid #fff', borderRadius: 2 }}
      />

      {/* Shape */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {isText ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: selected ? '1.5px dashed #cbd5e1' : '1.5px dashed transparent',
              borderRadius: 4,
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <ShapeSvg
            shape={shape}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        )}
      </div>

      {/* Selection ring */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: shape === 'circle' ? '50%' : 6,
            boxShadow: '0 0 0 2px #4f46e5',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Text — actor puts text at bottom, others center it */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isActor ? 'flex-end' : 'center',
          padding: isActor
            ? '0 6px 4px'
            : shape === 'decision'
            ? '18% 18%'
            : shape === 'note'
            ? '8px 16px 8px 10px'
            : '6px 10px',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            title="Edit label"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') { setDraft(data.label); setEditing(false) }
            }}
            style={{
              pointerEvents: 'all',
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              textAlign,
              color: textColor,
              fontSize,
              fontWeight,
              fontFamily: 'inherit',
              lineHeight: 1.4,
              padding: 0,
              overflow: 'hidden',
            }}
            rows={3}
          />
        ) : (
          <span
            style={{
              textAlign,
              color: textColor,
              fontSize,
              fontWeight,
              lineHeight: 1.4,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              userSelect: 'none',
              width: '100%',
              display: 'block',
            }}
          >
            {data.label || <span style={{ opacity: 0.28, fontStyle: 'italic' }}>Label</span>}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Top} id="top" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} />
    </div>
  )
}

export const DiagramNode = memo(DiagramNodeComponent)
