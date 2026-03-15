# 📚 Documentação da API — Fubika

Esta API utiliza **Fastify** e **Prisma**. Todas as rotas retornam JSON.

---

## ⚠️ Erros

Todos os erros seguem o mesmo formato:

```json
{
  "error": "Bad Request",
  "message": "Descrição do erro."
}
```

Erros de validação de body/query retornam detalhes dos campos:

```json
{
  "error": "Validation Error",
  "message": "Dados de entrada inválidos.",
  "details": {
    "name": ["O nome de usuário deve ter pelo menos 3 caracteres."]
  }
}
```

| Código | Nome | Quando ocorre |
|--------|------|---------------|
| `400` | Bad Request | Body/params/query inválidos |
| `401` | Unauthorized | Token ausente, inválido ou senha errada |
| `403` | Forbidden | Sem permissão para executar a ação |
| `404` | Not Found | Recurso não encontrado |
| `409` | Conflict | Recurso já existe |
| `500` | Internal Server Error | Erro interno ou banco de dados |

---

## 🔐 Autenticação

A maioria das rotas requer autenticação via um dos dois métodos:

- **JWT (Usuário):** Header `Authorization: Bearer <token>`
- **API Key (Bot/Script):** Header `x-api-key: <sua_chave>`

---

## 👤 Usuários — `/api/user`

### `POST /api/user/register`
Cria uma nova conta. Requer um código de convite válido.

**Autenticação:** Não necessária.

**Body:**
```json
{
  "name": "PlayerOne",
  "email": "player@email.com",
  "password": "senha123",
  "key": "CODIGO_CONVITE"
}
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | string | 3–15 caracteres, apenas letras, números, `_`, `[]` e espaço |
| `email` | string | E-mail válido |
| `password` | string | 6–100 caracteres |
| `key` | string | Obrigatório |

**Resposta `201`:**
```json
{
  "user": {
    "id": 4,
    "name": "PlayerOne",
    "safe_name": "playerone",
    "email": "player@email.com"
  }
}
```

**Erros:** `400` (validação), `400` (convite inválido/já usado)

---

### `POST /api/user/login`
Autentica o usuário e retorna o token JWT.

**Autenticação:** Não necessária.

**Body:**
```json
{
  "name": "PlayerOne",
  "password": "senha123"
}
```

**Resposta `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Erros:** `400` (validação), `401` (usuário não encontrado ou senha errada), `403` (conta restrita/banida)

---

### `GET /api/user/me`
Retorna o perfil do usuário autenticado.

**Autenticação:** Obrigatória.

**Resposta `200`:** Mesmo formato de `GET /api/user/:id`.

**Erros:** `401`, `404`

---

### `DELETE /api/user/me`
Deleta permanentemente a própria conta. Remove scores e stats associados.

**Autenticação:** Obrigatória.

**Body:**
```json
{
  "password": "senha123"
}
```

**Resposta `200`:**
```json
{
  "message": "Conta deletada com sucesso."
}
```

**Erros:** `400` (validação), `401` (senha incorreta)

---

### `GET /api/user/count`
Retorna contagem de usuários totais e online.

**Autenticação:** Não necessária.

**Resposta `200`:**
```json
{
  "total_users": 42,
  "online_users": 5
}
```

---

### `GET /api/user/:id`
Busca o perfil completo de um usuário. O parâmetro `:id` aceita:
- ID numérico do jogo (ex: `3`)
- ID do Discord (string numérica com mais de 15 dígitos)
- `safe_name` (nome sem espaços/especiais, ex: `player_one`)

**Autenticação:** Obrigatória.

**Query parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `mode` | número | `0` | Modo de jogo (0–8) |

**Resposta `200`:**
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
  "level": 5.61,
  "ss_count": 0,
  "ssh_count": 0,
  "s_count": 0,
  "sh_count": 0,
  "a_count": 1,
  "last_activity": "há 38 minutos",
  "top_200": [ ... ]
}
```

**Erros:** `401`, `404` (usuário não encontrado ou id < 3)

---

### `GET /api/user/:id/recent`
Busca as scores recentes de um usuário. Aceita os mesmos tipos de `:id` da rota acima.

**Autenticação:** Obrigatória.

**Query parameters:**

| Parâmetro | Tipo | Padrão | Limites |
|-----------|------|--------|---------|
| `mode` | número | `0` | 0–8 |
| `limit` | número | `5` | 1–100 |

**Resposta `200`:** Array de scores.

```json
[
  {
    "id": 2,
    "score": 73455,
    "pp": 50.089,
    "acc": 96.15385,
    "max_combo": 92,
    "mods_int": 536870912,
    "mods": "V2",
    "n300": 86,
    "n100": 4,
    "n50": 1,
    "nmiss": 0,
    "grade": "F",
    "perfect": false,
    "play_time": "2025-12-24T17:40:45.000Z",
    "beatmap": { ... }
  }
]
```

**Erros:** `400` (limit > 100), `401`, `404`

---

### `GET /api/user/:id/history`
Retorna o histórico de rank do usuário ao longo do tempo.

**Autenticação:** Obrigatória.

**Query parameters:**

| Parâmetro | Tipo | Padrão | Limites |
|-----------|------|--------|---------|
| `mode` | número | `0` | 0–8 |
| `days` | número | `90` | 1–365 |

**Resposta `200`:**
```json
[
  {
    "date": "2026-01-01T00:00:00.000Z",
    "rank": 10,
    "pp": 500.5
  },
  {
    "date": "2026-01-15T00:00:00.000Z",
    "rank": 8,
    "pp": 550.0
  }
]
```

**Erros:** `400` (mode > 8, days > 365 ou days < 1), `401`, `404`

---

### `GET /api/user/:id/map/:mapId`
Busca a melhor score de um usuário em um mapa específico.

**Autenticação:** Obrigatória.

**Query parameters:**

| Parâmetro | Tipo | Padrão |
|-----------|------|--------|
| `mode` | número | `0` |

**Resposta `200`:**
```json
{
  "id": 1,
  "score": 356317,
  "pp": 34.717,
  "acc": 95.13705,
  "max_combo": 260,
  "mods_int": 536870912,
  "mods": "V2",
  "n300": 352,
  "n100": 19,
  "n50": 2,
  "nmiss": 4,
  "grade": "A",
  "perfect": false,
  "play_time": "2025-12-24T17:08:16.000Z",
  "beatmap": { ... },
  "player": {
    "id": 3,
    "name": "henrique",
    "safe_name": "henrique",
    "pfp": "https://a.bpy.local/3",
    "rank": 0,
    "pp": 0,
    "acc": 0,
    "total_score": 0,
    "ranked_score": 0,
    "max_combo": 0,
    "playtime": 0
  }
}
```

**Erros:** `401`, `404` (usuário ou score não encontrado)

---

### `POST /api/user/avatar`
Faz upload da foto de perfil de um usuário via Discord ID.

**Autenticação:** Obrigatória + Discord Ownership.

**Body:** `multipart/form-data`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `discord_id` | string | Discord ID numérico do usuário |
| `avatar` | arquivo | Imagem (png, jpg, etc.) |

**Resposta `200`:**
```json
{
  "id": 3,
  "name": "henrique",
  "avatar_url": "https://a.bpy.local/3?v=1234567890"
}
```

**Erros:** `400` (arquivo ausente ou não é imagem), `401`, `403`, `404`

---

## 🎵 Beatmaps — `/api/beatmap`

**Autenticação:** Obrigatória em todas as rotas.

### `GET /api/beatmap/:id`
Busca informações de uma dificuldade e sua leaderboard local.

**Resposta `200`:**
```json
{
  "beatmap_id": 977708,
  "beatmapset_id": 456212,
  "beatmap_md5": "0ee95aa2718e4f106cdd36a8e58a1fa9",
  "title": "Candy Luv",
  "artist": "Thyme",
  "mode": "osu",
  "mode_int": 0,
  "status": "ranked",
  "total_length": 181,
  "author_id": 3178418,
  "author_name": "pishifat",
  "cover": "https://assets.ppy.sh/beatmaps/456212/covers/cover.jpg",
  "thumbnail": "https://assets.ppy.sh/beatmaps/456212/covers/list@2x.jpg",
  "diff": "Insane",
  "star_rating": 4.06623,
  "bpm": 130,
  "od": 7,
  "ar": 8,
  "cs": 5,
  "hp": 6,
  "max_combo": 784,
  "count_circles": 123,
  "count_sliders": 200,
  "playcount": 10,
  "passcount": 5,
  "scores": [ ... ]
}
```

**Erros:** `400` (id não numérico), `401`, `404`

---

### `GET /api/beatmap/c/:id`
Busca todas as dificuldades de um beatmapset.

**Resposta `200`:**
```json
{
  "beatmapset_id": 416153,
  "playcount": 14959574,
  "favourite_count": 4806,
  "cover": "https://assets.ppy.sh/beatmaps/416153/covers/cover.jpg",
  "thumbnail": "https://assets.ppy.sh/beatmaps/416153/covers/list@2x.jpg",
  "author_id": "899031",
  "title": "Sendan Life",
  "beatmaps": [
    {
      "beatmap_id": 901854,
      "beatmapset_id": 416153,
      "title": "Sendan Life",
      "diff": "Nostalgia",
      "star_rating": 7.00612,
      "mode": "osu",
      "mode_int": 0,
      "status": "ranked",
      "bpm": 227,
      "od": 9.2,
      "ar": 9.8,
      "cs": 4,
      "hp": 6,
      "max_combo": 1229
    }
  ]
}
```

**Erros:** `400` (id não numérico), `401`, `404`

---

## 🏆 Ranking — `/api/ranking`

**Autenticação:** Obrigatória.

### `GET /api/ranking/global`
Retorna o leaderboard global paginado.

**Query parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | número | `1` | Página |
| `mode` | número | `0` | Modo (0–8) |

**Resposta `200`:**
```json
[
  {
    "id": 3,
    "name": "henrique",
    "safe_name": "henrique",
    "pfp": "https://a.bpy.local/3",
    "rank": 1,
    "pp": 35,
    "acc": 93.9252,
    "playtime": 367,
    "playcount": 2,
    "max_combo": 209,
    "total_score": 1040907,
    "ranked_score": 268113,
    "level": 5.61,
    "ss_count": 0,
    "ssh_count": 0,
    "s_count": 0,
    "sh_count": 0,
    "a_count": 1
  }
]
```

**Erros:** `400`, `401`

---

## 🤖 Discord — `/api/discord`

**Autenticação:** Não necessária.

### `POST /api/discord/createlink`
Inicia o vínculo entre conta Discord e conta osu!. Envia um código de 6 caracteres via chat in-game.

**Body:**
```json
{
  "discord_id": "123456789012345678",
  "osu_name": "PlayerOne"
}
```

**Resposta `200`:**
```json
{
  "success": true,
  "message": "Código enviado no chat do jogo (F9)."
}
```

**Erros:** `400` (validação), `404` (usuário osu! não encontrado)

---

### `POST /api/discord/checklink`
Confirma o código recebido in-game e finaliza o vínculo.

**Body:**
```json
{
  "discord_id": "123456789012345678",
  "code": "A1B2C3"
}
```

**Resposta `200`:**
```json
{
  "success": true,
  "message": "Conta vinculada com sucesso"
}
```

**Erros:** `400` (código inválido ou expirado), `404`

---

## 🎟️ Convites — `/api/invite`

### `POST /api/invite/create`
Gera um novo código de convite.

**Autenticação:** Obrigatória + Discord Ownership.

**Body:**
```json
{
  "id": "520994132458471438"
}
```

O campo `id` aceita tanto string (Discord ID) quanto número (ID do jogo).

**Resposta `200`:**
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

**Erros:** `400`, `401`, `403`

---

## 🔑 API Keys — `/api/key`

### `POST /api/key/`
Gera uma nova API Key vinculada a um usuário alvo.

**Autenticação:** Obrigatória + Discord Ownership.

**Body:**
```json
{
  "id_req": 5,
  "id_target": 3,
  "name": "MeuBot"
}
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `id_req` | número inteiro | ID do jogo de quem solicita |
| `id_target` | número inteiro | ID do jogo do dono da key |
| `name` | string | Mínimo 3 caracteres |

**Resposta `200`:**
```json
{
  "id": 1,
  "name": "MeuBot",
  "key": "fubika_live_a1b2c3d4e5...",
  "owner_id": 3,
  "created_at": "2025-12-22T20:10:11.910Z",
  "can_write": false
}
```

**Erros:** `400`, `401`, `403`

---

## 🛡️ Admin — `/api/admin`

Todas as rotas requerem autenticação, privilégio de admin e Discord Ownership.

### `POST /api/admin/ban`
Bane um jogador, setando `priv = 0`.

**Autenticação:** Obrigatória + Admin + Discord Ownership.

**Body:**
```json
{
  "target_id": 10
}
```

**Resposta `200`:**
```json
{
  "success": true,
  "message": "O jogador PlayerAlvo foi banido com sucesso."
}
```

**Erros:** `400` (validação), `401`, `403` (sem permissão ou tentativa de banir id 1 ou 3), `404`

---

### `POST /api/admin/giveadmin`
Promove um jogador a administrador (`priv = 1048575`). Exclusivo para o dono do servidor (verificado via `OWNER_DISCORD_ID`).

**Autenticação:** Obrigatória + Discord Ownership.

**Body:**
```json
{
  "target_id": 10
}
```

**Resposta `200`:**
```json
{
  "success": true,
  "message": "Sucesso! O jogador PlayerAlvo agora é um Administrador."
}
```

**Erros:** `400` (validação), `401`, `403` (não é o dono do servidor), `404`