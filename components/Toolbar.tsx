'use client'

import { useCallback } from 'react'
import { SHAPE_DEFINITIONS, SHAPE_CATEGORIES } from '@/lib/shapeDefinitions'

interface ToolbarProps {
  onAddShape: (type: string) => void
}

function ShapeIcon({ type }: { type: string }) {
  const s = { fill: '#e2e8f0', stroke: '#64748b', strokeWidth: 1.5 }

  switch (type) {
    case 'process':
      return (
        <svg viewBox="0 0 40 24" width="40" height="24">
          <rect x="1" y="1" width="38" height="22" rx="3" {...s} />
        </svg>
      )
    case 'decision':
      return (
        <svg viewBox="0 0 40 30" width="40" height="30">
          <polygon points="20,1 39,15 20,29 1,15" {...s} />
        </svg>
      )
    case 'terminal':
      return (
        <svg viewBox="0 0 40 22" width="40" height="22">
          <rect x="1" y="1" width="38" height="20" rx="10" {...s} />
        </svg>
      )
    case 'data':
      return (
        <svg viewBox="0 0 42 24" width="42" height="24">
          <polygon points="8,1 41,1 34,23 1,23" {...s} />
        </svg>
      )
    case 'hexagon':
      return (
        <svg viewBox="0 0 44 26" width="44" height="26">
          <polygon points="9,1 35,1 43,13 35,25 9,25 1,13" {...s} />
        </svg>
      )
    case 'cylinder':
      return (
        <svg viewBox="0 0 34 40" width="34" height="40">
          <rect x="1" y="9" width="32" height="24" fill={s.fill} stroke="none" />
          <ellipse cx="17" cy="33" rx="16" ry="6" {...s} />
          <line x1="1" y1="9" x2="1" y2="33" stroke={s.stroke} strokeWidth={s.strokeWidth} />
          <line x1="33" y1="9" x2="33" y2="33" stroke={s.stroke} strokeWidth={s.strokeWidth} />
          <ellipse cx="17" cy="9" rx="16" ry="6" {...s} />
        </svg>
      )
    case 'circle':
      return (
        <svg viewBox="0 0 36 28" width="36" height="28">
          <ellipse cx="18" cy="14" rx="17" ry="13" {...s} />
        </svg>
      )
    case 'note':
      return (
        <svg viewBox="0 0 40 32" width="40" height="32">
          <polygon points="1,1 31,1 39,9 39,31 1,31" {...s} />
          <polyline points="31,1 31,9 39,9" fill="none" stroke={s.stroke} strokeWidth={s.strokeWidth} />
        </svg>
      )
    case 'class':
      return (
        <svg viewBox="0 0 44 38" width="44" height="38">
          <rect x="1" y="1" width="42" height="36" rx="2" {...s} />
          <line x1="1" y1="12" x2="43" y2="12" stroke={s.stroke} strokeWidth={s.strokeWidth} />
          <line x1="1" y1="24" x2="43" y2="24" stroke={s.stroke} strokeWidth={s.strokeWidth} />
        </svg>
      )
    case 'actor':
      return (
        <svg viewBox="0 0 30 44" width="30" height="44">
          <circle cx="15" cy="7" r="6" {...s} />
          <line x1="15" y1="13" x2="15" y2="30" stroke={s.stroke} strokeWidth={s.strokeWidth} />
          <line x1="5" y1="21" x2="25" y2="21" stroke={s.stroke} strokeWidth={s.strokeWidth} />
          <line x1="15" y1="30" x2="5" y2="43" stroke={s.stroke} strokeWidth={s.strokeWidth} />
          <line x1="15" y1="30" x2="25" y2="43" stroke={s.stroke} strokeWidth={s.strokeWidth} />
        </svg>
      )
    case 'arrowRight':
      return (
        <svg viewBox="0 0 40 20" width="40" height="20">
          <polygon points="1,6 26,6 26,1 39,10 26,19 26,14 1,14" {...s} />
        </svg>
      )
    case 'arrowLeft':
      return (
        <svg viewBox="0 0 40 20" width="40" height="20">
          <polygon points="39,6 14,6 14,1 1,10 14,19 14,14 39,14" {...s} />
        </svg>
      )
    case 'arrowUp':
      return (
        <svg viewBox="0 0 20 40" width="20" height="40">
          <polygon points="6,39 6,14 1,14 10,1 19,14 14,14 14,39" {...s} />
        </svg>
      )
    case 'arrowDown':
      return (
        <svg viewBox="0 0 20 40" width="20" height="40">
          <polygon points="6,1 6,26 1,26 10,39 19,26 14,26 14,1" {...s} />
        </svg>
      )
    case 'text':
      return (
        <svg viewBox="0 0 40 24" width="40" height="24">
          <text x="4" y="18" fontFamily="serif" fontSize="18" fill="#64748b" fontWeight="bold">
            T
          </text>
          <line x1="1" y1="23" x2="39" y2="23" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 40 24" width="40" height="24">
          <rect x="1" y="1" width="38" height="22" rx="3" {...s} />
        </svg>
      )
  }
}

export default function Toolbar({ onAddShape }: ToolbarProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent, type: string) => {
      e.dataTransfer.setData('application/reactflow/shapetype', type)
      e.dataTransfer.effectAllowed = 'copy'
    },
    []
  )

  return (
    <aside
      style={{
        width: 196,
        minWidth: 196,
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRight: '1px solid #1e293b',
        userSelect: 'none',
      }}
    >
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e293b' }}>
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          Flowed
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 0 16px' }}>
        {SHAPE_CATEGORIES.map((cat) => {
          const shapes = SHAPE_DEFINITIONS.filter((s) => s.category === cat)
          if (shapes.length === 0) return null
          return (
            <div key={cat} style={{ marginBottom: 4 }}>
              <div
                style={{
                  padding: '10px 14px 4px',
                  color: '#64748b',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {cat}
              </div>
              {shapes.map((shape) => (
                <button
                  key={shape.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, shape.type)}
                  onClick={() => onAddShape(shape.type)}
                  title={`Add ${shape.name}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '7px 14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'grab',
                    color: '#94a3b8',
                    fontSize: 13,
                    textAlign: 'left',
                    borderRadius: 0,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = '#1e293b'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: 0.8 }}>
                    <ShapeIcon type={shape.type} />
                  </span>
                  <span style={{ fontSize: 12.5 }}>{shape.name}</span>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid #1e293b',
          color: '#334155',
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        Click or drag shapes onto the canvas. Double-click a shape to edit text.
      </div>
    </aside>
  )
}
