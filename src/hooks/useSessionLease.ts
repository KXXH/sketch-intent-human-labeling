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

  const claim = useCallback((force = false) => {
    if (!annotatorId) return
    const key = leaseKey(config, annotatorId)
    const existing = readLease(key)
    if (!force && existing && existing.tabId !== tabId.current && existing.expiresAt > Date.now()) {
      setReadOnly(true)
      return
    }
    localStorage.setItem(key, JSON.stringify({ tabId: tabId.current, expiresAt: Date.now() + LEASE_MS }))
    channelRef.current?.postMessage({ type: 'claimed', tabId: tabId.current })
    setReadOnly(false)
  }, [annotatorId, config])

  useEffect(() => {
    if (!annotatorId) return
    const key = leaseKey(config, annotatorId)
    channelRef.current = 'BroadcastChannel' in window ? new BroadcastChannel(key) : null
    channelRef.current?.addEventListener('message', (event) => {
      if (event.data?.type === 'claimed' && event.data.tabId !== tabId.current) setReadOnly(true)
    })
    claim()
    const interval = window.setInterval(() => {
      if (!readOnly) claim(true)
      else claim(false)
    }, RENEW_MS)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      const current = readLease(key)
      if (current && current.tabId !== tabId.current && current.expiresAt > Date.now()) setReadOnly(true)
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('storage', onStorage)
      channelRef.current?.close()
      const current = readLease(key)
      if (current?.tabId === tabId.current) localStorage.removeItem(key)
    }
  }, [annotatorId, claim, config, readOnly])

  return { readOnly, takeOver: () => claim(true) }
}
