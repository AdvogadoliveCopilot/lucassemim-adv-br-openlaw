# Passagem de turno — para o Claude Code (15/10/2026, fim da tarde)

**De:** agente auxiliar (sessão encerrada). **Para:** Claude, ao acordar.
**Regra de ouro do projeto:** nada sobe para o servidor / Apps Script / Drive / planilha sem o OK do Dr. Lucas. Toda subida vem com backup antes e conferência depois.

---

## PARTE 1 — O QUE EU FIZ NESTA SESSÃO (confira item a item)

### A. Portal do Cliente V2 (front) — 14/10 à noite
- `portal/painel-cliente.html` foi **reescrito por completo** (~1.940 linhas, autocontido, um único `<script>`). Backup do V1 em `_ferramentas/portal-v2-rascunho/backup-painel-cliente-20261014.html`.
- Novidades: shell de app com sidebar (5 telas: Início, Meu Processo, Documentos, Pedidos, Notificações), dropzone drag & drop de documentos, biblioteca `portal_docs` agrupada por subpasta, pedidos com pill de status, tema claro/escuro próprio (`ls_portal_tema`), mobile com bottom-nav + FAB dourado.
- Segurança preservada do V1: POST no corpo, token só em `sessionStorage`, timeout 40 s, `escapar()` (textContent) em todo dado do servidor, modo `#demo` sem rede, `noindex/nofollow`.
- **Divergências V1→V2 no contrato** documentadas no fim de `_ferramentas/contrato-api-paineis.md`: `movimentacoes[]` virou `{data,titulo,texto}`, `resumo` virou objeto `{proximoPrazo:{data,descricao},pendencias}`, `pedidos[].tipo` com valores curtos, `notificacoes[]` é campo novo. **O backend precisa escolher: adotar o formato V2 ou reverter o contrato — escolher UM e não deixar os dois desencontrados.**
- Nota: o front V2 envia upload como **dataURL completo** — o backend precisa dar strip do prefixo `data:...;base64,`.

### B. Projeto NOVO no Apps Script (Portal V3 + Central de Comandos) — 15/10 (a maior parte do trabalho de hoje)
Este é o ponto mais importante da passagem: **existe agora um projeto Google NOVO e separado do "Advogado Live"**, instalado e testado na conta doutorbrnews@gmail.com. Documentação completa em `apps-script/projeto-novo-20261015/ESTADO-INSTALACAO-20261015.md`. Resumo:

| Item | Estado |
|---|---|
| Projeto "Portal do Cliente – Lucas Semim" | Criado, 3 arquivos: `00_Roteador_PROJETO_NOVO.gs` (Código.gs), `32_Portal_Cliente_V3.gs` (~111 KB), `CentralComandos.html` (~104 KB). Cópias locais em `apps-script/projeto-novo-20261015/`. |
| Planilha "Portal do Cliente – Banco de dados" | Criada, 8 abas `PORTAL_*`, dentro da pasta do portal no Drive. Não editar à mão. |
| Pasta Drive "Portal do Cliente – Lucas Semim" | Criada com `01_Clientes`, `02_Modelos`, `03_Arquivo_morto`, `04_Backups`. |
| Rotina diária 3h + backup dominical da planilha | Ligada. |
| Implantação "Portal API" (v1) | Ativa, executa como dono, acesso público: `https://script.google.com/macros/s/AKfycbwQjmF-cyZ4NwLLLI79rXEVCxlhydj25kGOUDQ-XJuZdozeegL-jSc6t0Nrak8a39XT/exec` |
| Implantação "Central de Comandos" (v2) | Ativa, executa como quem acessa, só para o advogado: `https://script.google.com/macros/s/AKfycbyF2nd6wrKFbWw4v9tyTYDm0gadlzsM1B5zi7eLNQM5kAnfW9nnNimMR65TyXT8cJUT/exec` |
| `portal3Testes` / `portal3Diagnostico` | Passaram ("Todos os testes do Portal V3 passaram…"). |
| Defeito corrigido no teste | Texto começando com `=` virava fórmula na planilha — corrigido na função `pc3Esc_`. Sem cliente real ainda, sem dado perdido. |

### C. Pacote de ligação site ↔ Portal V3 — pronto, NÃO enviado
- `_ferramentas/subida-portal-novo-20261015/` contém o pacote: só **2 arquivos** mudam no site (`js/ls-api-config.js` com a linha `apiUrlPortal` nova, e `portal/painel-cliente.html` ajustado para o V3), com SHA-256 conferido, ordem de subida escrita, backup do servidor como passo 1 e caminho de reversão documentado em `LEIA-ME-SUBIDA-PORTAL.txt`.
- Backups de pré-subida já tirados: `_ferramentas/backups/servidor-antes-portal-novo-20261015/` e `servidor-antes-subida-20261015/`.
- **Nada disso foi enviado ao servidor ainda.** É a etapa 6 do `INSTALAR_PROJETO_NOVO.md` e depende do OK do Dr. Lucas + do acesso de teste criado.

### D. Imagens de tela
`_ferramentas/tela-atual.png`, `tela-fz.png`, `tela-fz2.png`, `tela-fz3.png` — capturas usadas para conferência visual do painel. Use como referência do estado atual.

---

## PARTE 2 — MINHA OPINIÃO SOBRE AS ATUALIZAÇÕES (leia com senso crítico)

1. **A decisão do projeto novo foi a certa.** O "Advogado Live" tem histórico e acoplamento (formulários, bets, cível, Central do Caso); misturar o portal nele era risco de derrubar `doGet`/`doPost` uns aos outros. Isolou-se o risco: se o V3 falhar, o site público e os formulários nem sabem.
2. **O V3 já nasce com o essencial certo:** senha nunca em claro (pepper + sha256), autoteste com limpeza dos próprios dados, planilha blindada contra injeção de fórmula (`pc3Esc_`), Central só para o advogado, aviso por e-mail, backup dominical. É alicerce decente, não protótipo jogado.
3. **Meu receio nº 1 — duas fontes de verdade.** Hoje coexistem: a API antiga (site), o Portal V3 novo, e o desenho V2 do front com divergências de contrato. Se alguém subir o `painel-cliente.html` do pacote sem decidir o contrato, o cliente real vai ver telas com campos vazios. **Antes de qualquer subida: feche o contrato único (seção final de `contrato-api-paineis.md`) e verifique que o `32_Portal_Cliente_V3.gs` devolve exatamente esse formato.**
4. **Meu receio nº 2 — o teste no Google foi com contas do próprio sistema.** A única verificação "ponta a ponta de verdade" (navegador real → site → API nova → planilha) ainda não aconteceu, porque depende do Acesso de teste e da subida. Não presuma que está pronto; teste de verdade antes de dizer pronto.
5. **O `painel-cliente.html` do pacote (40 KB) é menor que o redesign de ~60 KB/1.940 linhas de 14/10.** Provavelmente é uma versão adaptada/compacta para o V3. Confirme qual das duas é a canônica antes de mexer — não tenha duas "versões finais".
6. `PC3_PEPPER` apareceu em registro de trabalho do assistente. Não é urgente (não abre nada sozinho), mas **troque agora, antes do primeiro cliente real** — depois, trocar invalida as senhas deles.

---

## PARTE 3 — SUA LISTA DE TRABALHO AO ACORDAR (em ordem)

1. **Ler primeiro:** `apps-script/projeto-novo-20261015/ESTADO-INSTALACAO-20261015.md`, `apps-script/projeto-novo-20261015/INSTALAR_PROJETO_NOVO.md`, `_ferramentas/contrato-api-paineis.md` (fim do arquivo), `_ferramentas/subida-portal-novo-20261015/LEIA-ME-SUBIDA-PORTAL.txt` e `CLAUDE_HANDOVER.md`.
2. **Fechar o contrato único da API** (V2 do front vs. V3 do backend). Decida o formato, atualize `contrato-api-paineis.md` e confira o `32_Portal_Cliente_V3.gs` contra ele, campo por campo (resumo objeto, titulo/texto, notificacoes, tipo curto, strip do dataURL no upload, formato de data — ISO ou `dd/MM/yyyy`, escolha um e documente).
3. **Conferir o que falta no backend V3** (se ainda não existir no `.gs`): `portal_docs`, `portal_doc_link` + registro em `PORTAL_DOCS`, `PORTAL_LINKS_TEMP` com revogação (gatilho), proteção IDOR (cliente só vê a própria pasta), logoutAdmin, flag `expirou`, limite de tentativas de login.
4. **Pedir ao Dr. Lucas:** criar o **Acesso de teste** na Central (aba Acessos) e dar o OK para a subida do pacote.
5. **Subir o pacote de ligação** exatamente pela ordem do `LEIA-ME-SUBIDA-PORTAL.txt` (backup → `ls-api-config.js` → `painel-cliente.html` → Ctrl+F5 → login com o acesso de teste). Rever? Os backups já estão em `_ferramentas/backups/`.
6. **Teste ponta a ponta de verdade** no navegador: login, 5 telas, upload real de documento, abertura de link de documento, pedido com resposta, notificação, tema claro/escuro, mobile.
7. **`.htaccess` (grupo 5 do pacote de 12/10):** último arquivo, o único que pode derrubar o site inteiro. Conferir o site logo após subir. A conferência pública está bloqueada pela verificação de segurança da Hostinger para o IP do Dr. Lucas — só ele resolve; combine com ele. Reversão em `reverter/htaccess-anterior.txt`.
8. **Depois de validado:** desativar `portal/_temp-antigo.html` (V1 renomeado), desativar painéis antigos em `civel/`, e executar a reorganização de pastas (seção 4 das orientações de redesign de 14/10).
9. **Search Console:** adicionar `sitemap.xml` e `sitemap-urgencia.xml`, pedir indexação de `/`, `/advogado-criminalista/`, `/o-que-fazer-agora/` e do guia da revista pessoal.
10. **Opcional e urgente-que-não-parece:** trocar o `PC3_PEPPER` (Propriedades do script → apagar → `portal3Instalar` recria). Só vale ANTES do primeiro cliente real.

## PARTE 4 — Orientações de continuidade do software jurídico (visão além do prazo)

- **Roteiro sugerido pós-portal ( converse com o Dr. Lucas e priorize ):**
  1. Primeiro cliente real no V3 + acompnhamento das primeiras 2 semanas (é o teste de fogo real).
  2. Notificações automáticas de prazo (a planilha já tem dados de prazo; um gatilho diário pode avisar por e-mail o advogado e o cliente — nenhuma infra nova necessária).
  3. Modelos de documento em `02_Modelos` virarem geração automática por caso (o Drive e a planilha já sustentam).
  4. Relatório semanal automático para o advogado (casos ativos, pendências, pedidos sem resposta) — barato e de alto valor percebido.
  5. Só depois: integração entre o portal V3 e o conteúdo do site (áreas de urgência, `o-que-fazer-agora`), e aí sim pensar em CSP no `.htaccess`.
- **Princípios que não pode quebrar ao continuar:** POST sempre no corpo; token de sessão só em `sessionStorage`; `escapar()`/textContent em todo dado do servidor; nunca apagar arquivo de cliente (só a pasta `AUTOTESTE` vai para a lixeira); nunca compartilhar pasta de cliente; genérico em resposta de ação desconhecida; o `00_Roteador_PROJETO_NOVO.gs` NUNCA vai no projeto "Advogado Live".
- **Ao atualizar o script no futuro:** colar por cima no editor e **reimplantar as DUAS implantações como Nova versão** — os endereços não mudam. Isso é fácil de esquecer e é a causa nº 1 de "subi e nada mudou".
- **Estilo de comunicação com o Dr. Lucas:** ele valoriza relatórios com o quê / onde / como reverter / o que falta. Mantenha esse padrão em `_ferramentas/` com data no nome, como os anteriores.

Boa sorte, Claude. O terreno está mapeado e quase todo o trabalho duro de instalação passou. O que falta é decisão de contrato, um teste de verdade e o OK do chefe.
