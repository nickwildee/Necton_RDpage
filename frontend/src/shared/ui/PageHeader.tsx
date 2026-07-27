export function PageHeader({
  description,
  eyebrow,
  id,
  title,
}: {
  description: string
  eyebrow: string
  id: string
  title: string
}) {
  return (
    <header className="mb-6">
      <p className="mt-0 mb-2 text-xs font-bold tracking-eyebrow text-brand">
        {eyebrow}
      </p>
      <h1
        className="m-0 text-page-title font-bold tracking-page-title text-ink"
        id={id}
      >
        {title}
      </h1>
      <p className="mt-2 mb-0 text-sm leading-[1.55] text-ink-muted">
        {description}
      </p>
    </header>
  )
}
