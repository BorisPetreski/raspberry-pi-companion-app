import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { StoredDevice } from './types'

const STORAGE_KEY = 'pi-companion.device.v1'

function webStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') return null
  return globalThis.localStorage
}

export async function loadStoredDevice(): Promise<StoredDevice | null> {
  const raw = webStorage()?.getItem(STORAGE_KEY)
    ?? (Platform.OS === 'web' ? null : await SecureStore.getItemAsync(STORAGE_KEY))

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredDevice>
    if (!parsed.id || !parsed.name || !parsed.baseUrl || !parsed.token) return null
    return parsed as StoredDevice
  } catch {
    return null
  }
}

export async function saveStoredDevice(device: StoredDevice): Promise<void> {
  const raw = JSON.stringify(device)
  const storage = webStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, raw)
    return
  }
  await SecureStore.setItemAsync(STORAGE_KEY, raw)
}

export async function clearStoredDevice(): Promise<void> {
  const storage = webStorage()
  if (storage) {
    storage.removeItem(STORAGE_KEY)
    return
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY)
}

