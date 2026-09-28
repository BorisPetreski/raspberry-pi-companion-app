#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo: sudo ./pi/install.sh" >&2
  exit 1
fi

SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_ROOT="/opt/pi-companion"
SERVICE_USER="pi-companion"

apt-get update
apt-get install -y python3 alsa-utils avahi-daemon

if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  useradd \
    --system \
    --home-dir /var/lib/pi-companion \
    --shell /usr/sbin/nologin \
    "${SERVICE_USER}"
fi
usermod -a -G audio "${SERVICE_USER}"

install -d -m 0755 "${INSTALL_ROOT}/pi"
cp -a "${SOURCE_DIR}/companion_agent" "${INSTALL_ROOT}/pi/"
chown -R root:root "${INSTALL_ROOT}"
find "${INSTALL_ROOT}" -type d -exec chmod 0755 {} +
find "${INSTALL_ROOT}" -type f -exec chmod 0644 {} +

install -m 0644 \
  "${SOURCE_DIR}/systemd/pi-companion.service" \
  /etc/systemd/system/pi-companion.service

if [[ ! -f /etc/pi-companion.env ]]; then
  install -m 0644 \
    "${SOURCE_DIR}/pi-companion.env.example" \
    /etc/pi-companion.env
fi

systemctl daemon-reload
systemctl enable --now avahi-daemon
systemctl enable pi-companion.service
systemctl restart pi-companion.service

echo
echo "Pi Companion is installed."
echo "Pairing code: sudo journalctl -u pi-companion -n 30 --no-pager"
echo "Status:       systemctl status pi-companion --no-pager"
echo "Address:      http://$(hostname).local:8787"
