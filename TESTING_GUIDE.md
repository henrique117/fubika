## 📋 Guia de Testes - Melhorias de MCP

### Implementação Realizada

#### 1️⃣ **System Prompt Expandido** (`llm.config.ts`)
- ✅ Instruções explícitas para usar automaticamente `userId` quando usuário menciona "minha", "meu", "eu"
- ✅ Suporte para mencionar outros usuários via `@username` ou `<@ID>`
- ✅ Limite de 1 tool call por mensagem para evitar confusão
- ✅ O prompt agora passa `userName` como contexto para a IA

#### 2️⃣ **Preprocessamento de Menções** (`messageCreateWithMCP.ts`)
- ✅ Função `preprocessMentions()` que:
  - Extrai `<@ID>` e converte em `{@user:ID}`
  - Detecta `@username` menções
  - Retorna o `userName` extraído
- ✅ Esse contexto é passado para a IA melhorar interpretação

#### 3️⃣ **Tratamento de Erros Elaborado** (`errorFormatter.ts` + `messageCreateWithMCP.ts`)
- ✅ Novo arquivo `errorFormatter.ts` com mapa de erros e mensagens amigáveis
- ✅ Sugestões de ações após cada erro
- ✅ Cobre: "não encontrado", "index inválido", "timeout", "autorização", etc.
- ✅ Integrado em `handleToolCall()` via `ErrorFormatter.elaborateToolError()`

#### 4️⃣ **Melhorias no Groq Service** (`groq.service.ts`)
- ✅ Aceita `userName` como parâmetro em `processMessage()`
- ✅ System prompt dinâmico via `getSystemPrompt(userName)`
- ✅ Contexto de usuário incluído no prompt enviado para a IA

---

### 🧪 Cenários de Teste

#### Teste 1: "Minha Score" (Usar ID do Autor Automaticamente)
```
User: @Fubas minha última score
Expected: IA extrai seu Discord ID automaticamente, busca sua score mais recente
Error Handling: Se não houver scores recentes → "Ops! Você não tem scores recentes aqui. Tente mapas novos!"
```

#### Teste 2: Comparação com Outro Usuário
```
User: @Fubas compare minha score com @otheruser
Expected: IA usa seu ID + extrai ID/nome do @otheruser
Flow: 
1. preprocessMentions() extrai "otheruser"
2. IA recebe contexto com ambos os userNames
3. Chama compare_scores tool com ambos parâmetros
Error Handling: Se usuário não existir → "Ops! Não encontrei o jogador 'otheruser'. Tente `/ranking` para explorar"
```

#### Teste 3: Score de Usuário Específico
```
User: @Fubas qual é a score do João
Expected: IA reconhece "do João" e busca pelo nome
Error Handling: Se "João" não existir → "Ops! Não encontrei esse jogador. Verifique o nome e tente novamente"
```

#### Teste 4: Index Inválido
```
User: @Fubas minha score número 500
Expected: Erro amigável
Response: "Ops! O número que você pediu não é válido. Use um número entre 1 e 200 para as scores recentes"
```

#### Teste 5: Erro de Conexão
```
User: @Fubas ranking
Expected (se API cair): "Demorou muito para buscar os dados... 😅 Tente novamente em alguns segundos"
```

---

### 📝 Mudanças nos Arquivos

**Arquivos Criados:**
- ✅ `/services/bot/src/services/errorFormatter.ts` - Novo formatador de erros

**Arquivos Modificados:**
- ✅ `/services/bot/src/config/llm.config.ts` - System prompt expandido com `getSystemPrompt(userName)`
- ✅ `/services/bot/src/services/llm/groq.service.ts` - Suporte a `userName` em `processMessage()`
- ✅ `/services/bot/src/events/messageCreateWithMCP.ts` - Integração de preprocessMentions() e ErrorFormatter

**Arquivos NÃO Modificados:**
- ℹ️ `tools/*.tool.ts` - Continuam retornando erros conforme antes (errorFormatter mapeia)
- ℹ️ `logic/*.logic.ts` - Mensagens já estruturadas, errorFormatter reconhece

---

### 🔍 Limites Conhecidos da IA & Como Melhorar

| Limite | Status | Solução Implementada |
|--------|--------|----------------------|
| IA não usa implicitamente `userId` | ✅ RESOLVIDO | System prompt agora instrui explicitamente |
| Não extrai IDs de menções | ✅ RESOLVIDO | preprocessMentions() processa antes |
| Erros retornam códigos feios | ✅ RESOLVIDO | errorFormatter com mensagens bonitas |
| LLM não "entende" Discord nativamente | ✅ MELHORADO | Contexto de usuário passa userName |

---

### 🎯 Próximas Melhorias (Opcionais)

1. **Cache de lookups de @username**: Evitar queries repetidas para mesmo usuário
2. **Variações de "minha"**: Detectar melhor em PT-BR (minha, meu, eu, minhas, meus, meus)
3. **Sugestões contextuais**: Quando erro de "não encontrado", sugerir nomes similares
4. **Logging de intent**: Rastrear quais comandos a IA está chamando para debug

---

### ✅ Checklist de Validação

- [ ] Comando "minha score" usa seu Discord ID automaticamente
- [ ] Comando "compare minha com @usuario" extrai ambos IDs corretos
- [ ] Erro "jogador não encontrado" retorna mensagem amigável com sugestão
- [ ] Error "index inválido" (ex: score 500) retorna mensagem clara
- [ ] Timeout retorna mensagem bonita, não código de erro
- [ ] Mencionar bot sem comando retorna resposta padrão
- [ ] Sistema mantém qualidade de respostas normais (sem quebra em conversas)
- [ ] Sem erros de compilação/runtime

---

### 🚀 Como Testar

1. **Localmente**: Rodar o bot em modo debug e mencionar com diferentes comandos
2. **Em Produção**: Testar cenários reais no Discord
3. **Regressão**: Verificar que comandos antigos ainda funcionam (help, leaderboard, etc)

Mensagens esperadas agora:
- ❌ **Antes**: "Error: Not Found"
- ✅ **Depois**: "Ops! Não encontrei esse jogador. Tente `/ranking` para explorar" 💡
