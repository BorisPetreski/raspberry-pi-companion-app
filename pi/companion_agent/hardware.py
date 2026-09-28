from __future__ import annotations

import os
import socket
import subprocess
import time
from pathlib import Path


def local_ip_address() -> str | None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("192.0.2.1", 80))
        return str(sock.getsockname()[0])
    except OSError:
        return None
    finally:
        sock.close()


def cpu_temperature_celsius() -> float | None:
    try:
        raw = Path("/sys/class/thermal/thermal_zone0/temp").read_text(
            encoding="utf-8"
        )
        return round(int(raw.strip()) / 1000, 1)
    except (OSError, TypeError, ValueError):
        return None


def memory_percent() -> float | None:
    try:
        values: dict[str, int] = {}
        for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
            key, raw = line.split(":", 1)
            values[key] = int(raw.strip().split()[0])
        total = values["MemTotal"]
        available = values["MemAvailable"]
        return round((total - available) / total * 100, 1)
    except (OSError, KeyError, ValueError, ZeroDivisionError):
        return None


def uptime_seconds() -> int:
    try:
        return int(float(Path("/proc/uptime").read_text(encoding="utf-8").split()[0]))
    except (OSError, IndexError, ValueError):
        return int(time.monotonic())


def set_alsa_volume(control: str, value: int) -> None:
    subprocess.run(
        ["amixer", "-q", "sset", control, f"{value}%"],
        check=True,
        timeout=5,
    )


def signal_identify(path: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(".tmp")
    temporary.write_text(f"{time.time()}\n", encoding="utf-8")
    os.replace(temporary, target)
