import { Icon } from '@iconify/react'
import { useState } from 'react'
import type { EffectDefinition, InstructionSection } from '../experiment/types'

interface InstructionPanelProps {
  sections: InstructionSection[]
  effects: EffectDefinition[]
  annotationPrompt: string
}

export function InstructionPanel({ sections, effects, annotationPrompt }: InstructionPanelProps) {
  const [open, setOpen] = useState(false)
  return (
    <section className={`instruction-panel ${open ? 'is-open' : ''}`}>
      <button type="button" className="instruction-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="instruction-title"><Icon icon="lucide:notebook-tabs" /><strong>Working instructions</strong><small>{annotationPrompt}</small></span>
        <span className="instruction-hint" aria-hidden="true"><Icon icon={open ? 'lucide:chevron-up' : 'lucide:chevron-down'} /></span>
      </button>
      {open && (
        <div className="instruction-grid">
          {sections.map((section, index) => (
            <article key={section.title}>
              <span className="instruction-index">0{index + 1}</span>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
            </article>
          ))}
          <section className="effect-glossary" aria-labelledby="effect-glossary-title">
            <div className="effect-glossary-heading">
              <div>
                <h3 id="effect-glossary-title">Supported animation effects</h3>
                <p>Choose exactly one definition that best matches the sketches.</p>
              </div>
            </div>
            <div className="effect-glossary-grid">
              {effects.map((effect) => (
                <article key={effect.id}>
                  <div><strong>{effect.label}</strong><p>{effect.definition}</p></div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
