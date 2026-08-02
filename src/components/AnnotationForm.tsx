import type { CaseAnswer, DurationAnswer, LoopAnswer } from '../domain/types'
import type { EffectDefinition, EffectId } from '../experiment/types'

interface AnnotationFormProps {
  answer: CaseAnswer
  effects: EffectDefinition[]
  missing: string[]
  disabled: boolean
  onChange: (patch: Partial<CaseAnswer>) => void
}

function RequiredMark() { return <span className="required-mark">required</span> }

export function AnnotationForm({ answer, effects, missing, disabled, onChange }: AnnotationFormProps) {
  const hasError = (field: string) => missing.includes(field)
  const setDuration = (value: DurationAnswer) => onChange({ duration: value })
  const setLoop = (value: LoopAnswer) => onChange({ loop: value })
  const durationText = answer.duration?.kind === 'text'
    ? answer.duration.text
    : answer.duration?.kind === 'value'
      ? `${answer.duration.seconds} seconds`
      : ''
  const loopText = answer.loop?.kind === 'text'
    ? answer.loop.text
    : answer.loop?.kind === 'value'
      ? `${answer.loop.count} ${answer.loop.count === 1 ? 'time' : 'times'}`
      : ''

  return (
    <section className="annotation-section" aria-labelledby="annotation-title">
      <div className="section-heading annotation-heading">
        <div>
          {/* <div className="eyebrow">Your interpretation</div> */}
          <h2 id="annotation-title">Describe the intended animation</h2></div>
        <p>Answer from the sketches only. Do not infer unstated values.</p>
      </div>

      <div className="annotation-grid">
        <div className="form-column">
          <div className={`field-group ${hasError('target') ? 'has-error' : ''}`}>
            <label htmlFor="target-text"><span>01</span> Target <RequiredMark /></label>
            <textarea
              id="target-text"
              rows={2}
              disabled={disabled}
              value={answer.targetText}
              onChange={(event) => onChange({ targetText: event.target.value })}
              placeholder="Use natural language to describe the target chart element(s) intended to animate."
            />
          </div>

          <div className={`field-group ${hasError('effect') ? 'has-error' : ''}`}>
            <label><span>02</span> Effect <RequiredMark /></label>
            <div className="effect-grid" role="radiogroup" aria-label="Animation effect">
              {effects.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  role="radio"
                  aria-checked={answer.effect === effect.id}
                  disabled={disabled}
                  className={answer.effect === effect.id ? 'is-selected' : ''}
                  title={effect.definition}
                  onClick={() => onChange({ effect: effect.id as EffectId })}
                >
                  <i aria-hidden="true" />
                  <strong>{effect.label}</strong>
                  <small>{effect.definition}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-column form-column-parameters">
          <div className={`field-group parameter-field ${hasError('duration') ? 'has-error' : ''}`}>
            <label><span>03</span> Duration <RequiredMark /></label>
            <p className="field-description">How long the animation lasts.</p>
            <div className="segmented-choice">
              <button type="button" disabled={disabled} className={!answer.duration || answer.duration.kind === 'text' || answer.duration.kind === 'value' ? 'is-selected' : ''} onClick={() => setDuration({ kind: 'text', text: durationText })}>Describe</button>
              <button type="button" disabled={disabled} className={answer.duration?.kind === 'not_shown' ? 'is-selected' : ''} onClick={() => setDuration({ kind: 'not_shown' })}>Not shown</button>
            </div>
            {(!answer.duration || answer.duration.kind === 'text' || answer.duration.kind === 'value') && (
              <div className="text-input-with-suffix"><input className="text-input" type="text" disabled={disabled} value={durationText.replace(/\s*seconds?\s*$/i, '')} onChange={(event) => setDuration({ kind: 'text', text: event.target.value })} placeholder="e.g. about 1.5" /><span>seconds</span></div>
            )}
          </div>

          <div className={`field-group parameter-field ${hasError('loop') ? 'has-error' : ''}`}>
            <label><span>04</span> Loop <RequiredMark /></label>
            <p className="field-description">The times the animation repeats.</p>
            <div className="segmented-choice">
              <button type="button" disabled={disabled} className={!answer.loop || answer.loop.kind === 'text' || answer.loop.kind === 'value' ? 'is-selected' : ''} onClick={() => setLoop({ kind: 'text', text: loopText })}>Describe</button>
              <button type="button" disabled={disabled} className={answer.loop?.kind === 'not_shown' ? 'is-selected' : ''} onClick={() => setLoop({ kind: 'not_shown' })}>Not shown</button>
            </div>
            {(!answer.loop || answer.loop.kind === 'text' || answer.loop.kind === 'value') && (
              <div className="text-input-with-suffix"><input className="text-input" type="text" disabled={disabled} value={loopText.replace(/\s+(?:time|times)\s*$/i, '')} onChange={(event) => setLoop({ kind: 'text', text: event.target.value })} placeholder="e.g. 3" /><span>times</span></div>
            )}
          </div>

          <div className={`field-group ${hasError('confidence') ? 'has-error' : ''}`}>
            <label><span>05</span> Confidence <RequiredMark /></label>
            <div className="confidence-labels"><span>Very uncertain</span><span>Very certain</span></div>
            <div className="confidence-scale" role="radiogroup" aria-label="Confidence from 1 to 7">
              {([1, 2, 3, 4, 5, 6, 7] as const).map((value) => (
                <button key={value} type="button" role="radio" aria-checked={answer.confidence === value} disabled={disabled} className={answer.confidence === value ? 'is-selected' : ''} onClick={() => onChange({ confidence: value })}>{value}</button>
              ))}
            </div>
          </div>

          <div className={`field-group ${hasError('explanation') ? 'has-error' : ''}`}>
            <label htmlFor="explanation"><span>06</span> Explanation <RequiredMark /></label>
            <textarea id="explanation" rows={4} disabled={disabled} value={answer.explanation} onChange={(event) => onChange({ explanation: event.target.value })} placeholder="Record ambiguity or reasoning that may help later analysis…" />
          </div>
        </div>
      </div>
    </section>
  )
}
