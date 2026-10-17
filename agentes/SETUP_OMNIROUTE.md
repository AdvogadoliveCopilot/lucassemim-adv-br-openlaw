# OmniRoute — configuração usada pelos agentes

Atualizado em 08/10/2026 (OmniRoute v3.8.48, painel em http://localhost:20128).
Os agentes não falam direto com nenhuma IA: falam com **combos** do OmniRoute (cadeias de modelos com reserva
automática). Se o 1º modelo falha ou estoura a cota, o OmniRoute passa para o seguinte sozinho.

## Combos atuais (ajustados no painel em 08/10/2026)

| Combo | Quem usa | Ordem dos modelos (1º = primeiro a ser tentado) |
|---|---|---|
| `auto/best-fast` | Pesquisador, Monitor | gemini-3.5-flash, gemini-3-flash-preview, gemini-3.6-flash, gemini-3.5-flash-lite |
| `auto/legal-writer` | Redator | gemini-3.6-flash, gemini-3.5-flash, gemini-3-flash-preview, gemini-3.5-flash-lite, gemini-3.1-pro-preview |
| `auto/pro-chat` | (reserva de redação) | igual ao legal-writer |
| `auto/smart` | SEO | gemini-3.6-flash, gemini-3.5-flash, gemini-3-flash-preview, gemini-3.5-flash-lite |
| `auto/coding` | Publicador | gemini-3.5-flash, gemini-3.6-flash, gemini-3-flash-preview |
| `auto/free` | reserva final | gemini-3.5-flash-lite, gemini-3.1-flash-lite, depois Gemini via navegador (gweb) |

Todos usam a mesma conexão **Gemini (Google AI Studio)** já cadastrada no painel. O combo `lucassemim.adv` (Gemini Web +
Ollama Cloud) não foi alterado.

Tempos medidos ao vivo em 08/10/2026: pauta em JSON 9 s, briefing 19 s, artigo completo de ~930 palavras 29 s; resposta
curta de qualquer combo em 3 a 6 s.

## O que saiu dos combos e por quê

| Saiu | Motivo |
|---|---|
| Gemini 1.5, 2.0 e 2.5 | Aposentados pelo Google: respondem erro 404 |
| Claude (`cc/claude-sonnet-4-6`) | Usa o **login (OAuth) da sua assinatura Claude** dentro de uma ferramenta de terceiros. Veja a seção abaixo: a Anthropic não permite e a sua conta pode ser suspensa |
| DuckDuckGo (`ddgw`), OpenCode (`oc`), `tllm` | Bloqueios/erros (418, 401, 403) nos testes |

Mantidos só no fim: `gemini-3.1-pro-preview` (a cota gratuita costuma ser zero, erro 429) e o Gemini via navegador
`gweb` (devolve a resposta repetida 3 vezes; por isso só aparece no `auto/free`).

## Regra da Anthropic sobre o login Claude em ferramentas de terceiros

Em 19/02/2026 a Anthropic atualizou a página oficial de termos do Claude Code ("Legal and compliance"): os tokens de
login (OAuth) dos planos **Free, Pro e Max** valem **somente** no Claude Code e no claude.ai. Usá-los em outros produtos,
ferramentas ou serviços, inclusive o Agent SDK, viola os termos de consumo; quem integra o Claude em um produto deve usar
**chave de API** (Console da Anthropic) ou um provedor de nuvem suportado.

- Página oficial: https://code.claude.com/docs/en/legal-and-compliance
- Reportagem: https://gigazine.net/gsc_news/en/20260220-anthropic-third-party-block
- Reportagem: https://alternativeto.net/news/2026/2/anthropic-officially-bans-using-subscription-authentication-for-third-party-claude-use

Se um dia quiser o Claude nos agentes: crie uma **chave de API** no Console da Anthropic (cobrança por uso), cadastre-a
como provedor no OmniRoute e inclua o modelo em um combo. Não use o login da assinatura.

## Alerta "API Key Health Alert ... connections: main"

É a conexão **Ollama Cloud** (rótulo `main`), usada só no combo `lucassemim.adv`, que ficou **sem credencial válida**.
Não afeta os combos `auto/...` dos agentes. Para resolver: em Providers > Ollama Cloud, cole uma chave nova (ollama.com) ou
desative a conexão. A decisão é sua; deixei a conexão como estava.

## Chave do OmniRoute (opcional, recomendado)

Enquanto o painel não exigir chave, qualquer programa do seu computador consegue gastar as suas cotas de IA. Se ligar a
opção de exigir chave de API nas configurações do OmniRoute, o painel já tem uma chave chamada `lucassemimadv` (menu API
Manager): copie-a e cole quando o `setup_segredos.bat` pedir a chave do OmniRoute. Os agentes passam a enviá-la sozinhos.

## Testar

```
python pipeline.py --testar
```

Testa cada combo e o FTP, sem publicar nada, e grava o resultado em `status_provedores.json`.
Teste manual no PowerShell (o `max_tokens` precisa ser generoso: os modelos Gemini "pensam" antes de responder e esse
raciocínio conta como token; com `max_tokens` pequeno a resposta volta vazia mesmo com HTTP 200):

```powershell
$b = @{ model = "auto/best-fast"; messages = @(@{ role = "user"; content = "Responda apenas OK" }); max_tokens = 800; stream = $false } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://localhost:20128/v1/chat/completions -Method POST -Body $b -ContentType "application/json" -TimeoutSec 60
```

## Recriar ou desfazer os combos

- As definições estão em `configurar_omniroute_combos.py`. `python configurar_omniroute_combos.py` só mostra;
  `python configurar_omniroute_combos.py --aplicar` grava no banco (**feche o OmniRoute antes**; ele faz uma cópia do banco
  antes de mexer e só toca nos 6 combos `auto/...`).
- Como os combos eram antes de 08/10/2026: `backup_omniroute\combos_antes_20261008.json` (modelos e pesos de cada um).
  Atenção: parte desses modelos já não existe mais (veja a tabela acima).

## Monitoramento

```
python pipeline.py --monitor      checagem rápida (só leitura)
python pipeline.py --relatorio    relatório visual completo em relatorio_monitor.html
```
