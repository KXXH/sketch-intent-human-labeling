import generatedCases from './cases.generated.json'
import type { ExperimentCase, ExperimentConfig } from './types'

export const experimentConfig = {
  schemaVersion: 1,
  datasetId: 'sketch-intent-40-pairs',
  datasetVersion: '2026-07-30.1',
  title: 'Sketch Intent Annotation',
  instructions: [
    {
      title: 'Overall',
      body: 'Share your understanding of the intended animation from the sketches atop of the chart.',
    },
    {
      title: 'Target',
      body: 'Use natural language to describe the target chart element(s) intended to animate.',
      points: [
        'Targets must be visual marks such as bars, lines, points, or pie slices.',
        'Do not select axes, titles, labels, grid lines, or legends.',
      ],
    },
    {
      title: 'Effect and timing',
      body: 'Choose one effect that aligns with your understanding of the sketches. Describe duration (how long the animation lasts) and looping (how many times the animation repeats) when the sketches explicitly communicate them. Otherwise choose “Not shown in the sketches” rather than guessing.',
    },
    {
      title: 'Confidence',
      body: 'Report confidence in your interpretation. Lower the score when the sketches are ambiguous. Use the explanation field to record ambiguity or reasoning.',
    },
  ],
  effects: [
    { id: 'blink', label: 'Blink', definition: 'Element rapidly appears and disappears repeatedly.' },
    { id: 'fade', label: 'Fade', definition: 'Smooth transition between visible and invisible states.' },
    { id: 'glow', label: 'Glow', definition: 'A soft light radiates from the edges of the element.' },
    { id: 'fillColor', label: 'Fill color', definition: 'Color slowly shifts from one hue to another.' },
    { id: 'desaturate', label: 'Desaturate', definition: 'Colors lose intensity, moving toward grayscale.' },
    { id: 'pulse', label: 'Pulse', definition: 'Element subtly expands and contracts in rhythm.' },
    { id: 'flip', label: 'Flip', definition: 'Element rotates as if turned along an axis.' },
    { id: 'shake', label: 'Shake', definition: 'Rapid micro-movements create vibration.' },
    { id: 'scale', label: 'Scale', definition: 'Element smoothly enlarges or reduces in size.' },
    { id: 'shatter', label: 'Shatter', definition: 'Element visually breaks into pieces that disperse.' },
  ],
  // The build-time validator enforces the four-item tuple before Vite runs.
  cases: generatedCases as ExperimentCase[],
} satisfies ExperimentConfig
