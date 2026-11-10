#!/usr/bin/env python3
"""Aviso diário das pendências no WhatsApp pessoal do Gabriel (timer na VPS, 7h de São Paulo).

Lê /api/pendencias e manda UMA mensagem pela instância gabs para o próprio número dela.
Nunca usar a instância caicara: é o número do box, bloqueado pelo Meta em 14/10.
Sem nada para avisar, não manda. --teste só imprime o texto.

Chave: PENDENCIAS_KEY no ambiente (/root/pendencias/.env, chmod 600).
Chave da Evolution: AUTHENTICATION_API_KEY em /root/evolution.yaml.
"""
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

SITE = os.environ.get("PENDENCIAS_SITE", "https://caicara.store")
EVOLUTION = "https://evolution.caicara.store"
INSTANCIA = "gabs"


def pedir(url, cabecalhos, corpo=None):
    dados = None if corpo is None else json.dumps(corpo).encode()
    pedido = urllib.request.Request(
        url, dados, {"Content-Type": "application/json", "User-Agent": "caicara-pendencias", **cabecalhos}
    )
    with urllib.request.urlopen(pedido, timeout=30) as resposta:
        return json.load(resposta)


def numero_da_instancia(evo):
    instancias = pedir(f"{EVOLUTION}/instance/fetchInstances?instanceName={INSTANCIA}", {"apikey": evo})
    dados = instancias[0]
    dados = dados.get("instance", dados)
    if (dados.get("connectionStatus") or dados.get("status")) != "open":
        sys.exit(f"instância {INSTANCIA} desconectada")
    return (dados.get("ownerJid") or dados["owner"]).split("@")[0]


def main():
    aviso = pedir(f"{SITE}/api/pendencias", {"x-chave": os.environ["PENDENCIAS_KEY"]})["aviso"]
    if not aviso:
        print("nada para avisar")
        return
    if "--teste" in sys.argv:
        print(aviso)
        return
    evo = re.search(r"AUTHENTICATION_API_KEY=(\S+)", Path("/root/evolution.yaml").read_text()).group(1)
    pedir(
        f"{EVOLUTION}/message/sendText/{INSTANCIA}",
        {"apikey": evo},
        {"number": numero_da_instancia(evo), "text": aviso},
    )
    print("enviado")


if __name__ == "__main__":
    main()
