# 🛡️ PROJETO ANJO — Documento de design

> "Onde a Justiça Falha, o Guardião Intervém."
> Página atual: [projeto-anjo.html](projeto-anjo.html) · Fase 1 do [ROADMAP](ROADMAP.md)

## O problema real

Toda noite, em cada delegacia de Minas Gerais, pessoas são presas em flagrante. A maioria:

- **Não sabe o que está acontecendo** — nunca viu um flagrante, não conhece seus direitos
- **Não tem dinheiro** — não consegue pagar advogado na madrugada
- **Tem família desesperada** — que também não sabe o que fazer, a quem ligar
- **Perde a janela de ouro** — a audiência de custódia em 24h é o momento mais importante do processo, e passa em branco sem defesa técnica

## O modelo: duas pontas que se encontram

O Projeto Anjo é uma **ponte com dois lados**:

### 🔵 Lado 1 — QUEM PRECISA (a pessoa presa e a família)

**Quem é:** pessoa presa em flagrante ou preventivamente, ou sua família — geralmente trabalhador comum, primeiro contato com o sistema penal.

**O que encontra no Projeto Anjo:**
1. **Socorro imediato, de graça** — guias "O Que Fazer Agora" explicando cada momento (flagrante → delegacia → audiência de custódia → primeiro contato com advogado)
2. **Triagem gratuita** — formulário/chat que entende a situação e diz quais direitos cabem AGORA (relaxamento, HC, custódia)
3. **Caminho sem custo** — encaminhamento correto para Defensoria Pública quando não há condições (o sistema ensina: onde fica a defensoria da comarca, o que levar, como pedir prioridade)
4. **Ponte para o advogado** — casos que precisam de defesa técnica particular chegam ao Dr. Lucas com o resumo já pronto, priorizados por urgência

**Fluxo do beneficiário:**
```
Crise (preso na delegacia / família soube)
   ↓
Entra em lucassemim.adv.br/projeto-anjo (busca / WhatsApp / indicação)
   ↓
Triagem: "O que aconteceu?" (3 perguntas rápidas)
   ↓
Resposta imediata: o que vai acontecer + direitos AGORA + guia específico
   ↓
Roteamento:
   • Sem condições → caminho Defensoria (orientação completa, gratuita)
   • Caso com urgência técnica → acionamento do Dr. Lucas (WhatsApp direto)
   • Caso em análise → triagem completa, resumo pronto para o escritório
```

### 🟡 Lado 2 — QUEM QUER AJUDAR (os Anjos)

**Quem é:** pessoas e empresas que querem transformar solidariedade em justiça real — e ver para onde cada contribuição vai.

**Papéis possíveis:**

| Papel | O que faz |
|---|---|
| **Anjo Acionador** | Qualquer pessoa que testemunha uma prisão injusta ou abuso (revista abusiva, flagrante forjado) e aciona o sistema — o "radar" |
| **Anjo Contribuidor** | Custo de deslocamento/emergência (ex.: deslocamento noturno até a delegacia) — o "custeio da missão" |
| **Anjo Voluntário** | Advogados parceiros, estagiários e estudantes que ajudam na triagem e acompanhamento |
| **Sócio-Anjo** | Apoio recorrente com acesso ao painel de processos (portal-investidor.html) — transparência de cada missão custeada |

**Princípio de transparência:** cada missão custeada (deslocamento, diligência emergencial) é registrada e o Sócio-Anjo vê: caso (anonimizado), o que foi feito, resultado. Confiança se constrói com prestação de contas.

## O despacho (já implementado, a evoluir)

A página atual já tem o fluxo de despacho: formulário → script (Google Apps) → WhatsApp do Dr. Lucas com mensagem pronta ("Missão Anjo acionada — destino X"). Evoluções necessárias:

1. **Classificação automática de urgência** — prisão em andamento = prioridade máxima; processo em andamento = normal
2. **Triagem antes do despacho** — perguntas mínimas (onde, quando, qual situação) já estruturam o caso antes de acionar
3. **Resposta ao Anjo** — depois do acionamento, o Anjo/família recebe orientação imediata (o que fazer enquanto o advogado não chega) — nada de "aguardar no vazio"
4. **Registro da missão** — cada despacho vira registro no painel de gestão (status: acionada → em deslocamento → atendida → acompanhamento)

## Caminho gratuito: parceria com a Defensoria

**Regra ética central:** quem não tem condições deve ser encaminhado à Defensoria Pública — e o Projeto Anjo torna esse caminho **menos confuso**, não o esconde:

- Página por comarca (base `presidios/` já tem as unidades) com endereço, telefone e horário da Defensoria local
- Checklist do que levar: documento com foto, comprovante de residência, comprovantes de vínculo (trabalho, família), boletim de ocorrência se houver
- Orientação sobre pedido de **gratuidade de justiça** e prioridade em audiência de custódia
- Nos casos de flagrante com indício de ilegalidade (revista abusiva, flagrante forjado, sem testemunhas), orientação para buscar também a defesa técnica especializada — é aí que o Dr. Lucas atua

## Fases de implementação

| Etapa | O quê | Status |
|---|---|---|
| A1 | Documento de design (este arquivo) | ✅ |
| A2 | Seção pública no site: "O que é o Projeto Anjo / como pedir ajuda / como ser um Anjo" | ⏳ |
| A3 | Triagem de 3 perguntas conectada ao guia certo | ⏳ |
| A4 | Páginas de Defensoria por comarca (caminho gratuito) | ⏳ |
| A5 | Painel de missões (registro + status + prestação de contas aos Sócios-Anjos) | ⏳ |
| A6 | Formulário de "Quero ser um Anjo" (voluntário/contribuidor) | ⏳ |

## Limites inegociáveis

- **Nenhuma promessa de resultado** — nem "te tiro daqui", nem "sai em X dias". Isso seria promessa enganosa (priva a pessoa da verdade e expõe o advogado)
- **IA não aconselha** — a triagem informa, estrutura e encaminha. A decisão jurídica é sempre do advogado
- **Sem desmoralização da Defensoria** — a Defensoria é aliada essencial; o projeto organiza o caminho até ela, não compete com ela
- **Sigilo** — dados de casos são tratados com sigilo profissional (Estatuto da OAB); nada de casos identificáveis em material público sem autorização

## Métrica do Projeto Anjo

1. Quantas pessoas em crise **encontraram orientação em menos de 5 minutos** (triagem → guia)
2. Quantas famílias **chegaram à Defensoria com a documentação certa** (caminho gratuito funcionando)
3. Quantos flagrantes com indício de ilegalidade **receberam defesa técnica na custódia** (missões atendidas)
