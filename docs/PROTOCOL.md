# Local Device Protocol

Default origin: `http://<hostname>.local:8787`

## Pairing

`POST /v1/pair`

```json
{ "code": "123456" }
```

The response contains a bearer token exactly once, minimal device identity, and the current status. The app stores the token in the platform secure store.

## Authenticated routes

Send `Authorization: Bearer <token>` to:

- `GET /v1/status`
- `POST /v1/volume` with `{ "volume": 0..100 }`
- `POST /v1/identify` with `{}`
- `POST /v1/unpair` with `{}`

The status, volume, and identify responses use the same status object shape. Unpair returns `{ "ok": true }` and immediately invalidates the old token.

## Status object

```json
{
  "id": "pi-0123456789ab",
  "name": "My Pi Companion",
  "hostname": "raspberrypi",
  "ipAddress": "192.168.1.50",
  "paired": true,
  "uptimeSeconds": 3600,
  "volume": 55,
  "volumeApplied": true,
  "cpuTemperatureC": 48.2,
  "memoryUsedPercent": 31.4,
  "activity": "idle",
  "agentVersion": "0.1.0",
  "updatedAt": "2026-09-28T10:00:00+00:00"
}
```
