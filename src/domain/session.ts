import type { ExperimentConfig } from '../experiment/types'
import type { AnnotationSessionData, AnswerValidation, CaseAnswer } from './types'
import { createStableCaseOrder } from '../lib/order'

export function createEmptyAnswer(now = new Date().toISOString()): CaseAnswer {
  return {
    status: 'in_progress',
    targetText: '',
    effect: null,
    duration: { kind: 'text', text: '' },
    loop: { kind: 'text', text: '' },
    confidence: null,
    explanation: '',
    firstViewedAt: now,
    lastUpdatedAt: now,
    activeTimeMs: 0,
  }
}

export function validateAnswer(answer: CaseAnswer | undefined): AnswerValidation {
  const missing: string[] = []
  if (!answer?.targetText.trim()) missing.push('target')
  if (!answer?.effect) missing.push('effect')
  if (!answer?.duration || (answer.duration.kind === 'text' && !answer.duration.text.trim())) missing.push('duration')
  if (!answer?.loop || (answer.loop.kind === 'text' && !answer.loop.text.trim())) missing.push('loop')
  if (!answer?.confidence) missing.push('confidence')
  if (!answer?.explanation.trim()) missing.push('explanation')
  return { valid: missing.length === 0, missing }
}

export function createSession(config: ExperimentConfig, annotatorId: string): AnnotationSessionData {
  const now = new Date().toISOString()
  const caseOrder = createStableCaseOrder(config.cases, `${config.datasetId}:${config.datasetVersion}:${annotatorId}`)
  return {
    schemaVersion: 1,
    datasetId: config.datasetId,
    datasetVersion: config.datasetVersion,
    annotatorId,
    sessionId: crypto.randomUUID(),
    caseOrder,
    currentCaseId: caseOrder[0],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    revision: 0,
    answers: { [caseOrder[0]]: createEmptyAnswer(now) },
  }
}

export function completedCount(session: AnnotationSessionData): number {
  return Object.values(session.answers).filter((answer) => answer.status === 'completed').length
}

export function skippedCount(session: AnnotationSessionData): number {
  return Object.values(session.answers).filter((answer) => answer.status === 'skipped').length
}

export function canFinalize(session: AnnotationSessionData): boolean {
  return session.caseOrder.every((id) => session.answers[id]?.status === 'completed' && validateAnswer(session.answers[id]).valid)
}
