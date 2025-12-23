# 📚 Documentação da API

Esta API utiliza **Fastify** e **Prisma**. Abaixo estão listadas todas as rotas disponíveis, seus métodos, parâmetros e corpos de requisição necessários.

## 🔐 Autenticação

A maioria das rotas requer autenticação. Existem dois métodos aceitos:

1.  **Usuário (JWT):** Header `Authorization: Bearer <token>`
2.  **Bot/Script (API Key):** Header `x-api-key: <sua_chave>`

---

## 👤 Usuários (`/api/user`)

Rotas para cadastro, login e perfil.

### `POST /api/user/register`
Cria uma nova conta de usuário.
**Autenticação:** Não necessária.

**Body (JSON):**
```json
{
  "username": "PlayerOne",
  "email": "player@email.com",
  "password": "senha_segura_123",
  "invite_code": "CODIGO_CONVITE"
}
```

### `POST /api/user/login`
Autentica o usuário e retorna o token JWT.
**Autenticação:** Não necessária.

**Body (JSON):**
```json
{
  "email": "player@email.com",
  "password": "senha_segura_123"
}
```

### `GET /api/user/:id`
Busca informações de um usuário específico. Pode ser usado o ID do Discord também como parâmetro.
**Autenticação:** Obrigatória.

**Exemplo de Uso:**
`GET /api/user/3`
**Resposta:**
```json
{
	"id": 3,
	"name": "henrique",
	"safe_name": "henrique",
	"pfp": "https://a.bpy.local/3",
	"banner": "https://assets.ppy.sh/user-profile-covers/3.jpg",
	"rank": 1,
	"pp": 35,
	"acc": 93.9252,
	"playtime": 367,
	"playcount": 2,
	"max_combo": 209,
	"total_score": 1040907,
	"ranked_score": 268113,
	"level": 5.6198309090909095,
	"ss_count": 0,
	"ssh_count": 0,
	"s_count": 0,
	"sh_count": 0,
	"a_count": 1,
	"last_activity": "há 38 minutos",
	"top_100": [
		{
			"id": 2,
			"score": 268113,
			"pp": 34.454,
			"acc": 93.92523,
			"max_combo": 209,
			"mods_int": 536870912,
			"mods": "V2",
			"n300": 491,
			"n100": 33,
			"n50": 3,
			"nmiss": 8,
			"grade": "A",
			"perfect": false,
			"play_time": "2025-12-23T17:59:40.000Z",
			"beatmap": {
				"beatmap_id": 977708,
				"beatmapset_id": 456212,
				"beatmap_md5": "0ee95aa2718e4f106cdd36a8e58a1fa9",
				"title": "Candy Luv",
				"mode": "osu",
				"mode_int": 0,
				"status": "ranked",
				"total_lenght": 181,
				"author_id": 3178418,
				"author_name": "pishifat",
				"cover": "https://assets.ppy.sh/beatmaps/456212/covers/cover.jpg?1622103831",
				"diff": "Insane",
				"star_rating": 4.06623,
				"bpm": 130,
				"od": 7,
				"ar": 8,
				"cs": 5,
				"hp": 6,
				"max_combo": 784
			}
		}, ...
	]
}
```
---

## 🎵 Beatmaps (`/api/beatmap`)

Rotas para buscar informações de mapas.
**Autenticação Geral:** Obrigatória (Hook Global).

### `GET /api/beatmap/:id`
Busca informações de uma dificuldade específica de um mapa.

**Exemplo de Uso:**
`GET /api/beatmap/977708` (Onde 977708 é o ID do beatmap)
**Resposta:**
```json
{
	"beatmap_id": 977708,
	"beatmapset_id": 456212,
	"beatmap_md5": "0ee95aa2718e4f106cdd36a8e58a1fa9",
	"title": "Candy Luv",
	"mode": "osu",
	"mode_int": 0,
	"status": "ranked",
	"total_lenght": 181,
	"author_id": 3178418,
	"author_name": "pishifat",
	"cover": "https://assets.ppy.sh/beatmaps/456212/covers/cover.jpg?1622103831",
	"diff": "Insane",
	"star_rating": 4.06623,
	"bpm": 130,
	"od": 7,
	"ar": 8,
	"cs": 5,
	"hp": 6,
	"max_combo": 784,
	"scores": [
		{
			"id": 2,
			"score": 268113,
			"pp": 34.454,
			"acc": 93.92523,
			"mods_int": 536870912,
			"mods": "V2",
			"n300": 491,
			"n100": 33,
			"n50": 3,
			"nmiss": 8,
			"grade": "A",
			"perfect": false,
			"max_combo": 209,
			"play_time": "2025-12-23T17:59:40.000Z",
			"player": {
				"id": 3,
				"name": "henrique",
				"safe_name": "henrique",
				"rank": 0,
				"pp": 35,
				"acc": 93.9252,
				"pfp": "https://a.bpy.local/3",
				"banner": "https://assets.ppy.sh/user-profile-covers/3.jpg",
				"a_count": 1,
				"s_count": 0,
				"ss_count": 0,
				"sh_count": 0,
				"ssh_count": 0,
				"level": 0,
				"total_score": 1040907,
				"ranked_score": 268113,
				"max_combo": 209,
				"playtime": 367,
				"playcount": 0
			}
		}
	]
}
```

### `GET /api/beatmap/c/:id`
Busca informações de um set completo de mapas (BeatmapSet).

**Exemplo de Uso:**
`GET /api/beatmap/c/416153` (Onde 416153 é o ID do set)
**Resposta:**
```json
{
	"beatmapset_id": 416153,
	"playcount": 14959574,
	"favourite_count": 4806,
	"cover": "https://assets.ppy.sh/beatmaps/416153/covers/cover.jpg?1650639459",
	"author_id": "899031",
	"title": "Sendan Life",
	"beatmaps": [
		{
			"beatmap_id": 901854,
			"beatmapset_id": 416153,
			"title": "Sendan Life",
			"mode": "osu",
			"mode_int": 0,
			"status": "ranked",
			"total_lenght": 232,
			"author_id": 899031,
			"author_name": "Lami",
			"diff": "Nostalgia",
			"star_rating": 7.00612,
			"bpm": 227,
			"od": 9.2,
			"ar": 9.8,
			"cs": 4,
			"hp": 6,
			"max_combo": 1229
		}, ...
	]
}
```
---

## 🏆 Ranking (`/api/ranking`)

Rotas para visualizar o Leaderboard global.
**Autenticação Geral:** Obrigatória (Hook Global).

### `GET /api/ranking/global`
Retorna a lista de melhores jogadores paginada.

**Query Parameters:**
* `page` (Opcional): Número da página (Padrão: 1)
* `mode` (Opcional): Modo de jogo (0 = Standard, 1 = Taiko, 2 = Catch, 3 = Mania).

**Exemplo de Uso:**
`GET /api/ranking/global?page=1&mode=0`
**Resposta:**
```json
[
	{
		"id": 3,
		"name": "henrique",
		"safe_name": "henrique",
		"pfp": "https://a.bpy.local/3",
		"banner": "https://assets.ppy.sh/user-profile-covers/3.jpg",
		"rank": 1,
		"pp": 35,
		"acc": 93.9252,
		"playtime": 367,
		"playcount": 2,
		"max_combo": 209,
		"total_score": 1040907,
		"ranked_score": 268113,
		"level": 5.6198309090909095,
		"ss_count": 0,
		"ssh_count": 0,
		"s_count": 0,
		"sh_count": 0,
		"a_count": 1
	}
]
```
---

## 🤖 Discord Integration (`/api/discord`)

Rotas usadas pelo Bot do Discord para vincular contas.
**Autenticação Geral:** Não necessária.

### `POST /api/discord/createlink`
Inicia o processo de vinculação. O servidor envia um código in-game para o usuário.

**Body (JSON):**
```json
{
  "discord_id": "123456789012345678",
  "osu_name": "Cookiezi"
}
```
**Resposta:**
```json
{
	"success": true,
	"message": "Código enviado no chat do jogo (F9)."
}
```

### `POST /api/discord/checklink`
Confirma o código recebido no jogo para finalizar o vínculo.

**Body (JSON):**
```json
{
  "discord_id": "123456789012345678",
  "code": "A1B2C3"
}
```
**Resposta:**
```json
{
	"success": true,
	"message": "Conta vinculada com sucesso"
}
```
---

## 🎟️ Convites (`/api/invite`)

Gerenciamento de chaves de acesso ao servidor.
**Autenticação Geral:** Obrigatória (Geralmente Admins).

### `POST /api/invite/create`
Gera um novo código de convite.

**Body (JSON):**
```json
{
    "id": "{id_do_discord_de_quem_criou | id_do_game}"
}
```
**Resposta:**
```json
{
	"id": 2,
	"code": "123456789ABCDE",
	"expires_at": "2025-12-29T19:46:45.027Z",
	"created_at": "2025-12-22T19:46:45.028Z",
	"created_by_id": 3,
	"used_by_id": null
}
```

---

## 🔑 API Keys (`/api/key`)

Gerenciamento de chaves de API para bots e scripts externos.

### `POST /api/key/`
Gera uma nova API Key vinculada ao usuário logado.
**Autenticação:** Obrigatória.

**Body (JSON):**
```json
{
	"id_req": "{discord_id_usuario_que_criou}",
	"id_target": "{discord_id_alvo}",
	"name": "NomeDaAplicacao"
}
```
**Resposta:**
```json
{
	"id": 1,
	"name": "Fubas",
	"key": "fubika_live_a1b2c3d4e5...",
	"owner_id": 3,
	"created_at": "2025-12-22T20:10:11.910Z",
	"can_write": false
}
```