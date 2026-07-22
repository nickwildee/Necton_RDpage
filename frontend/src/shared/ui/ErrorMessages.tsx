export function ErrorMessages({
  id,
  messages,
  className,
}: {
  id?: string
  messages?: string[]
  className: string
}) {
  if (!messages?.length) {
    return null
  }

  return (
    <div id={id}>
      {messages.map((message, index) => (
        <p className={className} key={`${message}-${index}`}>
          {message}
        </p>
      ))}
    </div>
  )
}
