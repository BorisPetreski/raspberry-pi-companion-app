from __future__ import annotations

import json
import logging
import socket
import subprocess
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from . import __version__
from .config import AgentConfig
from .hardware import (
    cpu_temperature_celsius,
    local_ip_address,
    memory_percent,
    set_alsa_volume,
    signal_identify,
    uptime_seconds,
)
from .state import StateStore

LOGGER = logging.getLogger("pi-companion")
MAX_BODY_BYTES = 16 * 1024


class PairingLimiter:
    def __init__(self, attempts: int = 5, window_seconds: int = 60):
        self.attempts = attempts
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            events = self._events[key]
            while events and events[0] <= now - self.window_seconds:
                events.popleft()
            if len(events) >= self.attempts:
                return False
            events.append(now)
            return True


class CompanionAgent:
    def __init__(self, config: AgentConfig, state: StateStore):
        self.config = config
        self.state = state
        self.started_at = time.time()
        self.identifying_until = 0.0
        self.pairing_limiter = PairingLimiter()

    def status(self) -> dict[str, Any]:
        return {
            "id": self.state.device_id,
            "name": self.config.name,
            "paired": self.state.is_paired,
            "volume": self.state.volume,
            "volumeApplied": self.state.volume_applied,
            "ipAddress": local_ip_address(),
            "hostname": socket.gethostname(),
            "agentVersion": __version__,
            "uptimeSeconds": uptime_seconds(),
            "cpuTemperatureC": cpu_temperature_celsius(),
            "memoryUsedPercent": memory_percent(),
            "activity": (
                "identifying" if self.identifying_until > time.time() else "idle"
            ),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }

    def set_volume(self, value: int) -> None:
        try:
            set_alsa_volume(self.config.alsa_control, value)
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            LOGGER.warning(
                "ALSA volume control %r is unavailable; storing requested value only",
                self.config.alsa_control,
            )
            self.state.set_volume(value, applied=False)
            return
        self.state.set_volume(value, applied=True)

    def identify(self) -> None:
        signal_identify(self.config.identify_file)
        self.identifying_until = time.time() + 8


def _handler_for(agent: CompanionAgent) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "PiCompanion/0.1"

        def log_message(self, pattern: str, *args: object) -> None:
            LOGGER.info("%s - %s", self.client_address[0], pattern % args)

        def _send_json(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.end_headers()
            self.wfile.write(body)

        def _read_json(self) -> dict[str, Any]:
            raw_length = self.headers.get("Content-Length", "0")
            try:
                length = int(raw_length)
            except ValueError as error:
                raise ValueError("invalid_content_length") from error
            if length <= 0 or length > MAX_BODY_BYTES:
                raise ValueError("invalid_body_size")
            try:
                value = json.loads(self.rfile.read(length).decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as error:
                raise ValueError("invalid_json") from error
            if not isinstance(value, dict):
                raise ValueError("json_object_required")
            return value

        def _bearer(self) -> str | None:
            authorization = self.headers.get("Authorization", "")
            prefix = "Bearer "
            if not authorization.startswith(prefix):
                return None
            return authorization[len(prefix) :].strip()

        def _authorized(self) -> bool:
            token = self._bearer()
            return bool(token and agent.state.authorize(token))

        def _require_authorized(self) -> bool:
            if self._authorized():
                return True
            self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
            return False

        def do_OPTIONS(self) -> None:
            self._send_json(HTTPStatus.NO_CONTENT, {})

        def do_GET(self) -> None:
            if self.path == "/health":
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "ok": True,
                        "paired": agent.state.is_paired,
                        "pairingOpen": agent.state.pairing_is_open(),
                    },
                )
                return
            if self.path == "/v1/status":
                if self._require_authorized():
                    self._send_json(HTTPStatus.OK, agent.status())
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})

        def do_POST(self) -> None:
            try:
                if self.path == "/v1/pair":
                    self._pair()
                elif self.path == "/v1/volume":
                    self._volume()
                elif self.path == "/v1/identify":
                    self._identify()
                elif self.path == "/v1/unpair":
                    self._unpair()
                else:
                    self._send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            except ValueError as error:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            except Exception:
                LOGGER.exception("Request failed")
                self._send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {"error": "internal_error"},
                )

        def _pair(self) -> None:
            client = self.client_address[0]
            if not agent.pairing_limiter.allow(client):
                self._send_json(
                    HTTPStatus.TOO_MANY_REQUESTS,
                    {"error": "too_many_attempts"},
                )
                return
            payload = self._read_json()
            code = str(payload.get("code", ""))
            if len(code) != 6 or not code.isdigit():
                raise ValueError("invalid_pairing_code")
            try:
                token = agent.state.pair(code)
            except ValueError as error:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": str(error)})
                return
            self._send_json(
                HTTPStatus.OK,
                {
                    "token": token,
                    "device": {
                        "id": agent.state.device_id,
                        "name": agent.config.name,
                    },
                    "status": agent.status(),
                },
            )

        def _volume(self) -> None:
            if not self._require_authorized():
                return
            payload = self._read_json()
            value = payload.get("volume")
            if isinstance(value, bool) or not isinstance(value, int):
                raise ValueError("volume_must_be_integer")
            agent.set_volume(value)
            self._send_json(HTTPStatus.OK, agent.status())

        def _identify(self) -> None:
            if not self._require_authorized():
                return
            agent.identify()
            self._send_json(HTTPStatus.ACCEPTED, agent.status())

        def _unpair(self) -> None:
            if not self._require_authorized():
                return
            code = agent.state.unpair(agent.config.pairing_window_seconds)
            LOGGER.warning("Device unpaired. New pairing code: %s", code)
            self._send_json(HTTPStatus.OK, {"ok": True})

    return Handler


def serve(agent: CompanionAgent) -> None:
    server = ThreadingHTTPServer(
        (agent.config.host, agent.config.port),
        _handler_for(agent),
    )
    LOGGER.info(
        "Companion agent listening on http://%s:%d",
        agent.config.host,
        agent.config.port,
    )
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
