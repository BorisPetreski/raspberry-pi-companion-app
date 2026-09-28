from __future__ import annotations

import argparse
import logging

from .config import AgentConfig
from .server import CompanionAgent, serve
from .state import StateStore


def main() -> None:
    parser = argparse.ArgumentParser(description="Local Raspberry Pi companion agent")
    parser.add_argument(
        "command",
        nargs="?",
        default="serve",
        choices=("serve", "pairing-code", "unpair"),
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    config = AgentConfig.from_env()
    state = StateStore(config.state_file)

    if args.command == "pairing-code":
        code = state.open_pairing(config.pairing_window_seconds)
        print(code)
        return
    if args.command == "unpair":
        code = state.unpair(config.pairing_window_seconds)
        print(f"Device unpaired. Pairing code: {code}")
        return

    if not state.is_paired:
        code = state.open_pairing(config.pairing_window_seconds)
        logging.warning("Pairing is open. Pairing code: %s", code)

    serve(CompanionAgent(config, state))


if __name__ == "__main__":
    main()
