import generatedCases from './cases.generated.json'
import type { ExperimentCase, ExperimentConfig } from './types'

export const experimentConfig = {
  schemaVersion: 1,
  datasetId: 'sketch-intent-40-pairs',
  datasetVersion: '2026-07-30.1',
  title: 'Sketch Intent Annotation',
  annotationPrompt: 'Share your understanding of the intended animation from the sketches atop of the chart.',
  instructions: [
    {
      title: 'Read the sequence',
      body: 'The first frame is the original chart without sketches. The last frame contains the complete sketch. Intermediate frames show how the sketch was built. Consider every frame and every sketch mark when interpreting the intended animation.',
    },
    {
      title: 'Identify the target',
      body: 'Use natural language to describe the target chart element(s) intended to animate. The target may be a single visual mark or a group of marks, i.e., bars, lines, points, or pie slices. If the sketches are ambiguous, describe the most likely target.',
      points: [
        // 'Target visual marks: bars, lines, points, or pie slices.',
        // 'Do not select axes, titles, labels, grid lines, or legends.',
        // 'Describe only the intended target, not elements that explain or label the sketch.',
      ],
    },
    {
      title: 'Interpret the animation',
      body: 'Choose one supported effect. Describe duration and looping in your own words only when the sketches explicitly communicate them. Otherwise choose “Not shown in the sketches” rather than guessing.',
    },
    {
      title: 'Report confidence',
      body: 'Use the 1–7 scale to report confidence in your complete interpretation. Lower the score when the sketches are ambiguous. Use the explanation to record ambiguity or reasoning.',
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
