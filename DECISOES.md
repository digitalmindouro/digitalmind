# DECISOES.md — DigitalMind v2
# Responda tudo aqui antes de começar a codar

Cada decisão sem resposta = parada na construção.
Marque cada item com ✅ quando decidido ou anote a resposta diretamente.

---

## BLOCO 1 — FUNDAÇÃO E AUTH

### 1.1 Acesso sem conta
O sistema atual permite "Preview local" sem login (modo offline com localStorage).
**O v2 vai ter acesso sem conta?**
- [ ] Sim — mantém o preview local igual ao v1
- [ ] Não — exige login para acessar qualquer módulo
- [ ] Parcial — diagnóstico público, restante exige login

**Resposta:**

---

### 1.2 Onboarding de novo usuário
Quando um usuário cria conta e entra pela primeira vez, o v1 mostra um checklist de 4 etapas (diagnóstico → vendas → financeiro → cadastrar cliente).
**O v2 mantém esse onboarding?**
- [ ] Sim — idêntico ao v1
- [ ] Sim — mas com mudanças (quais?)
- [ ] Não — vai direto para o dashboard

**Resposta:**

---

### 1.3 Recuperação de senha
O v1 não tem "esqueci minha senha". O Supabase tem isso pronto.
**Implementa no v2?**
- [ ] Sim
- [ ] Não por enquanto

**Resposta:**

---

### 1.4 Perfil do usuário
O v1 só mostra o email na sidebar.
**O v2 vai ter página de perfil (nome, empresa, foto)?**
- [ ] Sim
- [ ] Não por enquanto

**Resposta:**

---

## BLOCO 2 — PERSISTÊNCIA E DADOS

### 2.1 Estratégia de sync
O v1 salva no localStorage E no Supabase com debounce de 1500ms.
**O v2 usa a mesma estratégia?**
- [ ] Sim — localStorage como cache + Supabase como fonte de verdade
- [ ] Só Supabase — sem localStorage (mais simples, requer conexão)
- [ ] Só localStorage — sem sync (sem sentido para multi-device)

**Resposta:**

---

### 2.2 Dados do ai_context (JSONB atual)
O v1 salva contentCalendar, salesGoals, salesLeads, mktGoals, evoHistory, etc. num único JSONB.
**O v2 vai manter essa estrutura ou criar tabelas separadas?**
- [ ] Mantém o JSONB por enquanto (mais rápido de construir, dívida técnica persiste)
- [ ] Cria tabelas separadas para tudo (mais trabalho agora, correto a longo prazo)
- [ ] Híbrido: tabelas para o que tem volume (leads, calendar events), JSONB para configurações leves

**Nota:** Se criar tabelas separadas, vai precisar de um script de migração para os dados do v1.

**Resposta:**

---

### 2.3 Migração de dados do v1
Usuários que já usam o v1 têm dados no Supabase. Quando migrarem para o v2:
**O que acontece com os dados existentes?**
- [ ] Lê os dados existentes normalmente — sem migração (funciona se mantiver o schema)
- [ ] Script de migração automático no primeiro login do v2
- [ ] Migração manual por usuário

**Resposta:**

---

### 2.4 Multi-empresa por usuário
O v1 assume 1 usuário = 1 empresa.
**O v2 vai suportar múltiplas empresas por conta?**
- [ ] Não — continua 1:1
- [ ] Sim — o usuário pode ter N empresas e alternar entre elas

**Resposta:**

---

## BLOCO 3 — MÓDULO DX (DIAGNÓSTICO)

### 3.1 Diagnóstico pode ser refeito?
O v1 tem botão "Atualizar diagnóstico" que reinicia o formulário.
**O v2 mantém isso?**
- [ ] Sim — pode refazer qualquer hora
- [ ] Sim — mas guarda histórico de diagnósticos anteriores
- [ ] Não — diagnóstico é feito uma vez, editado depois

**Resposta:**

---

### 3.2 Diagnóstico sem IA (fallback local)
O v1 tem um `buildDiag` local que gera resultado sem chamar o Gemini.
**O v2 mantém o fallback?**
- [ ] Sim — se Gemini falhar, usa resultado local
- [ ] Não — se Gemini falhar, mostra erro e pede para tentar de novo

**Resposta:**

---

### 3.3 Campos do formulário de diagnóstico
O v1 tem 6 etapas. Você quer **adicionar, remover ou mudar algum campo**?
Lista atual: nome da empresa, cidade, segmento, tempo de mercado, modelo de venda, objetivo principal, principal dificuldade, presença digital, avanço desejado, diferencial.

**Resposta:**

---

### 3.4 SWOT no resultado
O v1 mostra SWOT gerado pelo Gemini.
**Mantém o SWOT no resultado?**
- [ ] Sim — idêntico
- [ ] Sim — mas com visual diferente
- [ ] Não — remove ou substitui por outra coisa

**Resposta:**

---

## BLOCO 4 — MÓDULO MK (MARKETING)

### 4.1 Agente de Marketing — contexto passado para o Gemini
O v1 monta um objeto `buildAgentContext()` rico com diagnóstico, financeiro, calendário, leads.
**O v2 manda o mesmo contexto?**
- [ ] Sim — idêntico
- [ ] Sim — com melhorias (quais?)
- [ ] Simplifica — manda menos contexto

**Resposta:**

---

### 4.2 Histórico de conversa com o agente
O v1 não persiste o histórico de chat — cada sessão começa do zero.
**O v2 vai persistir o histórico?**
- [ ] Sim — salva as últimas N mensagens no Supabase
- [ ] Não — começa do zero em cada sessão (igual ao v1)

**Resposta:**

---

### 4.3 Aba "Produção" com tabela de preços de serviços
O v1 tem uma aba com preços hardcoded de edição de vídeo, design e tráfego pago, com link direto para WhatsApp.
**O v2 mantém isso?**
- [ ] Sim — idêntico (mesmo número de WhatsApp, mesmos preços)
- [ ] Sim — mas os preços devem ser editáveis pelo usuário
- [ ] Remove — não faz sentido para todos os usuários

**Nota:** O número `5517996590804` está hardcoded. Se o v2 for multi-usuário real, isso precisa ser configurável por empresa.

**Resposta:**

---

### 4.4 Calendário — sincronização entre dispositivos
O v1 salva o calendário no `ai_context` JSONB. Funciona entre dispositivos mas com conflito potencial.
**O v2 usa tabela dedicada para eventos de calendário?**
- [ ] Sim — cria tabela `content_events` com uma linha por evento
- [ ] Não — mantém no JSONB (mais rápido, aceita a dívida técnica)

**Resposta:**

---

### 4.5 Agendamento a partir do chat do agente
O v1 tem um botão "Agendar conteúdo" no painel lateral que abre o popup de calendário.
**O v2 mantém esse fluxo?**
- [ ] Sim — idêntico
- [ ] Sim — mas melhora o UX (como?)
- [ ] Remove

**Resposta:**

---

## BLOCO 5 — MÓDULO VD (VENDAS)

### 5.1 CRM — leads salvos onde?
O v1 salva leads no `ai_context` JSONB.
**O v2 usa tabela dedicada?**
- [ ] Sim — cria tabela `crm_leads` com uma linha por lead
- [ ] Não — mantém no JSONB

**Resposta:**

---

### 5.2 CRM — drag and drop entre colunas
O v1 não tem drag and drop — o usuário abre o card e muda o estágio manualmente.
**O v2 implementa drag and drop?**
- [ ] Sim
- [ ] Não — muda estágio pelo modal igual ao v1

**Resposta:**

---

### 5.3 Agente de Vendas — fallback local
O v1 tem respostas locais extensas para ~15 temas (prospecção, follow-up, objeções, etc).
**O v2 mantém o fallback local?**
- [ ] Sim — mantém as respostas hardcoded como fallback
- [ ] Não — se Gemini falhar, mostra mensagem de erro

**Resposta:**

---

### 5.4 Diagnóstico de vendas — pode ser refeito?
O v1 tem botão "Reiniciar diagnóstico".
**O v2 mantém?**
- [ ] Sim
- [ ] Sim — mas guarda histórico
- [ ] Não

**Resposta:**

---

## BLOCO 6 — MÓDULO FN (FINANCEIRO)

### 6.1 Categorias de receita/despesa
O v1 permite o usuário criar categorias personalizadas, salvas no `ai_context`.
**O v2 usa tabela dedicada para categorias?**
- [ ] Sim — cria tabela `financial_categories`
- [ ] Não — mantém no JSONB / estado local

**Nota:** A tabela `financial_categories` já existe no schema do Supabase segundo o contexto do projeto.

**Resposta:**

---

### 6.2 Meta de receita mensal
O v1 tem campo para definir uma meta de receita do mês, salvo no `ai_context`.
**O v2 mantém?**
- [ ] Sim — idêntico
- [ ] Sim — mas suporta meta por mês (histórico de metas)
- [ ] Remove

**Resposta:**

---

### 6.3 Conciliação bancária (OFX/CSV)
O v1 tem importação de extrato OFX e CSV.
**O v2 mantém?**
- [ ] Sim — idêntico
- [ ] Sim — melhora o parser
- [ ] Remove por enquanto

**Resposta:**

---

### 6.4 Exportação para Excel
O v1 usa a biblioteca XLSX para exportar os lançamentos.
**O v2 mantém?**
- [ ] Sim
- [ ] Não — exporta CSV simples
- [ ] Remove

**Resposta:**

---

### 6.5 Projeção financeira
O v1 projeta receita e despesa dos próximos N meses baseado na média dos últimos 3.
**O v2 mantém?**
- [ ] Sim — idêntico
- [ ] Sim — com mais parâmetros (cenários otimista/pessimista)
- [ ] Remove

**Resposta:**

---

### 6.6 DRE (Demonstração de Resultado)
O v1 mostra DRE simplificada com gráficos de margem por mês.
**O v2 mantém?**
- [ ] Sim — idêntico
- [ ] Sim — melhora (quais campos adicionais?)
- [ ] Remove

**Resposta:**

---

## BLOCO 7 — MÓDULO EV (EVOLUÇÃO)

### 7.1 Score de maturidade
O v1 calcula um score de 0-100 baseado em ações reais (diagnóstico feito, transações registradas, conteúdos agendados, etc).
**O v2 mantém a mesma fórmula?**
- [ ] Sim — mesma lógica de pontos
- [ ] Não — muda a fórmula (como?)

**Resposta:**

---

### 7.2 Histórico de maturidade
O v1 salva um registro por mês com o score no `ai_context`.
**O v2 usa tabela dedicada?**
- [ ] Sim — cria/usa tabela `company_evo_history`
- [ ] Não — mantém no JSONB

**Nota:** A tabela `company_evo_history` já existe no schema.

**Resposta:**

---

### 7.3 Estágios de negócio — texto de "sobre contratar"
O v1 tem um texto sobre contratação em cada estágio (baseado em margem, dados reais).
**O v2 mantém?**
- [ ] Sim — mesmo texto
- [ ] Sim — atualiza os textos (você vai escrever ou eu sugiro?)
- [ ] Remove

**Resposta:**

---

## BLOCO 8 — PWA E MOBILE

### 8.1 Ícones PWA
O contexto menciona que os ícones atuais não têm o logo real da DigitalMind.
**O v2 usa novos ícones ou os mesmos?**
- [ ] Mesmos ícones (icon-192.png e icon-512.png atuais)
- [ ] Novos ícones — você vai fornecer os arquivos?

**Resposta:**

---

### 8.2 Nome da app no PWA
O manifest.json atual tem `name: "DigitalMind"`.
**Muda alguma coisa?**
- [ ] Não — mantém "DigitalMind"
- [ ] Muda para (qual nome?)

**Resposta:**

---

### 8.3 Tema de cores
O v1 usa `--bg:#05101e` (azul escuro profundo) com acento em `#4b8cff`.
**O v2 mantém o mesmo tema visual?**
- [ ] Sim — idêntico
- [ ] Não — muda (qual direção? mais escuro, mais claro, outra paleta?)

**Resposta:**

---

## BLOCO 9 — INTEGRAÇÕES

### 9.1 Gemini — modelo usado
O v1 usa Gemini via Edge Function. Qual modelo está configurado na Edge Function?
**Muda o modelo no v2?**
- [ ] Mantém o mesmo
- [ ] Atualiza para Gemini 2.0 Flash / Pro (mais capaz)

**Resposta:**

---

### 9.2 Memória semântica (pgvector)
O v1 tem infraestrutura de memória semântica (Caminho B) mas não está validada em produção.
**O v2 implementa ou ignora por enquanto?**
- [ ] Implementa — ativa a memória semântica
- [ ] Ignora por enquanto — foca no que funciona

**Resposta:**

---

### 9.3 Número de WhatsApp hardcoded
O v1 tem `const WA_NUM='5517996590804'` hardcoded nos links de contratação de serviços.
**O v2:**
- [ ] Mantém hardcoded — é sempre o seu número
- [ ] Torna configurável por empresa (cada empresa coloca o próprio número)

**Resposta:**

---

## BLOCO 10 — DEPLOY E DOMÍNIOS

### 10.1 URL do v2 durante desenvolvimento
**Qual URL você quer para o v2 enquanto testa?**
- [ ] digitalmind-v2.vercel.app (automático do Vercel)
- [ ] Outro subdomínio específico

**Resposta:**

---

### 10.2 Domínio final do v2
O projeto menciona `app.digitalmind.com.br` como domínio desejado.
**Confirma que o domínio final do v2 vai ser `app.digitalmind.com.br`?**
- [ ] Sim
- [ ] Não — vai ser outro (qual?)

**Resposta:**

---

### 10.3 Variáveis de ambiente
O v2 vai usar `.env.local` com as credenciais do Supabase.
**Além de `SUPABASE_URL` e `SUPABASE_ANON_KEY`, tem mais alguma variável necessária agora?**
(Ex: GEMINI_API_KEY vai ficar só na Edge Function do Supabase, não no Next.js)

**Resposta:**

---

## BLOCO 11 — COMPORTAMENTOS NÃO-ÓBVIOS DO V1 (confirmar se mantém)

### 11.1 Prioridade dos dados: tabela `companies` > `ai_context`
O v1 garante que os dados da tabela `companies` nunca são sobrescritos pelo JSONB ao hidratar.
**O v2 mantém essa prioridade?**
- [ ] Sim
- [ ] Não — redefine a hierarquia de fontes

**Resposta:**

---

### 11.2 Token de autenticação sempre renovado
O v1 tem `getAuthToken()` que busca a sessão mais recente antes de chamar a Edge Function.
**O v2 mantém esse padrão?**
- [ ] Sim — sempre renova antes de chamar o agente
- [ ] Não — usa o token do estado (risco de expirado)

**Resposta:**

---

### 11.3 `clearLocalState` antes de hidratar do Supabase
O v1 limpa o estado local antes de carregar do Supabase para evitar contaminação entre usuários.
**O v2 mantém?**
- [ ] Sim
- [ ] Não — o Zustand já garante isso por design

**Resposta:**

---

### 11.4 Score do formulário vs. score de maturidade real
O v1 mantém dois scores separados: `S.diag.sc` (score do formulário) e `S.maturityRealScore` (calculado com ações reais). O ring do dashboard mostra o real, não o do formulário.
**O v2 mantém essa separação?**
- [ ] Sim — dois scores distintos com propósitos diferentes
- [ ] Não — unifica em um único score

**Resposta:**

---

### 11.5 businessStage nunca vem do cache
O v1 tem comentário explícito: `// businessStage NUNCA vem do cache — sempre recalculado`. É calculado com dados reais toda vez.
**O v2 mantém?**
- [ ] Sim — sempre recalcula, nunca persiste
- [ ] Não — persiste para economizar processamento

**Resposta:**

---

## RESUMO — DECISÕES BLOQUEANTES
(Sem essas, não dá para codar)

Marque quando respondido:

- [ ] 1.1 — Acesso sem conta
- [ ] 2.1 — Estratégia de sync
- [ ] 2.2 — Estrutura do JSONB vs tabelas
- [ ] 2.4 — Multi-empresa
- [ ] 4.3 — Aba Produção / WhatsApp hardcoded
- [ ] 5.1 — CRM em tabela ou JSONB
- [ ] 10.2 — Domínio final

---

*Documento criado em 2026-05-26. Atualizar conforme decisões são tomadas.*
