export type ShapeType =
  | 'process'
  | 'decision'
  | 'terminal'
  | 'data'
  | 'cylinder'
  | 'circle'
  | 'hexagon'
  | 'actor'
  | 'note'
  | 'text'
  | 'arrowRight'
  | 'arrowLeft'
  | 'arrowUp'
  | 'arrowDown'

export interface NodeData extends Record<string, unknown> {
  label: string
  shapeType: ShapeType
  fillColor: string
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted'
  textColor: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
}

export interface ClassNodeData extends Record<string, unknown> {
  className: string
  stereotype: string
  attributes: string[]
  methods: string[]
  fillColor: string
  borderColor: string
  borderWidth: number
  textColor: string
  fontSize: number
}

export type ConnectorType = 'smoothstep' | 'straight' | 'step' | 'bezier'

export type MarkerStyleType =
  | 'none'
  | 'arrow'
  | 'arrowClosed'
  | 'triangle'
  | 'diamond'
  | 'diamondFilled'

export interface EdgeData extends Record<string, unknown> {
  label: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  strokeColor: string
  strokeWidth: number
  connectorType: ConnectorType
  markerStartType: MarkerStyleType
  markerEndType: MarkerStyleType
  sourceLabel: string
  targetLabel: string
}

export type ExportFormat = 'png' | 'jpeg' | 'pdf'
export type PdfPageSize = 'fit' | 'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'letter-landscape'
