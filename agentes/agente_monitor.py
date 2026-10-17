# -*- coding: utf-8 -*-
"""
AGENTE 5 — MONITOR (rápido)
Confere se o site está no ar, se o telefone novo está nas páginas principais e se arquivos que
devem estar bloqueados continuam fora do ar (403/404/410). Só LEITURA: nunca altera nada.
Para o relatório visual completo use  agente_monitor_avancado.py.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config
import omni_client
from util import agora_iso, anexar_jsonl, console_utf8

LOG_FILE = os.path.join(config.PASTA_AGENTES, "log_monitor.jsonl")
UA = "Mozilla/5.0 LucasSemimMonitor/2.0"

URLS_CHECAR = [
    config.SITE_URL + "/",
    config.SITE_URL + "/artigos.html",
    config.SITE_URL + "/emergencia.html",
    "https://civel.lucassemim.adv.br/",
    config.SITE_URL + "/sw.js",
]

# páginas onde o telefone TEM que estar (novo) e NÃO pode estar (antigo)
URLS_TELEFONE = [config.SITE_URL + "/", config.SITE_URL + "/emergencia.html", "https://civel.lucassemim.adv.br/"]

# devem estar fora do ar: 403 (bloqueado), 404 (apagado) ou 410
URLS_BLOQUEADAS = [
    "https://civel.lucassemim.adv.br/Advogado%20Live.json",
    config.SITE_URL + "/.git/",
    config.SITE_URL + "/.env",
]
BLOQUEIO_OK = (403, 404, 410)


def _buscar(url, ler_corpo=False):
    inicio = time.monotonic()
    status, corpo = 0, ""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as r:
            status = r.status
            dados = r.read(400000)
            corpo = dados.decode("utf-8", errors="ignore") if ler_corpo else ""
            tamanho = len(dados)
    except urllib.error.HTTPError as e:
        status, tamanho = e.code, 0
    except Exception:
        tamanho = 0
    return status, tamanho, corpo, round((time.monotonic() - inicio) * 1000)


def _eh_desafio_waf(corpo):
    return "Verificação de segurança" in corpo or "d923032023rdw23u89u834_sec" in corpo


def monitorar():
    ts = agora_iso()
    resultados = []

    print("🔍 Verificando URLs do site...")
    for url in URLS_CHECAR:
        status, tam, _, ms = _buscar(url)
        ok = 200 <= status < 400
        print("  %s %s %dms — %s" % ("✅" if ok else "❌", status, ms, url))
        resultados.append({"url": url, "tipo": "no_ar", "status": status, "ok": ok, "ms": ms, "bytes": tam})

    print("\n📞 Verificando o telefone %s nas páginas principais..." % config.TELEFONE)
    for url in URLS_TELEFONE:
        status, tam, corpo, ms = _buscar(url, ler_corpo=True)
        if status != 200:
            ok, nota = False, "HTTP %s" % status
        elif _eh_desafio_waf(corpo):
            ok, nota = True, "inconclusivo (o servidor mostrou a página de verificação anti-robô)"
        else:
            tem_novo = config.WHATSAPP_NUM in corpo or "98942-0094" in corpo
            tem_antigo = any(p in corpo for p in ("98394-4973", "983944973"))
            ok = tem_novo and not tem_antigo
            nota = "novo OK, antigo ausente" if ok else ("TELEFONE ANTIGO NO AR" if tem_antigo else "telefone novo não encontrado")
        print("  %s %s — %s" % ("✅" if ok else "🚨", nota, url))
        resultados.append({"url": url, "tipo": "telefone", "status": status, "ok": ok, "nota": nota, "ms": ms})

    print("\n🔒 Verificando o que deve estar bloqueado ou apagado (esperado: 403, 404 ou 410)...")
    for url in URLS_BLOQUEADAS:
        status, tam, corpo, ms = _buscar(url, ler_corpo=True)
        if status in BLOQUEIO_OK:
            ok, nota = True, "bloqueado/apagado"
        elif status == 200 and _eh_desafio_waf(corpo):
            ok, nota = False, "inconclusivo: veio a página anti-robô, confira no navegador"
        else:
            ok, nota = False, "RESPONDEU HTTP %s — conferir o .htaccess" % status
        print("  %s %s — %s" % ("✅" if ok else "🚨", nota, url))
        resultados.append({"url": url, "tipo": "bloqueio", "status": status, "ok": ok, "nota": nota, "ms": ms})

    falhas = [r for r in resultados if not r["ok"]]
    urgente = any(r["tipo"] in ("no_ar", "telefone") for r in falhas) or \
        any(r["tipo"] == "bloqueio" and r["status"] == 200 for r in falhas)

    resumo_ia = None
    if falhas:
        prompt = ("Você é assistente de monitoramento de um site jurídico. Resultados:\n%s\n\nFalhas:\n%s\n\n"
                  "Escreva 3 a 5 linhas para o webmaster: o que está com problema, a causa mais provável e o que fazer agora. "
                  "Seja direto e técnico; se algo for inconclusivo por causa de verificação anti-robô, diga isso."
                  % (json.dumps(resultados, ensure_ascii=False)[:6000], json.dumps(falhas, ensure_ascii=False)[:3000]))
        try:
            resumo_ia = omni_client.chat(prompt, papel="monitor", tentativas=2)
        except Exception as e:
            resumo_ia = "(IA indisponível: %s)" % str(e)[:160]

    relatorio = {"ts": ts, "total": len(resultados), "ok": len(resultados) - len(falhas), "falhas": len(falhas),
                 "urgente": urgente, "resultados": resultados, "resumo_ia": resumo_ia}
    anexar_jsonl(LOG_FILE, relatorio)
    return relatorio


if __name__ == "__main__":
    console_utf8()
    rel = monitorar()
    print("\n%s" % ("🚨 ATENÇÃO — há falhas!" if rel["urgente"] else ("⚠️  Há itens para olhar." if rel["falhas"] else "✅ Tudo OK!")))
    print("   %d/%d verificações saudáveis" % (rel["ok"], rel["total"]))
    if rel.get("resumo_ia"):
        print("\n📋 Análise da IA:\n%s" % rel["resumo_ia"])
