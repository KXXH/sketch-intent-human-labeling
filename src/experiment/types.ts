export const EFFECT_IDS = [
  'blink',
  'fade',
  'glow',
  'fillColor',
  'desaturate',
  'pulse',
  'flip',
  'shake',
  'scale',
  'shatter',
] as const

export type EffectId = (typeof EFFECT_IDS)[number]

export interface InstructionSection {
  title: string
  body: string
  points?: string[]
}

export interface EffectDefinition {
  id: EffectId
  label: string
  definition: string
}

export interface ExperimentCase {
  id: string
  pairId: string
  imagePaths: [string, string, string, string]
}

export interface ExperimentConfig {
  schemaVersion: 1
  datasetId: string
  datasetVersion: string
  title: string
  instructions: InstructionSection[]
  effects: EffectDefinition[]
  cases: ExperimentCase[]
}
