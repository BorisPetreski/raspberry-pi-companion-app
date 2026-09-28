from __future__ import annotations

import hashlib
import json
import os
import secrets
import tempfile
import threading
import time
from pathlib import Path
from typing import Any


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _machine_identifier() -> str:
    for candidate in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
        try:
            value = Path(candidate).read_text(encoding="utf-8").strip()
            if value:
                return value
        except OSError:
            continue
    return os.uname().nodename


class StateStore:
    def __init__(self, path: str):
        self.path = Path(path)
        self._lock = threading.RLock()
        self._state = self._load()

    def _default_state(self) -> dict[str, Any]:
        hardware_id = hashlib.sha256(_machine_identifier().encode("utf-8")).hexdigest()
        return {
            "device_id": f"pi-{hardware_id[:12]}",
            "token_hash": None,
            "paired_at": None,
            "pairing_code_hash": None,
            "pairing_expires_at": None,
            "volume": 55,
            "volume_applied": False,
        }

    def _load(self) -> dict[str, Any]:
        try:
            loaded = json.loads(self.path.read_text(encoding="utf-8"))
            if not isinstance(loaded, dict):
                raise ValueError("state must be an object")
        except (OSError, ValueError, json.JSONDecodeError):
            loaded = {}
        return {**self._default_state(), **loaded}

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_path = tempfile.mkstemp(
            dir=self.path.parent,
            prefix=f".{self.path.name}.",
            text=True,
        )
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
                json.dump(self._state, handle, indent=2, sort_keys=True)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.chmod(temporary_path, 0o600)
            os.replace(temporary_path, self.path)
        finally:
            try:
                os.unlink(temporary_path)
            except FileNotFoundError:
                pass

    @property
    def device_id(self) -> str:
        with self._lock:
            return str(self._state["device_id"])

    @property
    def volume(self) -> int:
        with self._lock:
            return int(self._state.get("volume", 55))

    @property
    def volume_applied(self) -> bool:
        with self._lock:
            return bool(self._state.get("volume_applied", False))

    @property
    def is_paired(self) -> bool:
        with self._lock:
            return bool(self._state.get("token_hash"))

    def pairing_is_open(self) -> bool:
        with self._lock:
            expires_at = self._state.get("pairing_expires_at")
            return bool(
                self._state.get("pairing_code_hash")
                and isinstance(expires_at, (int, float))
                and expires_at > time.time()
            )

    def open_pairing(self, duration_seconds: int) -> str:
        code = f"{secrets.randbelow(1_000_000):06d}"
        with self._lock:
            self._state["pairing_code_hash"] = _digest(code)
            self._state["pairing_expires_at"] = time.time() + duration_seconds
            self._save()
        return code

    def pair(self, code: str) -> str:
        with self._lock:
            if not self.pairing_is_open():
                raise ValueError("pairing_window_closed")
            if not secrets.compare_digest(
                str(self._state.get("pairing_code_hash")),
                _digest(code),
            ):
                raise ValueError("invalid_pairing_code")

            token = secrets.token_urlsafe(32)
            self._state["token_hash"] = _digest(token)
            self._state["paired_at"] = time.time()
            self._state["pairing_code_hash"] = None
            self._state["pairing_expires_at"] = None
            self._save()
            return token

    def authorize(self, token: str) -> bool:
        with self._lock:
            expected = self._state.get("token_hash")
            return bool(expected and secrets.compare_digest(str(expected), _digest(token)))

    def unpair(self, duration_seconds: int) -> str:
        with self._lock:
            self._state["token_hash"] = None
            self._state["paired_at"] = None
            self._save()
        return self.open_pairing(duration_seconds)

    def set_volume(self, value: int, *, applied: bool = True) -> None:
        if not 0 <= value <= 100:
            raise ValueError("volume_out_of_range")
        with self._lock:
            self._state["volume"] = value
            self._state["volume_applied"] = applied
            self._save()
