'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'

import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import Toolbar from './Toolbar'
import TopBar from './TopBar'
import PropertiesPanel from './PropertiesPanel'
import { getShapeDefinition } from '@/lib/shapeDefinitions'
import { exportDiagram } from '@/lib/export'
import type { NodeData, EdgeData, ExportFormat, PdfPageSize } from '@/lib/types'
import { createClient } from '@/utils/supabase/client'

const STORAGE_KEY = 'flowed-diagram'

function loadSaved(): { nodes: Node[]; edges: Edge[]; name: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { nodes: [], edges: [], name: 'Untitled Diagram' }
    const parsed = JSON.parse(raw)
    const nodes: Node[] = (parsed.nodes ?? []).map((n: Node) =>
      n.type === 'class' ? { ...n, style: { ...((n.style as object) ?? {}), height: undefined } } : n
    )
    const edges: Edge[] = (parsed.edges ?? []).map((e: Edge) => ({ ...e, type: 'diagram' }))
    return { nodes, edges, name: parsed.diagramName ?? 'Untitled Diagram' }
  } catch {
    return { nodes: [], edges: [], name: 'Untitled Diagram' }
  }
}

function normalizeNodes(nodes: Node[]): Node[] {
  return nodes.map((n: Node) =>
    n.type === 'class' ? { ...n, style: { ...((n.style as object) ?? {}), height: undefined } } : n
  )
}

function normalizeEdges(edges: Edge[]): Edge[] {
  return edges.map((e: Edge) => ({ ...e, type: 'diagram' }))
}

// Strip transient React Flow UI state so collaborators don't inherit each other's selection/drag state
function stripUIState(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map(({ selected: _s, dragging: _d, ...n }) => n as Node),
    edges: edges.map(({ selected: _s, ...e }) => e as Edge),
  }
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const DEFAULT_EDGE_COLOR = '#64748b'
const DEFAULT_EDGE: Partial<EdgeData> = {
  lineStyle: 'solid',
  strokeColor: DEFAULT_EDGE_COLOR,
  strokeWidth: 1.5,
  markerStartType: 'none',
  markerEndType: 'arrowClosed',
  connectorType: 'smoothstep',
  label: '',
  sourceLabel: '',
  targetLabel: '',
}

interface HistoryEntry {
  nodes: Node[]
  edges: Edge[]
}

function DiagramEditorContent({ diagramId }: { diagramId?: string }) {
  const reactFlow = useReactFlow()
  const router = useRouter()

  const [saved] = useState(() =>
    diagramId ? { nodes: [], edges: [], name: 'Untitled Diagram' } : loadSaved()
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(saved.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(saved.edges)
  const [diagramName, setDiagramName] = useState(saved.name)

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set())

  const selectedNodes = useMemo(
    () => nodes.filter((n) => selectedNodeIds.has(n.id)),
    [nodes, selectedNodeIds],
  )
  const selectedEdges = useMemo(
    () => edges.filter((e) => selectedEdgeIds.has(e.id)),
    [edges, selectedEdgeIds],
  )

  const [showGrid, setShowGrid] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [cloudLoading, setCloudLoading] = useState(!!diagramId)
  const [cloudSaving, setCloudSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const past = useRef<HistoryEntry[]>([])
  const future = useRef<HistoryEntry[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Realtime refs
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const skipBroadcast = useRef(false)

  // ── Cloud: load diagram ──────────────────────────────────────────────────
  useEffect(() => {
    if (!diagramId) return
    const supabase = createClient()
    supabase
      .from('diagrams')
      .select('*')
      .eq('id', diagramId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setNodes(normalizeNodes(data.data?.nodes ?? []))
          setEdges(normalizeEdges(data.data?.edges ?? []))
          setDiagramName(data.name ?? 'Untitled Diagram')
        }
        setCloudLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramId])

  // ── Cloud: real-time channel ─────────────────────────────────────────────
  useEffect(() => {
    if (!diagramId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`diagram-${diagramId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        skipBroadcast.current = true
        setNodes(normalizeNodes(payload.nodes ?? []))
        setEdges(normalizeEdges(payload.edges ?? []))
        if (payload.name) setDiagramName(payload.name)
        // Reset skip flag after React processes the state updates
        setTimeout(() => { skipBroadcast.current = false }, 300)
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramId])

  // ── Cloud: broadcast local changes to collaborators ──────────────────────
  useEffect(() => {
    if (!diagramId || !channelRef.current || cloudLoading) return
    if (skipBroadcast.current) return

    const timer = setTimeout(() => {
      const clean = stripUIState(nodes, edges)
      channelRef.current?.send({
        type: 'broadcast',
        event: 'update',
        payload: { nodes: clean.nodes, edges: clean.edges, name: diagramName },
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [diagramId, nodes, edges, diagramName, cloudLoading])

  // ── Cloud: save to database ──────────────────────────────────────────────
  useEffect(() => {
    if (!diagramId || cloudLoading) return
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const clean = stripUIState(nodes, edges)
      await supabase
        .from('diagrams')
        .update({ data: { nodes: clean.nodes, edges: clean.edges }, name: diagramName, updated_at: new Date().toISOString() })
        .eq('id', diagramId)
    }, 1500)
    return () => clearTimeout(timer)
  }, [diagramId, nodes, edges, diagramName, cloudLoading])

  // ── Local: auto-save to localStorage (home page only) ───────────────────
  useEffect(() => {
    if (diagramId) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, diagramName }))
      } catch { /* storage full */ }
    }, 400)
    return () => clearTimeout(timer)
  }, [diagramId, nodes, edges, diagramName])

  // ── Save to cloud (from home page) ──────────────────────────────────────
  const saveToCloud = useCallback(async () => {
    setCloudSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('diagrams')
        .insert({ name: diagramName, data: { nodes, edges } })
        .select('id')
        .single()
      if (data && !error) {
        router.push(`/diagram/${data.id}`)
      }
    } finally {
      setCloudSaving(false)
    }
  }, [diagramName, nodes, edges, router])

  const shareUrl = diagramId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/diagram/${diagramId}`
    : undefined

  // ── History ──────────────────────────────────────────────────────────────
  const snapshot = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    past.current = [...past.current, { nodes: currentNodes, edges: currentEdges }].slice(-60)
    future.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    const prev = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [{ nodes, edges }, ...future.current].slice(0, 60)
    setNodes(prev.nodes)
    setEdges(prev.edges)
    setCanUndo(past.current.length > 0)
    setCanRedo(true)
  }, [nodes, edges, setNodes, setEdges])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    const next = future.current[0]
    future.current = future.current.slice(1)
    past.current = [...past.current, { nodes, edges }]
    setNodes(next.nodes)
    setEdges(next.edges)
    setCanUndo(true)
    setCanRedo(future.current.length > 0)
  }, [nodes, edges, setNodes, setEdges])

  const makeEdge = useCallback(
    (connection: Connection, data: Partial<EdgeData> = {}): Edge => {
      const merged = { ...DEFAULT_EDGE, ...data } as EdgeData
      return { ...connection, id: generateId(), type: 'diagram', data: merged } as Edge
    },
    [],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      snapshot(nodes, edges)
      setEdges((eds) => addEdge(makeEdge(connection), eds))
    },
    [nodes, edges, snapshot, setEdges, makeEdge],
  )

  const onSelectionChange = useCallback(({ nodes: sn, edges: se }: OnSelectionChangeParams) => {
    setSelectedNodeIds(new Set(sn.map((n) => n.id)))
    setSelectedEdgeIds(new Set(se.map((e) => e.id)))
  }, [])

  const createNode = useCallback(
    (shapeType: string, position: { x: number; y: number }): Node => {
      const def = getShapeDefinition(shapeType)
      if (!def) throw new Error(`Unknown shape: ${shapeType}`)
      const style = def.nodeType === 'class'
        ? { width: def.defaultWidth }
        : { width: def.defaultWidth, height: def.defaultHeight }
      return { id: generateId(), type: def.nodeType, position, style, data: { ...def.defaultData } }
    },
    [],
  )

  const addShape = useCallback(
    (shapeType: string) => {
      snapshot(nodes, edges)
      const viewport = reactFlow.getViewport()
      const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom
      const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom
      const def = getShapeDefinition(shapeType)
      const node = createNode(shapeType, {
        x: centerX - (def?.defaultWidth ?? 80) / 2,
        y: centerY - (def?.defaultHeight ?? 60) / 2,
      })
      setNodes((nds) => [...nds, node])
    },
    [nodes, edges, snapshot, reactFlow, createNode, setNodes],
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const shapeType = event.dataTransfer.getData('application/reactflow/shapetype')
      if (!shapeType) return
      const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const def = getShapeDefinition(shapeType)
      snapshot(nodes, edges)
      setNodes((nds) => [
        ...nds,
        createNode(shapeType, {
          x: position.x - (def?.defaultWidth ?? 80) / 2,
          y: position.y - (def?.defaultHeight ?? 60) / 2,
        }),
      ])
    },
    [nodes, edges, snapshot, reactFlow, createNode, setNodes],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onNodeDragStop = useCallback(() => {
    snapshot(nodes, edges)
  }, [nodes, edges, snapshot])

  const onNodesDelete = useCallback(
    (deleted: Node[]) => { if (deleted.length > 0) snapshot(nodes, edges) },
    [nodes, edges, snapshot],
  )

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => { if (deleted.length > 0) snapshot(nodes, edges) },
    [nodes, edges, snapshot],
  )

  const updateSelectedNodes = useCallback(
    (patch: Record<string, unknown>) => {
      snapshot(nodes, edges)
      setNodes((nds) =>
        nds.map((n) => selectedNodeIds.has(n.id) ? { ...n, data: { ...n.data, ...patch } } : n)
      )
    },
    [nodes, edges, snapshot, selectedNodeIds, setNodes],
  )

  const updateEdge = useCallback(
    (id: string, patch: Partial<EdgeData>) => {
      snapshot(nodes, edges)
      setEdges((eds) =>
        eds.map((e): Edge => {
          if (e.id !== id) return e
          const prev = (e.data ?? {}) as EdgeData
          return { ...e, type: 'diagram', data: { ...DEFAULT_EDGE, ...prev, ...patch } as EdgeData }
        }),
      )
    },
    [nodes, edges, snapshot, setEdges],
  )

  const handleExport = useCallback(
    async (format: ExportFormat, pageSize: PdfPageSize) => {
      setExporting(true)
      try {
        await exportDiagram(reactFlow.getNodes(), format, pageSize, diagramName)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Export failed.')
      } finally {
        setExporting(false)
      }
    },
    [reactFlow, diagramName],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    },
    [undo, redo],
  )

  if (notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: '#64748b' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>Diagram not found</div>
        <div style={{ fontSize: 14 }}>This link may be invalid or the diagram was deleted.</div>
        <button
          onClick={() => router.push('/')}
          type="button"
          style={{ marginTop: 8, padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <TopBar
        diagramName={diagramName}
        onDiagramNameChange={setDiagramName}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onFitView={() => reactFlow.fitView({ padding: 0.12, duration: 300 })}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap((v) => !v)}
        onExport={handleExport}
        exporting={exporting}
        shareUrl={shareUrl}
        onSaveToCloud={diagramId ? undefined : saveToCloud}
        cloudSaving={cloudSaving}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Toolbar onAddShape={addShape} />

        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            deleteKeyCode={['Backspace', 'Delete']}
            zoomOnDoubleClick={false}
            fitView={false}
            minZoom={0.05}
            maxZoom={4}
            style={{ background: '#ffffff' }}
            proOptions={{ hideAttribution: true }}
          >
            {showGrid && (
              <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#cbd5e1" />
            )}
            <Controls showInteractive={false} />
            {showMiniMap && (
              <MiniMap
                nodeColor={(n) => ((n.data as NodeData)?.fillColor ?? '#e2e8f0')}
                maskColor="rgba(248,250,252,0.7)"
                pannable
                zoomable
              />
            )}

            {nodes.length === 0 && !cloudLoading && (
              <div
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', textAlign: 'center',
                  pointerEvents: 'none', color: '#94a3b8', userSelect: 'none',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Your canvas is empty</div>
                <div style={{ fontSize: 13 }}>Drag shapes from the left panel, then hover a shape to see connection handles</div>
              </div>
            )}

            {cloudLoading && (
              <div
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', color: '#94a3b8', fontSize: 14,
                  pointerEvents: 'none',
                }}
              >
                Loading diagram...
              </div>
            )}
          </ReactFlow>
        </div>

        <PropertiesPanel
          selectedNodes={selectedNodes}
          selectedEdges={selectedEdges}
          onUpdateNodes={updateSelectedNodes}
          onUpdateEdge={updateEdge}
        />
      </div>
    </div>
  )
}

export default function DiagramEditor({ diagramId }: { diagramId?: string }) {
  return (
    <ReactFlowProvider>
      <DiagramEditorContent diagramId={diagramId} />
    </ReactFlowProvider>
  )
}
