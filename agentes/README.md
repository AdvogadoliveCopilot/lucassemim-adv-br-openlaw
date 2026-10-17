# Agentes — lucassemim.adv.br

Atualizado em 08/10/2026. Os agentes preparam artigos de defesa criminal com IA (via OmniRoute) e deixam tudo em
**rascunho**. Nada vai para o site sem você revisar e mandar publicar.

> Esta pasta **nunca** deve ser enviada ao servidor (FileZilla). Ela tem as rotinas e os dados internos do escritório.
> O arquivo `.htaccess` daqui é só uma trava extra, caso alguém suba a pasta por engano.

## Como funciona

```
OmniRoute (http://localhost:20128)  <-  combos "auto/..." só com Gemini atuais
  1 PESQUISADOR  auto/best-fast      tema da fila -> pauta -> briefing
  2 REDATOR      auto/legal-writer   briefing -> artigo em HTML no padrão do site
  3 SEO          auto/smart          confere título, meta, H1, schema, links + travas de ética
  4 RASCUNHO     auto/coding         grava em agentes\rascunhos\ (publica só quando você manda)
  5 MONITOR      auto/best-fast      site no ar, telefone novo, arquivos que devem estar bloqueados
```

## Primeira vez (uns 5 minutos)

1. Deixe o **OmniRoute** aberto.
2. Dois cliques em **`setup_segredos.bat`** e digite a senha do FTP quando pedir (nada aparece na tela).
   Só você digita. Ela fica criptografada no seu Windows (`%APPDATA%\LucasSemimAgentes`), fora da pasta do site.
3. Rode `python pipeline.py --testar`. Ele testa cada combo e o FTP e **não publica nada**.

Se você ainda não guardou a senha, tudo funciona do mesmo jeito: o `--publicar` grava a página na pasta do site e mostra
os 2 arquivos para você subir pelo FileZilla.

## Dia a dia

```
python pipeline.py                      gera 1 rascunho (próximo tema da fila)
python pipeline.py --tema "texto livre" idem, com o tema que você escolher
python pipeline.py --listar             mostra os rascunhos aguardando revisão
```

**Revisão:** abra `rascunhos\AAAA-MM-DD_slug\REVISAO.txt` (erros, avisos e as citações de lei para conferir) e o
`artigo.html` no navegador. Pode editar o `artigo.html` à vontade. Quando estiver bom:

```
python pipeline.py --publicar SLUG              pede para você digitar PUBLICAR
python pipeline.py --publicar SLUG --sem-ftp    só grava na pasta do site (você sobe pelo FileZilla)
python pipeline.py --descartar SLUG             não serviu: vai para _descartados e o tema volta para a fila
```

Publicar envia **somente 2 arquivos**: a página nova e o `sitemap.xml` (o sitemap do servidor é baixado e guardado em
`backups_publicacao\` antes de ser alterado). O publicador não sobrescreve página existente sem `--sobrescrever`.

## Travas de ética e segurança (`compliance.py`)

- **Bloqueiam a publicação (erro):** promessa de resultado, marcador `[CONFERIR]` pendente, telefone antigo ou de teste,
  código ativo no texto (script, iframe, formulário), diferente de 1 H1, JSON-LD inválido, telefone novo ausente.
- **Avisam:** preço ou mercantilização, afirmação com data, valores em reais.
- **Listam as citações** (artigo, súmula, lei, tema, HC/REsp) para você conferir antes de publicar.
- A IA **não tem internet**. Por isso os temas são "permanentes" (direitos, procedimentos, prazos, teses). Notícia e
  jurisprudência nova só entram se você acrescentar à mão. Regras do Provimento 205/2021 estão nos prompts.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `config.py` | Configuração central (sem segredos): modelos, pasta do site, dados do escritório, telefone |
| `pipeline.py` | Comando principal (veja "Dia a dia") |
| `agente_pesquisador.py` / `agente_redator.py` / `agente_seo.py` | Agentes 1, 2 e 3 |
| `agente_publicador.py` | Agente 4: rascunho, publicar, descartar |
| `agente_monitor.py` | Agente 5: checagem rápida (só leitura) |
| `agente_monitor_avancado.py` | Relatório visual completo em `relatorio_monitor.html` |
| `motor_retroalimentacao.py` | Atualiza a memória editorial e a fila de temas |
| `omni_client.py` | Conversa com o OmniRoute (tentativas, combos de reserva, log sem conteúdo dos prompts) |
| `compliance.py` | Travas de ética, segurança e sanitização do HTML |
| `memoria.py` / `banco_memoria_conteudo.json` | Fila de temas e histórico do que já foi coberto |
| `ftp_util.py` | FTP (tenta FTPS primeiro; nunca imprime a senha) |
| `configurar_omniroute_combos.py` | Definição dos 6 combos (para recriar se perder a configuração) |
| `setup_segredos.bat` / `.ps1` | Guarda a senha do FTP (e, se quiser, a chave do OmniRoute) criptografadas |
| `SETUP_OMNIROUTE.md` | Guia do OmniRoute: combos, modelos, chaves, política da Anthropic |
| `update_*.py` | **Obsoletos** (não fazem mais nada; originais no backup) |
| `_backup_20261008\` | Cópia dos arquivos originais de antes desta reforma (senha removida) |
| `backup_omniroute\` | Combos do OmniRoute como estavam antes de 08/10/2026 |

Gerados durante o uso: `rascunhos\`, `backups_publicacao\`, `output_*.json` (último ciclo), `log_pipeline.jsonl`,
`log_ia.jsonl` (qual modelo respondeu, tempo e erros; sem o texto dos prompts), `log_monitor.jsonl`,
`log_publicacoes.jsonl`, `status_provedores.json` (último `--testar`).

## Agendamento (opcional)

`python pipeline.py --agendar` cria duas tarefas diárias no Windows (confira em `taskschd.msc`):
**LucasSemim_Rascunho** às 03:00 (só gera rascunho) e **LucasSemim_Monitor** às 06:00. O PC e o OmniRoute precisam
estar ligados nesses horários. Se existir a tarefa antiga **LucasSemim_Pipeline**, apague-a para não gerar dois rascunhos.

## Telefone do escritório

Número definitivo desde 08/10/2026: **(31) 98942-0094** (WhatsApp `5531989420094`). Fica em um só lugar, no `config.py`
(`TELEFONE`, `TELEFONE_E164`, `WHATSAPP_NUM`); o número antigo está em `TELEFONES_PROIBIDOS` e trava qualquer página
nova que ainda o contenha.

## Segurança

- Não existe senha neste arquivo nem no `config.py`. Segredos: `setup_segredos.bat` ou as variáveis de ambiente
  `LS_FTP_PASS` e `OMNIROUTE_API_KEY`.
- A senha do FTP ficava em texto puro no `config.py` antigo. Por precaução, troque a senha do FTP no painel da Hostinger
  e rode `setup_segredos.bat` de novo.
- Chave do Gemini e logins dos provedores ficam **só no painel do OmniRoute**, nunca em arquivo desta pasta.
- `setup_segredos.bat remover` apaga os segredos guardados.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| "OmniRoute não está respondendo" | Abra o OmniRoute (http://localhost:20128) e rode de novo |
| Erro 429 / cota | Normal no plano gratuito: o cliente tenta o próximo modelo e depois os combos de reserva sozinho |
| Rascunho com `[CONFERIR]` | Confira a citação, corrija o texto no `artigo.html` e apague o marcador |
| Acentos estranhos no terminal | Os agentes já forçam UTF-8; use o Terminal do Windows ou PowerShell atual |
| `--publicar` sem FTP | Use `--sem-ftp` e suba os 2 arquivos indicados pelo FileZilla |
