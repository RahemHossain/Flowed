'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react'
import type { ClassNodeData } from '@/lib/types'

type Props = NodeProps & { data: ClassNodeData }

function EditableList({
  items,
  onChange,
  textColor,
  fontSize,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  textColor: string
  fontSize: number
  placeholder: string
}) {
  const [draft, setDraft] = useState(items.join('\n'))
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(items.join('\n'))
  }, [items])

  const handleBlur = () => {
    const updated = draft.split('\n').filter((l) => l.trim() !== '')
    onChange(updated.length > 0 ? updated : [placeholder])
  }

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        color: textColor,
        fontSize,
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        lineHeight: 1.6,
        padding: '4px 10px',
        minHeight: 40,
      }}
      rows={Math.max(items.length, 1) + 1}
    />
  )
}

function ClassNodeComponent({ id, data, selected, isConnectable }: Props) {
  const { updateNodeData } = useReactFlow()
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(data.className)
  const [draftStereotype, setDraftStereotype] = useState(data.stereotype)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraftName(data.className)
    setDraftStereotype(data.stereotype)
  }, [data.className, data.stereotype])

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus()
  }, [editingName])

  const commitName = useCallback(() => {
    setEditingName(false)
    updateNodeData(id, { className: draftName, stereotype: draftStereotype })
  }, [id, draftName, draftStereotype, updateNodeData])

  const updateAttributes = useCallback(
    (attributes: string[]) => updateNodeData(id, { attributes }),
    [id, updateNodeData]
  )

  const updateMethods = useCallback(
    (methods: string[]) => updateNodeData(id, { methods }),
    [id, updateNodeData]
  )

  const fill = data.fillColor ?? '#ffffff'
  const stroke = data.borderColor ?? '#94a3b8'
  const sw = data.borderWidth ?? 1.5
  const textColor = data.textColor ?? '#1e293b'
  const fontSize = data.fontSize ?? 13

  return (
    <div
      style={{
        width: '100%',
        minHeight: 120,
        position: 'relative',
        background: fill,
        border: `${sw}px solid ${stroke}`,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: selected ? `0 0 0 2px #4f46e5` : 'none',
        cursor: 'default',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={120}
        lineStyle={{ border: '1.5px dashed #4f46e5' }}
        handleStyle={{ width: 8, height: 8, background: '#4f46e5', border: '1.5px solid #fff', borderRadius: 2 }}
      />

      {/* Class name section */}
      <div
        style={{
          borderBottom: `${sw}px solid ${stroke}`,
          padding: '6px 10px',
          textAlign: 'center',
          background: selected ? '#f5f3ff' : fill,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setEditingName(true)
        }}
      >
        {data.stereotype ? (
          <div style={{ fontSize: fontSize - 2, color: '#64748b', fontStyle: 'italic' }}>
            {editingName ? (
              <input
                value={draftStereotype}
                onChange={(e) => setDraftStereotype(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') commitName()
                }}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: fontSize - 2, color: '#64748b' }}
              />
            ) : (
              `«${data.stereotype}»`
            )}
          </div>
        ) : null}
        {editingName ? (
          <input
            ref={nameRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') commitName()
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize,
              color: textColor,
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <div style={{ fontWeight: 'bold', fontSize, color: textColor }}>{data.className}</div>
        )}
      </div>

      {/* Attributes */}
      <div style={{ borderBottom: `${sw}px solid ${stroke}` }}>
        <EditableList
          items={data.attributes}
          onChange={updateAttributes}
          textColor={textColor}
          fontSize={fontSize - 1}
          placeholder="- attribute: Type"
        />
      </div>

      {/* Methods */}
      <div>
        <EditableList
          items={data.methods}
          onChange={updateMethods}
          textColor={textColor}
          fontSize={fontSize - 1}
          placeholder="+ method(): void"
        />
      </div>

      <Handle type="source" position={Position.Top} id="top" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} />
    </div>
  )
}

export const ClassNode = memo(ClassNodeComponent)
