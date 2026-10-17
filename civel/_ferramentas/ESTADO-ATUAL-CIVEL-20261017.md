# ESTADO ATUAL — SITE CÍVEL (handover de 17/10/2026)

Inventário verificado na pasta `civel/` nesta data. Serve como ponto de partida
para a próxima sessão do Claude. **Confirme sempre no sistema de arquivos antes
de confiar neste documento** (pode ficar desatualizado).

## Estrutura da pasta `civel/`
- `index.html` — página principal do cível.
- **Soluções (14):** acidentes-transito, bancario-juros, banco-master-civel,
  bets-civel, blindagem-patrimonial, contratos-negocios, erro-medico,
  execucao-cobranca, familia-sucessoes, golpe-pix-civel, reajuste-plano-saude-civel,
  rmc-consignado-civel, seguros-indenizacao, superendividamento-civel,
  usucapiao-civel.
- **Locais (2):** belohorizonte-civel.html, sabara-civel.html.
- **Guias (~25):** arquivos `guia-*.html` (erro médico, juros, bets, usucapião,
  inventário, plano de saúde, DPVAT, apostas, RMC etc.).
- **Painéis/central:** painel-cliente.html, painel-processo.html,
  central-do-caso-civel.html, cadastro-cliente.html, sala-reuniao.html.
- `codeleicivel/` — ~45 módulos JS + CSS próprios (structure.js, platinum-ui,
  civel-painel-auth, civel-api-config, civel-seo, service-worker etc.).
  Identidade própria "Advocacia Patrimonial" — NÃO unificar com o header criminal.
- `sitemap.xml`, `robots.txt`, `.htaccess`, `manifest.json`.
- `img/` — imagens do cível. `Claude outputs/` — histórico de sessões anteriores
  (scripts .gs instalados, prints, estudos). `codeleicivel/` é o código ativo;
  `Claude outputs/` é referência histórica.

## Backend (Apps Script "Advogado Live")
- `24_API_Central_Civel.gs` instalado e roteado no `23_WebApp_Dispatcher`
  (`central_civel`, `lead_retorno_civel`) — ver `Claude outputs/INSTALAR_CENTRAL_CIVEL.md`.
- URL da API em `codeleicivel/civel-api-config.js` (`CIVEL_API_URL`, /exec).
- Ao alterar qualquer `.gs`: reimplantar como "Nova versão" (a URL não muda).
- Fallback WhatsApp em caso de queda do Apps Script — não remover.

## Pendências conhecidas
1. **CEP divergente no site inteiro** (cível usa `34505-000`): confirmar o CEP
   correto nos Correios antes de unificar (problema global, mapeado no criminal).
2. Testar login do painel do cliente com "Acesso de teste" da Central.
3. Design das páginas a ser atualizado (Missão B do briefing).
4. SEO por página a ser auditado (Missão C do briefing).
5. 3 páginas antigas do `/portal/` no servidor com WhatsApp antigo — decisão do chefe.

## Regras que valem sempre
- Publicação: só o chefe sobe (Locaweb/FileZilla). Preparar pacote em `releases/`.
- Backup antes de qualquer lote → `backups/`.
- Dry-run antes de gravar; relatório depois → `relatorios/`.
- Nada de promessa de resultado; OAB 205/2021; dados de cliente confidenciais.
