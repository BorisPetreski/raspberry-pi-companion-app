from __future__ import annotations

import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from companion_agent.config import AgentConfig
from companion_agent.server import CompanionAgent, PairingLimiter, _handler_for
from companion_agent.state import StateStore


class PairingLimiterTests(unittest.TestCase):
    def test_limiter_rejects_after_allowed_attempts(self) -> None:
        limiter = PairingLimiter(attempts=2, window_seconds=60)
        self.assertTrue(limiter.allow("client"))
        self.assertTrue(limiter.allow("client"))
        self.assertFalse(limiter.allow("client"))
        self.assertTrue(limiter.allow("different-client"))


class ApiContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        root = Path(self.temporary_directory.name)
        self.state = StateStore(str(root / "state.json"))
        self.code = self.state.open_pairing(60)
        config = AgentConfig(
            host="127.0.0.1",
            port=0,
            name="Test Pi",
            state_file=str(root / "state.json"),
            pairing_window_seconds=60,
            alsa_control="Master",
            identify_file=str(root / "identify"),
        )
        self.agent = CompanionAgent(config, self.state)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), _handler_for(self.agent))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.server.server_address
        self.base_url = f"http://{host}:{port}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary_directory.cleanup()

    def request(self, path: str, *, token: str | None = None, body: dict | None = None):
        headers = {"Accept": "application/json"}
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode("utf-8")
        if token:
            headers["Authorization"] = f"Bearer {token}"
        request = Request(self.base_url + path, headers=headers, data=data)
        with urlopen(request, timeout=2) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def test_pair_and_fetch_status_match_app_contract(self) -> None:
        status_code, paired = self.request(
            "/v1/pair",
            body={"code": self.code},
        )
        self.assertEqual(200, status_code)
        self.assertEqual("Test Pi", paired["device"]["name"])
        self.assertIn("token", paired)
        self.assertEqual(paired["device"]["id"], paired["status"]["id"])

        status_code, status = self.request(
            "/v1/status",
            token=paired["token"],
        )
        self.assertEqual(200, status_code)
        self.assertEqual("idle", status["activity"])
        self.assertIn("memoryUsedPercent", status)
        self.assertIn("agentVersion", status)
        self.assertIn("updatedAt", status)

    def test_status_rejects_missing_token(self) -> None:
        with self.assertRaises(HTTPError) as result:
            self.request("/v1/status")
        self.assertEqual(401, result.exception.code)


if __name__ == "__main__":
    unittest.main()
