import type { ExperimentConfig } from '../experiment/types'
import type { AnnotationExport, AnnotationSessionData } from '../domain/types'
import { checksum } from './checksum'

const SNAPSHOT_COUNT = 5

export class StorageError extends Error {}

function storagePrefix(config: ExperimentConfig, annotatorId: string): string {
  return `human-labeling:${config.datasetId}:${config.datasetVersion}:${encodeURIComponent(annotatorId)}`
}

function withoutChecksum(payload: AnnotationExport): AnnotationSessionData {
  const { checksum: _checksum, ...session } = payload
  return session
}

export function sealSession(session: AnnotationSessionData): AnnotationExport {
  return { ...session, checksum: checksum(session) }
}

export function verifyExport(value: unknown, config: ExperimentConfig): value is AnnotationExport {
  if (!value || typeof value !== 'object') return false
  const payload = value as AnnotationExport
  if (
    payload.schemaVersion !== 1 ||
    payload.datasetId !== config.datasetId ||
    payload.datasetVersion !== config.datasetVersion ||
    typeof payload.annotatorId !== 'string' ||
    !Array.isArray(payload.caseOrder) ||
    typeof payload.answers !== 'object' ||
    typeof payload.checksum !== 'string'
  ) return false

  const expectedIds = new Set(config.cases.map((item) => item.id))
  if (payload.caseOrder.length !== expectedIds.size || payload.caseOrder.some((id) => !expectedIds.has(id))) return false
  return checksum(withoutChecksum(payload)) === payload.checksum
}

export function persistSession(
  session: AnnotationSessionData,
  config: ExperimentConfig,
  storage: Storage = localStorage,
): AnnotationExport {
  const prefix = storagePrefix(config, session.annotatorId)
  const payload = sealSession(session)
  const serialized = JSON.stringify(payload)
  try {
    storage.setItem(`${prefix}:staging`, serialized)
    if (storage.getItem(`${prefix}:staging`) !== serialized) throw new StorageError('The browser did not verify the staged save.')
    for (let index = SNAPSHOT_COUNT - 1; index > 0; index -= 1) {
      const previous = storage.getItem(`${prefix}:snapshot:${index - 1}`)
      if (previous) storage.setItem(`${prefix}:snapshot:${index}`, previous)
    }
    const current = storage.getItem(`${prefix}:main`)
    if (current) storage.setItem(`${prefix}:snapshot:0`, current)
    storage.setItem(`${prefix}:main`, serialized)
    storage.removeItem(`${prefix}:staging`)
    return payload
  } catch (error) {
    throw new StorageError(error instanceof Error ? error.message : 'Unknown local storage failure')
  }
}

export function loadSession(
  config: ExperimentConfig,
  annotatorId: string,
  storage: Storage = localStorage,
): { session: AnnotationSessionData | null; recovered: boolean } {
  const prefix = storagePrefix(config, annotatorId)
  const keys = [
    `${prefix}:main`,
    `${prefix}:staging`,
    ...Array.from({ length: SNAPSHOT_COUNT }, (_, index) => `${prefix}:snapshot:${index}`),
  ]
  const candidates: AnnotationExport[] = []
  for (const key of keys) {
    const serialized = storage.getItem(key)
    if (!serialized) continue
    try {
      const parsed = JSON.parse(serialized)
      if (verifyExport(parsed, config) && parsed.annotatorId === annotatorId) candidates.push(parsed)
    } catch {
      // Corrupt candidates are ignored in favor of another valid snapshot.
    }
  }
  if (!candidates.length) return { session: null, recovered: false }
  candidates.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || right.revision - left.revision)
  const selected = candidates[0]
  const main = storage.getItem(`${prefix}:main`)
  const recovered = !main || main !== JSON.stringify(selected)
  return { session: withoutChecksum(selected), recovered }
}

export function leaseKey(config: ExperimentConfig, annotatorId: string): string {
  return `${storagePrefix(config, annotatorId)}:lease`
}

export function parseImportedSession(text: string, config: ExperimentConfig): AnnotationSessionData {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new StorageError('The selected file is not valid JSON.')
  }
  if (!verifyExport(parsed, config)) throw new StorageError('The file is damaged or belongs to another dataset version.')
  return withoutChecksum(parsed)
}

export function downloadSession(session: AnnotationSessionData, final: boolean): void {
  const payload = sealSession(session)
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeAnnotator = session.annotatorId.replace(/[^a-z0-9_-]+/gi, '-')
  anchor.href = url
  anchor.download = `human-labels__${session.datasetId}__${safeAnnotator}__${final ? 'final' : 'draft'}__r${session.revision}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
