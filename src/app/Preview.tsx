interface PreviewProps {
  code: string
}

export function Preview({ code }: PreviewProps) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-2">Preview</h2>
      <div dangerouslySetInnerHTML={{ __html: code }} />
    </div>
  )
}