"""
Web Push helpers and routes for the Bursa FastAPI service.

Usage:
    from fastapi import FastAPI
    from push import router, register_push_routes

    app = FastAPI()
    # keep existing routes intact
    register_push_routes(app)
"""

import json
import os
from typing import List

from fastapi import APIRouter, FastAPI
from pydantic import BaseModel
from pywebpush import WebPushException, webpush

VAPID_PUBLIC = os.getenv("VAPID_PUBLIC", "CHANGE_ME")
VAPID_PRIVATE = os.getenv("VAPID_PRIVATE", "CHANGE_ME")
CONTACT = os.getenv("VAPID_CONTACT", "mailto:you@example.com")
SUB_FILE = os.getenv("SUBSCRIPTIONS_FILE", "subscriptions.json")


class Subscription(BaseModel):
    endpoint: str
    keys: dict


def load_subs() -> List[dict]:
    if not os.path.exists(SUB_FILE):
        return []
    with open(SUB_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save_subs(subs: List[dict]):
    with open(SUB_FILE, "w", encoding="utf-8") as fh:
        json.dump(subs, fh)


def push_all(payload: dict):
    subs = load_subs()
    for sub in subs:
        try:
            webpush(
                subscription_info=sub,
                data=json.dumps(payload),
                vapid_private_key=VAPID_PRIVATE,
                vapid_claims={"sub": CONTACT},
                ttl=60,
            )
        except WebPushException as exc:
            # Keep going even if one subscription is invalid
            print("Push failed:", exc)


def notify_signal_change(changes: List[dict]):
    if not changes:
        return
    title = "Bursa signal change"
    body = "; ".join([f"{c['ticker']}: {c['old']}→{c['new']}" for c in changes])
    push_all({"title": title, "body": body})


router = APIRouter()


@router.post("/notify/subscribe")
def add_subscription(sub: Subscription):
    subs = load_subs()
    if sub.model_dump() not in subs:
        subs.append(sub.model_dump())
        save_subs(subs)
    return {"ok": True, "count": len(subs)}


@router.post("/notify/trigger")
def trigger(body: dict):
    changes = body.get("changes", [])
    notify_signal_change(changes)
    return {"sent": len(changes)}


def register_push_routes(app: FastAPI):
    """Attach push endpoints to an existing FastAPI app."""
    app.include_router(router)
