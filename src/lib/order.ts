import type { ExperimentCase } from '../experiment/types'

function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  return () => {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function createStableCaseOrder(cases: ExperimentCase[], seedText: string): string[] {
  const random = mulberry32(hashSeed(seedText))
  const grouped = new Map<string, ExperimentCase[]>()
  for (const item of cases) grouped.set(item.pairId, [...(grouped.get(item.pairId) ?? []), item])

  const groups = shuffled([...grouped.entries()], random)
  const firstPass: ExperimentCase[] = []
  const secondPass: ExperimentCase[] = []

  for (const [, group] of groups) {
    const ordered = shuffled(group, random)
    firstPass.push(ordered[0])
    secondPass.push(...ordered.slice(1))
  }

  const shuffledSecondPass = shuffled(secondPass, random)
  if (
    firstPass.length > 0 &&
    shuffledSecondPass.length > 1 &&
    firstPass.at(-1)?.pairId === shuffledSecondPass[0].pairId
  ) {
    ;[shuffledSecondPass[0], shuffledSecondPass[1]] = [shuffledSecondPass[1], shuffledSecondPass[0]]
  }

  return [...firstPass, ...shuffledSecondPass].map((item) => item.id)
}
