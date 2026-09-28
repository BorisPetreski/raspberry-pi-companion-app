import type { DeviceStatus, PairResponse, StoredDevice } from './types'

const DEFAULT_PORT = '8787'
const REQUEST_TIMEOUT_MS = 5000

export class DeviceApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'DeviceApiError'
  }
}

export function normalizeBaseUrl(input: string): string {
  const candidate = input.trim()
  if (!candidate) throw new DeviceApiError('Enter the Pi hostname or IP address.')

  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `http://${candidate}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new DeviceApiError('That hostname or address is not valid.')
  }

  if (!url.port) url.port = DEFAULT_PORT
  url.pathname = ''
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {})
      }
    })

    const payload = await response.json().catch(() => ({})) as { error?: string }
    if (!response.ok) {
      throw new DeviceApiError(payload.error || `Device request failed (${response.status}).`, response.status)
    }
    return payload as T
  } catch (error) {
    if (error instanceof DeviceApiError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DeviceApiError('The Pi did not respond in time.')
    }
    throw new DeviceApiError('The Pi could not be reached on this network.')
  } finally {
    clearTimeout(timeout)
  }
}

export async function pairWithDevice(host: string, code: string): Promise<PairResponse> {
  const baseUrl = normalizeBaseUrl(host)
  const normalizedCode = code.replace(/\D/g, '')
  if (normalizedCode.length !== 6) throw new DeviceApiError('Enter the six-digit pairing code.')

  const response = await request<{
    token: string
    device: Omit<StoredDevice, 'baseUrl' | 'token'>
    status: DeviceStatus
  }>(baseUrl, '/v1/pair', {
    method: 'POST',
    body: JSON.stringify({ code: normalizedCode })
  })

  return {
    device: {
      ...response.device,
      baseUrl,
      token: response.token
    },
    status: response.status
  }
}

export function fetchDeviceStatus(device: StoredDevice): Promise<DeviceStatus> {
  return request<DeviceStatus>(device.baseUrl, '/v1/status', {}, device.token)
}

export function setDeviceVolume(device: StoredDevice, volume: number): Promise<DeviceStatus> {
  return request<DeviceStatus>(device.baseUrl, '/v1/volume', {
    method: 'POST',
    body: JSON.stringify({ volume: Math.round(volume) })
  }, device.token)
}

export function identifyDevice(device: StoredDevice): Promise<DeviceStatus> {
  return request<DeviceStatus>(device.baseUrl, '/v1/identify', {
    method: 'POST',
    body: '{}'
  }, device.token)
}

export async function unpairDevice(device: StoredDevice): Promise<void> {
  await request<{ ok: boolean }>(device.baseUrl, '/v1/unpair', {
    method: 'POST',
    body: '{}'
  }, device.token)
}

