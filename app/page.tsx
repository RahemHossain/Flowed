'use client'

import dynamic from 'next/dynamic'

const DiagramEditor = dynamic(() => import('@/components/DiagramEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ color: '#64748b', fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>Loading editor...</div>
    </div>
  ),
})

export default function Page() {
  return <DiagramEditor />
}
