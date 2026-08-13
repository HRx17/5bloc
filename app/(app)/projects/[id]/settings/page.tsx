import { redirect } from 'next/navigation'

type Ctx = { params: Promise<{ id: string }> }

/** Settings used to be a dead tab — real controls live on Overview / Portal / ⋯. */
export default async function ProjectSettingsRedirect({ params }: Ctx) {
  const { id } = await params
  redirect(`/projects/${id}`)
}
