# 🗺️ ROADMAP — Do site ao software jurídico

> Visão: qualquer pessoa, no momento de maior vulnerabilidade, consegue falar com o advogado Lucas Semim e fazer a justiça chegar. Cada fase aproxima o projeto desse objetivo.

---

## Fase 0 — Fundação (✅ Concluída)

- [x] Site completo com 1.900+ arquivos: guias, análises, sitemaps, PWA
- [x] Série "O Que Fazer Agora" (30+ guias de primeiros socorros jurídicos)
- [x] 100+ análises jurídicas de atualidades (STF, STJ, legislação)
- [x] Repositório público no GitHub com documentação (README, LICENSE, CONTRIBUTING)
- [x] Proteção de segredos (chave API em arquivo local, gitignored)
- [x] Scripts de automação editorial em `_ferramentas/`

## Fase 1 — Projeto Anjo: socorro a presos injustamente (🔄 Em andamento)

**Objetivo:** transformar a página [projeto-anjo.html](projeto-anjo.html) em um **sistema de triagem e acompanhamento** para presos provisórios e suas famílias.

### 1.1 Tela de triagem inteligente
- Formulário que coleta: situação atual (preso em flagrante, preventiva, condenado), comarca, tipo de crime, tempo de prisão
- Saída: orientação personalizada gerada (qual medida cabe: habeas corpus, audiência de custódia, relaxamento, progressão)
- Integração com a API existente em `api/` (backend PHP + Claude)

### 1.2 Base de conhecimento estruturada
- Converter os guias existentes em **dados estruturados** (JSON) que a triagem pode consultar
- Mapear: sintoma da pessoa → guia mais relevante → próxima ação prática
- Cobertura: flagrante, custódia, HC, delação, revista abusiva, tornozeleira, saidinha temporária

### 1.3 Calendário de direitos (execução penal)
- Calendário automático de: saidinha, progressão de regime, remição por estudo/trabalho, indulto
- A pessoa informa a data de prisão → sistema calcula as datas dos direitos
- Base: `presidios/` e leis de execução penal

## Fase 2 — Cível sem êxito: o direito que a pessoa desistiu de buscar

**Objetivo:** resgatar demandas cíveis que as pessoas abandonaram por não saber como prosseguir.

### 2.1 Diagnóstico de caso cível
- Formulário: tipo de problema (consumidor, família, contrato, acidente)
- Saída: caminho prático — qual órgão (PROCON, Juizado Especial), qual documento levar, qual prazo corre
- Integração com guias de `civel/`

### 2.2 Gerador de documentos iniciais
- Templates pré-preenchíveis: requerimento PROCON, notificação extrajudicial, petição inicial simplificada para Juizado
- A pessoa responde perguntas → documento sai pronto para conferência do advogado

### 2.3 Acompanhamento de prazo
- Sistema que lembra prazos processuais e de prescrição
- Base de prazos: consumidor, cível comum, família

## Fase 3 — Software jurídico: conversa direta com o advogado

**Objetivo:** a pessoa chega ao Lucas Semim no momento exato de necessidade.

### 3.1 Triagem conversacional (IA)
- Chat (já existe em `api/`) evoluído para entender o caso em linguagem natural
- Fluxo: pessoa descreve → IA faz perguntas de qualificação → resumo estruturado
- Entrega: resumo do caso + urgência + guia imediato

### 3.2 Roteamento para o advogado
- Casos classificados como urgentes (prisão, audiência em 24h, medida protetiva) → notificação imediata
- Canal de contato direto com prioridade para emergências
- Painel de gestão para o escritório (já existe em `painel-gestao-admin.html`)

### 3.3 Transparência total
- Toda conversa com IA registra que é IA (Resolução CNJ 332/2020)
- Nenhuma orientação substitui advogado — a IA **qualifica e encaminha**, nunca aconselha tecnicamente

## Fase 4 — Escala e comunidade (🔮 Futuro)

- Repositório de templates processuais compartilháveis (Visual Law)
- API pública para outros advogados usarem a triagem
- Colaboração com defensorias públicas e ONGs de apoio ao preso

---

## 🎯 Métrica do sucesso

**O número de pessoas que, antes desamparadas, conseguem:**
1. Entender o que está acontecendo com elas (Fases 1 e 2)
2. Chegar ao advogado certo no momento certo (Fase 3)

---

## ⚖️ Princípio inegociável

> Nenhuma automação substitui a responsabilidade profissional do advogado. A tecnologia **amplia o alcance** da orientação, mas a decisão jurídica é sempre humana — do advogado inscrito na OAB/MG.
