import { useRef, useEffect } from 'react'
import { editor as monacoEditor } from 'monaco-editor';  // Added import for monacoEditor
import { Editor as MonacoEditor } from '@monaco-editor/react';

interface EditorProps {
  code: string
  setCode: (code: string) => void
}

export function Editor({ code, setCode }: EditorProps) {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)

  function handleEditorDidMount(editor: monacoEditor.IStandaloneCodeEditor) {
    editorRef.current = editor
  }

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(code)
    }
  }, [code])

  return (
    <MonacoEditor
      height="70vh"
      defaultLanguage="javascript"
      defaultValue={code}
      onMount={handleEditorDidMount}
      onChange={(value) => setCode(value || '')}
    />
  )
}