import { describe, expect, it } from 'vitest'
import type { ExperimentCase } from '../src/experiment/types'
import { createStableCaseOrder } from '../src/lib/order'

const cases: ExperimentCase[] = Array.from({ length: 40 }, (_, pairIndex) => [1, 2].map((stage) => ({
  id: `${1000 + pairIndex} (S${stage}), P${pairIndex}`,
  pairId: `${1000 + pairIndex}, P${pairIndex}`,
  imagePaths: ['01.png', '02.png', '03.png', '04.png'] as [string, string, string, string],
}))).flat()

describe('createStableCaseOrder', () => {
  it('is deterministic for one annotator and changes for another', () => {
    expect(createStableCaseOrder(cases, 'annotator-a')).toEqual(createStableCaseOrder(cases, 'annotator-a'))
    expect(createStableCaseOrder(cases, 'annotator-a')).not.toEqual(createStableCaseOrder(cases, 'annotator-b'))
  })

  it('keeps pair siblings in separate passes', () => {
    const order = createStableCaseOrder(cases, 'annotator-a')
    const lookup = new Map(cases.map((item) => [item.id, item.pairId]))
    expect(order).toHaveLength(80)
    expect(new Set(order)).toHaveLength(80)
    expect(new Set(order.slice(0, 40).map((id) => lookup.get(id)))).toHaveLength(40)
    for (let index = 1; index < order.length; index += 1) {
      expect(lookup.get(order[index])).not.toBe(lookup.get(order[index - 1]))
    }
  })
})
