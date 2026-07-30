import generatedCases from './cases.generated.json'
import type { ExperimentCase, ExperimentConfig } from './types'

export const experimentConfig = {
  schemaVersion: 1,
  datasetId: 'sketch-intent-40-pairs',
  datasetVersion: '2026-07-30.1',
  title: 'Sketch Intent Annotation',
  instructions: [
    {
      title: 'Read the sequence',
      body: 'The first frame is the original chart without sketches. The last frame contains the complete sketch. Intermediate frames show how the sketch was built. Consider every frame and every sketch mark when interpreting the intended animation.',
    },
    {
      title: 'Identify the target',
      body: 'Describe the chart element or elements intended to animate. Enter a natural-language description, SVG class IDs, or both.',
      points: [
        'Targets must be visual marks such as bars, lines, points, or pie slices.',
        'Do not select axes, titles, labels, grid lines, or legends.',
        'Describe only the intended target; do not include elements that merely explain or label the sketch.',
      ],
    },
    {
      title: 'Interpret the animation',
      body: 'Choose exactly one supported effect. Describe duration and looping in your own words only when the sketches explicitly communicate them. Otherwise choose “Not shown in the sketches” rather than guessing.',
    },
    {
      title: 'Report confidence',
      body: 'Use the 1–7 scale to report confidence in your complete interpretation. Lower the score when the sketches are ambiguous. Use the optional explanation to record ambiguity or reasoning that may help later analysis.',
    },
  ],
  effects: [
    { id: 'blink', label: 'Blink', definition: 'Rapidly appears and disappears repeatedly.', icon: 'lucide:scan-eye' },
    { id: 'fade', label: 'Fade', definition: 'Smoothly transitions between visible and invisible states.', icon: 'lucide:blend' },
    { id: 'glow', label: 'Glow', definition: 'A soft light radiates from the element’s edges.', icon: 'lucide:sun' },
    { id: 'fillColor', label: 'Fill color', definition: 'The element’s fill slowly shifts from one hue to another.', icon: 'lucide:paint-bucket' },
    { id: 'desaturate', label: 'Desaturate', definition: 'Colors lose intensity and move toward grayscale.', icon: 'lucide:circle-off' },
    { id: 'pulse', label: 'Pulse', definition: 'Subtly expands and contracts in a rhythm.', icon: 'lucide:activity' },
    { id: 'flip', label: 'Flip', definition: 'Rotates as if turned around an axis.', icon: 'lucide:flip-horizontal-2' },
    { id: 'shake', label: 'Shake', definition: 'Rapid micro-movements create vibration.', icon: 'lucide:vibrate' },
    { id: 'scale', label: 'Scale', definition: 'Smoothly enlarges or reduces in size.', icon: 'lucide:move-diagonal-2' },
    { id: 'shatter', label: 'Shatter', definition: 'Visually breaks into pieces that disperse.', icon: 'lucide:sparkles' },
  ],
  // The build-time validator enforces the four-item tuple before Vite runs.
  cases: generatedCases as ExperimentCase[],
} satisfies ExperimentConfig
