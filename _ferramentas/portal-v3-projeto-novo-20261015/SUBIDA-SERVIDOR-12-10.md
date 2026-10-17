# Subida do pacote de 12/10 para o servidor — checklist do FileZilla

Você pediu para enviar os arquivos atualizados ao servidor. Eu não envio: não manuseio a senha do FTP e o link com o seu computador está fora do ar. O seu pedido vale como o OK do pacote de 12/10 (109 arquivos, 4,3 MB). Quem sobe é você, pelo FileZilla, nesta ordem. Os detalhes completos estão no `LEIA-ME-SUBIDA.txt`, dentro de `_ferramentas\subida-20261012\`; esta folha é o resumo de execução.

Pasta de origem: `C:\Users\adm\Desktop\lucassemim.adv.br\_ferramentas\subida-20261012\`

Suba SÓ pelas pastas de grupo (1 a 5). Não suba pelos caminhos da raiz do site: depois de 12/10 outros agentes mexeram em arquivos da raiz (por exemplo `painel-gestao-admin.html` e `js/ls-api-config.js`), e as pastas de grupo guardam a versão certa de cada arquivo.

## Antes de começar (10 minutos)
1. Dê dois cliques em `verificar-pacote.bat` (dentro de `subida-20261012`). Esperado: "Tudo certo". É a conferência que eu não consigo fazer daqui: compara cada arquivo do seu PC com o manifesto. Se disser que algum difere, pare e me mande o texto.
2. Backup do servidor (é o que garante voltar atrás). No FileZilla, arraste do lado direito para uma pasta sua (ex.: `Desktop\backup-servidor-20261015`): `.htaccess`, `index.html`, `sitemap.xml`, `sitemap-urgencia.xml`, `sw.js`, `llms.txt` e as pastas `css`, `js`, `advogado-criminalista` e `o-que-fazer-agora`. Se a Locaweb oferecer ponto de restauração no painel, gere um também.
3. FileZilla, três ajustes (uma vez só): menu **Servidor → Forçar exibição de arquivos ocultos** (para ver o `.htaccess`); **Transferência → Tipo de transferência → Binário**; **Transferência → Ação padrão se o arquivo já existe → Sobrescrever**.
4. Considerei confirmados, pelo seu OK, os seis fatos que o site afirma (item 1 do `LEIA-ME-SUBIDA.txt`): plantão 24h todos os dias; cidades atendidas, presencial em Sabará e BH e virtual para qualquer cidade; "Área do cliente" na home; texto de LGPD da Central do Caso; legendas da faixa de fotos das delegacias; parágrafo do Tema 1.439 do STJ. Se algum não for verdade, me avise antes de subir e eu tiro do texto.

## A ordem (termine um grupo, espere a fila do FileZilla zerar, só então comece o próximo)
Em cada grupo: lado ESQUERDO = abra a pasta do grupo; lado DIREITO = abra `/public_html`. Selecione TUDO que aparece dentro da pasta do grupo e arraste para a direita. Não arraste a pasta do grupo em si (senão cria uma pasta "1-primeiro" no servidor).

| Ordem | Pasta | Arquivos | O que é |
|---|---|---|---|
| 1 | `1-primeiro` | 49 | css, js, codelei e img: o apoio que as páginas chamam |
| 2 | `2-paginas` | 55 | 6 páginas da raiz (404, diagnostico, emergencia, faq, politica-privacidade, llms.txt), 18 de `advogado-criminalista/` e 31 de `o-que-fazer-agora/` |
| 3 | `3-mapas` | 2 | `sitemap.xml` e `sitemap-urgencia.xml` |
| 4 | `4-home-e-sw` | 2 | `index.html` (home) e `sw.js`. Ao terminar, abra a home com Ctrl+F5 e confira; se estiver bem, siga |
| 5 | `5-htaccess-por-ultimo` | 1 | `.htaccess`. Ao terminar, abra a home e uma página interna |

Por que essa ordem: o servidor guarda css e js por 1 ano no navegador do visitante. Se a página subir antes do css ou js, o visitante pode guardar o arquivo velho sob o nome novo.

## Conferir depois (janela anônima, Ctrl+F5, "Rejeitar" nos cookies)
- Home: título "FAMILIAR PRESO? SAIBA O QUE FAZER AGORA."; WhatsApp e ligação mostram (31) 98942-0094 (abrir o link basta).
- `/advogado-criminalista/` abre; abra Sabará e Belo Horizonte.
- `/o-que-fazer-agora/` abre; abra `revista-pessoal-abordagem-policial-o-que-fazer.html` e `meu-filho-foi-preso.html`.
- `/faq.html`, `/emergencia.html`, `/diagnostico.html` e `/politica-privacidade.html` abrem sem erro.
- Um endereço que não existe mostra a 404 nova.
- `/o-que-fazer-agora/politica-privacidade.html` leva para `/politica-privacidade.html`.
- `/sitemap.xml` (74 endereços) e `/sitemap-urgencia.xml` (31) abrem como XML.
- Celular: home, 1 guia e 1 cidade. `https://civel.lucassemim.adv.br/` continua abrindo.
- Search Console: Sitemaps → adicionar `sitemap.xml` e `sitemap-urgencia.xml`; Inspeção de URL → "Solicitar indexação" de `/`, `/advogado-criminalista/`, `/o-que-fazer-agora/` e do guia da revista pessoal.

Quando terminar, me avise e cole aqui no chat os endereços que quer que eu confira (a home, `/sitemap.xml`, uma cidade, um guia): eu só consigo abrir páginas públicas cujo endereço você colou na conversa.

## Se algo der errado
- ERRO 500 ou site fora do ar logo depois do grupo 5: quase sempre é o `.htaccess`. No servidor, botão direito no `.htaccess` → Renomear para `htaccess-com-erro.txt`. Depois envie o `.htaccess` do seu backup (item 2) ou, se não tiver, o `reverter\htaccess-anterior.txt` (versão de 08/10, 17.226 bytes) para `/public_html` e renomeie no servidor para `.htaccess`. O site volta na hora. Me avise.
- Uma página com problema: reenvie a versão do backup e me diga qual é.
- Página sem cores ou com aparência antiga: quase sempre é css ou js que não subiu, ou cache. Ctrl+Shift+R; se continuar, reenvie o grupo 1.

## O que NÃO subir (nunca nesta rodada)
- A pasta `_ferramentas` inteira, `agentes`, `apps-script`, `clientes`, `templates`, `dados`, `.vscode`, `civel\Claude outputs`.
- Arquivos `.py`, `.bat`, `.ps1`, `.md`, `.gs`; `Advogado Live.json`; `.claude-config.php`; `CLAUDE.md` e `CLAUDE_HANDOVER.md`.
- `painel-gestao-admin.html`: a versão modificada pelo outro agente depende de um roteador que ninguém conferiu. O original de 12/10 está em `_restaurar/`.
- `portal/_temp-antigo.html`: sobra de um "renomear" do outro agente.
- O novo `portal/painel-cliente.html` de 14/10 (visual de aplicativo): ainda precisa ser ajustado ao V3 e testado. A página do cliente que sobe é a de `site-modo-novo/`, só na etapa 6 do `INSTALAR_PROJETO_NOVO.md`, depois que o projeto novo estiver instalado e testado.
- Os 189 artigos (`news\` e `defesa-criminal\`): ainda têm termos que a OAB não aceita e serão corrigidos no Lote H, para subir de uma vez.

## Sobre a "Área do cliente" da home
Até o projeto novo estar instalado e a página do cliente ajustada subir (etapa 6 do `INSTALAR_PROJETO_NOVO.md`), o login do portal não atende cliente real. Pelo que você disse em 12/10 (ainda ia criar o primeiro usuário), ainda não há cliente real usando, então o risco é baixo; se já houver, me avise. Se preferir, faça primeiro o `INSTALAR_PROJETO_NOVO.md` (cerca de 15 minutos, independe do servidor) e depois suba o pacote.
