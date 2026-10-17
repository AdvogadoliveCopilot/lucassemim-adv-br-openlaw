# -*- coding: utf-8 -*-
r"""
COMBOS DO OMNIROUTE USADOS PELOS AGENTES  (fonte única das definições)
=======================================================================
Em 08/10/2026 os combos foram atualizados DIRETO NO PAINEL do OmniRoute (Combos). Este arquivo guarda
as mesmas definições para você poder recriá-las se algum dia perder a configuração.

  python configurar_omniroute_combos.py             -> só MOSTRA os combos (não altera nada)
  python configurar_omniroute_combos.py --aplicar   -> grava no banco do OmniRoute (feche o OmniRoute antes!)

--aplicar faz uma cópia do banco (storage.sqlite.bak-AAAAMMDD-HHMMSS) antes de mexer e só toca nos 6 combos
"auto/..." abaixo. O combo "lucassemim.adv" e as suas conexões (provedores/chaves) nunca são alterados.

Por que estes modelos (testados ao vivo em 08/10/2026):
  - gemini-3.5-flash e gemini-3-flash-preview: respondem em 1-4 s -> são os primeiros da fila.
  - gemini-3.6-flash e gemini-3.5-flash-lite: funcionam, um pouco mais lentos -> reservas.
  - gemini-3.1-pro-preview: a cota gratuita costuma estar zerada (HTTP 429); fica por último nos combos de redação
    só para o caso de a cota dos Flash acabar e a do Pro existir.
  - FORA: gemini 1.5/2.0/2.5 (404, aposentados), DuckDuckGo "ddgw" (418), OpenCode "oc" (401), "tllm" (403)
    e os modelos Claude "cc/..." (login OAuth da assinatura Claude em ferramenta de terceiros: a política da
    Anthropic de fev/2026 não permite e pode suspender a conta).
  - gweb (Gemini via navegador) devolve a resposta repetida 3 vezes: só aparece no combo auto/free, no fim.
"""
import argparse
import datetime
import json
import os
import shutil
import sqlite3
import sys

DB_PATH = os.path.expanduser(r"~\.omniroute\storage.sqlite")


def _m(modelo, provedor, peso):
    return {"model": modelo, "providerId": provedor, "weight": peso}


G35 = "gemini/gemini-3.5-flash"
G3P = "gemini/gemini-3-flash-preview"
G36 = "gemini/gemini-3.6-flash"
G35L = "gemini/gemini-3.5-flash-lite"
G31L = "gemini/gemini-3.1-flash-lite"
G31P = "gemini/gemini-3.1-pro-preview"

COMBOS_DEFINITION = [
    {"id": "combo-best-fast", "name": "auto/best-fast", "strategy": "priority",
     "description": "Rápido: pesquisa de pautas e monitor. Gemini Flash primeiro.",
     "models": [_m(G35, "gemini", 100), _m(G3P, "gemini", 90), _m(G36, "gemini", 80), _m(G35L, "gemini", 70)]},
    {"id": "combo-pro-chat", "name": "auto/pro-chat", "strategy": "priority",
     "description": "Redação aprofundada. Gemini 3.6 Flash primeiro; Pro só como último recurso.",
     "models": [_m(G36, "gemini", 100), _m(G35, "gemini", 90), _m(G3P, "gemini", 80), _m(G35L, "gemini", 70), _m(G31P, "gemini", 60)]},
    {"id": "combo-smart", "name": "auto/smart", "strategy": "priority",
     "description": "Equilibrado: auditoria de SEO e refinamento.",
     "models": [_m(G36, "gemini", 100), _m(G35, "gemini", 90), _m(G3P, "gemini", 80), _m(G35L, "gemini", 70)]},
    {"id": "combo-coding", "name": "auto/coding", "strategy": "priority",
     "description": "Técnico: HTML, scripts e publicação.",
     "models": [_m(G35, "gemini", 100), _m(G36, "gemini", 90), _m(G3P, "gemini", 80)]},
    {"id": "combo-legal-writer", "name": "auto/legal-writer", "strategy": "priority",
     "description": "Direito Penal, Júri, Tráfico e Audiência de Custódia (artigos longos).",
     "models": [_m(G36, "gemini", 100), _m(G35, "gemini", 90), _m(G3P, "gemini", 80), _m(G35L, "gemini", 70), _m(G31P, "gemini", 60)]},
    {"id": "combo-free", "name": "auto/free", "strategy": "priority",
     "description": "Reserva de baixo custo (modelos lite; Gemini via navegador no fim).",
     "models": [_m(G35L, "gemini", 100), _m(G31L, "gemini", 90),
                _m("gweb/gemini-3.1-flash-lite", "gweb", 70), _m("gweb/gemini-3.5-flash", "gweb", 60)]},
]


def montar_registro(c, ordem, agora):
    passos = []
    for i, m in enumerate(c["models"], start=1):
        passos.append({"id": "%s-model-%d-%s" % (c["id"], i, m["model"].replace("/", "-")), "kind": "model",
                       "model": m["model"], "providerId": m["providerId"], "weight": m["weight"]})
    return {"id": c["id"], "name": c["name"], "strategy": c["strategy"], "models": passos,
            "config": {"description": c["description"]}, "isHidden": False, "sortOrder": ordem,
            "version": 2, "createdAt": agora, "updatedAt": agora}


def mostrar():
    for c in COMBOS_DEFINITION:
        print("%-20s %s" % (c["name"], c["description"]))
        for m in c["models"]:
            print("    %3d  %s" % (m["weight"], m["model"]))
    print("\nSó mostrei. Para gravar no banco do OmniRoute (com ele FECHADO): python configurar_omniroute_combos.py --aplicar")


def aplicar():
    if not os.path.exists(DB_PATH):
        print("Banco do OmniRoute não encontrado em: %s" % DB_PATH)
        return False
    backup = DB_PATH + ".bak-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copyfile(DB_PATH, backup)
    print("Cópia de segurança do banco: %s" % backup)
    agora = datetime.datetime.now(datetime.timezone.utc).isoformat()
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        for ordem, c in enumerate(COMBOS_DEFINITION, start=1):
            blob = json.dumps(montar_registro(c, ordem, agora))
            cur.execute("SELECT id FROM combos WHERE name = ?", (c["name"],))
            if cur.fetchone():
                cur.execute("UPDATE combos SET data = ?, sort_order = ?, updated_at = ? WHERE name = ?",
                            (blob, ordem, agora, c["name"]))
                print("  Atualizado: %s (%d modelos)" % (c["name"], len(c["models"])))
            else:
                cur.execute("INSERT INTO combos (id, name, data, sort_order, created_at, updated_at, context_cache_protection) "
                            "VALUES (?, ?, ?, ?, ?, ?, ?)", (c["id"], c["name"], blob, ordem, agora, agora, 0))
                print("  Criado: %s (%d modelos)" % (c["name"], len(c["models"])))
        conn.commit()
    finally:
        conn.close()
    print("\nPronto. Feche e abra o OmniRoute de novo e rode:  python pipeline.py --testar")
    return True


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true", help="grava as definições no banco do OmniRoute")
    a = ap.parse_args()
    if a.aplicar:
        sys.exit(0 if aplicar() else 1)
    mostrar()
