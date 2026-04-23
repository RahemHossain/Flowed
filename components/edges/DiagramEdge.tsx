'use client'

import {
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
  type Position,
} from '@xyflow/react'
import type { EdgeData, MarkerStyleType } from '@/lib/types'

function getEdgePath(
  connectorType: string,
  sourceX: number, sourceY: number, sourcePosition: Position,
  targetX: number, targetY: number, targetPosition: Position,
): [string, number, number] {
  let result: [string, number, number, number, number]
  switch (connectorType) {
    case 'straight':
      result = getStraightPath({ sourceX, sourceY, targetX, targetY })
      break
    case 'step':
      // No getStepPath export — use borderRadius: 0 on smoothstep for sharp elbows
      result = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0 })
      break
    case 'bezier':
      result = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
      break
    default:
      result = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8 })
  }
  return [result[0], result[1], result[2]]
}

// Each edge defines its own inline SVG marker defs (unique IDs per edge).
// isStart=true  → outer/connecting point is at low x (placed at source)
// isStart=false → outer/connecting point is at high x (placed at target)
function MarkerDef({
  id, type, color, sw, isStart,
}: {
  id: string
  type: MarkerStyleType
  color: string
  sw: number
  isStart: boolean
}) {
  if (type === 'none') return null
  const orient = 'auto'
  const mu = 'userSpaceOnUse'

  switch (type) {
    case 'arrow':
      return (
        <marker id={id} markerWidth={13} markerHeight={10} refX={isStart ? 1 : 11} refY={5} orient={orient} markerUnits={mu}>
          <polyline
            points={isStart ? '11,1 1,5 11,9' : '1,1 11,5 1,9'}
            fill="none"
            stroke={color}
            strokeWidth={Math.max(sw, 1)}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </marker>
      )
    case 'arrowClosed':
      return (
        <marker id={id} markerWidth={13} markerHeight={10} refX={isStart ? 1 : 11} refY={5} orient={orient} markerUnits={mu}>
          <polygon
            points={isStart ? '11,1 1,5 11,9' : '1,1 11,5 1,9'}
            fill={color}
            stroke={color}
            strokeLinejoin="round"
          />
        </marker>
      )
    case 'triangle':
      // Hollow triangle — used for inheritance (end) and realization (end)
      return (
        <marker id={id} markerWidth={15} markerHeight={12} refX={isStart ? 1 : 13} refY={6} orient={orient} markerUnits={mu}>
          <polygon
            points={isStart ? '13,1 1,6 13,11' : '1,1 13,6 1,11'}
            fill="white"
            stroke={color}
            strokeWidth={Math.max(sw * 0.85, 1)}
            strokeLinejoin="round"
          />
        </marker>
      )
    case 'diamond':
      // Hollow diamond — aggregation
      return (
        <marker id={id} markerWidth={21} markerHeight={11} refX={isStart ? 1 : 19} refY={5} orient={orient} markerUnits={mu}>
          <polygon
            points="1,5 10,0 19,5 10,10"
            fill="white"
            stroke={color}
            strokeWidth={Math.max(sw * 0.85, 1)}
            strokeLinejoin="round"
          />
        </marker>
      )
    case 'diamondFilled':
      // Filled diamond — composition
      return (
        <marker id={id} markerWidth={21} markerHeight={11} refX={isStart ? 1 : 19} refY={5} orient={orient} markerUnits={mu}>
          <polygon
            points="1,5 10,0 19,5 10,10"
            fill={color}
            stroke={color}
            strokeWidth={Math.max(sw * 0.5, 0.5)}
            strokeLinejoin="round"
          />
        </marker>
      )
    default:
      return null
  }
}

function MultiplicityLabel({
  ax, ay, bx, by, text, color,
}: {
  ax: number; ay: number; bx: number; by: number; text: string; color: string
}) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / len
  const ny = dy / len
  // Place 20px along the edge, offset 13px perpendicular
  const x = ax + nx * 20 - ny * 13
  const y = ay + ny * 20 + nx * 13
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={color}
      fontSize={11}
      fontWeight={600}
      style={{ fontFamily: 'inherit', userSelect: 'none', pointerEvents: 'none' }}
    >
      {text}
    </text>
  )
}

export function DiagramEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
}: EdgeProps) {
  const d = (data ?? {}) as Partial<EdgeData>
  const color = d.strokeColor ?? '#64748b'
  const sw = d.strokeWidth ?? 1.5
  const lineStyle = d.lineStyle ?? 'solid'
  const connectorType = d.connectorType ?? 'smoothstep'
  const markerStartType = d.markerStartType ?? 'none'
  const markerEndType = d.markerEndType ?? 'arrowClosed'
  const sourceLabel = d.sourceLabel ?? ''
  const targetLabel = d.targetLabel ?? ''
  const label = d.label ?? ''

  const [edgePath, labelX, labelY] = getEdgePath(
    connectorType, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  )

  const strokeDasharray =
    lineStyle === 'dashed' ? '8 4' : lineStyle === 'dotted' ? '2 4' : undefined

  const strokeColor = selected ? '#4f46e5' : color
  const msId = `ms-${id}`
  const meId = `me-${id}`

  return (
    <>
      <defs>
        {markerStartType !== 'none' && (
          <MarkerDef id={msId} type={markerStartType} color={strokeColor} sw={sw} isStart />
        )}
        {markerEndType !== 'none' && (
          <MarkerDef id={meId} type={markerEndType} color={strokeColor} sw={sw} isStart={false} />
        )}
      </defs>

      {/* Wide transparent hit area for easy clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(sw + 12, 20)}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />

      {/* Visible styled path */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={sw}
        strokeDasharray={strokeDasharray}
        markerStart={markerStartType !== 'none' ? `url(#${msId})` : undefined}
        markerEnd={markerEndType !== 'none' ? `url(#${meId})` : undefined}
        style={{ cursor: 'pointer' }}
      />

      {sourceLabel && (
        <MultiplicityLabel ax={sourceX} ay={sourceY} bx={targetX} by={targetY} text={sourceLabel} color={strokeColor} />
      )}
      {targetLabel && (
        <MultiplicityLabel ax={targetX} ay={targetY} bx={sourceX} by={sourceY} text={targetLabel} color={strokeColor} />
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#fff',
              padding: '2px 8px',
              borderRadius: 5,
              fontSize: 11,
              color: '#374151',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
