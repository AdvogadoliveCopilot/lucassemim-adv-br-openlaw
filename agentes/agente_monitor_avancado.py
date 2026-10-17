"""
AGENTE DE MONITORAMENTO AVANÇADO — lucassemim.adv.br
Verifica integridade, latência, segurança e arquivos essenciais do site.
Gera relatório detalhado em HTML (agentes/relatorio_monitor.html) com tabela colorida.
Só LEITURA: não altera nada no site. Revisado em 08/10/2026 (telefone novo, 404 aceito, aviso do WAF corrigido).
"""

import os
import sys
import json
import time
import datetime
import urllib.request
import urllib.error

# Garantir saída UTF-8 no console Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))
try:
    from config import OMNI_BASE, MODELO_ATIVO
except ImportError:
    OMNI_BASE = "http://localhost:20128/api/v1"
    MODELO_ATIVO = None

REPORT_HTML_PATH = os.path.join(os.path.dirname(__file__), "relatorio_monitor.html")
LOG_JSONL_PATH = os.path.join(os.path.dirname(__file__), "log_monitor_avancado.jsonl")

# Definição dos testes solicitados
TESTES = [
    {
        "id": "home_principal",
        "url": "https://lucassemim.adv.br/",
        "descricao": "Página Principal (Home)",
        "status_esperado": [200],
        "seguranca": False,
    },
    {
        "id": "telefone_home",
        "url": "https://lucassemim.adv.br/",
        "descricao": "Telefone novo (31) 98942-0094 no ar na Home",
        "status_esperado": [200],
        "seguranca": False,
        "deve_conter": ["98942-0094"],
        "nao_deve_conter": ["98394-4973", "983944973"],
    },
    {
        "id": "service_worker",
        "url": "https://lucassemim.adv.br/sw.js",
        "descricao": "Service Worker PWA (sw.js)",
        "status_esperado": [200],
        "seguranca": False,
    },
    {
        "id": "seguranca_live_json",
        "url": "https://civel.lucassemim.adv.br/Advogado%20Live.json",
        "descricao": "Advogado Live.json bloqueado ou apagado (Subdomínio Cível)",
        "status_esperado": [403, 404, 410],
        "seguranca": True,
    },
    {
        "id": "sitemap",
        "url": "https://lucassemim.adv.br/sitemap.xml",
        "descricao": "Mapa do Site (sitemap.xml)",
        "status_esperado": [200],
        "seguranca": False,
    },
    {
        "id": "robots",
        "url": "https://lucassemim.adv.br/robots.txt",
        "descricao": "Diretivas para Robôs (robots.txt)",
        "status_esperado": [200],
        "seguranca": False,
    },
    {
        "id": "seguranca_env",
        "url": "https://lucassemim.adv.br/.env",
        "descricao": "Proteção Arquivo Sensível (.env)",
        "status_esperado": [403, 404],
        "seguranca": True,
    },
    {
        "id": "civel_home",
        "url": "https://civel.lucassemim.adv.br/",
        "descricao": "Subdomínio Cível (Home)",
        "status_esperado": [200],
        "seguranca": False,
    },
    {
        "id": "seguranca_git",
        "url": "https://lucassemim.adv.br/.git/",
        "descricao": "Proteção Repositório Git (.git)",
        "status_esperado": [403, 404],
        "seguranca": True,
    },
]


def testar_url(item: dict) -> dict:
    """Executa requisição HTTP, detecta status, latência, tamanho e WAF."""
    url = item["url"]
    status_esperados = item["status_esperado"]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    inicio = time.monotonic()
    status_obtido = 0
    tamanho_bytes = 0
    erro_msg = ""
    corpo_str = ""

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as response:
            status_obtido = response.status
            conteudo = response.read()
            tamanho_bytes = len(conteudo)
            corpo_str = conteudo.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        status_obtido = e.code
        erro_msg = str(e.reason)
        try:
            conteudo = e.read()
            tamanho_bytes = len(conteudo)
            corpo_str = conteudo.decode("utf-8", errors="ignore")
        except Exception:
            tamanho_bytes = 0
    except urllib.error.URLError as e:
        status_obtido = 0
        erro_msg = str(e.reason)
    except Exception as e:
        status_obtido = 0
        erro_msg = str(e)

    latencia_ms = round((time.monotonic() - inicio) * 1000)

    # Detectar interceptação de WAF / Desafio de segurança
    desafio_waf = "Verificação de segurança" in corpo_str or "recaptcha" in corpo_str or "d923032023rdw23u89u834_sec" in corpo_str

    # Formatar tamanho legível
    if tamanho_bytes >= 1024 * 1024:
        tamanho_fmt = f"{tamanho_bytes / (1024 * 1024):.2f} MB"
    elif tamanho_bytes >= 1024:
        tamanho_fmt = f"{tamanho_bytes / 1024:.1f} KB"
    else:
        tamanho_fmt = f"{tamanho_bytes} B"

    esperado_str = " ou ".join(str(s) for s in status_esperados)

    # Avaliação de sucesso
    sucesso = (status_obtido in status_esperados)

    if item["seguranca"]:
        if status_obtido in status_esperados:
            diagnostico = f"OK: Bloqueado com sucesso (HTTP {status_obtido}). Protegido contra acesso público."
        elif desafio_waf:
            # WAF interceptou bots antes do Apache responder
            diagnostico = f"AVISO WAF: Interceptado pelo Firewall Hostinger (HTTP 200 - Desafio Anti-Bot). Arquivo sensível não foi exposto diretamente, mas esperava código HTTP {esperado_str} nativo do Apache."
            sucesso = False
        else:
            diagnostico = f"ALERTA: Retornou HTTP {status_obtido} (esperava {esperado_str}). Verifique permissões no .htaccess!"
            sucesso = False
    else:
        if status_obtido in status_esperados:
            if desafio_waf:
                diagnostico = f"OK: HTTP {status_obtido} recebido (WAF Anti-DDoS ativo no provedor Hostinger)."
            else:
                diagnostico = f"OK: HTTP {status_obtido} recebido com sucesso ({tamanho_fmt})."
        else:
            if status_obtido == 0:
                diagnostico = f"FALHA: Erro de conexão/timeout ({erro_msg})"
            else:
                diagnostico = f"FALHA: Retornou HTTP {status_obtido}, esperado {esperado_str}."

    # Conferência de conteúdo (ex.: telefone certo no ar)
    if item.get("deve_conter") or item.get("nao_deve_conter"):
        if status_obtido == 200 and desafio_waf:
            sucesso = False
            diagnostico = "INCONCLUSIVO: o servidor mostrou a página de verificação anti-robô; confira no navegador."
        elif status_obtido == 200:
            faltando = [x for x in item.get("deve_conter", []) if x not in corpo_str]
            sobrando = [x for x in item.get("nao_deve_conter", []) if x in corpo_str]
            if faltando or sobrando:
                sucesso = False
                diagnostico = "FALHA de conteúdo: " + ("faltando " + ", ".join(faltando) + ". " if faltando else "") + \
                              ("NÃO deveria aparecer: " + ", ".join(sobrando) if sobrando else "")
            else:
                diagnostico = "OK: conteúdo conferido (" + ", ".join(item.get("deve_conter", [])) + " presente; antigo ausente)."

    return {
        "id": item["id"],
        "url": url,
        "descricao": item["descricao"],
        "status_obtido": status_obtido,
        "status_esperado": esperado_str,
        "latencia_ms": latencia_ms,
        "tamanho_bytes": tamanho_bytes,
        "tamanho_fmt": tamanho_fmt,
        "desafio_waf": desafio_waf,
        "sucesso": sucesso,
        "seguranca": item["seguranca"],
        "diagnostico": diagnostico,
        "erro": erro_msg,
    }


def gerar_relatorio_html(resultados: list, timestamp: str) -> str:
    """Gera página HTML com dashboard visual, resumo e tabela colorida."""
    total = len(resultados)
    aprovados = sum(1 for r in resultados if r["sucesso"])
    reprovados = total - aprovados
    latencia_media = round(sum(r["latencia_ms"] for r in resultados) / max(1, total))
    tem_waf = any(r["desafio_waf"] for r in resultados)

    status_geral_cor = "#10b981" if reprovados == 0 else "#f59e0b" if (reprovados <= 3 and tem_waf) else "#ef4444"
    if reprovados == 0:
        status_geral_texto = "TODOS OS SISTEMAS EM CONFORMIDADE (100% OK)"
    elif tem_waf:
        status_geral_texto = f"ATENÇÃO: WAF / FIREWALL HOSTINGER ATIVO ({reprovados} URLs COM DESAFIO ANTI-BOT)"
    else:
        status_geral_texto = f"ALERTA: {reprovados} FALHA(S) DETECTADA(S)"

    linhas_tabela = ""
    for r in resultados:
        tr_class = "row-success" if r["sucesso"] else "row-danger"
        badge_class = "badge-success" if r["sucesso"] else "badge-danger"
        badge_txt = "APROVADO" if r["sucesso"] else ("WAF / 200" if r["desafio_waf"] else "FALHA")

        linhas_tabela += f"""
        <tr class="{tr_class}">
            <td style="text-align: center;"><span class="badge {badge_class}">{badge_txt}</span></td>
            <td><strong>{r['descricao']}</strong><br><a href="{r['url']}" target="_blank" class="url-link">{r['url']}</a></td>
            <td style="text-align: center; font-weight: bold; font-family: monospace;">{r['status_obtido'] or 'ERR'}</td>
            <td style="text-align: center; color: #94a3b8; font-family: monospace;">{r['status_esperado']}</td>
            <td style="text-align: right; font-family: monospace;">{r['latencia_ms']} ms</td>
            <td style="text-align: right; font-family: monospace;">{r['tamanho_fmt']}</td>
            <td><small>{r['diagnostico']}</small></td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório do Monitor Avançado — Lucas Semim Advogados</title>
    <style>
        :root {{
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: #334155;
            --success: #10b981;
            --success-bg: rgba(16, 185, 129, 0.14);
            --danger: #ef4444;
            --danger-bg: rgba(239, 68, 68, 0.16);
            --warning: #f59e0b;
            --accent: #3b82f6;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }}
        body {{
            background-color: var(--bg);
            color: var(--text-main);
            padding: 2.5rem 1.5rem;
            line-height: 1.5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border);
        }}
        h1 {{
            font-size: 1.8rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        .timestamp {{
            color: var(--text-muted);
            font-size: 0.9rem;
        }}
        .status-banner {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: {status_geral_cor}15;
            border: 1px solid {status_geral_cor};
            padding: 1.2rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }}
        .status-title {{
            font-weight: bold;
            color: {status_geral_cor};
            font-size: 1.15rem;
        }}
        .cards-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
            margin-bottom: 2.5rem;
        }}
        .card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.2rem;
        }}
        .card-label {{
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 0.4rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        .card-value {{
            font-size: 1.8rem;
            font-weight: 700;
        }}
        .card-val-green {{ color: var(--success); }}
        .card-val-red {{ color: var(--danger); }}
        .card-val-yellow {{ color: var(--warning); }}
        .card-val-blue {{ color: var(--accent); }}

        .notice-box {{
            background: rgba(59, 130, 246, 0.1);
            border-left: 4px solid var(--accent);
            padding: 1rem 1.2rem;
            border-radius: 4px;
            margin-bottom: 2rem;
            font-size: 0.92rem;
            color: #cbd5e1;
        }}
        .notice-box strong {{
            color: #fff;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--card-bg);
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border);
        }}
        th {{
            background: #111827;
            padding: 1rem;
            font-size: 0.85rem;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
        }}
        td {{
            padding: 0.9rem 1rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.95rem;
        }}
        tr:last-child td {{
            border-bottom: none;
        }}
        .row-success {{
            background-color: var(--success-bg);
        }}
        .row-danger {{
            background-color: var(--danger-bg);
        }}
        .badge {{
            display: inline-block;
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.03em;
        }}
        .badge-success {{
            background: var(--success);
            color: #064e3b;
        }}
        .badge-danger {{
            background: var(--danger);
            color: #ffffff;
        }}
        .url-link {{
            color: #60a5fa;
            text-decoration: none;
            word-break: break-all;
            font-size: 0.85rem;
        }}
        .url-link:hover {{
            text-decoration: underline;
        }}
        footer {{
            margin-top: 3rem;
            text-align: center;
            font-size: 0.85rem;
            color: var(--text-muted);
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>🛡️ Monitor Avançado de Saúde e Segurança</h1>
                <div class="timestamp">Lucas Semim Advogados (lucassemim.adv.br) — Relatório em tempo real</div>
            </div>
            <div class="timestamp">
                Executado em: <strong>{timestamp}</strong>
            </div>
        </header>

        <div class="status-banner">
            <div>
                <div class="status-title">{status_geral_texto}</div>
                <div style="font-size: 0.9rem; color: var(--text-muted);">Verificação de latência, códigos HTTP, segurança de rotas e arquivos críticos</div>
            </div>
            <div>
                <span class="badge {'badge-success' if reprovados == 0 else 'badge-danger'}" style="font-size: 1rem; padding: 0.5rem 1rem;">
                    {aprovados}/{total} APROVADOS
                </span>
            </div>
        </div>

        <div class="cards-grid">
            <div class="card">
                <div class="card-label">Testes Executados</div>
                <div class="card-value">{total}</div>
            </div>
            <div class="card">
                <div class="card-label">Testes Aprovados</div>
                <div class="card-value card-val-green">{aprovados}</div>
            </div>
            <div class="card">
                <div class="card-label">Alertas / WAF</div>
                <div class="card-value {'card-val-yellow' if reprovados > 0 else 'card-val-green'}">{reprovados}</div>
            </div>
            <div class="card">
                <div class="card-label">Latência Média</div>
                <div class="card-value card-val-blue">{latencia_media} ms</div>
            </div>
        </div>

        <div class="notice-box">
            <strong>ℹ️ Como ler este relatório:</strong> os testes de segurança esperam HTTP 403 (bloqueado) ou 404 (apagado). Se o servidor responder com a página de verificação anti-robô (HTTP 200), o resultado é <em>inconclusivo</em>: isso <strong>não</strong> prova que o arquivo está protegido — abra o endereço no navegador para confirmar.
        </div>

        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th style="width: 110px; text-align: center;">Resultado</th>
                        <th>Recurso & URL</th>
                        <th style="width: 90px; text-align: center;">Retorno</th>
                        <th style="width: 100px; text-align: center;">Esperado</th>
                        <th style="width: 90px; text-align: right;">Latência</th>
                        <th style="width: 100px; text-align: right;">Tamanho</th>
                        <th>Diagnóstico Detalhado</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas_tabela}
                </tbody>
            </table>
        </div>

        <footer>
            Monitoramento Automático — Lucas Semim Advogados (lucassemim.adv.br)
        </footer>
    </div>
</body>
</html>
"""
    return html


def executar_monitoramento():
    """Executa a rotina completa do monitor avançado."""
    agora = datetime.datetime.now()
    timestamp_str = agora.strftime("%d/%m/%Y %H:%M:%S")

    print("=" * 75)
    print("INICIANDO MONITOR AVANCADO -- LUCAS SEMIM ADVOGADOS")
    print(f"Horario de execucao: {timestamp_str}")
    print("=" * 75)

    resultados = []
    for item in TESTES:
        res = testar_url(item)
        resultados.append(res)
        tag = "[OK]  " if res["sucesso"] else "[ALERTA]"
        print(f" {tag} [{res['status_obtido']:3d}] {res['latencia_ms']:4d}ms | {res['descricao']:<40} | {res['tamanho_fmt']}")
        if not res["sucesso"]:
            print(f"       -> {res['diagnostico']}")

    # Gravar HTML
    html_content = gerar_relatorio_html(resultados, timestamp_str)
    with open(REPORT_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_content)

    # Gravar log JSONL histórico
    registro_log = {
        "timestamp": agora.isoformat(),
        "total": len(resultados),
        "aprovados": sum(1 for r in resultados if r["sucesso"]),
        "reprovados": sum(1 for r in resultados if not r["sucesso"]),
        "detalhes": resultados,
    }
    with open(LOG_JSONL_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(registro_log, ensure_ascii=False) + "\n")

    print("\n" + "=" * 75)
    aprovados = registro_log["aprovados"]
    total = registro_log["total"]
    print(f"RESUMO: {aprovados}/{total} aprovados | {registro_log['reprovados']} alertas (incluindo interceptacoes WAF)")
    print(f"Relatorio HTML gerado e salvo em:")
    print(f"  file:///{REPORT_HTML_PATH.replace(os.sep, '/')}")
    print("=" * 75)

    return registro_log


if __name__ == "__main__":
    executar_monitoramento()
