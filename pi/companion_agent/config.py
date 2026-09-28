from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AgentConfig:
    host: str
    port: int
    name: str
    state_file: str
    pairing_window_seconds: int
    alsa_control: str
    identify_file: str

    @classmethod
    def from_env(cls) -> "AgentConfig":
        return cls(
            host=os.getenv("PI_COMPANION_HOST", "0.0.0.0"),
            port=int(os.getenv("PI_COMPANION_PORT", "8787")),
            name=os.getenv("PI_COMPANION_NAME", "My Pi Companion"),
            state_file=os.getenv(
                "PI_COMPANION_STATE_FILE",
                "/var/lib/pi-companion/state.json",
            ),
            pairing_window_seconds=int(
                os.getenv("PI_COMPANION_PAIRING_WINDOW_SECONDS", "900")
            ),
            alsa_control=os.getenv("PI_COMPANION_ALSA_CONTROL", "Master"),
            identify_file=os.getenv(
                "PI_COMPANION_IDENTIFY_FILE",
                "/run/pi-companion/identify",
            ),
        )
