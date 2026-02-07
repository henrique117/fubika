from __future__ import annotations

import ipaddress
import logging
import pickle
import re
import secrets
from collections.abc import AsyncGenerator
from collections.abc import Mapping
from collections.abc import MutableMapping
from pathlib import Path
from typing import TypedDict

import asyncio
import json

import datadog as datadog_module
import datadog.threadstats.base as datadog_client
import httpx
import pymysql
from redis import asyncio as aioredis

import app.packets
import app.settings
import app.state
from app._typing import IPAddress
from app.adapters.database import Database
from app.logging import Ansi
from app.logging import log

STRANGE_LOG_DIR = Path.cwd() / ".data/logs"

VERSION_RGX = re.compile(r"^# v(?P<ver>\d+\.\d+\.\d+)$")
SQL_UPDATES_FILE = Path.cwd() / "migrations/migrations.sql"


""" session objects """

http_client = httpx.AsyncClient()
database = Database(app.settings.DB_DSN)
redis: aioredis.Redis = aioredis.from_url(app.settings.REDIS_DSN)  # type: ignore[no-untyped-call]

datadog: datadog_client.ThreadStats | None = None
if str(app.settings.DATADOG_API_KEY) and str(app.settings.DATADOG_APP_KEY):
    datadog_module.initialize(
        api_key=str(app.settings.DATADOG_API_KEY),
        app_key=str(app.settings.DATADOG_APP_KEY),
    )
    datadog = datadog_client.ThreadStats()  # type: ignore[no-untyped-call]

ip_resolver: IPResolver

""" session usecases """


class Country(TypedDict):
    acronym: str
    numeric: int


class Geolocation(TypedDict):
    latitude: float
    longitude: float
    country: Country


# fmt: off
# Substituí a lista de países colocando os estados BR no lugar
country_codes = {
    "ac": 1, "al": 2, "ap": 3, "am": 4, "ba": 5, "ce": 6, "df": 7, "es": 8,
    "go": 9, "ma": 10, "mt": 11, "ms": 12, "mg": 13, "pa": 14, "pb": 15,
    "pr": 16, "pe": 17, "pi": 18, "rj": 19, "rn": 20, "rs": 21, "ro": 22,
    "rr": 23, "sc": 24, "sp": 25, "se": 26, "to": 27,
    # Fallback se der algum problema:
    "xx": 28 
}
# fmt: on


class IPResolver:
    def __init__(self) -> None:
        self.cache: MutableMapping[str, IPAddress] = {}

    def get_ip(self, headers: Mapping[str, str]) -> IPAddress:
        """Resolve the IP address from the headers."""
        ip_str = headers.get("CF-Connecting-IP")
        if ip_str is None:
            forwards = headers["X-Forwarded-For"].split(",")

            if len(forwards) != 1:
                ip_str = forwards[0]
            else:
                ip_str = headers["X-Real-IP"]

        ip = self.cache.get(ip_str)
        if ip is None:
            ip = ipaddress.ip_address(ip_str)
            self.cache[ip_str] = ip

        return ip


async def fetch_geoloc(
    ip: IPAddress,
    headers: Mapping[str, str] | None = None,
) -> Geolocation | None:
    """Attempt to fetch geolocation data by any means necessary."""
    geoloc = None
    if headers is not None:
        geoloc = _fetch_geoloc_from_headers(headers)

    if geoloc is None:
        geoloc = await _fetch_geoloc_from_ip(ip)

    return geoloc


def _fetch_geoloc_from_headers(headers: Mapping[str, str]) -> Geolocation | None:
    """Attempt to fetch geolocation data from http headers."""
    geoloc = __fetch_geoloc_cloudflare(headers)

    if geoloc is None:
        geoloc = __fetch_geoloc_nginx(headers)

    return geoloc


def __fetch_geoloc_cloudflare(headers: Mapping[str, str]) -> Geolocation | None:
    """Attempt to fetch geolocation data from cloudflare headers."""

    """
    Tô tentando ignorar a geolocalização da Cloudflare pra ela não retornar 'BR'
    e tentando puxar o Estado específico via API.
    """
    return None
#    if not all(
#        key in headers for key in ("CF-IPCountry", "CF-IPLatitude", "CF-IPLongitude")
#    ):
#        return None

    country_code = headers["CF-IPCountry"].lower()
    latitude = float(headers["CF-IPLatitude"])
    longitude = float(headers["CF-IPLongitude"])

    return {
        "latitude": latitude,
        "longitude": longitude,
        "country": {
            "acronym": country_code,
            "numeric": country_codes[country_code],
        },
    }


def __fetch_geoloc_nginx(headers: Mapping[str, str]) -> Geolocation | None:
    """Attempt to fetch geolocation data from nginx headers."""
    if not all(
        key in headers for key in ("X-Country-Code", "X-Latitude", "X-Longitude")
    ):
        return None

    country_code = headers["X-Country-Code"].lower()
    latitude = float(headers["X-Latitude"])
    longitude = float(headers["X-Longitude"])

    return {
        "latitude": latitude,
        "longitude": longitude,
        "country": {
            "acronym": country_code,
            "numeric": country_codes[country_code],
        },
    }


async def _fetch_geoloc_from_ip(ip: IPAddress) -> Geolocation | None:
    """Fetch geolocation data based on ip (using ip-api)."""
    if not ip.is_private:
        url = f"http://ip-api.com/line/{ip}"
    else:
        url = "http://ip-api.com/line/"

    response = await http_client.get(
        url,
        params={
            #"fields": ",".join(("status", "message", "countryCode", "lat", "lon")),

            #O Parâmetro acima comentado pega o "countryCode" (País), vou tentar mudar pra "region" (estado)
            "fields": ",".join(("status", "message", "region", "lat", "lon")),
        },
    )
    if response.status_code != 200:
        log("Failed to get geoloc data: request failed.", Ansi.LRED)
        return None

    status, *lines = response.read().decode().split("\n")

    if status != "success":
        err_msg = lines[0]
        if err_msg == "invalid query":
            err_msg += f" ({url})"

        log(f"Failed to get geoloc data: {err_msg} for ip {ip}.", Ansi.LRED)
        return None

    country_acronym = lines[0].lower()

    return {
        "latitude": float(lines[1]),
        "longitude": float(lines[2]),
        "country": {
            "acronym": country_acronym,
            "numeric": country_codes[country_acronym],
        },
    }


async def log_strange_occurrence(obj: object) -> None:
    pickled_obj: bytes = pickle.dumps(obj)
    uploaded = False

    if app.settings.AUTOMATICALLY_REPORT_PROBLEMS:
        # automatically reporting problems to cmyui's server
        response = await http_client.post(
            url="https://log.cmyui.xyz/",
            headers={
                "Bancho-Version": app.settings.VERSION,
                "Bancho-Domain": app.settings.DOMAIN,
            },
            content=pickled_obj,
        )
        if response.status_code == 200 and response.read() == b"ok":
            uploaded = True
            log(
                "Logged strange occurrence to cmyui's server. "
                "Thank you for your participation! <3",
                Ansi.LBLUE,
            )
        else:
            log(
                f"Autoupload to cmyui's server failed (HTTP {response.status_code})",
                Ansi.LRED,
            )

    if not uploaded:
        # log to a file locally, and prompt the user
        while True:
            log_file = STRANGE_LOG_DIR / f"strange_{secrets.token_hex(4)}.db"
            if not log_file.exists():
                break

        log_file.touch(exist_ok=False)
        log_file.write_bytes(pickled_obj)

        log(
            "Logged strange occurrence to" + "/".join(log_file.parts[-4:]),
            Ansi.LYELLOW,
        )
        log(
            "It would be greatly appreciated if you could forward this to the "
            "bancho.py development team. To do so, please email josh@akatsuki.gg",
            Ansi.LYELLOW,
        )


# dependency management


class Version:
    def __init__(self, major: int, minor: int, micro: int) -> None:
        self.major = major
        self.minor = minor
        self.micro = micro

    def __repr__(self) -> str:
        return f"{self.major}.{self.minor}.{self.micro}"

    def __hash__(self) -> int:
        return self.as_tuple.__hash__()

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Version):
            return NotImplemented

        return self.as_tuple == other.as_tuple

    def __lt__(self, other: Version) -> bool:
        return self.as_tuple < other.as_tuple

    def __le__(self, other: Version) -> bool:
        return self.as_tuple <= other.as_tuple

    def __gt__(self, other: Version) -> bool:
        return self.as_tuple > other.as_tuple

    def __ge__(self, other: Version) -> bool:
        return self.as_tuple >= other.as_tuple

    @property
    def as_tuple(self) -> tuple[int, int, int]:
        return (self.major, self.minor, self.micro)

    @classmethod
    def from_str(cls, s: str) -> Version | None:
        split = s.split(".")
        if len(split) == 3:
            return cls(
                major=int(split[0]),
                minor=int(split[1]),
                micro=int(split[2]),
            )

        return None


async def _get_latest_dependency_versions() -> AsyncGenerator[
    tuple[str, Version, Version],
    None,
]:
    """Return the current installed & latest version for each dependency."""
    with open("requirements.txt") as f:
        dependencies = f.read().splitlines(keepends=False)

    # TODO: use asyncio.gather() to do all requests at once? or chunk them

    for dependency in dependencies:
        dependency_name, _, dependency_ver = dependency.partition("==")
        current_ver = Version.from_str(dependency_ver)

        if not current_ver:
            # the module uses some more advanced (and often hard to parse)
            # versioning system, so we won't be able to report updates.
            continue

        # TODO: split up and do the requests asynchronously
        url = f"https://pypi.org/pypi/{dependency_name}/json"
        response = await http_client.get(url)
        json = response.json()

        if response.status_code == 200 and json:
            latest_ver = Version.from_str(json["info"]["version"])

            if not latest_ver:
                # they've started using a more advanced versioning system.
                continue

            yield (dependency_name, latest_ver, current_ver)
        else:
            yield (dependency_name, current_ver, current_ver)


async def check_for_dependency_updates() -> None:
    """Notify the developer of any dependency updates available."""
    updates_available = False

    async for module, current_ver, latest_ver in _get_latest_dependency_versions():
        if latest_ver > current_ver:
            updates_available = True
            log(
                f"{module} has an update available "
                f"[{current_ver!r} -> {latest_ver!r}]",
                Ansi.LMAGENTA,
            )

    if updates_available:
        log(
            "Python modules can be updated with "
            "`python3.11 -m pip install -U <modules>`.",
            Ansi.LMAGENTA,
        )


# sql migrations


async def _get_current_sql_structure_version() -> Version | None:
    """Get the last launched version of the server."""
    res = await app.state.services.database.fetch_one(
        "SELECT ver_major, ver_minor, ver_micro "
        "FROM startups ORDER BY datetime DESC LIMIT 1",
    )

    if res:
        return Version(res["ver_major"], res["ver_minor"], res["ver_micro"])

    return None


async def run_sql_migrations() -> None:
    """Update the sql structure, if it has changed."""
    software_version = Version.from_str(app.settings.VERSION)
    if software_version is None:
        raise RuntimeError(f"Invalid bancho.py version '{app.settings.VERSION}'")

    last_run_migration_version = await _get_current_sql_structure_version()
    if not last_run_migration_version:
        # Migrations have never run before - this is the first time starting the server.
        # We'll insert the current version into the database, so future versions know to migrate.
        await app.state.services.database.execute(
            "INSERT INTO startups (ver_major, ver_minor, ver_micro, datetime) "
            "VALUES (:major, :minor, :micro, NOW())",
            {
                "major": software_version.major,
                "minor": software_version.minor,
                "micro": software_version.micro,
            },
        )
        return  # already up to date (server has never run before)

    if software_version == last_run_migration_version:
        return  # already up to date

    # version changed; there may be sql changes.
    content = SQL_UPDATES_FILE.read_text()

    queries: list[str] = []
    q_lines: list[str] = []

    update_ver = None

    for line in content.splitlines():
        if not line:
            continue

        if line.startswith("#"):
            # may be normal comment or new version
            r_match = VERSION_RGX.fullmatch(line)
            if r_match:
                update_ver = Version.from_str(r_match["ver"])

            continue
        elif not update_ver:
            continue

        # we only need the updates between the
        # previous and new version of the server.
        if last_run_migration_version < update_ver <= software_version:
            if line.endswith(";"):
                if q_lines:
                    q_lines.append(line)
                    queries.append(" ".join(q_lines))
                    q_lines = []
                else:
                    queries.append(line)
            else:
                q_lines.append(line)

    if queries:
        log(
            f"Updating mysql structure (v{last_run_migration_version!r} -> v{software_version!r}).",
            Ansi.LMAGENTA,
        )

    # XXX: we can't use a transaction here with mysql as structural changes to
    # tables implicitly commit: https://dev.mysql.com/doc/refman/5.7/en/implicit-commit.html
    for query in queries:
        try:
            await app.state.services.database.execute(query)
        except pymysql.err.MySQLError as exc:
            log(f"Failed: {query}", Ansi.GRAY)
            log(repr(exc))
            log(
                "SQL failed to update - unless you've been "
                "modifying sql and know what caused this, "
                "please contact @cmyui on Discord.",
                Ansi.LRED,
            )
            raise KeyboardInterrupt from exc
    else:
        # all queries executed successfully
        await app.state.services.database.execute(
            "INSERT INTO startups (ver_major, ver_minor, ver_micro, datetime) "
            "VALUES (:major, :minor, :micro, NOW())",
            {
                "major": software_version.major,
                "minor": software_version.minor,
                "micro": software_version.micro,
            },
        )

""" redis usecases """

async def send_ingame_message(user_id: int, message: str) -> None:
    """Envia uma mensagem para o Redis, para ser entregue in-game."""
    payload = json.dumps({
        "target_id": user_id,
        "msg": message
    })
    await redis.publish("api:notification", payload)
    log(f"Enviado pedido de notificação para ID {user_id}", Ansi.LCYAN)


async def run_redis_listener() -> None:
    """
    Serviço que fica escutando o canal 'api:notification' do Redis
    e entrega as mensagens para os jogadores online.
    """
    import app.state.sessions as sessions

    log("Iniciando ouvinte do Redis (Pub/Sub)...", Ansi.LMAGENTA)

    async with redis.pubsub() as pubsub:
        await pubsub.subscribe("api:notification")

        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                data = json.loads(message["data"])
                target_id = int(data["target_id"])
                msg_content = data["msg"]

                player = sessions.players.get(id=target_id)

                if player:
                    bot = sessions.bot

                    packet = app.packets.send_message(
                        sender=bot.name,
                        msg=msg_content,
                        recipient=player.name, 
                        sender_id=bot.id,
                    )

                    player.enqueue(packet)
                    
                    log(f"[Redis] DM enviada de {bot.name} para {player.name}", Ansi.LGREEN)
                else:
                    pass

            except Exception as e:
                log(f"[Redis Error] Falha ao processar mensagem: {e}", Ansi.LRED)