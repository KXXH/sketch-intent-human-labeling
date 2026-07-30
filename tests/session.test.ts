import { describe, expect, it } from 'vitest'
import { canFinalize, createEmptyAnswer, validateAnswer } from '../src/domain/session'
import type { AnnotationSessionData } from '../src/domain/types'

describe('answer completion', () => {
  it('requires target, effect, duration, loop, and confidence', () => {
    const answer = createEmptyAnswer('2026-01-01T00:00:00.000Z')
    expect(validateAnswer(answer).missing).toEqual(['target', 'effect', 'duration', 'loop', 'confidence'])
    const complete = {
      ...answer,
      targetText: 'the MSFT line',
      effect: 'shake' as const,
      duration: { kind: 'not_shown' as const },
      loop: { kind: 'text' as const, text: 'repeats twice' },
      confidence: 5 as const,
      status: 'completed' as const,
    }
    expect(validateAnswer(complete).valid).toBe(true)
  })

  it('rejects empty natural-language parameter descriptions', () => {
    const answer = {
      ...createEmptyAnswer(),
      targetText: 'the MSFT line',
      effect: 'shake' as const,
      duration: { kind: 'text' as const, text: '   ' },
      loop: { kind: 'text' as const, text: 'continuously' },
      confidence: 5 as const,
    }
    expect(validateAnswer(answer).missing).toEqual(['duration'])
  })

  it('blocks finalization while any answer is skipped', () => {
    const answer = { ...createEmptyAnswer(), status: 'skipped' as const }
    const session: AnnotationSessionData = {
      schemaVersion: 1,
      datasetId: 'test',
      datasetVersion: '1',
      annotatorId: 'ann',
      sessionId: 'session',
      caseOrder: ['case-a'],
      currentCaseId: 'case-a',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      completedAt: null,
      revision: 0,
      answers: { 'case-a': answer },
    }
    expect(canFinalize(session)).toBe(false)
  })
})
