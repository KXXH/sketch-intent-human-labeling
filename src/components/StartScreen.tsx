import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'

interface StartScreenProps {
  error: string | null
  onStart: (annotatorId: string) => void
  onImport: (file: File) => void
}

export function StartScreen({ error, onStart, onImport }: StartScreenProps) {
  const [annotatorId, setAnnotatorId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = annotatorId.trim()
    if (normalized) onStart(normalized)
  }

  return (
    <main className="start-shell">
      <section className="start-panel" aria-labelledby="start-title">
        <h1 id="start-title">Read the sketch.<br />Name the animation.</h1>

        {error && <div className="alert alert-error" role="alert"><Icon icon="lucide:triangle-alert" />{error}</div>}

        <form onSubmit={submit} className="start-form">
          <label htmlFor="annotator-id">Anonymous annotator ID</label>
          <div className="start-input-row">
            <input
              id="annotator-id"
              value={annotatorId}
              onChange={(event) => setAnnotatorId(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              maxLength={60}
              placeholder="Your Name"
              autoFocus
            />
            <button className="button button-primary" type="submit" disabled={!annotatorId.trim()}>
              Begin <Icon icon="lucide:arrow-up-right" />
            </button>
          </div>
          <p className="field-note">Use the same ID to restore your saved progress on this device.</p>
        </form>

        <div className="start-divider"><span>or</span></div>
        <button className="button button-quiet import-button" type="button" onClick={() => fileRef.current?.click()}>
          <Icon icon="lucide:upload" /> Restore from a JSON backup
        </button>
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImport(file)
            event.target.value = ''
          }}
        />
      </section>
    </main>
  )
}
