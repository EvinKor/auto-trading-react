"""
Polling helper to detect signal changes and trigger Web Push.

Run every 5–10 minutes (Task Scheduler / cron):
    python cron_check.py
"""

import json
import os
from typing import Dict

import requests

API = os.getenv("RUN_API", "http://localhost:8000/run?skip_fetch=true")
TRIGGER = os.getenv("TRIGGER_API", "http://localhost:8000/notify/trigger")
STATE = os.getenv("SIGNAL_STATE_FILE", "last_signals.json")


def load_state() -> Dict[str, str]:
    if not os.path.exists(STATE):
        return {}
    with open(STATE, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save_state(state: Dict[str, str]):
    with open(STATE, "w", encoding="utf-8") as fh:
        json.dump(state, fh)


def main():
    previous = load_state()
    response = requests.post(API)
    response.raise_for_status()
    signals = {s["ticker"]: s["signal"] for s in response.json().get("signals", [])}

    changes = []
    for ticker, signal in signals.items():
        prior = previous.get(ticker)
        if prior and prior != signal:
            changes.append({"ticker": ticker, "old": prior, "new": signal})

    save_state(signals)

    if changes:
        requests.post(TRIGGER, json={"changes": changes}).raise_for_status()
        print(f"Triggered pushes for {len(changes)} change(s).")
    else:
        print("No signal changes.")


if __name__ == "__main__":
    main()
