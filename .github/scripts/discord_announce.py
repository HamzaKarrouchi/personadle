#!/usr/bin/env python3
"""Poste les notes d'une release GitHub sur Discord via un webhook.

Le corps de la release n'est jamais interpole dans du shell ni du YAML :
il transite par un fichier JSON puis par le payload. Pas d'injection possible.
"""
import json
import os
import sys
import urllib.request

WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL")
MENTION = os.environ.get("MENTION_ROLE_ID", "").strip()

if not WEBHOOK:
    sys.exit("❌ Secret DISCORD_WEBHOOK_URL absent du depot.")

with open(sys.argv[1], encoding="utf-8") as fh:
    rel = json.load(fh)

# gh release view renvoie htmlUrl/tagName, le payload d'event html_url/tag_name
title = rel.get("name") or rel.get("tagName") or rel.get("tag_name") or "Nouvelle version"
body = (rel.get("body") or "").strip()
url = rel.get("htmlUrl") or rel.get("html_url") or ""

# Discord plafonne une description d'embed a 4096 caracteres
if len(body) > 3900:
    body = body[:3900].rstrip() + f"\n\n… [lire la suite]({url})"

payload = {
    "embeds": [{
        "title": f"⚡ {title}",
        "description": body or "Voir les notes de version sur GitHub.",
        "url": url,
        "color": 0xE60012,  # rouge Persona 5
        "footer": {"text": "personadle.net"},
    }],
    "allowed_mentions": {"parse": [], "roles": [MENTION] if MENTION else []},
}

if MENTION:
    payload["content"] = f"<@&{MENTION}>"

req = urllib.request.Request(
    WEBHOOK + "?wait=true",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json", "User-Agent": "personadle-release-announcer"},
)
with urllib.request.urlopen(req) as resp:
    print(f"✅ Poste sur Discord (HTTP {resp.status})")
