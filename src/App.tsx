import { Icon } from '@iconify/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnnotationForm } from './components/AnnotationForm'
import { InstructionPanel } from './components/InstructionPanel'
import { KeyframeStrip } from './components/KeyframeStrip'
import { ProgressGrid } from './components/ProgressGrid'
import { StartScreen } from './components/StartScreen'
import { canFinalize, completedCount, createEmptyAnswer, createSession, skippedCount, validateAnswer } from './domain/session'
import type { AnnotationSessionData, CaseAnswer } from './domain/types'
import { experimentConfig } from './experiment/config'
import { useSessionLease } from './hooks/useSessionLease'
import { downloadSession, loadSession, parseImportedSession, persistSession, StorageError } from './lib/storage'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const LAST_ANNOTATOR_KEY = `human-labeling:${experimentConfig.datasetId}:${experimentConfig.datasetVersion}:last-annotator`

function readLastAnnotator(): string | null {
  try { return localStorage.getItem(LAST_ANNOTATOR_KEY) } catch { return null }
}

function assetUrl(relativePath: string): string {
  return encodeURI(`${import.meta.env.BASE_URL}datasets/${experimentConfig.datasetId}/${relativePath}`)
}

export function App() {
  const [session, setSession] = useState<AnnotationSessionData | null>(() => {
    const lastAnnotator = readLastAnnotator()
    return lastAnnotator ? loadSession(experimentConfig, lastAnnotator).session : null
  })
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [validationMissing, setValidationMissing] = useState<string[]>([])
  const sessionRef = useRef<AnnotationSessionData | null>(null)
  const activeStartedAt = useRef(Date.now())
  const importRef = useRef<HTMLInputElement>(null)
  const { readOnly, ownsLease, takeOver } = useSessionLease(experimentConfig, session?.annotatorId ?? null)

  const persistNow = useCallback((value: AnnotationSessionData) => {
    if (!ownsLease()) {
      setSaveState('error')
      setMessage('Saving stopped because this tab no longer owns the session. Take over here or export a backup from the active tab.')
      return false
    }
    try {
      setSaveState('saving')
      persistSession(value, experimentConfig)
      setSaveState('saved')
      return true
    } catch (error) {
      setSaveState('error')
      setMessage(error instanceof Error ? `Automatic save failed: ${error.message}` : 'Automatic save failed.')
      return false
    }
  }, [])

  useEffect(() => { sessionRef.current = session }, [session])

  useEffect(() => {
    if (!session || readOnly) return
    const timeout = window.setTimeout(() => persistNow(session), 180)
    return () => window.clearTimeout(timeout)
  }, [persistNow, readOnly, session])

  const addElapsedTime = useCallback((value: AnnotationSessionData): AnnotationSessionData => {
    const elapsed = document.visibilityState === 'visible' ? Math.max(0, Date.now() - activeStartedAt.current) : 0
    activeStartedAt.current = Date.now()
    const id = value.currentCaseId
    const answer = value.answers[id]
    if (!answer || elapsed === 0) return value
    return { ...value, answers: { ...value.answers, [id]: { ...answer, activeTimeMs: answer.activeTimeMs + elapsed } } }
  }, [])

  useEffect(() => {
    if (!session) return
    const flush = () => {
      const current = sessionRef.current
      if (!current || readOnly) return
      const timed = addElapsedTime(current)
      sessionRef.current = timed
      setSession((latest) => latest?.sessionId === timed.sessionId ? timed : latest)
      persistNow(timed)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
      else activeStartedAt.current = Date.now()
    }
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    window.addEventListener('blur', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('blur', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [addElapsedTime, persistNow, readOnly, session])

  const mutate = useCallback((mutator: (current: AnnotationSessionData) => AnnotationSessionData) => {
    if (readOnly || !ownsLease()) return
    setSession((current) => {
      if (!current) return current
      const next = mutator(current)
      const now = new Date().toISOString()
      return { ...next, updatedAt: now, revision: current.revision + 1 }
    })
  }, [ownsLease, readOnly])

  const start = (annotatorId: string) => {
    const normalized = annotatorId.trim()
    const loaded = loadSession(experimentConfig, normalized)
    const next = loaded.session ?? createSession(experimentConfig, normalized)
    try { localStorage.setItem(LAST_ANNOTATOR_KEY, normalized) } catch { /* The session save will surface storage failures. */ }
    setSession(next)
    setMessage(loaded.recovered ? 'The primary save was unavailable. Progress was restored from a verified recovery snapshot.' : null)
    setValidationMissing([])
    activeStartedAt.current = Date.now()
  }

  const handleImport = async (file: File) => {
    if (session && (readOnly || !ownsLease())) {
      setMessage('Import is disabled in this read-only tab. Take over the session before replacing its data.')
      return
    }
    try {
      const imported = parseImportedSession(await file.text(), experimentConfig)
      setSession(imported)
      try { localStorage.setItem(LAST_ANNOTATOR_KEY, imported.annotatorId) } catch { /* The session save will surface storage failures. */ }
      setMessage(`Loaded revision ${imported.revision} for ${imported.annotatorId}; saving locally…`)
      setSaveState('saving')
      activeStartedAt.current = Date.now()
    } catch (error) {
      setMessage(error instanceof StorageError ? error.message : 'Unable to import this backup.')
      if (!session) setSaveState('error')
    }
  }

  const takeOverHere = async () => {
    const claimed = await takeOver()
    if (!claimed || !session) return
    const latest = loadSession(experimentConfig, session.annotatorId).session
    if (latest) {
      sessionRef.current = latest
      setSession(latest)
      activeStartedAt.current = Date.now()
      setMessage(latest.revision > session.revision ? 'This tab took over and restored the latest saved revision.' : 'This tab now owns the session.')
    } else {
      setMessage('This tab now owns the session. The current draft will be saved locally.')
    }
  }

  const currentIndex = session ? session.caseOrder.indexOf(session.currentCaseId) : -1
  const currentCase = useMemo(
    () => session ? experimentConfig.cases.find((item) => item.id === session.currentCaseId) ?? null : null,
    [session],
  )
  const currentAnswer = session ? session.answers[session.currentCaseId] : undefined

  useEffect(() => {
    if (!session || !currentCase) return
    const nextId = session.caseOrder[currentIndex + 1]
    const nextCase = experimentConfig.cases.find((item) => item.id === nextId)
    for (const imagePath of nextCase?.imagePaths ?? []) {
      const image = new Image()
      image.src = assetUrl(imagePath)
    }
  }, [currentCase, currentIndex, session])

  const navigate = (caseId: string) => {
    mutate((current) => {
      const timed = addElapsedTime(current)
      const now = new Date().toISOString()
      return {
        ...timed,
        currentCaseId: caseId,
        answers: timed.answers[caseId]
          ? timed.answers
          : { ...timed.answers, [caseId]: createEmptyAnswer(now) },
      }
    })
    setValidationMissing([])
    activeStartedAt.current = Date.now()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateAnswer = (patch: Partial<CaseAnswer>) => {
    mutate((current) => {
      const id = current.currentCaseId
      const previous = current.answers[id] ?? createEmptyAnswer()
      const next = { ...previous, ...patch, lastUpdatedAt: new Date().toISOString() }
      if (previous.status === 'skipped' || (previous.status === 'completed' && !validateAnswer(next).valid)) next.status = 'in_progress'
      return { ...current, completedAt: null, answers: { ...current.answers, [id]: next } }
    })
    setValidationMissing((fields) => fields.filter((field) => {
      if (field === 'target') return patch.targetText === undefined || !patch.targetText.trim()
      if (field === 'effect') return patch.effect === undefined || patch.effect === null
      if (field === 'duration') return patch.duration === undefined || patch.duration === null || (patch.duration.kind === 'text' && !patch.duration.text.trim())
      if (field === 'loop') return patch.loop === undefined || patch.loop === null || (patch.loop.kind === 'text' && !patch.loop.text.trim())
      if (field === 'confidence') return patch.confidence === undefined || patch.confidence === null
      return true
    }))
  }

  const completeCurrent = () => {
    if (!session || !currentAnswer) return
    const validation = validateAnswer(currentAnswer)
    if (!validation.valid) {
      setValidationMissing(validation.missing)
      setMessage('Complete every required field or use “Skip for now”.')
      return
    }
    mutate((current) => {
      const timed = addElapsedTime(current)
      const now = new Date().toISOString()
      const answer = timed.answers[timed.currentCaseId]
      const answers = { ...timed.answers, [timed.currentCaseId]: { ...answer, status: 'completed' as const, lastUpdatedAt: now } }
      const currentOrderIndex = timed.caseOrder.indexOf(timed.currentCaseId)
      const nextId = timed.caseOrder
        .slice(currentOrderIndex + 1)
        .concat(timed.caseOrder.slice(0, currentOrderIndex))
        .find((id) => answers[id]?.status !== 'completed')
      if (!nextId) return { ...timed, answers }
      return { ...timed, answers: answers[nextId] ? answers : { ...answers, [nextId]: createEmptyAnswer(now) }, currentCaseId: nextId }
    })
    setValidationMissing([])
    setMessage(null)
    activeStartedAt.current = Date.now()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const skipCurrent = () => {
    if (!session || !currentAnswer) return
    mutate((current) => {
      const timed = addElapsedTime(current)
      const now = new Date().toISOString()
      const answers = { ...timed.answers, [timed.currentCaseId]: { ...timed.answers[timed.currentCaseId], status: 'skipped' as const, lastUpdatedAt: now } }
      const currentOrderIndex = timed.caseOrder.indexOf(timed.currentCaseId)
      const nextId = timed.caseOrder
        .slice(currentOrderIndex + 1)
        .concat(timed.caseOrder.slice(0, currentOrderIndex))
        .find((id) => answers[id]?.status !== 'completed') ?? timed.currentCaseId
      return { ...timed, answers: answers[nextId] ? answers : { ...answers, [nextId]: createEmptyAnswer(now) }, currentCaseId: nextId }
    })
    setValidationMissing([])
    setMessage(null)
    activeStartedAt.current = Date.now()
  }

  const finalize = () => {
    if (!session || readOnly || !ownsLease()) {
      setMessage('Final export is locked while this tab is read-only. Take over the session first.')
      return
    }
    if (!canFinalize(session)) {
      setMessage('Final export is locked until all 80 cases are complete. Draft export remains available.')
      return
    }
    const finalSession = { ...addElapsedTime(session), completedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revision: session.revision + 1 }
    if (persistNow(finalSession)) {
      setSession(finalSession)
      downloadSession(finalSession, true)
      setMessage('Final result downloaded. Keep the JSON file as the official copy of your work.')
    }
  }

  if (!session) {
    return <StartScreen datasetTitle={experimentConfig.title} caseCount={experimentConfig.cases.length} error={saveState === 'error' ? message : null} onStart={start} onImport={handleImport} />
  }

  if (!currentCase || !currentAnswer) return null

  const complete = completedCount(session)
  const skipped = skippedCount(session)
  const total = session.caseOrder.length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-index">HI<br />01</span><div><strong>Sketch Intent</strong><small>Human annotation instrument</small></div></div>
        <div className="session-meta"><span>DATASET <strong>{session.datasetVersion}</strong></span><span>ANNOTATOR <strong>{session.annotatorId}</strong></span></div>
        <div className="topbar-actions">
          <span className={`save-indicator save-${saveState}`}><i />{saveState === 'error' ? 'Save failed' : saveState === 'saving' ? 'Saving…' : 'Saved locally'}</span>
          <button type="button" className="icon-button" title="Import backup" disabled={readOnly} onClick={() => importRef.current?.click()}><Icon icon="lucide:upload" /></button>
          <button type="button" className="button button-quiet" onClick={() => downloadSession(addElapsedTime(session), false)}><Icon icon="lucide:download" /> Draft</button>
          <button type="button" className="button button-primary compact" onClick={finalize} disabled={readOnly || !canFinalize(session)}><Icon icon="lucide:badge-check" /> Final export</button>
          <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file); event.target.value = '' }} />
        </div>
      </header>

      {readOnly && (
        <div className="conflict-banner" role="alert"><Icon icon="lucide:panels-top-left" /><div><strong>This session is open in another tab.</strong><span>This copy is read-only to prevent data loss.</span></div><button type="button" onClick={() => void takeOverHere()}>Take over here</button></div>
      )}
      {message && <div className={`global-message ${saveState === 'error' ? 'is-error' : ''}`} role="status"><Icon icon={saveState === 'error' ? 'lucide:triangle-alert' : 'lucide:info'} /><span>{message}</span><button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message"><Icon icon="lucide:x" /></button></div>}

      <main className="workspace">
        <InstructionPanel sections={experimentConfig.instructions} effects={experimentConfig.effects} />
        <ProgressGrid caseOrder={session.caseOrder} answers={session.answers} currentCaseId={session.currentCaseId} />

        <div className="case-rule"><i /><strong>{complete}/{total} complete</strong>{skipped > 0 && <em>{skipped} to revisit</em>}</div>
        <div className="case-layout">
          <KeyframeStrip images={currentCase.imagePaths.map(assetUrl)} />
          <AnnotationForm answer={currentAnswer} effects={experimentConfig.effects} missing={validationMissing} disabled={readOnly} onChange={updateAnswer} />
        </div>

        <nav className="case-navigation" aria-label="Case navigation">
          <button className="button button-quiet" type="button" disabled={readOnly || currentIndex === 0} onClick={() => navigate(session.caseOrder[currentIndex - 1])}><Icon icon="lucide:arrow-left" /> Previous</button>
          <button className="button button-skip" type="button" disabled={readOnly} onClick={skipCurrent}><Icon icon="lucide:bookmark" /> Skip for now</button>
          <button className="button button-primary" type="button" disabled={readOnly} onClick={completeCurrent}>{currentIndex === total - 1 && complete === total - 1 && skipped === 0 ? 'Complete case' : 'Save & next'} <Icon icon="lucide:arrow-right" /></button>
        </nav>
      </main>
      <footer><span>No network connection · no analytics · local browser storage</span><span>Dataset {experimentConfig.datasetId} / {experimentConfig.datasetVersion}</span></footer>
    </div>
  )
}
