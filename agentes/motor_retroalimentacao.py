# -*- coding: utf-8 -*-
"""
MOTOR DE RETROALIMENTAÇÃO — roda com:  python pipeline.py --retroalimentar
1) Roda o monitor avançado e guarda o resultado na memória editorial.
2) Se a fila de temas estiver com menos de 3 itens, pede novos temas à IA (se o OmniRoute estiver aberto).
3) Mostra o que já foi publicado, o que está em rascunho e o que vem a seguir.
Não publica nada e não altera o site.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import memoria
import omni_client
from util import agora_iso, console_utf8


def executar_ciclo_retroalimentacao():
    console_utf8()
    dados = memoria.carregar()

    print("🛡️  Rodando o monitor avançado...")
    try:
        import agente_monitor_avancado
        reg = agente_monitor_avancado.executar_monitoramento()
        dados["metricas_monitor"] = {"ultima_checagem": agora_iso(), "aprovados": reg["aprovados"], "total": reg["total"]}
    except Exception as e:
        print("  ⚠️  Monitor avançado falhou: %s" % e)

    fila = memoria.limpar_fila(dados)
    if len(fila) < 3:
        ok, _, erro = omni_client.estado()
        if ok:
            import agente_pesquisador
            print("\n🧠 Fila com %d tema(s) — pedindo novos à IA..." % len(fila))
            fila = memoria.adicionar_a_fila(dados, agente_pesquisador.sugerir_temas(dados, quantidade=6))
        else:
            print("\n⚠️  Fila com %d tema(s), mas o OmniRoute está fora do ar (%s); não deu para pedir novos." % (len(fila), erro))
    memoria.salvar(dados)

    print("\n📚 Situação editorial")
    print("   Publicados: %d | Em rascunho: %d | Na fila: %d" %
          (len(dados["artigos_publicados"]), len(dados["rascunhos"]), len(fila)))
    for i, item in enumerate(fila[:5], start=1):
        print("   %d. %s" % (i, memoria.semente_para_texto(item)))
    return dados


if __name__ == "__main__":
    executar_ciclo_retroalimentacao()
