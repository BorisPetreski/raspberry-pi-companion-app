import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  fetchDeviceStatus,
  identifyDevice,
  pairWithDevice,
  setDeviceVolume,
  unpairDevice
} from './device-client'
import { clearStoredDevice, loadStoredDevice, saveStoredDevice } from './storage'
import type { ConnectionPhase, DeviceStatus, StoredDevice } from './types'

type DeviceContextValue = {
  device: StoredDevice | null
  status: DeviceStatus | null
  phase: ConnectionPhase
  error: string | null
  pair: (host: string, code: string) => Promise<void>
  refresh: () => Promise<void>
  setVolume: (volume: number) => Promise<void>
  identify: () => Promise<void>
  forget: () => Promise<void>
}

const DeviceContext = createContext<DeviceContextValue | null>(null)

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<StoredDevice | null>(null)
  const [status, setStatus] = useState<DeviceStatus | null>(null)
  const [phase, setPhase] = useState<ConnectionPhase>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadStoredDevice().then((stored) => {
      if (!active) return
      setDevice(stored)
      setPhase(stored ? 'connecting' : 'unpaired')
    })
    return () => { active = false }
  }, [])

  const refresh = useCallback(async () => {
    if (!device) {
      setStatus(null)
      setPhase('unpaired')
      return
    }

    try {
      const nextStatus = await fetchDeviceStatus(device)
      setStatus(nextStatus)
      setPhase('online')
      setError(null)
    } catch (nextError) {
      setPhase('offline')
      setError(nextError instanceof Error ? nextError.message : 'The device is offline.')
    }
  }, [device])

  useEffect(() => {
    if (!device) return
    void refresh()
    const timer = setInterval(() => void refresh(), 5000)
    return () => clearInterval(timer)
  }, [device, refresh])

  const pair = useCallback(async (host: string, code: string) => {
    setPhase('connecting')
    setError(null)
    try {
      const result = await pairWithDevice(host, code)
      await saveStoredDevice(result.device)
      setDevice(result.device)
      setStatus(result.status)
      setPhase('online')
    } catch (nextError) {
      setPhase('unpaired')
      setError(nextError instanceof Error ? nextError.message : 'Pairing failed.')
      throw nextError
    }
  }, [])

  const setVolume = useCallback(async (volume: number) => {
    if (!device) return
    setStatus((current) => current ? { ...current, volume: Math.round(volume) } : current)
    try {
      const nextStatus = await setDeviceVolume(device, volume)
      setStatus(nextStatus)
      setPhase('online')
      setError(null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Volume could not be changed.')
      await refresh()
    }
  }, [device, refresh])

  const identify = useCallback(async () => {
    if (!device) return
    const nextStatus = await identifyDevice(device)
    setStatus(nextStatus)
    setError(null)
  }, [device])

  const forget = useCallback(async () => {
    if (device) {
      try {
        await unpairDevice(device)
      } catch {
        // Local removal must still work when the Pi is unavailable.
      }
    }
    await clearStoredDevice()
    setDevice(null)
    setStatus(null)
    setPhase('unpaired')
    setError(null)
  }, [device])

  const value = useMemo<DeviceContextValue>(() => ({
    device,
    status,
    phase,
    error,
    pair,
    refresh,
    setVolume,
    identify,
    forget
  }), [device, status, phase, error, pair, refresh, setVolume, identify, forget])

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevice(): DeviceContextValue {
  const value = useContext(DeviceContext)
  if (!value) throw new Error('useDevice must be used inside DeviceProvider')
  return value
}

