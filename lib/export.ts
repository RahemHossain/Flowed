import { toPng, toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react'
import type { ExportFormat, PdfPageSize } from './types'

// Ratio of padding on each side (6% = 12% total whitespace around content)
const PADDING_RATIO = 0.06
const MIN_DIM = 600   // upscale tiny diagrams so they look crisp
const MAX_DIM = 2400  // cap so files aren't enormous

const PDF_SIZES: Record<string, [number, number]> = {
  'a4-portrait': [794, 1123],
  'a4-landscape': [1123, 794],
  'letter-portrait': [816, 1056],
  'letter-landscape': [1056, 816],
}

function getViewportElement(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport')
}

function getWrapperElement(): HTMLElement | null {
  return document.querySelector('.react-flow')
}

function calcFitDimensions(nodes: Node[]): [number, number] {
  const b = getNodesBounds(nodes)
  let w = b.width
  let h = b.height

  // Scale up diagrams that are too small
  const upScale = Math.max(1, MIN_DIM / Math.min(w, h))
  w *= upScale
  h *= upScale

  // Scale down diagrams that are too large
  const downScale = Math.min(1, MAX_DIM / Math.max(w, h))
  w *= downScale
  h *= downScale

  return [Math.round(w), Math.round(h)]
}

function buildExportStyle(
  nodes: Node[],
  targetWidth: number,
  targetHeight: number
): { transform: string; width: string; height: string } {
  const bounds = getNodesBounds(nodes)
  // PADDING_RATIO is a fraction (0.06 = 6% per side) — this is what the API expects
  const viewport = getViewportForBounds(bounds, targetWidth, targetHeight, 0.05, 4, PADDING_RATIO)
  return {
    width: `${targetWidth}px`,
    height: `${targetHeight}px`,
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
  }
}

async function captureImage(
  nodes: Node[],
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  background: string
): Promise<string> {
  const viewport = getViewportElement()
  const wrapper = getWrapperElement()
  if (!viewport || !wrapper) throw new Error('Canvas element not found')

  wrapper.classList.add('rf-exporting')
  const style = buildExportStyle(nodes, width, height)

  try {
    const fn = format === 'jpeg' ? toJpeg : toPng
    return await fn(viewport, {
      backgroundColor: background,
      width,
      height,
      style: { ...style, transformOrigin: 'top left' },
      pixelRatio: 2,
    })
  } finally {
    wrapper.classList.remove('rf-exporting')
  }
}

export async function exportDiagram(
  nodes: Node[],
  format: ExportFormat,
  pageSize: PdfPageSize,
  filename: string
): Promise<void> {
  if (nodes.length === 0) {
    throw new Error('Nothing to export — add some shapes first.')
  }

  if (format === 'png' || format === 'jpeg') {
    const [w, h] = calcFitDimensions(nodes)
    const dataUrl = await captureImage(nodes, w, h, format, '#ffffff')
    const link = document.createElement('a')
    link.download = `${filename}.${format}`
    link.href = dataUrl
    link.click()
    return
  }

  // PDF
  let width: number
  let height: number
  let orientation: 'portrait' | 'landscape'

  if (pageSize === 'fit') {
    const [fw, fh] = calcFitDimensions(nodes)
    width = fw
    height = fh
    orientation = width > height ? 'landscape' : 'portrait'
  } else {
    ;[width, height] = PDF_SIZES[pageSize]
    orientation = pageSize.includes('landscape') ? 'landscape' : 'portrait'
  }

  const dataUrl = await captureImage(nodes, width, height, 'png', '#ffffff')
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height], hotfixes: ['px_scaling'] })
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
  pdf.save(`${filename}.pdf`)
}
