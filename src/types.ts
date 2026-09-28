export type StoredDevice = {
  id: string
  name: string
  baseUrl: string
  token: string
}

export type DeviceStatus = {
  id: string
  name: string
  hostname: string
  ipAddress: string | null
  paired: boolean
  uptimeSeconds: number
  volume: number
  volumeApplied: boolean
  cpuTemperatureC: number | null
  memoryUsedPercent: number | null
  activity: 'idle' | 'identifying'
  agentVersion: string
  updatedAt: string
}

export type PairResponse = {
  device: StoredDevice
  status: DeviceStatus
}

export type ConnectionPhase = 'loading' | 'unpaired' | 'connecting' | 'online' | 'offline'

