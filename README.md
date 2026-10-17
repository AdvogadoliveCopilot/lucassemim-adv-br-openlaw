# lucassemim.adv.br — Open Law Brasil

[![Open Law](https://img.shields.io/badge/miss%C3%A3o-Open%20Law-blue)](https://lucassemim.adv.br)
[![Acesso à Justiça](https://img.shields.io/badge/acesso-%C3%A0%20justi%C3%A7a-green)](https://lucassemim.adv.br)
[![Feito com IA](https://img.shields.io/badge/IA-Anthropic%20Claude-orange)](https://www.anthropic.com)

> **Democratizando o conhecimento jurídico no Brasil** — plataforma, conteúdo e ferramentas de automação que levam orientação legal clara a quem mais precisa, na hora em que mais precisa.

**Lucas Renan Semim** · Advogado (OAB/MG) · [lucassemim.adv.br](https://lucassemim.adv.br)

---

## 🎯 A missão

No Brasil, a distância entre "ter um direito" e "saber como exercê-lo" condena milhões de pessoas à passividade. Este projeto existe para fechar essa lacuna:

- **Conteúdo jurídico aberto** — centenas de guias práticos, gratuitos, escritos em linguagem acessível.
- **Orientação no momento de crise** — a série *"O Que Fazer Agora"* responde à pergunta mais urgente que existe: *"acabei de ser preso em flagrante, e agora?"*
- **Cobertura viva** — análise diária de decisões do STF, STJ e Tribunais que mudam a vida de presos, vítimas e famílias.
- **Transparência radical** — [transparencia-ia.html](transparencia-ia.html) documenta como IA é usada no projeto, em alinhamento com a Resolução CNJ nº 332/2020.

## 📂 O que vive aqui

```
├── index.html                 # Portal principal
├── o-que-fazer-agora/         # Série de emergência: 30+ guias de primeiros socorros jurídicos
├── news/                      # 100+ análises jurídicas de atualidades (STF, STJ, legislação)
├── presidios/                 # Guia de estabelecimentos penais (Minas Gerais)
├── defesa-criminal/           # Conteúdo técnico de defesa penal
├── civil/                     # Conteúdo cível e do consumidor
├── templates/                 # Componentes reutilizáveis (header, footer)
├── _ferramentas/              # Scripts Python de automação editorial
│   └── *.py                   #   → gerenciamento de sitemap, publicação em lote, QA
├── api/                       # Backend leve (PHP) — atendimento automatizado
├── sw.js                      # Service Worker — site funciona offline (PWA)
├── manifest.json              # Instalável como app
└── llms.txt                   # Manifesto para agentes de IA — conteúdo legível por máquinas
```

### Destaques técnicos

| Recurso | Descrição |
|---|---|
| **PWA completo** | `sw.js` + `manifest.json` — funciona offline, instalável em celular |
| **SEO profundo** | 5 sitemaps segmentados (`sitemap.xml`, `sitemap-news.xml`, `sitemap-urgencia.xml`, etc.), Google News, `robots.txt` |
| **Automação editorial** | Scripts Python em `_ferramentas/` que geram, validam e publicam conteúdo em lote |
| **API de atendimento** | Backend PHP leve em `api/` — triagem inicial automatizada de casos |
| **Acessível a IA** | `llms.txt` padroniza como agentes de IA devem citar o conteúdo |

## 🛠️ Stack

HTML/CSS/JS puro (zero framework — carregamento instantâneo em 3G) · PHP leve no backend · Python para automação editorial · Integração com API da [Anthropic](https://www.anthropic.com) para assistência.

## 🔐 Segurança

- Chaves de API **nunca** ficam no repositório — arquivos `*.local.*` são ignorados pelo git.
- `git grep` roda antes de cada push para validar ausência de segredos.
- Consulte a [Política de Privacidade](https://lucassemim.adv.br/politica-privacidade.html) do site.

## 🤝 Como contribuir

Este projeto nasceu aberto e cresce aberto:

1. **Juristas** — revise, corrija ou escreva guias (abrinha uma issue com a proposta).
2. **Desenvolvedores** — os scripts em `_ferramentas/` aceitam melhorias: mais validação, testes, CI.
3. **Divulgação** — compartilhe os guias *"O Que Fazer Agora"* com quem precisa.

```bash
git clone https://github.com/AdvogadoliveCopilot/lucassemim-adv-br-openlaw.git
```

## 📄 Licença

[LICENSE](LICENSE) — conteúdo jurídico e código abertos para uso livre com atribuição.

## ⚖️ Aviso legal

O conteúdo deste site é **informativo e educacional**. Não constitui aconselhamento jurídico individualizado. Cada caso é único — consulte um advogado da sua confiança. Lucas Renan Semim é advogado regularmente inscrito na OAB/MG.

---

*"A justiça não se pede. A justiça se constrói — com informação, método e coragem."*
