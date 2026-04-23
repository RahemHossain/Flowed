import type { ShapeType, NodeData, ClassNodeData } from './types'

export interface ShapeDefinition {
  type: ShapeType | 'class'
  name: string
  category: string
  defaultWidth: number
  defaultHeight: number
  nodeType: string
  defaultData: NodeData | ClassNodeData
}

const baseNodeData: NodeData = {
  label: '',
  shapeType: 'process',
  fillColor: '#ffffff',
  borderColor: '#94a3b8',
  borderWidth: 1.5,
  borderStyle: 'solid',
  textColor: '#1e293b',
  fontSize: 14,
  fontWeight: 'normal',
  textAlign: 'center',
}

export const SHAPE_DEFINITIONS: ShapeDefinition[] = [
  {
    type: 'process',
    name: 'Process',
    category: 'Flowchart',
    defaultWidth: 160,
    defaultHeight: 64,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Process', shapeType: 'process' },
  },
  {
    type: 'decision',
    name: 'Decision',
    category: 'Flowchart',
    defaultWidth: 160,
    defaultHeight: 110,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Decision?', shapeType: 'decision' },
  },
  {
    type: 'terminal',
    name: 'Terminal',
    category: 'Flowchart',
    defaultWidth: 160,
    defaultHeight: 56,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Start', shapeType: 'terminal' },
  },
  {
    type: 'data',
    name: 'Data / IO',
    category: 'Flowchart',
    defaultWidth: 160,
    defaultHeight: 64,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Data', shapeType: 'data' },
  },
  {
    type: 'hexagon',
    name: 'Preparation',
    category: 'Flowchart',
    defaultWidth: 160,
    defaultHeight: 72,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Prepare', shapeType: 'hexagon' },
  },
  {
    type: 'cylinder',
    name: 'Database',
    category: 'Flowchart',
    defaultWidth: 130,
    defaultHeight: 110,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Database', shapeType: 'cylinder' },
  },
  {
    type: 'circle',
    name: 'Ellipse',
    category: 'Shapes',
    defaultWidth: 110,
    defaultHeight: 90,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'State', shapeType: 'circle' },
  },
  {
    type: 'note',
    name: 'Note',
    category: 'Shapes',
    defaultWidth: 160,
    defaultHeight: 110,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Note', shapeType: 'note', fillColor: '#fefce8', borderColor: '#a16207' },
  },
  {
    type: 'class',
    name: 'UML Class',
    category: 'UML',
    defaultWidth: 220,
    defaultHeight: 160,
    nodeType: 'class',
    defaultData: {
      className: 'ClassName',
      stereotype: '',
      attributes: ['- attribute: Type'],
      methods: ['+ method(): void'],
      fillColor: '#ffffff',
      borderColor: '#94a3b8',
      borderWidth: 1.5,
      textColor: '#1e293b',
      fontSize: 13,
    } as ClassNodeData,
  },
  {
    type: 'actor',
    name: 'Actor',
    category: 'UML',
    defaultWidth: 80,
    defaultHeight: 130,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: 'Actor', shapeType: 'actor' },
  },
  {
    type: 'arrowRight',
    name: 'Arrow Right',
    category: 'Arrows',
    defaultWidth: 160,
    defaultHeight: 70,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: '', shapeType: 'arrowRight', fillColor: '#e2e8f0', borderColor: '#64748b' },
  },
  {
    type: 'arrowLeft',
    name: 'Arrow Left',
    category: 'Arrows',
    defaultWidth: 160,
    defaultHeight: 70,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: '', shapeType: 'arrowLeft', fillColor: '#e2e8f0', borderColor: '#64748b' },
  },
  {
    type: 'arrowUp',
    name: 'Arrow Up',
    category: 'Arrows',
    defaultWidth: 70,
    defaultHeight: 130,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: '', shapeType: 'arrowUp', fillColor: '#e2e8f0', borderColor: '#64748b' },
  },
  {
    type: 'arrowDown',
    name: 'Arrow Down',
    category: 'Arrows',
    defaultWidth: 70,
    defaultHeight: 130,
    nodeType: 'diagram',
    defaultData: { ...baseNodeData, label: '', shapeType: 'arrowDown', fillColor: '#e2e8f0', borderColor: '#64748b' },
  },
  {
    type: 'text',
    name: 'Text',
    category: 'Basic',
    defaultWidth: 180,
    defaultHeight: 52,
    nodeType: 'diagram',
    defaultData: {
      ...baseNodeData,
      label: 'Text label',
      shapeType: 'text',
      fillColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
  },
]

export const SHAPE_CATEGORIES = ['Flowchart', 'Shapes', 'Arrows', 'UML', 'Basic']

export function getShapeDefinition(type: string): ShapeDefinition | undefined {
  return SHAPE_DEFINITIONS.find((s) => s.type === type)
}
