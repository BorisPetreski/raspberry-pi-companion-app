# Raspberry Pi Agent

The agent exposes a deliberately small local-network API for the companion app. It uses only the Python standard library and does not require cloud credentials.

## Install

On Raspberry Pi OS:

```bash
git clone <your-repository-url> pi-companion-starter
cd pi-companion-starter
sudo ./pi/install.sh
```

Read the current pairing code:

```bash
sudo journalctl -u pi-companion -n 30 --no-pager
```

The app can normally connect to `raspberrypi.local`. If the hostname was changed, use `<hostname>.local` or the Pi's local IP address.

## Administration

```bash
# Follow logs
sudo journalctl -u pi-companion -f

# Open a fresh 15-minute pairing window
sudo -u pi-companion \
  PYTHONPATH=/opt/pi-companion/pi \
  PI_COMPANION_STATE_FILE=/var/lib/pi-companion/state.json \
  python3 -m companion_agent pairing-code

# Unpair the current app and create a fresh code
sudo -u pi-companion \
  PYTHONPATH=/opt/pi-companion/pi \
  PI_COMPANION_STATE_FILE=/var/lib/pi-companion/state.json \
  python3 -m companion_agent unpair
```

Edit `/etc/pi-companion.env` to change the display name, port, ALSA mixer control, or pairing-window duration. Then restart with `sudo systemctl restart pi-companion`.

The identify action writes a timestamp to `/run/pi-companion/identify`. A hardware-specific LED, display, or sound process can watch that file without expanding the network API.

## Security boundary

- Pairing codes expire and are rate-limited.
- The stored pairing code and bearer token are SHA-256 hashes, not plaintext.
- State is written atomically with mode `0600`.
- All control routes require the bearer token after pairing.
- There is no remote-shell or arbitrary-command endpoint.
- The service runs as an unprivileged, systemd-hardened user.

Traffic is plain HTTP and is intended only for a trusted private LAN. Never forward port `8787` from a router or expose it to the public internet. Add authenticated TLS or a secure cloud relay before using this design on an untrusted network.
