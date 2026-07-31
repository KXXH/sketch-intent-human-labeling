import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExperimentConfig } from '../experiment/types'
import { leaseKey } from '../lib/storage'

const LEASE_MS = 12_000
const RENEW_MS = 4_000

interface LeaseRecord { tabId: string; expiresAt: number }

function readLease(key: string): LeaseRecord | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

export function useSessionLease(config: ExperimentConfig, annotatorId: string | null) {
  const tabId = useRef(crypto.randomUUID())
  const [readOnly, setReadOnly] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const claim = useCallback(async (force = false): Promise<boolean> => {
    if (!annotatorId) return false
    const key = leaseKey(config, annotatorId)

    const writeLease = () => {
      const existing = readLease(key)
      if (!force && existing && existing.tabId !== tabId.current && existing.expiresAt > Date.now()) {
        setReadOnly(true)
        return false
      }
      try {
        localStorage.setItem(key, JSON.stringify({ tabId: tabId.current, expiresAt: Date.now() + LEASE_MS }))
        const verified = readLease(key)
        const owner = verified?.tabId === tabId.current && verified.expiresAt > Date.now()
        setReadOnly(!owner)
        if (owner) channelRef.current?.postMessage({ type: 'claimed', tabId: tabId.current })
        return owner
      } catch {
        setReadOnly(true)
        return false
      }
    }

    // Web Locks makes the read/check/write sequence atomic between tabs that
    // use this app. Older browsers still get the verified best-effort fallback.
    if ('locks' in navigator) {
      return navigator.locks.request(`${key}:claim`, async () => writeLease())
    }
    return writeLease()
  }, [annotatorId, config])

  const ownsLease = useCallback(() => {
    if (!annotatorId) return false
    const current = readLease(leaseKey(config, annotatorId))
    const owned = current?.tabId === tabId.current && current.expiresAt > Date.now()
    if (!owned) setReadOnly(true)
    return owned
  }, [annotatorId, config])

  useEffect(() => {
    if (!annotatorId) return
    const key = leaseKey(config, annotatorId)
    channelRef.current = 'BroadcastChannel' in window ? new BroadcastChannel(key) : null
    channelRef.current?.addEventListener('message', (event) => {
      if (event.data?.type === 'claimed' && event.data.tabId !== tabId.current) setReadOnly(true)
    })
    void claim()
    const interval = window.setInterval(() => { void claim() }, RENEW_MS)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      const current = readLease(key)
      if (current?.tabId !== tabId.current && current?.expiresAt && current.expiresAt > Date.now()) setReadOnly(true)
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('storage', onStorage)
      channelRef.current?.close()
      const current = readLease(key)
      if (current?.tabId === tabId.current) {
        try { localStorage.removeItem(key) } catch { /* Storage may be unavailable during teardown. */ }
      }
    }
  }, [annotatorId, claim, config])

  return { readOnly, ownsLease, takeOver: () => claim(true) }
}
