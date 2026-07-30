import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'

interface StartScreenProps {
  datasetTitle: string
  caseCount: number
  error: string | null
  onStart: (annotatorId: string) => void
  onImport: (file: File) => void
}

export function StartScreen({ datasetTitle, caseCount, error, onStart, onImport }: StartScreenProps) {
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
        <div className="start-mark" aria-hidden="true">
          <span>HI</span>
          <span>01</span>
        </div>
        <div className="eyebrow">Human interpretation study</div>
        <h1 id="start-title">Read the sketch.<br />Name the motion.</h1>
        <p className="start-lede">
          You will inspect four keyframes for each case and record the animation intent you believe the sketch communicates.
        </p>

        <dl className="start-facts">
          <div><dt>Dataset</dt><dd>{datasetTitle}</dd></div>
          <div><dt>Cases</dt><dd>{caseCount} · resume anytime</dd></div>
          <div><dt>Privacy</dt><dd>Stored only in this browser</dd></div>
        </dl>

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
              placeholder="e.g. annotator-07"
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
      <aside className="start-aside" aria-hidden="true">
        <div className="sequence-glyph">
          {[0, 1, 2, 3].map((index) => <span key={index} style={{ '--i': index } as React.CSSProperties}>{index + 1}</span>)}
        </div>
        <div className="aside-caption">Observe change<br />across time</div>
      </aside>
    </main>
  )
}
