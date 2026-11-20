#!/usr/bin/env python3
"""Lista as portas publicadas de uma saída de `docker compose config --format json`.

Usado pelo `make env-check` para deixar explícito quem expõe porta no host — em
staging e produção só o caddy deve aparecer.
"""
import json
import sys

with open(sys.argv[1], encoding="utf-8") as f:
    cfg = json.load(f)

achou = False
for nome, svc in sorted(cfg.get("services", {}).items()):
    for porta in svc.get("ports") or []:
        achou = True
        ip = porta.get("host_ip") or "0.0.0.0"
        print(
            f"    {nome}: {ip}:{porta.get('published')}"
            f" -> {porta.get('target')}/{porta.get('protocol')}"
        )
if not achou:
    print("    (nenhuma)")
