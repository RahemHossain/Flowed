import DiagramPageClient from './DiagramPageClient'

export default async function DiagramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DiagramPageClient id={id} />
}
