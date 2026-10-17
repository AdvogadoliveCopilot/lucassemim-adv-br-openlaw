# BRIEFING PARA O CLAUDE — ATUALIZAÇÕES DO SITE CÍVEL
## Escrito em 17/10/2026. Leia inteiro antes de codificar qualquer coisa.

Você (Claude) vai trabalhar em `c:\Users\adm\Desktop\lucassemim.adv.br\civel\`.
O site criminal (raiz do projeto) já passou por este ciclo — siga os mesmos padrões.
Leia também o `CLAUDE.md` da raiz antes de qualquer alteração.

---

## 1. O QUE VOCÊ ESTÁ HERDANDO (estado atual)

### Site cível no servidor (Locaweb, em /civel/)
- ~50 páginas HTML estáticas: página principal (`index.html`), páginas de solução
  (plano de saúde, banco, bets, erro médico, usucapião, superendividamento etc.),
  ~25 guias ("guia-*.html"), páginas locais (belohorizonte-civel, sabara-civel).
- `codeleicivel/`: ~45 módulos JS + CSS próprios. **Núcleo com identidade própria**
  ("Advocacia Patrimonial"), header/menu com submenus em `structure.js`.
  ⚠️ NÃO unificar com o header do site criminal sem decisão do chefe.
- `painel-cliente.html` e `central-do-caso-civel.html`: já existem e consomem
  a API do Apps Script via `codeleicivel/civel-api-config.js` (`CIVEL_API_URL`).
- `sitemap.xml`, `robots.txt`, `.htaccess`, `manifest.json` próprios.

### Backend (Google Apps Script — projeto "Advogado Live")
- `24_API_Central_Civel.gs` instalado + roteado no `23_WebApp_Dispatcher`
  (`central_civel` e `lead_retorno_civel`). Instalação documentada em
  `civel/Claude outputs/INSTALAR_CENTRAL_CIVEL.md`.
- `civel-painel-auth.js` no site cuida do login do cliente.
- Fallback garantido: se o Apps Script cair, o lead abre no WhatsApp com ficha pronta.
  **Nunca remover esse fallback.**

### Problemas conhecidos (levantamento do site criminal, ainda válidos aqui)
- **CEP divergente (NAP)**: o cível usa `34505-000` em 9 páginas; o site inteiro
  tem 5 CEPs diferentes para o mesmo endereço. Antes de unificar, confirmar o CEP
  correto nos Correios. NÃO unificar na sorte.
- Codificação mista (CRLF/UTF-8/BOM) — preservar em qualquer edição.

---

## 2. MISSÃO A — INTEGRAR O PAINEL DO CLIENTE À FERRAMENTA

Objetivo: o `painel-cliente.html` do cível deve funcionar como o portal criminal
(`/portal/painel-cliente.html`, visual "aplicativo" V3), consumindo o mesmo
Apps Script, mas com as abas da Central Cível.

Passos:
1. Ler `civel/painel-cliente.html`, `civel-painel-auth.js`, `civel-api-config.js`
   e comparar com `portal/painel-cliente.html` da raiz (referência de visual V3).
2. Login/consulta: tudo passa pela URL única `CIVEL_API_URL` (/exec).
   Se a URL não responder, mostrar mensagem clara de erro — nunca travar em silêncio
   nem usar dados fictícios.
3. Segurança (obrigatório): minimizar dados exibidos, não expor CPF/token,
   limitar tentativas de login, validar entradas no servidor (Apps Script),
   nunca declarar "conformidade LGPD" sem análise específica.
4. Testes locais com acesso de teste criado na Central (aba Acessos) — como já
   se faz no criminal. Nada de cliente real até o chefe validar.
5. A URL do Apps Script não muda entre versões; quem alterar o `.gs` deve
   instruir o chefe a reimplantar como "Nova versão" (as DUAS implantações,
   quando for o projeto Portal do Cliente).

## 3. MISSÃO B — AJUSTAR O DESIGN DAS PÁGINAS

1. Referência de identidade: `codeleicivel/civel-v2.css`, `platinum-ui.js`,
   `structure.js` (header/submenus). Manter a identidade "Advocacia Patrimonial".
2. Padrão de trabalho: começar pelas páginas de maior tráfego (index + as 3-4
   soluções principais), em lotes pequenos, com backup em
   `civel/_ferramentas/backups/<data>-<nome>/`.
3. Responsivo obrigatório: testar 1440 / 1200 / 390px (mesmo padrão de testes
   Puppeteer do criminal — evidências em `civel/_ferramentas/relatorios/`).
4. Não remover: canonical, metadados, H1, FAQ/schema, scripts de conversão,
   consentimento de cookies, CTAs de WhatsApp e fallback do Apps Script.
5. Mudança de design não pode alterar o sentido jurídico do texto.

## 4. MISSÃO C — MELHORAR O SEO

1. Cada página: title ≤ 60 car., meta description ≤ 155, 1 H1 único,
   FAQPage + schema coerente com o texto visível, canonical correto,
   imagem com alt descritivo.
2. NAP/CEP: só unificar o CEP DEPOIS da confirmação oficial dos Correios
   (pendente do chefe no site inteiro). Enquanto isso, apenas mapear
   onde cada CEP aparece no cível e registrar em `relatorios/`.
3. Sitemap: toda URL nova entra em `civel/sitemap.xml`
   (o `adicionar_url_sitemap.py` da raiz pode servir de modelo; adaptar ao cível).
4. Links internos: guias devem linkar para a solução correspondente
   (ex.: `guia-valor-indenizacao-erro-medico.html` → `erro-medico.html`) e vice-versa.
5. Performance: minificar só com backup; não quebrar codificação;
   evitar scripts duplicados por página.
6. Nada de promessa de resultado ou comparação — conformidade OAB 205/2021.

## 5. FLUXO DE TRABALHO OBRIGATÓRIO

1. **Antes**: ler o `ESTADO-ATUAL-CIVEL-*.md` mais recente em `civel/_ferramentas/`.
2. **Lote pequeno**: uma missão ou grupo de páginas por vez.
3. **Dry-run sempre antes de gravar** (modelo: `aplicar_v2_artigos.py` da raiz).
4. **Backup antes de sobrescrever** → `civel/_ferramentas/backups/`.
5. **Relatório depois** → `civel/_ferramentas/relatorios/RELATORIO-<data>-<tema>.md`
   com: o que mudou, o que foi testado, o que NÃO foi verificado, como reverter.
6. **Publicação**: nunca por iniciativa própria. Preparar pacote em
   `civel/_ferramentas/releases/` e aguardar o chefe subir (FileZilla/Locaweb).
7. Ao terminar a sessão, atualizar o `ESTADO-ATUAL-CIVEL-*.md` (handover).

## 6. CONTATOS E DADOS FIXOS (não alterar sem conferir `agentes/config.py`)

- Telefone: (31) 98942-0094 · WhatsApp: 5531989420094
- Dr. Lucas Renan Semim — OAB/MG 222.539
- Endereço: Rua Cel. Abílio Pereira, 337 – Sabará/MG (CEP divergente no site — ver seção 4.2)
