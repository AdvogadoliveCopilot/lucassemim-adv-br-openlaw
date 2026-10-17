# _ferramentas — Site Cível (lucassemim.adv.br/civel)

Pasta de trabalho **interna** do site cível. Nada aqui vai para o servidor público
(Locaweb) sem pedido explícito do chefe. Espelha o padrão da pasta
`_ferramentas/` da raiz do projeto (que atende o site criminal).

## Objetivo da fase atual (iniciada em 17/10/2026)

1. **Integrar o Painel do Cliente cível** à nossa ferramenta jurídica
   (Apps Script "Advogado Live" — mesma infraestrutura da Central do Caso criminal).
2. **Ajustar o design das páginas cível** (identidade "Advocacia Patrimonial",
   mantendo o sistema próprio de header/menu do `codeleicivel/structure.js`).
3. **Melhorar o SEO do site cível** (metadados, dados estruturados, NAP/CEP,
   sitemap, links internos, performance).

## Estrutura recomendada

```
civel/_ferramentas/
├── README.md                        ← este arquivo
├── BRIEFING-CLAUDE-CIVEL-20261017.md ← instruções para o Claude codificador
├── ESTADO-ATUAL-CIVEL-20261017.md   ← inventário verificado do site cível
├── backups/                         ← backups ANTES de qualquer lote de mudança
├── releases/                        ← pacotes de subida + lista de arquivos alterados
└── relatorios/                      ← relatórios de execução e verificação
```

## Regras de ouro (herdadas do CLAUDE.md da raiz)

- Sempre **dry-run antes de gravar** em alterações em lote; backup antes de sobrescrever.
- **Nunca subir para o servidor** sem pedido explícito do chefe.
- Não mexer no telefone, OAB, endereço sem conferir `agentes/config.py`.
- Não prometer resultado jurídico; conformidade OAB 205/2021 em todo texto novo.
- Dados de clientes/processos são confidenciais — nada em logs, exemplos ou commits.
- Preservar codificação (há arquivos CRLF e UTF-8 misturados) e o sentido jurídico original.
