#!/usr/bin/env python3.11
from __future__ import annotations

import argparse
import asyncio
import ipaddress
import os
import sys
from collections.abc import Sequence

import databases
import httpx

sys.path.insert(0, os.path.abspath(os.pardir))
os.chdir(os.path.abspath(os.pardir))

try:
    import app.settings
    from app.state.services import country_codes
except ModuleNotFoundError:
    print("\x1b[;91mMust run from tools/ directory\x1b[m")
    raise


async def resolve_ip_state(client: httpx.AsyncClient, ip_str: str) -> str | None:
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback:
            return None

        url = f"http://ip-api.com/json/{ip}"
        params = {"fields": "status,message,region"}
        res = await client.get(url, params=params, timeout=5.0)
        if res.status_code != 200:
            return None

        data = res.json()
        if data.get("status") != "success":
            return None

        state_acronym = str(data.get("region", "")).upper().strip()
        if state_acronym in country_codes and state_acronym != "XX":
            return state_acronym

        return None
    except Exception:
        return None


async def main(argv: Sequence[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]

    parser = argparse.ArgumentParser(
        description="Detect and backfill Brazilian state acronyms for users with 'BR' or 'XX'",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate detection without updating the database",
    )
    args = parser.parse_args(argv)

    db = databases.Database(app.settings.DB_DSN)
    await db.connect()

    print("\x1b[1;34m=== Fubika Regional State Backfill Tool ===\x1b[0m")
    if args.dry_run:
        print("\x1b[1;33m[DRY RUN MODE] Nenhuma alteração será gravada no banco.\x1b[0m")

    query = """
        SELECT u.id, u.name, u.country, (
            SELECT l.ip FROM ingame_logins l WHERE l.userid = u.id ORDER BY l.id DESC LIMIT 1
        ) as last_ip
        FROM users u
        WHERE u.country IN ('BR', 'br', 'XX', 'xx')
        ORDER BY u.id ASC
    """

    users = await db.fetch_all(query)
    print(f"Encontrados {len(users)} usuários com país genérico ('BR' ou 'XX').\n")

    fixed_count = 0
    skipped_count = 0

    async with httpx.AsyncClient() as http_client:
        for row in users:
            user_id = row["id"]
            name = row["name"]
            current_country = row["country"]
            last_ip = row["last_ip"]

            if not last_ip:
                print(f"\x1b[90m[IGNORADO]\x1b[0m #{user_id} {name}: Sem registro de IP em ingame_logins.")
                skipped_count += 1
                continue

            detected_state = await resolve_ip_state(http_client, last_ip)

            if detected_state:
                if not args.dry_run:
                    await db.execute(
                        "UPDATE users SET country = :state WHERE id = :id",
                        {"state": detected_state, "id": user_id},
                    )
                print(f"\x1b[92m[SUCESSO]\x1b[0m #{user_id} {name} (IP {last_ip}): {current_country} -> \x1b[1;32m{detected_state}\x1b[0m")
                fixed_count += 1
            else:
                print(f"\x1b[93m[FALLBACK]\x1b[0m #{user_id} {name} (IP {last_ip}): Estado não identificado ou fora do BR (mantido {current_country}).")
                skipped_count += 1

            # Respeitar o rate-limit do ip-api.com (45 reqs/min)
            await asyncio.sleep(1.4)

    await db.disconnect()

    print("\n\x1b[1;32mConcluído!\x1b[0m")
    print(f"Total corrigidos: {fixed_count}")
    print(f"Total inalterados/fallback: {skipped_count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
