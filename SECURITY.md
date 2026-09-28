# Security Policy

## Intended deployment

Pi Companion Starter is a local-network prototype. Keep the phone and Pi on a trusted private network and do not publish TCP port `8787` to the internet.

## Secrets

- Do not commit access tokens, Wi-Fi passwords, signing keys, or cloud API keys.
- The app stores its device token with Expo SecureStore on native platforms.
- The Pi stores only a SHA-256 token hash in `/var/lib/pi-companion/state.json`.
- `/etc/pi-companion.env` is configuration, not a secret store.

## Reporting

Until this project has a public security mailbox, report issues privately to the repository owner rather than opening a public issue containing exploit details or credentials.
