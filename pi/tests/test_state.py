from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from companion_agent.state import StateStore


class StateStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.path = Path(self.temporary_directory.name) / "state.json"
        self.state = StateStore(str(self.path))

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_pairing_stores_only_hashes(self) -> None:
        code = self.state.open_pairing(60)
        token = self.state.pair(code)

        raw_state = self.path.read_text(encoding="utf-8")
        self.assertNotIn(code, raw_state)
        self.assertNotIn(token, raw_state)
        self.assertTrue(self.state.authorize(token))
        self.assertFalse(self.state.authorize("wrong-token"))
        self.assertTrue(self.state.is_paired)

    def test_invalid_code_does_not_pair(self) -> None:
        self.state.open_pairing(60)

        with self.assertRaisesRegex(ValueError, "invalid_pairing_code"):
            self.state.pair("999999")

        self.assertFalse(self.state.is_paired)
        self.assertTrue(self.state.pairing_is_open())

    def test_unpair_invalidates_existing_token(self) -> None:
        code = self.state.open_pairing(60)
        token = self.state.pair(code)

        next_code = self.state.unpair(60)

        self.assertFalse(self.state.authorize(token))
        self.assertFalse(self.state.is_paired)
        self.assertEqual(6, len(next_code))
        self.assertTrue(next_code.isdigit())

    def test_volume_must_be_in_range(self) -> None:
        self.state.set_volume(73)
        self.assertEqual(73, self.state.volume)
        self.assertTrue(self.state.volume_applied)
        self.state.set_volume(48, applied=False)
        self.assertFalse(self.state.volume_applied)
        with self.assertRaisesRegex(ValueError, "volume_out_of_range"):
            self.state.set_volume(101)


if __name__ == "__main__":
    unittest.main()
