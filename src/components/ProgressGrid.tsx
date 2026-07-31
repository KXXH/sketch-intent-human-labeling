import type { CaseAnswer } from '../domain/types'

interface ProgressGridProps {
  caseOrder: string[]
  answers: Record<string, CaseAnswer>
  currentCaseId: string
  disabled: boolean
  onSelect: (caseId: string) => void
}

export function ProgressGrid({ caseOrder, answers, currentCaseId, disabled, onSelect }: ProgressGridProps) {
  const completed = Object.values(answers).filter((answer) => answer.status === 'completed').length

  return (
    <section className="progress-panel" aria-labelledby="progress-title">
      <div className="progress-heading">
        <div className="progress-title-block">
          <span className="eyebrow">Session index</span>
          <h2 id="progress-title">Annotation progress</h2>
          <span className="progress-count"><strong>{completed}</strong> / {caseOrder.length}</span>
        </div>
        <div className="progress-legend" aria-label="Progress legend">
          <span><i className="legend-unseen" /> Unseen</span>
          <span><i className="legend-active" /> In progress</span>
          <span><i className="legend-skipped" /> Skipped</span>
          <span><i className="legend-complete" /> Complete</span>
        </div>
      </div>
      <div className="progress-ledger">
        <div className="progress-grid">
          {caseOrder.map((caseId, index) => {
            const status = answers[caseId]?.status ?? 'unseen'
            const current = caseId === currentCaseId
            return (
              <button
                key={caseId}
                type="button"
                disabled={disabled}
                className={`progress-cell status-${status} ${current ? 'is-current' : ''}`}
                aria-current={current ? 'step' : undefined}
                aria-label={`Case ${index + 1}: ${status.replace('_', ' ')}`}
                title={`${index + 1}. ${caseId} · ${status.replace('_', ' ')}`}
                onClick={() => onSelect(caseId)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
