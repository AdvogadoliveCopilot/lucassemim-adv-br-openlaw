# Instruções para agentes (GitHub Copilot, Claude Code, Cursor, etc.)

Você está trabalhando no **lucassemim.adv.br** — plataforma Open Law brasileira que democratiza acesso ao conhecimento jurídico. Leia `ROADMAP.md` para entender a visão e `CONTRIBUTING.md` para as regras.

## Regras de ouro

1. **Você não é advogado.** Você ajuda na técnica: código, estrutura, formatação, SEO. Conteúdo jurídico significativo (petição, parecer, tese de defesa) precisa de revisão humana do advogado Lucas Semim antes de publicar.
2. **O leitor está em crise.** Escreva tudo considerando que a pessoa pode estar presa agora, ou com um familiar preso. Clareza, empatia, ação concreta. Nada de jargão desnecessário.
3. **Precisão legal é inegociável.** Nunca invente número de lei, artigo, súmula ou jurisprudência. Se não tem certeza da fonte, deixe marcado como `[VERIFICAR: fonte]` para revisão humana.
4. **Segredos nunca em commit.** Chaves ficam em `*.local.*` (gitignored). Se precisar testar integrações, use variáveis de ambiente.
5. **Um tema por commit.** Conteúdo jurídico OU infraestrutura, nunca os dois juntos.

## Padrões do código

- HTML/CSS/JS puro — sem framework. O site precisa carregar rápido em 3G.
- Backend PHP leve em `api/` — sem dependências pesadas.
- Python para automação editorial em `_ferramentas/`.
- Ao alterar assets (css/js), incremente a versão do cache em `sw.js`.
- Ao criar página nova, registre no sitemap correspondente com `adicionar_url_sitemap.py`.

## Estrutura de conteúdo

- `o-que-fazer-agora/` — guias de crise, formato: situação → o que fazer AGORA → prazos → quando chamar advogado
- `news/` — análises de atualidade jurídica, formato jornalístico com base legal no fim
- `presidios/` — guias de unidades prisionais de MG
- `civel/`, `defesa-criminal/` — conteúdo técnico por área
- `templates/` — componentes reutilizáveis (header, footer)

## Quando propor algo novo

Antes de implementar, verifique `ROADMAP.md` — se a ideia serve a Fase 1 (Projeto Anjo), Fase 2 (Cível sem êxito) ou Fase 3 (Software jurídico), ela está alinhada à visão. Abra uma issue com o template correspondente para discussão antes de codificar algo grande.
