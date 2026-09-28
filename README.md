# Pi Companion Starter

A clean-room personal-project starter for controlling a Raspberry Pi from a small Expo app on the same local network.

This repository is intentionally generic. It contains newly written code, neutral text, and newly generated artwork. It does not contain prior product names, characters, prompts, images, domains, project identifiers, customer data, or service credentials.

## What works

- Pair one phone installation to one Pi with a six-digit, time-limited code.
- Keep the resulting bearer token in iOS Keychain or Android Keystore through Expo SecureStore.
- Show online state, hostname, IP address, uptime, CPU temperature, memory use, and agent version.
- Set ALSA output volume with a touch-friendly accessible slider.
- Trigger a narrow local identify signal for a hardware-specific LED or sound integration.
- Unpair locally and rotate the Pi's pairing credentials.
- Run the Pi agent as an unprivileged, hardened systemd service.

There are deliberately no accounts, analytics, push notifications, remote shell, AI provider, or cloud backend in the starter.

## Architecture

```text
┌──────────────────────────┐       trusted LAN        ┌──────────────────────────┐
│ Expo app                 │  HTTP + bearer token     │ Raspberry Pi             │
│                          │ ◀──────────────────────▶ │                          │
│ Expo Router              │                          │ Python local agent       │
│ SecureStore              │                          │ systemd service          │
│ status + controls        │                          │ state file + ALSA hook   │
└──────────────────────────┘                          └──────────────────────────┘
```

The Pi owns device state. The app owns only the endpoint and bearer token. The protocol is documented in [`docs/PROTOCOL.md`](docs/PROTOCOL.md).

## Run the app

Requirements: Node.js 22.13 or newer and an Expo-compatible Android/iOS development environment. This matches the [Expo SDK 57 compatibility table](https://docs.expo.dev/versions/latest/).

```bash
npm install
npm start
```

Local HTTP access is native configuration, so use a development build rather than Expo Go for reliable device testing:

```bash
npx expo run:android
# or
npx expo run:ios
```

Before publishing, replace the placeholder bundle identifiers in `app.config.js` with identifiers you control.

## Install the Pi agent

On Raspberry Pi OS:

```bash
git clone <your-repository-url> pi-companion-starter
cd pi-companion-starter
sudo ./pi/install.sh
sudo journalctl -u pi-companion -n 30 --no-pager
```

Enter `<hostname>.local` and the pairing code from the journal in the app. See [`pi/README.md`](pi/README.md) for service administration and hardware hooks.

## Verify

```bash
npm run verify
```

This runs strict TypeScript checking and the Python unit/API-contract tests.

## Security limits

This MVP uses plain HTTP because it is designed for a trusted private LAN and native apps cannot practically pin a self-signed Pi certificate without extra provisioning. Do not expose or port-forward `8787`. A product version should add authenticated TLS or a secure outbound cloud relay, device-scoped credentials, audit logs, signed updates, abuse controls, and credential recovery.

The pairing token is shown to the app once and stored only as a SHA-256 hash on the Pi. The six-digit pairing code is also hashed, expires after 15 minutes, and is rate-limited.

## Turning it into your project

1. Rename the app, package, scheme, and bundle identifiers.
2. Replace the neutral generated artwork with assets you own.
3. Add only the hardware adapters your Pi actually has, such as a specific LED strip, button, display, or amplifier.
4. Choose a real remote-access architecture before adding off-LAN control.
5. Add signed OTA updates before distributing devices you cannot physically recover.

Technical patterns can be reused, but ownership of prior employer, client, or team work is a legal question rather than a code question. Verify your agreements before carrying over any existing implementation, prompt, content, brand asset, dataset, or secret. This starter avoids those materials by design.

## License

No open-source license has been selected. Add one only after deciding how you want others to use the project.
