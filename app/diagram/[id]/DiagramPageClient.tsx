'use client'

import dynamic from 'next/dynamic'

const DiagramEditor = dynamic(() => import('@/components/DiagramEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', fontSize: 14 }}>
      Loading diagram...
    </div>
  ),
})

export default function DiagramPageClient({ id }: { id: string }) {
  return <DiagramEditor diagramId={id} />
}
