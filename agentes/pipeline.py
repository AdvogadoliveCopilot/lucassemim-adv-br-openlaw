# -*- coding: utf-8 -*-
"""
PIPELINE PRINCIPAL — lucassemim.adv.br
Pesquisador -> Redator -> SEO -> RASCUNHO (nada vai para o site sem a sua aprovação).

Uso:
  python pipeline.py                     gera um artigo-rascunho (próximo tema da fila)
  python pipeline.py --tema "texto"      idem, com tema escolhido por você
  python pipeline.py --listar            mostra os rascunhos aguardando revisão
  python pipeline.py --publicar SLUG     publica um rascunho já revisado (pede confirmação)
        opções:  --sem-ftp (só grava na pasta do site)  --sobrescrever  --sim
  python pipeline.py --descartar SLUG    move o rascunho para _descartados e devolve o tema à fila
  python pipeline.py --testar            testa OmniRoute (cada combo) e FTP, sem publicar nada
  python pipeline.py --monitor           checagem rápida do site (só leitura)
  python pipeline.py --relatorio         monitor avançado -> relatorio_monitor.html
  python pipeline.py --retroalimentar    atualiza memória editorial e fila de temas
  python pipeline.py --agendar           cria as tarefas diárias no Windows (rascunho 03:00 / monitor 06:00)
"""
import argparse
import datetime
import os
import subprocess
import sys

PASTA = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PASTA)

import config
import omni_client
from util import agora_iso, anexar_jsonl, console_utf8, gravar_json

console_utf8()

ETAPAS = [
    ("agente_pesquisador.py", "AGENTE 1 — PESQUISADOR"),
    ("agente_redator.py",     "AGENTE 2 — REDATOR"),
    ("agente_seo.py",         "AGENTE 3 — SEO"),
    ("agente_publicador.py",  "AGENTE 4 — RASCUNHO"),
]


def _registrar(status, etapa, duracao_s=0):
    anexar_jsonl(os.path.join(PASTA, "log_pipeline.jsonl"),
                 {"ts": agora_iso(), "status": status, "etapa": etapa, "duracao_s": duracao_s})


def _rodar(script, nome, extra=None, timeout=900):
    print("\n" + "=" * 60 + "\n  🤖 %s\n" % nome + "=" * 60)
    env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
    try:
        r = subprocess.run([sys.executable, "-X", "utf8", os.path.join(PASTA, script)] + (extra or []),
                           env=env, timeout=timeout)
    except subprocess.TimeoutExpired:
        print("\n⏱️  %s passou de %d minutos e foi interrompido." % (nome, timeout // 60))
        return False
    except Exception as e:
        print("\n❌ Erro ao executar %s: %s" % (nome, e))
        return False
    return r.returncode == 0


def rodar_pipeline(tema=None, civel=False):
    if civel:
        os.environ["LS_AREA"] = "civel"
        import importlib
        importlib.reload(config)
    inicio = datetime.datetime.now()
    print("\n" + "#" * 60 + "\n  🚀 PIPELINE (modo rascunho) — %s\n" % inicio.strftime("%d/%m/%Y %H:%M") + "#" * 60)
    ok, n, erro = omni_client.estado()
    if not ok:
        print("❌ O OmniRoute não está respondendo em %s (%s).\n   Abra o OmniRoute e rode de novo." % (config.OMNI_BASE, erro))
        _registrar("FALHA", "OmniRoute offline")
        return False
    print("✅ OmniRoute no ar (%d modelos)." % n)
    for script, nome in ETAPAS:
        extra = ["--tema", tema] if (tema and script == "agente_pesquisador.py") else None
        if civel:
            extra = (extra or [])
            if script == "agente_pesquisador.py":
                extra += ["--area", "civel"]
        if not _rodar(script, nome, extra):
            print("\n❌ Falha em %s. Pipeline interrompido." % nome)
            _registrar("FALHA", nome)
            return False
    dur = (datetime.datetime.now() - inicio).seconds
    print("\n" + "#" * 60 + "\n  ✅ RASCUNHO PRONTO em %dm %ds — revise em agentes\\rascunhos\\\n" % (dur // 60, dur % 60) + "#" * 60)
    _registrar("SUCESSO", "pipeline completo (rascunho)", dur)
    return True


def testar():
    print("[TESTE] Conferindo tudo sem publicar nada...\n")
    print("Modo: %s | Pasta do site: %s" % (config.MODO, config.SITE_DIR))
    ok, n, erro = omni_client.estado()
    if not ok:
        print("❌ OmniRoute fora do ar em %s (%s)" % (config.OMNI_BASE, erro))
    else:
        print("✅ OmniRoute no ar — %d modelos listados" % n)
        print("   Testando cada combo (pode levar até 1 minuto)...")
        resultado = omni_client.testar_combos()
        for r in resultado:
            if r["ok"]:
                print("   ✅ %-18s %5.1fs  (respondeu: %s)" % (r["combo"], r["ms"] / 1000, r["usado"]))
            else:
                print("   ❌ %-18s %s" % (r["combo"], r["erro"][:110]))
        gravar_json(os.path.join(PASTA, "status_provedores.json"),
                    {"testado_em": agora_iso(), "combos": resultado})
    print("")
    if config.ftp_configurado():
        import ftp_util
        okf, msg = ftp_util.testar()
        print("%s FTP: %s" % ("✅" if okf else "❌", msg))
    else:
        print("ℹ️  Senha do FTP ainda não configurada (dê dois cliques em setup_segredos.bat). "
              "Sem ela, o --publicar grava na pasta do site e mostra os 2 arquivos para subir pelo FileZilla.")


def agendar_windows():
    python = sys.executable
    pipeline = os.path.abspath(__file__)
    tarefas = [
        ("LucasSemim_Rascunho", config.HORA_PUBLICACAO, "", "Gera 1 artigo-RASCUNHO por dia (não publica)"),
        ("LucasSemim_Monitor", config.HORA_MONITOR, "--monitor", "Monitor do site lucassemim.adv.br"),
    ]
    for nome, hora, args, _ in tarefas:
        tr = '"%s" "%s" %s' % (python, pipeline, args)
        r = subprocess.run(["schtasks", "/Create", "/F", "/SC", "DAILY", "/TN", nome, "/ST", hora, "/TR", tr.strip()],
                           capture_output=True, text=True)
        if r.returncode == 0:
            print("  ✅ Tarefa criada: %s — todos os dias às %s" % (nome, hora))
        else:
            print("  ❌ Falha ao criar %s: %s" % (nome, (r.stderr or r.stdout).strip()))
    # a versão antiga do --agendar criava a tarefa "LucasSemim_Pipeline"; se ela ainda existir, avisa (não apaga nada)
    r = subprocess.run(["schtasks", "/Query", "/TN", "LucasSemim_Pipeline"], capture_output=True, text=True)
    if r.returncode == 0:
        print("\n⚠️  Existe também a tarefa antiga LucasSemim_Pipeline. Ela usa este mesmo pipeline.py (agora só gera rascunho),")
        print("   mas para não gerar dois rascunhos por dia, apague-a no Agendador de Tarefas (taskschd.msc).")
    print("\n📋 Confira em taskschd.msc. O PC e o OmniRoute precisam estar ligados nesses horários.")
    print("   A tarefa das %s só gera RASCUNHO; nada é publicado sem você rodar --publicar." % config.HORA_PUBLICACAO)


def _definir_area_civel():
    """Liga o modo cível para os comandos desta chamada (rascunhos ganham prefixo civel-)."""
    os.environ["LS_AREA"] = "civel"
    import importlib
    importlib.reload(config)


def main():
    ap = argparse.ArgumentParser(description="Pipeline de agentes — lucassemim.adv.br (modo rascunho)")
    ap.add_argument("--tema", help="tema do artigo, escolhido por você")
    ap.add_argument("--civel", action="store_true", help="rodar a esteira para o SITE CÍVEL (publica em /civel/)")
    ap.add_argument("--area", help="(uso interno do pesquisador)")
    ap.add_argument("--listar", action="store_true")
    ap.add_argument("--publicar", metavar="RASCUNHO")
    ap.add_argument("--descartar", metavar="RASCUNHO")
    ap.add_argument("--sim", action="store_true", help="confirma a publicação sem perguntar")
    ap.add_argument("--sem-ftp", action="store_true")
    ap.add_argument("--sobrescrever", action="store_true")
    ap.add_argument("--testar", action="store_true")
    ap.add_argument("--monitor", action="store_true")
    ap.add_argument("--relatorio", action="store_true")
    ap.add_argument("--retroalimentar", action="store_true")
    ap.add_argument("--agendar", action="store_true")
    a = ap.parse_args()

    if a.testar:
        return testar()
    if a.agendar:
        return agendar_windows()
    if a.monitor:
        return sys.exit(0 if _rodar("agente_monitor.py", "AGENTE 5 — MONITOR") else 1)
    if a.relatorio:
        return sys.exit(0 if _rodar("agente_monitor_avancado.py", "MONITOR AVANÇADO") else 1)
    if a.retroalimentar:
        from motor_retroalimentacao import executar_ciclo_retroalimentacao
        executar_ciclo_retroalimentacao()
        return
    if a.listar or a.publicar or a.descartar:
        if a.civel:
            _definir_area_civel()
        import agente_publicador as pub
        if a.listar:
            itens = pub.listar_rascunhos()
            print("Nenhum rascunho aguardando revisão." if not itens else "Rascunhos aguardando revisão:")
            for i in itens:
                print("• %s\n    %s%s" % (i["slug"], i["titulo"], "   [%d erro(s) a corrigir]" % i["erros"] if i["erros"] else ""))
            return
        if a.descartar:
            print("Movido para:", pub.descartar_rascunho(a.descartar))
            return
        ok = pub.publicar_rascunho(a.publicar, sim=a.sim, sem_ftp=a.sem_ftp, sobrescrever=a.sobrescrever)
        sys.exit(0 if ok else 1)
    if a.civel:
        _definir_area_civel()
    sys.exit(0 if rodar_pipeline(a.tema, civel=a.civel) else 1)


if __name__ == "__main__":
    main()
