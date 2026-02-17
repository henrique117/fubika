from __future__ import annotations

import asyncio
import ipaddress
import json
import logging
import pickle
import re
import secrets
import struct
from collections.abc import AsyncGenerator, Mapping, MutableMapping
from pathlib import Path
from typing import Any, TypedDict, Literal

import datadog as datadog_module
import datadog.threadstats.base as datadog_client
import httpx
import pymysql
from redis import asyncio as aioredis
from urllib.parse import unquote

import app.packets
import app.settings
import app.state
from app._typing import IPAddress
from app.adapters.database import Database
from app.logging import Ansi, log

STRANGE_LOG_DIR = Path.cwd() / ".data/logs"
VERSION_RGX = re.compile(r"^# v(?P<ver>\d+\.\d+\.\d+)$")
SQL_UPDATES_FILE = Path.cwd() / "migrations/migrations.sql"

http_client = httpx.AsyncClient()
database = Database(app.settings.DB_DSN)
redis: aioredis.Redis = aioredis.from_url(app.settings.REDIS_DSN)

datadog: datadog_client.ThreadStats | None = None
if str(app.settings.DATADOG_API_KEY) and str(app.settings.DATADOG_APP_KEY):
    datadog_module.initialize(
        api_key=str(app.settings.DATADOG_API_KEY),
        app_key=str(app.settings.DATADOG_APP_KEY),
    )
    datadog = datadog_client.ThreadStats()


country_codes = {
    "ac": 1, "al": 2, "ap": 3, "am": 4, "ba": 5, "ce": 6, "df": 7, "es": 8,
    "go": 9, "ma": 10, "mt": 11, "ms": 12, "mg": 13, "pa": 14, "pb": 15,
    "pr": 16, "pe": 17, "pi": 18, "rj": 19, "rn": 20, "rs": 21, "ro": 22,
    "rr": 23, "sc": 24, "sp": 25, "se": 26, "to": 27,
    "xx": 28 # Fallback para IPs desconhecidos
}

class Country(TypedDict):
    acronym: str
    numeric: int

class Geolocation(TypedDict):
    latitude: float
    longitude: float
    country: Country


class IPResolver:
    def __init__(self) -> None:
        self.cache: MutableMapping[str, IPAddress] = {}

    def get_ip(self, headers: Mapping[str, str]) -> IPAddress:
        """Resolve o endereço IP real considerando Cloudflare, Nginx ou Caddy."""
        ip_str = headers.get("CF-Connecting-IP")
        
        if ip_str is None:
            forwarded = headers.get("X-Forwarded-For")
            if forwarded:
                ip_str = forwarded.split(",")[0].strip()
            else:
                ip_str = headers.get("X-Real-IP")

        if not ip_str:
            return ipaddress.ip_address("127.0.0.1")

        ip = self.cache.get(ip_str)
        if ip is None:
            try:
                ip = ipaddress.ip_address(ip_str)
                self.cache[ip_str] = ip
            except ValueError:
                return ipaddress.ip_address("127.0.0.1")

        return ip

ip_resolver = IPResolver()

async def fetch_geoloc(
    ip: IPAddress, 
    headers: Mapping[str, str] | None = None
) -> Geolocation | None:
    """Detecta a geolocalização priorizando o ESTADO (region) via IP-API."""
    
    if ip.is_private or ip.is_loopback:
        return {
            "latitude": -23.5505, "longitude": -46.6333,
            "country": {"acronym": "sp", "numeric": 25}
        }

    url = f"http://ip-api.com/json/{ip}"
    
    try:
        params = {"fields": "status,message,region,lat,lon"}
        response = await http_client.get(url, params=params, timeout=5.0)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        if data.get("status") != "success":
            log(f"IP-API Error: {data.get('message')} para {ip}", Ansi.LYELLOW)
            return None

        state_acronym = data["region"].lower()
        
        if state_acronym not in country_codes:
            state_acronym = "xx"

        return {
            "latitude": float(data["lat"]),
            "longitude": float(data["lon"]),
            "country": {
                "acronym": state_acronym,
                "numeric": country_codes[state_acronym],
            },
        }
    except Exception as e:
        log(f"Falha ao obter dados geográficos: {e}", Ansi.LRED)
        return None


async def log_strange_occurrence(obj: object) -> None:
    """Registra eventos anômalos no servidor para posterior análise."""
    pickled_obj: bytes = pickle.dumps(obj)
    uploaded = False

    if app.settings.AUTOMATICALLY_REPORT_PROBLEMS:
        try:
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
                log("Log de ocorrência enviado com sucesso.", Ansi.LBLUE)
        except Exception:
            pass

    if not uploaded:
        STRANGE_LOG_DIR.mkdir(parents=True, exist_ok=True)
        while True:
            log_file = STRANGE_LOG_DIR / f"strange_{secrets.token_hex(4)}.db"
            if not log_file.exists():
                break

        log_file.touch(exist_ok=False)
        log_file.write_bytes(pickled_obj)
        log(f"Ocorrência estranha gravada localmente em: {log_file.name}", Ansi.LYELLOW)


class Version:
    def __init__(self, major: int, minor: int, micro: int) -> None:
        self.major = major
        self.minor = minor
        self.micro = micro

    def __repr__(self) -> str: return f"{self.major}.{self.minor}.{self.micro}"
    def __hash__(self) -> int: return self.as_tuple.__hash__()
    def __eq__(self, other: object) -> bool: return isinstance(other, Version) and self.as_tuple == other.as_tuple
    def __lt__(self, other: Version) -> bool: return self.as_tuple < other.as_tuple
    def __le__(self, other: Version) -> bool: return self.as_tuple <= other.as_tuple
    def __gt__(self, other: Version) -> bool: return self.as_tuple > other.as_tuple
    def __ge__(self, other: Version) -> bool: return self.as_tuple >= other.as_tuple

    @property
    def as_tuple(self) -> tuple[int, int, int]:
        return (self.major, self.minor, self.micro)

    @classmethod
    def from_str(cls, s: str) -> Version | None:
        split = s.split(".")
        if len(split) == 3:
            return cls(major=int(split[0]), minor=int(split[1]), micro=int(split[2]))
        return None

async def check_for_dependency_updates() -> None:
    """Verifica se existem atualizações para os módulos Python utilizados."""
    log("📦 Verificando atualizações de dependências...", Ansi.LMAGENTA)
    try:
        with open("requirements.txt") as f:
            for line in f.read().splitlines():
                if "==" in line:
                    name, _, ver = line.partition("==")
                    curr = Version.from_str(ver)
                    if curr:
                        resp = await http_client.get(f"https://pypi.org/pypi/{name}/json")
                        if resp.status_code == 200:
                            latest = Version.from_str(resp.json()["info"]["version"])
                            if latest and latest > curr:
                                log(f"Update disponível: {name} [{curr} -> {latest}]", Ansi.LMAGENTA)
    except Exception:
        pass


async def run_sql_migrations() -> None:
    """Executa scripts SQL pendentes para manter a estrutura do banco atualizada."""
    sw_ver = Version.from_str(app.settings.VERSION)
    if sw_ver is None: return

    res = await database.fetch_one("SELECT ver_major, ver_minor, ver_micro FROM startups ORDER BY datetime DESC LIMIT 1")
    last_ver = Version(res["ver_major"], res["ver_minor"], res["ver_micro"]) if res else None

    if last_ver is None:
        await database.execute("INSERT INTO startups (ver_major, ver_minor, ver_micro, datetime) VALUES (:major, :minor, :micro, NOW())",
                               {"major": sw_ver.major, "minor": sw_ver.minor, "micro": sw_ver.micro})
        return

    if sw_ver == last_ver: return
    if not SQL_UPDATES_FILE.exists(): return

    log(f"🛠️  Atualizando estrutura SQL (v{last_ver} -> v{sw_ver})...", Ansi.LMAGENTA)
    content = SQL_UPDATES_FILE.read_text()
    
    queries = []
    current_update_ver = None
    
    for line in content.splitlines():
        if line.startswith("# v"):
            match = VERSION_RGX.match(line)
            if match: current_update_ver = Version.from_str(match["ver"])
            continue
        
        if current_update_ver and last_ver < current_update_ver <= sw_ver:
            if line.strip() and not line.startswith("--"):
                queries.append(line)

    for query in queries:
        try:
            await database.execute(query)
        except Exception as e:
            log(f"Falha na migração SQL: {e}", Ansi.LRED)
    
    await database.execute("INSERT INTO startups (ver_major, ver_minor, ver_micro, datetime) VALUES (:major, :minor, :micro, NOW())",
                           {"major": sw_ver.major, "minor": sw_ver.minor, "micro": sw_ver.micro})


async def send_ingame_message(user_id: int, message: str) -> None:
    """Envia uma mensagem privada in-game através do Redis."""
    payload = json.dumps({"target_id": user_id, "msg": message})
    await redis.publish("api:notification", payload)
    log(f"Notificação de DM enviada para ID {user_id}", Ansi.LCYAN)

async def trigger_top_score_event(
    score: Any, 
    player_discord_id: str | None = None,
    previous_top_1_id: int | None = None, 
    victim_name: str | None = None, 
    victim_discord_id: str | None = None,
    victim_score: int = 0,
    victim_pp: float = 0.0,
    victim_acc: float = 0.0,
    victim_mods: int = 0
) -> None:
    """Dispara eventos de Snipe ou Rank #1 para o Bot via Redis."""
    try:
        is_snipe = previous_top_1_id is not None and previous_top_1_id != score.player.id
        event_type = "SNIPE" if is_snipe else "TOP_1"

        payload = {
            "type": event_type,
            "data": {
                "beatmap_id": score.bmap.id,
                "beatmap_title": score.bmap.title,
                "beatmap_diff": score.bmap.version,
                "star_rating": float(score.sr) if hasattr(score, 'sr') else float(score.bmap.diff),
                "thumbnail": f"https://b.ppy.sh/thumb/{score.bmap.set_id}l.jpg",
                "player_id": score.player.id,
                "player_name": score.player.name,
                "player_discord_id": player_discord_id,
                "new_score": score.score,
                "new_pp": float(score.pp),
                "new_acc": float(score.acc),
                "new_mods": int(score.mods),
                "victim_id": previous_top_1_id if is_snipe else None,
                "victim_name": victim_name if is_snipe else None,
                "victim_discord_id": victim_discord_id if is_snipe else None,
                "victim_score": victim_score if is_snipe else 0,
                "victim_pp": victim_pp if is_snipe else 0.0,
                "victim_acc": victim_acc if is_snipe else 0.0,
                "victim_mods": victim_mods if is_snipe else 0,
                "mode": int(score.mode)
            }
        }
        await redis.publish("fubika:notifications", json.dumps(payload))
        log(f"🚀 [Redis] Snipe detectado! {score.player.name} vs {victim_name}", Ansi.LBLUE)
    except Exception as e:
        log(f"❌ [Redis Error] Snipe notification failed: {e}", Ansi.LRED)

async def run_redis_listener() -> None:
    """Worker que escuta o Redis e entrega pacotes para os jogadores online."""
    import app.state.sessions as sessions
    log("📡 Ouvinte Pub/Sub do Redis para DMs iniciado.", Ansi.LMAGENTA)

    async with redis.pubsub() as pubsub:
        await pubsub.subscribe("api:notification")
        async for message in pubsub.listen():
            if message["type"] != "message": continue
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
                    log(f"💬 [Redis] DM do Bot entregue a {player.name}", Ansi.LGREEN)
            except Exception as e:
                log(f"⚠️ Erro ao processar mensagem Redis: {e}", Ansi.LYELLOW)