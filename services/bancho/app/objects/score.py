from __future__ import annotations

import asyncio
import functools
import hashlib
from datetime import datetime
from enum import IntEnum
from enum import unique
from pathlib import Path
from typing import TYPE_CHECKING, Any

import app.state
import app.usecases.performance
import app.utils
from app.constants.clientflags import ClientFlags
from app.constants.gamemodes import GameMode
from app.constants.mods import Mods
from app.objects.beatmap import Beatmap
from app.repositories import scores as scores_repo
from app.usecases.performance import ScoreParams
from app.logging import log
from app.logging import Ansi
from app.utils import escape_enum
from app.utils import pymysql_encode

if TYPE_CHECKING:
    from app.objects.player import Player

BEATMAPS_PATH = Path.cwd() / ".data/osu"


@unique
class Grade(IntEnum):
    # NOTE: these are implemented in the opposite order
    # as osu! to make more sense with <> operators.
    N = 0
    F = 1
    D = 2
    C = 3
    B = 4
    A = 5
    S = 6  # S
    SH = 7  # HD S
    X = 8  # SS
    XH = 9  # HD SS

    @classmethod
    @functools.cache
    def from_str(cls, s: str) -> Grade:
        return {
            "xh": Grade.XH,
            "x": Grade.X,
            "sh": Grade.SH,
            "s": Grade.S,
            "a": Grade.A,
            "b": Grade.B,
            "c": Grade.C,
            "d": Grade.D,
            "f": Grade.F,
            "n": Grade.N,
        }[s.lower()]

    def __format__(self, format_spec: str) -> str:
        if format_spec == "stats_column":
            return f"{self.name.lower()}_count"
        else:
            raise ValueError(f"Invalid format specifier {format_spec}")


@unique
@pymysql_encode(escape_enum)
class SubmissionStatus(IntEnum):
    # TODO: make a system more like bancho's?
    FAILED = 0
    SUBMITTED = 1
    BEST = 2
    BEST_V2 = 3

    def __repr__(self) -> str:
        return {
            self.FAILED: "Failed",
            self.SUBMITTED: "Submitted",
            self.BEST: "Best",
            self.BEST_V2: "Best V2"
        }[self]


class Score:
    """\
    Server side representation of an osu! score; any gamemode.

    Possibly confusing attributes
    -----------
    bmap: `Beatmap | None`
        A beatmap obj representing the osu map.

    player: `Player | None`
        A player obj of the player who submitted the score.

    grade: `Grade`
        The letter grade in the score.

    rank: `int`
        The leaderboard placement of the score.

    perfect: `bool`
        Whether the score is a full-combo.

    time_elapsed: `int`
        The total elapsed time of the play (in milliseconds).

    client_flags: `int`
        osu!'s old anticheat flags.

    prev_best: `Score | None`
        The previous best score before this play was submitted.
        NOTE: just because a score has a `prev_best` attribute does
        mean the score is our best score on the map! the `status`
        value will always be accurate for any score.
    """

    def __init__(self) -> None:
        # TODO: check whether the reamining Optional's should be
        self.id: int | None = None
        self.bmap: Beatmap | None = None
        self.player: Player | None = None

        self.mode: GameMode
        self.mods: Mods

        self.pp: float
        self.sr: float
        self.score: int
        self.max_combo: int
        self.acc: float

        # TODO: perhaps abstract these differently
        # since they're mode dependant? feels weird..
        self.n300: int
        self.n100: int  # n150 for taiko
        self.n50: int
        self.nmiss: int
        self.ngeki: int
        self.nkatu: int

        self.grade: Grade

        self.passed: bool
        self.perfect: bool
        self.status: SubmissionStatus

        self.client_time: datetime
        self.server_time: datetime
        self.time_elapsed: int

        self.client_flags: ClientFlags
        self.client_checksum: str

        self.rank: int | None = None
        self.prev_best: Score | None = None

    def __repr__(self) -> str:
        # TODO: i really need to clean up my reprs
        try:
            assert self.bmap is not None
            return (
                f"<{self.acc:.2f}% {self.max_combo}x {self.nmiss}M "
                f"#{self.rank} on {self.bmap.full_name} for {self.pp:,.2f}pp>"
            )
        except:
            return super().__repr__()

    """Classmethods to fetch a score object from various data types."""

    @classmethod
    async def from_sql(cls, score_id: int) -> Score | None:
        """Create a score object from sql using its scoreid."""
        rec = await scores_repo.fetch_one(score_id)

        if rec is None:
            return None

        s = cls()

        s.id = rec["id"]
        s.bmap = await Beatmap.from_md5(rec["map_md5"])
        s.player = await app.state.sessions.players.from_cache_or_sql(id=rec["userid"])

        s.sr = 0.0  # TODO

        s.pp = rec["pp"]
        s.score = rec["score"]
        s.max_combo = rec["max_combo"]
        s.mods = Mods(rec["mods"])
        s.acc = rec["acc"]
        s.n300 = rec["n300"]
        s.n100 = rec["n100"]
        s.n50 = rec["n50"]
        s.nmiss = rec["nmiss"]
        s.ngeki = rec["ngeki"]
        s.nkatu = rec["nkatu"]
        s.grade = Grade.from_str(rec["grade"])
        s.perfect = rec["perfect"] == 1
        s.status = SubmissionStatus(rec["status"])
        s.passed = s.status != SubmissionStatus.FAILED
        s.mode = GameMode(rec["mode"])
        s.server_time = rec["play_time"]
        s.time_elapsed = rec["time_elapsed"]
        s.client_flags = ClientFlags(rec["client_flags"])
        s.client_checksum = rec["online_checksum"]

        if s.bmap:
            s.rank = await s.calculate_placement()

        return s

    @classmethod
    def from_submission(cls, data: list[str]) -> Score:
        """Create a score object from an osu! submission string."""
        s = cls()

        """ parse the following format
        # 0  online_checksum
        # 1  n300
        # 2  n100
        # 3  n50
        # 4  ngeki
        # 5  nkatu
        # 6  nmiss
        # 7  score
        # 8  max_combo
        # 9  perfect
        # 10 grade
        # 11 mods
        # 12 passed
        # 13 gamemode
        # 14 play_time # yyMMddHHmmss
        # 15 osu_version + (" " * client_flags)
        """

        s.client_checksum = data[0]
        s.n300 = int(data[1])
        s.n100 = int(data[2])
        s.n50 = int(data[3])
        s.ngeki = int(data[4])
        s.nkatu = int(data[5])
        s.nmiss = int(data[6])
        s.score = int(data[7])
        s.max_combo = int(data[8])
        s.perfect = data[9] == "True"
        s.grade = Grade.from_str(data[10])
        s.mods = Mods(int(data[11]))
        s.passed = data[12] == "True"
        s.mode = GameMode.from_params(int(data[13]), s.mods)
        s.client_time = datetime.strptime(data[14], "%y%m%d%H%M%S")
        s.client_flags = ClientFlags(data[15].count(" ") & ~4)

        s.server_time = datetime.now()

        return s

    def compute_online_checksum(
        self,
        osu_version: str,
        osu_client_hash: str,
        storyboard_checksum: str,
    ) -> str:
        """Validate the online checksum of the score."""
        assert self.player is not None
        assert self.bmap is not None

        return hashlib.md5(
            "chickenmcnuggets{0}o15{1}{2}smustard{3}{4}uu{5}{6}{7}{8}{9}{10}{11}Q{12}{13}{15}{14:%y%m%d%H%M%S}{16}{17}".format(
                self.n100 + self.n300,
                self.n50,
                self.ngeki,
                self.nkatu,
                self.nmiss,
                self.bmap.md5,
                self.max_combo,
                self.perfect,
                self.player.name,
                self.score,
                self.grade.name,
                int(self.mods),
                self.passed,
                self.mode.as_vanilla,
                self.client_time,
                osu_version,
                osu_client_hash,
                storyboard_checksum,
            ).encode(),
        ).hexdigest()

    """Methods to calculate internal data for a score."""

    async def calculate_placement(self) -> int:
        """Calcula a posição no ranking e dispara o trigger de Snipe/Top1."""
        if not self.bmap:
            return 0

        try:
            SCORE_V2_BIT = 536870912
            am_i_v2 = (self.mods & SCORE_V2_BIT) != 0

            # Para mapas Unranked (status < 2), PP geralmente é 0. 
            # Forçamos a métrica 'score' para mapas que não dão PP.
            if self.mode >= GameMode.RELAX_OSU and self.bmap.status == 2:
                scoring_metric = "pp"
                score_val = float(self.pp)
            else:
                scoring_metric = "score" 
                score_val = int(self.score)

            # REMOVIDO: AND s.status IN (2, 3) para aceitar qualquer mapa
            query = [
                f"SELECT COUNT(*) FROM scores s ",
                "INNER JOIN users u ON u.id = s.userid ",
                "WHERE s.map_md5 = :map_md5 AND s.mode = :mode AND s.grade != 'F' ",
                "AND u.priv & 1 ",
                f"AND s.{scoring_metric} > :score "
            ]
            
            params = {
                "map_md5": self.bmap.md5,
                "mode": int(self.mode),
                "score": score_val,
                "v2_mod": SCORE_V2_BIT
            }

            if am_i_v2:
                query.append("AND (s.mods & :v2_mod) != 0")
            else:
                query.append("AND (s.mods & :v2_mod) = 0")

            full_query = "".join(query)

            res = await app.state.services.database.fetch_val(full_query, params)
            num_better_scores = int(res) if res is not None else 0
            
            placement = num_better_scores + 1
            
            log(f"[Rank] {self.player.name} pegou #{placement} no mapa {self.bmap.id}", Ansi.LBLUE)

            if placement == 1 and self.grade != 'F':
                # Dispara a lógica de Snipe para QUALQUER mapa agora
                asyncio.create_task(self.process_top_score_logic(am_i_v2, scoring_metric, SCORE_V2_BIT))

            return placement

        except Exception as e:
            log(f"Erro crítico no calculate_placement: {str(e)}", Ansi.LRED)
            return 0

    async def process_top_score_logic(self, am_i_v2: bool, metric: str, v2_bit: int):
        """Busca a vítima e envia os dados para o Bot via Redis."""
        try:
            v2_op = "!=" if am_i_v2 else "="
            
            # REMOVIDO: AND s.status IN (2, 3)
            victim_query = f"""
                SELECT s.userid, u.name, u.discord_id, s.pp, s.score, s.acc, s.mods
                FROM scores s
                JOIN users u ON u.id = s.userid
                WHERE s.map_md5 = :map_md5 AND s.mode = :mode AND s.grade != 'F'
                AND (s.mods & :v2_mod) {v2_op} 0
                AND s.userid != :current_user
                ORDER BY s.{metric} DESC LIMIT 1
            """
            
            victim = await app.state.services.database.fetch_one(
                victim_query,
                {
                    "map_md5": self.bmap.md5,
                    "mode": int(self.mode),
                    "v2_mod": v2_bit,
                    "current_user": self.player.id
                }
            )

            # Garantimos que passamos o discord_id do player atual (atacante)
            # Se o objeto player não tiver discord_id carregado, tentamos buscar no banco ou enviamos None
            player_discord_id = getattr(self.player, 'discord_id', None)
            if not player_discord_id:
                # Busca rápida no banco caso o objeto em memória esteja incompleto
                player_discord_id = await app.state.services.database.fetch_val(
                    "SELECT discord_id FROM users WHERE id = :id", {"id": self.player.id}
                )

            await app.state.services.trigger_top_score_event(
                score=self,
                player_discord_id=player_discord_id,
                previous_top_1_id=victim["userid"] if victim else None,
                victim_name=victim["name"] if victim else None,
                victim_discord_id=victim["discord_id"] if victim else None,
                victim_score=victim["score"] if victim else 0,
                victim_pp=float(victim["pp"]) if victim else 0.0,
                victim_acc=float(victim["acc"]) if victim else 0.0,
                victim_mods=int(victim["mods"]) if victim else 0
            )

        except Exception as e:
            log(f"Falha ao processar anúncio de Top 1: {e}", Ansi.LRED)

    def calculate_performance(self, beatmap_id: int) -> tuple[float, float]:
        """Calculate PP and star rating for our score."""
        mode_vn = self.mode.as_vanilla

        score_args = ScoreParams(
            mode=mode_vn,
            mods=int(self.mods),
            combo=self.max_combo,
            ngeki=self.ngeki,
            n300=self.n300,
            nkatu=self.nkatu,
            n100=self.n100,
            n50=self.n50,
            nmiss=self.nmiss,
        )

        result = app.usecases.performance.calculate_performances(
            osu_file_path=str(BEATMAPS_PATH / f"{beatmap_id}.osu"),
            scores=[score_args],
        )

        pp = result[0]["performance"]["pp"]
        stars = result[0]["difficulty"]["stars"]

        return pp, stars

    async def calculate_status(self) -> None:
        """Calculate the submission status of a submitted score with V1/V2 separation."""
        assert self.player is not None
        assert self.bmap is not None

        if self.bmap.status < 0:
            self.status = SubmissionStatus.SUBMITTED
            return

        SCORE_V2_BIT = 536870912
        is_current_v2 = (self.mods & SCORE_V2_BIT) != 0

        recs_best = await scores_repo.fetch_many(
            user_id=self.player.id,
            map_md5=self.bmap.md5,
            mode=self.mode,
            status=SubmissionStatus.BEST,
        )
        current_best = recs_best[0] if recs_best else None

        recs_best_v2 = await scores_repo.fetch_many(
            user_id=self.player.id,
            map_md5=self.bmap.md5,
            mode=self.mode,
            status=SubmissionStatus.BEST_V2,
        )
        current_best_v2 = recs_best_v2[0] if recs_best_v2 else None

        metric = "pp" if self.bmap.status in (2, 3) and self.mode < 4 else "score"
        
        new_val = getattr(self, metric)
        best_val = current_best[metric] if current_best else 0
        alt_val = current_best_v2[metric] if current_best_v2 else 0

        if new_val > best_val:
            self.status = SubmissionStatus.BEST
            
            if current_best:
                prev_best_obj = await Score.from_sql(current_best["id"])
                self.prev_best = prev_best_obj 
                
                is_prev_v2 = (prev_best_obj.mods & SCORE_V2_BIT) != 0
                
                if is_prev_v2 != is_current_v2:
                    prev_best_obj.status = SubmissionStatus.BEST_V2
                    
                    if current_best_v2:
                        await app.state.services.database.execute(
                            "UPDATE scores SET status = :status WHERE id = :id",
                            {"status": SubmissionStatus.SUBMITTED.value, "id": current_best_v2["id"]}
                        )
                else:
                    prev_best_obj.status = SubmissionStatus.SUBMITTED
                
                await app.state.services.database.execute(
                    "UPDATE scores SET status = :status WHERE id = :id",
                    {"status": prev_best_obj.status.value, "id": prev_best_obj.id}
                )
        else:
            best_is_v2 = (current_best["mods"] & SCORE_V2_BIT) != 0 if current_best else not is_current_v2

            if is_current_v2 != best_is_v2:
                if new_val > alt_val:
                    self.status = SubmissionStatus.BEST_V2
                    
                    if current_best_v2:
                        await app.state.services.database.execute(
                            "UPDATE scores SET status = :status WHERE id = :id",
                            {"status": SubmissionStatus.SUBMITTED.value, "id": current_best_v2["id"]}
                        )
                else:
                    self.status = SubmissionStatus.SUBMITTED
            else:
                self.status = SubmissionStatus.SUBMITTED
            

    def calculate_accuracy(self) -> float:
        """Calculate the accuracy of our score."""
        mode_vn = self.mode.as_vanilla

        if mode_vn == 0:  # osu!
            total = self.n300 + self.n100 + self.n50 + self.nmiss

            if total == 0:
                return 0.0

            return (
                100.0
                * ((self.n300 * 300.0) + (self.n100 * 100.0) + (self.n50 * 50.0))
                / (total * 300.0)
            )

        elif mode_vn == 1:  # osu!taiko
            total = self.n300 + self.n100 + self.nmiss

            if total == 0:
                return 0.0

            return 100.0 * ((self.n100 * 0.5) + self.n300) / total

        elif mode_vn == 2:  # osu!catch
            total = self.n300 + self.n100 + self.n50 + self.nkatu + self.nmiss

            if total == 0:
                return 0.0

            return 100.0 * (self.n300 + self.n100 + self.n50) / total

        elif mode_vn == 3:  # osu!mania
            total = (
                self.n300 + self.n100 + self.n50 + self.ngeki + self.nkatu + self.nmiss
            )

            if total == 0:
                return 0.0

            if self.mods & Mods.SCOREV2:
                return (
                    100.0
                    * (
                        (self.n50 * 50.0)
                        + (self.n100 * 100.0)
                        + (self.nkatu * 200.0)
                        + (self.n300 * 300.0)
                        + (self.ngeki * 305.0)
                    )
                    / (total * 305.0)
                )

            return (
                100.0
                * (
                    (self.n50 * 50.0)
                    + (self.n100 * 100.0)
                    + (self.nkatu * 200.0)
                    + ((self.n300 + self.ngeki) * 300.0)
                )
                / (total * 300.0)
            )
        else:
            raise Exception(f"Invalid vanilla mode {mode_vn}")

    """ Methods for updating a score. """

    async def increment_replay_views(self) -> None:
        # TODO: move replay views to be per-score rather than per-user
        assert self.player is not None

        # TODO: apparently cached stats don't store replay views?
        #       need to refactor that to be able to use stats_repo here
        await app.state.services.database.execute(
            f"UPDATE stats "
            "SET replay_views = replay_views + 1 "
            "WHERE id = :user_id AND mode = :mode",
            {"user_id": self.player.id, "mode": self.mode},
        )
