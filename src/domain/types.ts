import type { EffectId } from '../experiment/types'

export type AnswerStatus = 'in_progress' | 'skipped' | 'completed'

export type DurationAnswer =
  | { kind: 'text'; text: string }
  // Kept for backwards compatibility with drafts created before free-text input.
  | { kind: 'value'; seconds: number; milliseconds: number }
  | { kind: 'not_shown' }
  | null

export type LoopAnswer =
  | { kind: 'text'; text: string }
  // Kept for backwards compatibility with drafts created before free-text input.
  | { kind: 'value'; count: number }
  | { kind: 'not_shown' }
  | null

export interface CaseAnswer {
  status: AnswerStatus
  targetText: string
  effect: EffectId | null
  duration: DurationAnswer
  loop: LoopAnswer
  confidence: 1 | 2 | 3 | 4 | 5 | 6 | 7 | null
  explanation: string
  firstViewedAt: string
  lastUpdatedAt: string
  activeTimeMs: number
}

export interface AnnotationSessionData {
  schemaVersion: 1
  datasetId: string
  datasetVersion: string
  annotatorId: string
  sessionId: string
  caseOrder: string[]
  currentCaseId: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  revision: number
  answers: Record<string, CaseAnswer>
}

export interface AnnotationExport extends AnnotationSessionData {
  checksum: string
}

export interface AnswerValidation {
  valid: boolean
  missing: string[]
}
