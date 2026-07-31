import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'

interface KeyframeStripProps {
  images: string[]
}

export function KeyframeStrip({ images }: KeyframeStripProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (expanded === null) return
      if (event.key === 'Escape') setExpanded(null)
      if (event.key === 'ArrowLeft') setExpanded((expanded + images.length - 1) % images.length)
      if (event.key === 'ArrowRight') setExpanded((expanded + 1) % images.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expanded, images.length])

  return (
    <section className="keyframe-section" aria-labelledby="keyframe-title">
      <div className="section-heading">
        <div>
          <h2 id="keyframe-title">Sketch sequence</h2>
        </div>
      </div>
      <div className="filmstrip">
        {images.map((source, index) => (
          <figure key={source} className="frame-card">
            <button type="button" onClick={() => setExpanded(index)} aria-label={`Enlarge frame ${index + 1}`}>
              <img src={source} alt={`Keyframe ${index + 1} of 4`} draggable={false} />
              <span className="zoom-cue"><Icon icon="lucide:maximize-2" /> Enlarge</span>
            </button>
            <figcaption><span>FRAME</span> 0{index + 1}<i />{index === 0 ? 'Original' : index === images.length - 1 ? 'Complete' : 'Process'}</figcaption>
          </figure>
        ))}
      </div>
      {expanded !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Enlarged frame ${expanded + 1}`} onClick={() => setExpanded(null)}>
          <button className="lightbox-close" type="button" onClick={() => setExpanded(null)} aria-label="Close image viewer"><Icon icon="lucide:x" /></button>
          <button className="lightbox-arrow left" type="button" onClick={(event) => { event.stopPropagation(); setExpanded((expanded + images.length - 1) % images.length) }} aria-label="Previous frame"><Icon icon="lucide:arrow-left" /></button>
          <img src={images[expanded]} alt={`Enlarged keyframe ${expanded + 1}`} onClick={(event) => event.stopPropagation()} />
          <button className="lightbox-arrow right" type="button" onClick={(event) => { event.stopPropagation(); setExpanded((expanded + 1) % images.length) }} aria-label="Next frame"><Icon icon="lucide:arrow-right" /></button>
          <div className="lightbox-label">FRAME {String(expanded + 1).padStart(2, '0')} / 04</div>
        </div>
      )}
    </section>
  )
}
