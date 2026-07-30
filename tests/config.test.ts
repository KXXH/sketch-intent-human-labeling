import { describe, expect, it } from 'vitest'
import { experimentConfig } from '../src/experiment/config'

describe('experiment configuration', () => {
  it('contains 80 blinded cases with four relative keyframes', () => {
    expect(experimentConfig.cases).toHaveLength(80)
    expect(new Set(experimentConfig.cases.map((item) => item.id))).toHaveLength(80)
    for (const item of experimentConfig.cases) {
      expect(item.imagePaths).toHaveLength(4)
      expect(Object.keys(item)).toEqual(['id', 'pairId', 'imagePaths'])
      expect(JSON.stringify(item)).not.toMatch(/taskDescription|groundTruth|animationUnit|"effect"|"targets"/)
    }
  })

  it('documents every supported effect using the original AI prompt definitions', () => {
    expect(experimentConfig.effects.map((effect) => effect.id)).toEqual([
      'blink', 'fade', 'glow', 'fillColor', 'desaturate',
      'pulse', 'flip', 'shake', 'scale', 'shatter',
    ])
    expect(experimentConfig.effects.every((effect) => effect.definition.trim().length > 0)).toBe(true)
  })
})
