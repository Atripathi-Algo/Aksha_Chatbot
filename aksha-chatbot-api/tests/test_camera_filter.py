"""
Camera-name filter regression check — app/formatter.py's `_matches_camera_filter`.

Same rationale as tests/test_router_regressions.py for why this is a plain
script rather than a pytest suite (no test dependency installed in this
project). Unlike the router cases, this is pure deterministic logic with no
LLM call involved, so it runs instantly and every case must pass, always —
there's no flakiness allowance here.

    python3 -m tests.test_camera_filter        # from aksha-chatbot-api/

Every case here traces back to a real bug found live in this project, or is
a baseline guarding against reintroducing it.
"""

import sys

sys.path.insert(0, ".")

from app.formatter import _matches_camera_filter  # noqa: E402

# (name, camera_filter, expected, why this case exists)
CASES = [
    # Found live 2026-09-04, fix #1: the operator's phrasing doesn't line up
    # character-for-character with the real Camera_Name.
    ("cam1-Gate-Camera", ["gate camera"], True,
     "operator phrasing vs. real hyphenated Camera_Name must still match"),
    ("cam1-Gate-Camera", ["cam1"], True,
     "a short alias the operator used must match the full real name"),

    # Found live 2026-09-04, fix #2: fix #1's raw-substring approach over-matched.
    ("cam11", ["cam1"], False,
     "cam1 is a character-substring of cam11 but a different camera — must NOT match"),
    ("cam1", ["cam11"], False,
     "same bug, reversed direction"),
    ("cam1", ["cam1"], True,
     "exact same camera must still match after the token-based fix"),

    # Baseline correctness — must not regress into wrongly matching or
    # wrongly excluding once the token-based comparison is in place.
    ("cam3", ["cam1-Gate-Camera"], False,
     "unrelated camera must not match"),
    ("Perimeter Group", ["cam1"], False,
     "no shared tokens at all must not match"),
]


def main() -> int:
    failures = []

    for name, camera_filter, expected, note in CASES:
        got = _matches_camera_filter(name, camera_filter)
        ok = got == expected
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] _matches_camera_filter({name!r}, {camera_filter!r}) -> {got} (expected {expected}) — {note}")
        if not ok:
            failures.append((name, camera_filter, expected, got))

    # No camera_filter at all means "show everything" — must always match.
    no_filter_ok = _matches_camera_filter("cam3", None) is True and _matches_camera_filter("cam3", []) is True
    print(f"[{'PASS' if no_filter_ok else 'FAIL'}] no camera_filter (None or []) always matches")
    if not no_filter_ok:
        failures.append(("cam3", None, True, False))

    print(f"\n{len(CASES) + 1 - len(failures)}/{len(CASES) + 1} passed")
    if failures:
        print("\nFailed:")
        for name, camera_filter, expected, got in failures:
            print(f"  _matches_camera_filter({name!r}, {camera_filter!r}): expected {expected}, got {got}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
