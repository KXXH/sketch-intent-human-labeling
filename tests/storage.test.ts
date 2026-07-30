import { describe, expect, it } from 'vitest'
import { createSession } from '../src/domain/session'
import type { ExperimentConfig } from '../src/experiment/types'
import { loadSession, parseImportedSession, persistSession, sealSession, StorageError } from '../src/lib/storage'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const config: ExperimentConfig = {
  schemaVersion: 1,
  datasetId: 'test-dataset',
  datasetVersion: '1',
  title: 'Test',
  instructions: [],
  effects: [],
  cases: [
    { id: 'a-s1', pairId: 'a', imagePaths: ['1', '2', '3', '4'] },
    { id: 'a-s2', pairId: 'a', imagePaths: ['1', '2', '3', '4'] },
  ],
}

describe('safe local persistence', () => {
  it('recovers from a corrupt main save using a verified snapshot', () => {
    const storage = new MemoryStorage()
    const first = createSession(config, 'ann-1')
    persistSession(first, config, storage)
    const second = { ...first, revision: 1, updatedAt: '2026-01-02T00:00:00.000Z' }
    persistSession(second, config, storage)
    const mainKey = Array.from({ length: storage.length }, (_, index) => storage.key(index)).find((key) => key?.endsWith(':main'))!
    storage.setItem(mainKey, '{corrupt')
    const loaded = loadSession(config, 'ann-1', storage)
    expect(loaded.recovered).toBe(true)
    expect(loaded.session?.revision).toBe(0)
  })

  it('rejects an import with a changed payload and stale checksum', () => {
    const payload = sealSession(createSession(config, 'ann-1'))
    payload.annotatorId = 'tampered'
    expect(() => parseImportedSession(JSON.stringify(payload), config)).toThrow(StorageError)
  })
})
