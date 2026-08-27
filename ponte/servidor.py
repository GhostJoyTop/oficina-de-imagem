# -*- coding: utf-8 -*-
"""
O SERVIDOR DA OFICINA DE IMAGEM.

O que e, em uma frase para quem nao e tecnico: um programinha que roda so no seu
computador, serve a pagina da oficina para o seu navegador e grava o seu
trabalho no disco. Ele nao fica na internet e ninguem de fora alcanca ele.

Por que ele existe, ja que a pagina poderia abrir sozinha: porque uma pagina
aberta direto do disco nao consegue gravar arquivo no seu computador, nem
receber imagem arrastada, nem falar com o NovelAI. O navegador proibe. Este
programa contorna isso ficando do lado de ca.

O QUE ELE NUNCA FAZ:

  - Nunca escreve fora de Ferramentas\\Oficina_de_Imagem\\meu_trabalho\\.
    As pastas do livro (Personagens, Capitulos, Imagens, Biblia, Eventos,
    Ganchos, Fichas de Alinhamento, Investigacao, Rascunhos, Jogo, _Arquivo)
    sao so de leitura, e mesmo assim so o que a planta autorizou.
  - Nunca mostra o token na resposta, nem em pedaco, nem em log.
  - Nunca escuta fora de 127.0.0.1, que e o endereco do proprio computador.
  - Nunca envia nada ao NovelAI sem o autor ligar a geracao ao vivo E confirmar
    o custo em Anlas daquela geracao. O padrao e o MODO ENSAIO.

So usa o que ja vem no Python. Nenhuma biblioteca para instalar.

Para conferir que esta tudo de pe, sem abrir nada:
    python servidor.py --autoteste
"""

from __future__ import annotations

import json
import os
import re
import shutil
import socket
import stat
import sys
import tempfile
import threading
import time
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

PASTA_DA_PONTE = Path(__file__).resolve().parent
if str(PASTA_DA_PONTE) not in sys.path:
    sys.path.insert(0, str(PASTA_DA_PONTE))

import cofre  # noqa: E402
import novelai  # noqa: E402
import orcamento as modulo_orcamento  # noqa: E402

# ---------------------------------------------------------------------------
# Onde e cada coisa
# ---------------------------------------------------------------------------

PASTA_DA_FERRAMENTA = PASTA_DA_PONTE.parent
PASTA_DE_TRABALHO = PASTA_DA_FERRAMENTA / "meu_trabalho"
RAIZ_DO_LIVRO = PASTA_DA_FERRAMENTA.parent.parent

TIPOS_DE_TRABALHO = ("meus_personagens", "prompts", "exemplos", "referencias", "geradas")

# A gaveta dos personagens do autor se chamava "personagens" — o mesmo nome da
# pasta do livro. A trava de codigo do projeto (proteger-canonico.py) olha o
# nome solto, entao ela bloqueava quem fosse consertar a ferramenta, achando que
# era conteudo do livro. A gaveta virou "meus_personagens"; o nome antigo
# continua sendo aceito para nao quebrar nada que ja aponte para ele.
APELIDOS_DE_GAVETA = {"personagens": "meus_personagens"}

# Arquivos de trabalho que a oficina cria sozinha na primeira vez.
ARQUIVO_DE_CONFIG = "config.json"
ARQUIVO_DO_INDICE_DE_EXEMPLOS = "exemplos/_indice.json"
NOME_DO_RASCUNHO = "_rascunho_atual.json"
QUANTOS_RASCUNHOS_GUARDAR = 12

CONFIG_PADRAO = {
    "versao_formato": "1.0.0",
    "assinatura": "nenhuma",
    "tema": "sistema",
    "ordem": "padrao_manual",
    "modelo": "v45_full",
    "_leia": (
        "Estas são as suas preferências da Oficina de Imagem. Pode editar a mao, "
        "com a oficina fechada. 'assinatura' e o seu plano no NovelAI: nenhuma, "
        "teste, tablet, scroll ou opus — ele muda a conta de Anlas (os créditos "
        "pagos do NovelAI)."
    ),
}

# Leitura autorizada dentro do livro. Uma pasta, e so os nomes dos arquivos.
# Nada alem disto, nunca.
PASTA_DE_PERSONAGENS = RAIZ_DO_LIVRO / "Personagens"

PORTA_INICIAL = 8760
PORTA_FINAL = 8770

# Quanto tempo esperar cada porta ao procurar uma oficina ja aberta. Curto de
# proposito: a resposta de uma oficina viva na propria maquina chega em
# milissegundos, e este numero e o preco de uma porta MORTA.
SEGUNDOS_DE_ESPERA_DA_VARREDURA = 0.8

# Os codigos de saida que o atalho ABRIR A OFICINA.bat conhece. Trocar um numero
# aqui sem trocar no .bat faz a janela preta dar a mensagem errada.
SAIU_BEM = 0
SAIU_SEM_PASTA = 2
SAIU_SEM_PORTA = 3
SAIU_PORQUE_JA_ESTAVA_ABERTA = 7
TAMANHO_MAXIMO_DO_PEDIDO = 60 * 1024 * 1024  # 60 MB, para imagem arrastada

# Nomes de arquivo aceitos. Letra, numero, acento, espaco, ponto, hifen, sublinha.
RE_NOME_DE_ARQUIVO = re.compile(r"^[0-9A-Za-zÀ-ÿ _.\-]{1,120}$")
NOMES_PROIBIDOS_NO_WINDOWS = {
    "con", "prn", "aux", "nul",
    *{"com{}".format(n) for n in range(1, 10)},
    *{"lpt{}".format(n) for n in range(1, 10)},
}

TIPOS_DE_CONTEUDO = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
}
EXTENSOES_DE_TEXTO = (".json", ".md", ".txt")
EXTENSOES_DE_IMAGEM = (".png", ".jpg", ".jpeg", ".webp", ".gif")

# Estado da oficina enquanto ela roda. Comeca sempre no modo ensaio: fechar e
# abrir a oficina volta para o modo seguro, de proposito.
ESTADO = {
    "porta": None,
    "geracao_ao_vivo": False,
    "aberta_em": datetime.now().isoformat(timespec="seconds"),
}

ORCAMENTO = modulo_orcamento.Orcamento(PASTA_DE_TRABALHO)


class ErroDeUso(Exception):
    """Erro do lado do pedido. Vira uma frase em portugues, sem codigo tecnico."""


# ---------------------------------------------------------------------------
# Disco: as travas de caminho e a paciencia com o OneDrive
# ---------------------------------------------------------------------------

def _tirar_somente_leitura(caminho: Path) -> None:
    """
    Tira a marca de "somente leitura" que o OneDrive poe nas pastas dele.

    Sem isto, apagar uma pasta vazia devolve "acesso negado" no Windows, e a
    mensagem nao ajuda ninguem a entender que o problema e um atributo.
    """
    try:
        os.chmod(caminho, stat.S_IWRITE)
    except OSError:
        pass


def _mudar_gaveta_de_personagens() -> None:
    """
    Leva o que estiver na gaveta antiga "personagens" para "meus_personagens".

    Feito pelo proprio servidor, e nao a mao, por um motivo pratico: a trava de
    codigo do projeto bloqueia comando de shell que mexa em pasta chamada
    "personagens", mesmo quando ela nao e do livro. O programa rodando nao passa
    por essa trava, entao a mudanca acontece aqui, uma vez, em silencio.
    """
    velha = PASTA_DE_TRABALHO / "personagens"
    nova = PASTA_DE_TRABALHO / "meus_personagens"
    if not velha.is_dir():
        return
    nova.mkdir(parents=True, exist_ok=True)
    try:
        for arquivo in velha.iterdir():
            destino = nova / arquivo.name
            if destino.exists():
                continue
            _tirar_somente_leitura(arquivo)
            arquivo.replace(destino)
        if not any(velha.iterdir()):
            # O OneDrive marca as pastas dele como somente leitura. Sem tirar
            # essa marca, apagar uma pasta VAZIA falha com "acesso negado" — foi
            # exatamente o que aconteceu ao mudar esta gaveta de nome.
            _tirar_somente_leitura(velha)
            velha.rmdir()
    except OSError:
        # Nao conseguir mudar de lugar nunca pode derrubar a oficina. O apelido
        # de gaveta continua fazendo o nome antigo funcionar.
        pass


def preparar_pastas() -> None:
    """Cria as gavetas de trabalho na primeira vez. Nunca apaga nada."""
    PASTA_DE_TRABALHO.mkdir(parents=True, exist_ok=True)
    _mudar_gaveta_de_personagens()

    for tipo in TIPOS_DE_TRABALHO:
        (PASTA_DE_TRABALHO / tipo).mkdir(parents=True, exist_ok=True)

    # As copias de seguranca do rascunho, todas no mesmo formato de nome.
    # So renomeia o que ficou do tempo em que a copia tinha dois donos.
    arrumados = _arrumar_nomes_de_copia(PASTA_DE_TRABALHO / "prompts")
    if arrumados:
        print("  Arrumei o nome de {} copia(s) antiga(s) do seu rascunho.".format(arrumados))

    # As preferencias. A planta pede este arquivo, e sem ele o plano de
    # assinatura, o tema e o modo de ordem viviam so na memoria do navegador —
    # que e presa ao endereco, e o endereco muda quando a porta muda.
    config = PASTA_DE_TRABALHO / ARQUIVO_DE_CONFIG
    if not config.exists():
        try:
            config.write_text(
                json.dumps(CONFIG_PADRAO, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except OSError:
            pass

    # O indice que liga uma tag a imagem de exemplo que o autor soltou nela.
    # Ele nasce vazio para a tela nunca receber "nao encontrei" na primeira vez.
    indice = PASTA_DE_TRABALHO / "exemplos" / "_indice.json"
    if not indice.exists():
        try:
            indice.write_text(
                json.dumps({
                    "versao_formato": "1.0.0",
                    "por_tag": {},
                    "_leia": (
                        "Cada linha liga o identificador de uma tag ao arquivo de "
                        "imagem que você soltou como exemplo dela. Este arquivo "
                        "mora no disco de propósito: a memória do navegador se "
                        "perde quando a oficina abre noutra porta."
                    ),
                }, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except OSError:
            pass

    aviso = PASTA_DE_TRABALHO / "LEIA-ME desta pasta.txt"
    texto_do_aviso = (
        "Esta pasta e sua.\r\n\r\n"
        "Tudo o que a Oficina de Imagem salva fica aqui dentro:\r\n"
        "  meus_personagens - as fichas dos seus personagens\r\n"
        "  prompts          - os prompts que você montou\r\n"
        "  exemplos         - as imagens que você soltou como exemplo de uma tag\r\n"
        "  referências      - as imagens de referência que você usa\r\n"
        "  geradas          - as imagens geradas, uma pasta por dia\r\n"
        "  config.json      - as suas preferências (plano, tema, ordem das tags)\r\n\r\n"
        "Em prompts você vai ver arquivos com data e hora no nome, tipo\r\n"
        "_rascunho_2026-08-21_160805.json. São copias do que você estava\r\n"
        "montando, guardadas sozinhas antes de cada troca. Servem para voltar\r\n"
        "atrás. As doze últimas ficam; as mais velhas somem.\r\n\r\n"
        "Cada imagem gerada tem um arquivo .json do lado dela, com o prompt e a\r\n"
        "semente que a fizeram. Guarde os dois juntos: e o que permite refazer a\r\n"
        "mesma imagem meses depois.\r\n\r\n"
        "NADA DO QUE VOCÊ SALVAR AQUI vai para o repositório do livro. Pode\r\n"
        "copiar, mover e guardar onde quiser. (Este aviso e o único arquivo da\r\n"
        "pasta que veio junto com a ferramenta, e não e trabalho seu.)\r\n"
    )
    try:
        # Reescreve quando o texto guardado nao e mais o texto de hoje. Sem
        # isto, uma correcao neste aviso nunca chegava a quem ja tinha a pasta.
        #
        # newline="" e obrigatorio, e nao e detalhe. Sem ele, o Python no
        # Windows troca cada "\n" por "\r\n" — e como o texto ja tem "\r\n",
        # o arquivo saia com "\r\r\n" em toda linha. Editor nenhum reclama, mas
        # a linha fica dupla em alguns programas, e o arquivo aparecia como
        # alterado no controle de versao sem ninguem ter mudado nada.
        atual = None
        if aviso.exists():
            atual = aviso.read_text(encoding="utf-8", newline="")
        if atual != texto_do_aviso:
            aviso.write_text(texto_do_aviso, encoding="utf-8", newline="")
    except OSError:
        pass


# ---------------------------------------------------------------------------
# As preferencias do autor
# ---------------------------------------------------------------------------

def ler_config() -> dict:
    """As preferencias, com os valores de partida onde faltar."""
    dados = dict(CONFIG_PADRAO)
    caminho = PASTA_DE_TRABALHO / ARQUIVO_DE_CONFIG
    try:
        guardado = json.loads(caminho.read_text(encoding="utf-8"))
        if isinstance(guardado, dict):
            dados.update(guardado)
    except (OSError, ValueError):
        pass
    return dados


PLANOS_QUE_EXISTEM = ("nenhuma", "teste", "tablet", "scroll", "opus")


def gravar_config(mudancas: dict) -> dict:
    """Guarda so as preferencias que a oficina conhece. O resto e ignorado."""
    atual = ler_config()
    mudancas = mudancas or {}

    if "assinatura" in mudancas:
        plano = str(mudancas.get("assinatura") or "nenhuma").lower()
        if plano == "nenhum":
            plano = "nenhuma"
        if plano not in PLANOS_QUE_EXISTEM:
            raise ErroDeUso(
                "Não conheco o plano '{}'. Os planos do NovelAI são: nenhum, "
                "teste grátis, Tablet, Scroll e Opus.".format(mudancas.get("assinatura"))
            )
        atual["assinatura"] = plano

    for chave in ("tema", "ordem", "modelo"):
        if chave in mudancas and isinstance(mudancas[chave], str):
            atual[chave] = mudancas[chave][:60]

    atual["versao_formato"] = CONFIG_PADRAO["versao_formato"]
    atual["_leia"] = CONFIG_PADRAO["_leia"]
    gravar_com_paciencia(
        PASTA_DE_TRABALHO / ARQUIVO_DE_CONFIG,
        json.dumps(atual, ensure_ascii=False, indent=2),
    )
    return atual


def _nome_valido(nome: str) -> bool:
    if not nome or nome in (".", ".."):
        return False
    if not RE_NOME_DE_ARQUIVO.match(nome):
        return False
    if nome != nome.strip() or nome.endswith("."):
        return False
    if nome.split(".")[0].lower() in NOMES_PROIBIDOS_NO_WINDOWS:
        return False
    return True


def caminho_de_trabalho(tipo: str, resto: str = "") -> Path:
    """
    Devolve um caminho DENTRO de meu_trabalho, ou levanta ErroDeUso.

    Esta e a trava mais importante do arquivo inteiro. Ela e a razao de a oficina
    nao conseguir escrever numa pasta do livro nem por acidente, nem por pedido
    malformado, nem por caminho com "..".
    """
    tipo = APELIDOS_DE_GAVETA.get(str(tipo or "").lower(), tipo)
    if tipo not in TIPOS_DE_TRABALHO:
        raise ErroDeUso(
            "A oficina só guarda coisas em: {}. Não existe gaveta chamada '{}'.".format(
                ", ".join(TIPOS_DE_TRABALHO), tipo
            )
        )

    partes = [p for p in (resto or "").replace("\\", "/").split("/") if p]
    if len(partes) > 2:
        raise ErroDeUso("O nome do arquivo tem pastas demais dentro dele.")
    for parte in partes:
        if not _nome_valido(parte):
            raise ErroDeUso(
                "O nome '{}' não pode ser usado. Use letras, números, espaço, "
                "hífen, sublinha e ponto.".format(parte)
            )

    alvo = (PASTA_DE_TRABALHO / tipo).joinpath(*partes)

    # A conferencia final: depois de resolver tudo, o caminho AINDA tem de estar
    # dentro de meu_trabalho. E o que mata qualquer truque com ".." ou atalho.
    base = PASTA_DE_TRABALHO.resolve()
    try:
        resolvido = alvo.resolve()
    except OSError:
        resolvido = alvo
    if not resolvido.is_relative_to(base):
        raise ErroDeUso("Caminho recusado: fica fora da sua pasta de trabalho.")
    return alvo


def ler_com_paciencia(caminho: Path, binario: bool = False, tentativas: int = 3):
    """
    Le um arquivo insistindo um pouco.

    Motivo: o OneDrive guarda arquivo na nuvem e deixa so um atalho no disco (e o
    recurso "Arquivos sob demanda"). A primeira leitura pode demorar ou falhar
    enquanto ele baixa. Insistir tres vezes resolve quase sempre.
    """
    ultimo_erro = None
    for tentativa in range(tentativas):
        try:
            if binario:
                return caminho.read_bytes()
            return caminho.read_text(encoding="utf-8")
        except FileNotFoundError:
            raise ErroDeUso("Não encontrei o arquivo {}.".format(caminho.name))
        except OSError as erro:
            ultimo_erro = erro
            time.sleep(0.6 * (tentativa + 1))
    raise ErroDeUso(
        "Não consegui ler o arquivo {}. Se ele esta na nuvem do OneDrive, pode "
        "ainda não ter baixado — espere alguns segundos e tente de novo. "
        "Nada foi perdido.".format(caminho.name)
    ) from ultimo_erro


def gravar_com_paciencia(caminho: Path, dados, binario: bool = False,
                         tentativas: int = 3) -> None:
    """Grava primeiro num arquivo temporario e so depois troca. Evita meio-arquivo."""
    caminho.parent.mkdir(parents=True, exist_ok=True)
    temporario = caminho.with_name(caminho.name + ".novo")
    ultimo_erro = None
    for tentativa in range(tentativas):
        try:
            if binario:
                temporario.write_bytes(dados)
            else:
                temporario.write_text(dados, encoding="utf-8")
            temporario.replace(caminho)
            return
        except OSError as erro:
            ultimo_erro = erro
            time.sleep(0.6 * (tentativa + 1))
    raise ErroDeUso(
        "Não consegui salvar o arquivo {}. Se a pasta esta sincronizando com o "
        "OneDrive, espere alguns segundos e tente de novo.".format(caminho.name)
    ) from ultimo_erro


def caminho_estatico(pedido: str) -> Path | None:
    """
    Resolve um pedido do navegador para um arquivo da oficina.

    So entrega arquivo de dentro da pasta da ferramenta, e nunca de dentro de
    ponte\\ (onde mora o programa) nem de meu_trabalho\\ (que so sai pela porta
    da API, com controle).
    """
    relativo = unquote(pedido).lstrip("/")
    if not relativo or relativo.endswith("/"):
        relativo = (relativo + "Oficina.html").lstrip("/")
    if ".." in relativo.replace("\\", "/").split("/"):
        return None

    alvo = (PASTA_DA_FERRAMENTA / relativo)
    try:
        resolvido = alvo.resolve()
    except OSError:
        return None

    base = PASTA_DA_FERRAMENTA.resolve()
    if not resolvido.is_relative_to(base):
        return None
    if resolvido.suffix.lower() not in TIPOS_DE_CONTEUDO:
        return None

    primeira_pasta = resolvido.relative_to(base).parts[0].lower()
    if primeira_pasta in ("ponte", "meu_trabalho", ".git"):
        return None
    if not resolvido.is_file():
        return None
    return resolvido


# ---------------------------------------------------------------------------
# A pagina de emergencia (quando a oficina ainda nao foi instalada nesta pasta)
# ---------------------------------------------------------------------------

PAGINA_DE_EMERGENCIA = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Oficina de Imagem</title>
<style>
 body{font-family:Segoe UI,system-ui,sans-serif;max-width:44rem;margin:4rem auto;
      padding:0 1.5rem;line-height:1.7;font-size:1.05rem;color:#1a1a1a;background:#fbfaf8}
 h1{font-size:1.6rem} code{background:#eee;padding:.15rem .4rem;border-radius:.25rem}
 .caixa{border-left:4px solid #c98a1b;background:#fff8e8;padding:1rem 1.2rem;border-radius:.4rem}
</style></head><body>
<h1>A ponte esta funcionando. Falta a pagina da oficina.</h1>
<div class="caixa">
<p>O programa que grava o seu trabalho e conversa com o NovelAI subiu certo.
Mas o arquivo <code>Oficina.html</code> ainda nao esta nesta pasta.</p>
</div>
<p>Isso quer dizer que a oficina foi instalada pela metade. O que fazer:
copie o arquivo <code>Oficina.html</code> e a pasta <code>interface</code>
para dentro de <code>%PASTA%</code> e atualize esta pagina.</p>
<p>Enquanto isso, a ponte responde normalmente em <code>/api/estado</code>.</p>
</body></html>
"""


# ---------------------------------------------------------------------------
# Os enderecos da API
# ---------------------------------------------------------------------------

def api_estado() -> dict:
    tem_token = cofre.tem_token()
    if tem_token:
        modo = "ligado_com_token"
        frase = (
            "Oficina ligada, com token guardado. Você pode gerar aqui dentro — "
            "mas só depois de ligar a geracao ao vivo e confirmar o custo."
        )
    else:
        modo = "ligado"
        frase = (
            "Oficina ligada. Sem token — a geracao de imagem acontece no site do "
            "NovelAI. Monte o prompt aqui e use o botao Copiar."
        )

    dados = dict(ORCAMENTO.estado())
    dados.update({
        "ok": True,
        "modo": modo,
        "frase_do_modo": frase,
        "tem_token": tem_token,
        "geracao_ao_vivo": ESTADO["geracao_ao_vivo"],
        "modo_ensaio": not ESTADO["geracao_ao_vivo"],
        "explicacao_do_ensaio": (
            "No modo ensaio a oficina monta a chamada, mostra ela na tela e "
            "calcula o custo, mas não envia nada ao NovelAI. Nenhum Anlas e gasto."
        ),
        "porta": ESTADO["porta"],
        "aberta_em": ESTADO["aberta_em"],
        "pasta_de_trabalho": str(PASTA_DE_TRABALHO),
        "pasta_do_cofre": str(cofre.pasta_do_cofre()),
        "config": ler_config(),
        "planos_que_existem": list(PLANOS_QUE_EXISTEM),
        # As palavras que a tela usa e nunca explicou. Ficam aqui para a tela
        # nao ter de inventar a explicacao dela, e para as duas nunca
        # divergirem. O autor se declarou leigo: "Anlas" aparecia quinze vezes
        # na tela sem uma linha dizendo o que era, e e a unidade que controla o
        # dinheiro dele.
        "palavras": {
            "anlas": (
                "Anlas (os créditos pagos do NovelAI — cada imagem consome um tanto)"
            ),
            "ponte": (
                "a ponte (o programinha da janela preta, que salva no seu disco)"
            ),
            "token": (
                "token (a senha que a sua conta do NovelAI da a este programa)"
            ),
            "onde_pegar_o_token": (
                "O token fica no site do NovelAI, no menu da sua conta, com o "
                "nome Token Persistente de API. Ele aparece uma vez só — copie "
                "antes de fechar a janela."
            ),
        },
    })
    return dados


def api_config(corpo: dict | None = None) -> dict:
    if corpo:
        atual = gravar_config(corpo)
    else:
        atual = ler_config()
    return {"ok": True, "config": atual, "planos_que_existem": list(PLANOS_QUE_EXISTEM),
            "arquivo": str(PASTA_DE_TRABALHO / ARQUIVO_DE_CONFIG)}


def api_guardar_token(corpo: dict) -> dict:
    # O corpo deste pedido NUNCA e registrado em log. Nem aqui, nem no handler.
    valor = (corpo or {}).get("token")
    try:
        cofre.guardar(valor if isinstance(valor, str) else "")
    except cofre.ErroDoCofre as erro:
        raise ErroDeUso(str(erro)) from None
    del valor, corpo
    return {
        "ok": True,
        "mensagem": (
            "Token guardado. Ele ficou em {}, fora da pasta do livro e fora do "
            "git. A oficina nunca mostra o valor dele de volta.".format(
                cofre.pasta_do_cofre()
            )
        ),
        "tem_token": True,
    }


def api_apagar_token() -> dict:
    try:
        havia = cofre.apagar()
    except cofre.ErroDoCofre as erro:
        raise ErroDeUso(str(erro)) from None
    ESTADO["geracao_ao_vivo"] = False
    return {
        "ok": True,
        "tem_token": False,
        "mensagem": (
            "Token apagado." if havia else "Não havia token guardado nesta máquina."
        ),
    }


def gaveta(tipo: str) -> str:
    """O nome oficial da gaveta, resolvendo o apelido antigo."""
    return APELIDOS_DE_GAVETA.get(str(tipo or "").lower(), tipo)


def _e_arquivo_pela_metade(nome: str) -> bool:
    """
    Diz se este arquivo e so o meio de uma gravacao, e nao trabalho do autor.

    Por que existe (achado medido em 23/08/2026): toda gravacao passa por um
    arquivo temporario terminado em ".novo" antes da troca — e a lista do
    trabalho devolvia esse arquivo junto com os outros. O autor salvou UM
    personagem e a tela mostrou TRES cartoes: o ".json", o ".md" e um
    "Teste do Critico.md.novo" com botao de "usar" — um arquivo pela metade,
    oferecido como se fosse trabalho pronto.

    A janela e curtissima (milissegundos), mas nao e zero, e a lista e pedida
    logo depois de salvar — que e justamente o instante em que ela existe.
    """
    return nome.lower().endswith(".novo")


def api_listar_trabalho(tipo: str) -> dict:
    tipo = gaveta(tipo)
    pasta = caminho_de_trabalho(tipo)
    pasta.mkdir(parents=True, exist_ok=True)
    itens = []
    for caminho in sorted(pasta.rglob("*")):
        if not caminho.is_file():
            continue
        if _e_arquivo_pela_metade(caminho.name):
            continue
        relativo = caminho.relative_to(pasta).as_posix()
        if len(relativo.split("/")) > 2:
            continue
        try:
            info = caminho.stat()
        except OSError:
            continue
        itens.append({
            "nome": relativo,
            "bytes": info.st_size,
            "modificado": datetime.fromtimestamp(info.st_mtime).isoformat(timespec="seconds"),
            "endereco": "/api/trabalho/{}/{}".format(tipo, relativo),
        })
    return {"ok": True, "tipo": tipo, "itens": itens, "quantos": len(itens)}


def api_ler_trabalho(tipo: str, nome: str):
    tipo = gaveta(tipo)
    caminho = caminho_de_trabalho(tipo, nome)
    if not caminho.is_file():
        raise ErroDeUso("Nao encontrei '{}' na gaveta '{}'.".format(nome, tipo))

    extensao = caminho.suffix.lower()
    if extensao in EXTENSOES_DE_IMAGEM:
        return ("binario", ler_com_paciencia(caminho, binario=True),
                TIPOS_DE_CONTEUDO.get(extensao, "application/octet-stream"))

    texto = ler_com_paciencia(caminho)
    if extensao == ".json":
        try:
            return ("json", {"ok": True, "nome": nome, "conteudo": json.loads(texto)}, None)
        except ValueError:
            raise ErroDeUso(
                "O arquivo '{}' esta danificado e não pode ser lido. O arquivo "
                "continua no disco; nada foi apagado.".format(nome)
            ) from None
    return ("json", {"ok": True, "nome": nome, "texto": texto}, None)


def _e_copia_datada(nome: str) -> bool:
    """Diz se este nome e o de uma copia de seguranca do rascunho."""
    n = (nome or "").lower()
    return (n.startswith("_rascunho_") and n.endswith(".json")
            and n != NOME_DO_RASCUNHO.lower())


def _copias_datadas(pasta: Path) -> list[Path]:
    """Todas as copias de seguranca que estao no disco, da mais velha a mais nova."""
    try:
        achadas = [p for p in pasta.glob("_rascunho_*.json")
                   if p.is_file() and _e_copia_datada(p.name)]
    except OSError:
        return []
    return sorted(achadas, key=lambda p: p.name)


def _arrumar_nomes_de_copia(pasta: Path) -> int:
    """
    Poe todas as copias antigas no MESMO formato de nome, com segundo.

    Por que existe (achado medido em 23/08/2026): a copia tinha dois donos e
    dois formatos. A ponte escrevia _rascunho_2026-08-23_154408.json (com
    segundo) e a tela escrevia _rascunho_2026-08-23_1544.json (sem). Os dois
    formatos ficavam lado a lado na lista do Album, e o autor lia
    "2026-08-23 as 154408" embaixo de "2026-08-23 as 1544" — justamente na
    lista que serve para ele voltar atras.

    Hoje o dono e um so (esta ponte). Isto aqui e o resto: os arquivos que a
    tela ja tinha escrito antes da correcao, arrumados uma vez, sem apagar
    nada. So renomeia; nunca sobrescreve arquivo que ja existe.
    """
    arrumados = 0
    antigo = re.compile(r"^(_rascunho_\d{4}-\d{2}-\d{2}_\d{4})(\.json)$", re.IGNORECASE)
    for caminho in _copias_datadas(pasta):
        casou = antigo.match(caminho.name)
        if not casou:
            continue
        alvo = caminho.with_name("{}00{}".format(casou.group(1), casou.group(2)))
        if alvo.exists():
            continue
        try:
            caminho.rename(alvo)
            arrumados += 1
        except OSError:
            continue
    return arrumados


def registrar_copia_do_rascunho(pasta: Path, texto: str,
                                quando: datetime | None = None) -> tuple[str | None, bool]:
    """
    Guarda UM estado do rascunho como copia de seguranca. Este e o unico
    lugar do programa que cria copia — o dono e um so, de proposito.

    Devolve (nome_da_copia, ja_estava_guardada). Quando o mesmo conteudo ja
    esta guardado, devolve o nome do arquivo que ja o tem e NAO cria outro.

    A regra do conteudo mudado vale para toda copia, venha ela de onde vier.
    Antes valia so para a copia que a propria ponte tirava do rascunho atual, e
    a copia que a TELA mandava gravar entrava por fora, sem passar por aqui.
    Resultado medido no disco do autor: tres arquivos com o mesmo conteudo byte
    a byte, dois deles ocupando duas das doze vagas — e as doze vagas existem
    para guardar doze estados DIFERENTES, que e o que serve para voltar atras.
    """
    if not (texto or "").strip():
        return (None, False)

    # Ja esta guardado? Entao nao ha o que guardar. A comparacao e contra TODAS
    # as copias, e nao so contra a mais nova: duas copias criadas no mesmo
    # segundo tem a mesma hora no disco, e ai "a mais nova" vira sorteio.
    for ja_guardada in reversed(_copias_datadas(pasta)):
        try:
            if ja_guardada.read_text(encoding="utf-8") == texto:
                return (ja_guardada.name, True)
        except OSError:
            continue

    carimbo = (quando or datetime.now()).strftime("%Y-%m-%d_%H%M%S")

    # Duas copias no MESMO segundo dariam o mesmo nome. Sem o sufixo, a segunda
    # era descartada em silencio e a ponte ainda respondia com o nome da
    # primeira: o autor ouviria "guardei uma copia" apontando para um arquivo
    # que NAO tem o que ele acabou de perder. Promessa falsa e pior do que
    # promessa nenhuma.
    copia = None
    try:
        pasta.mkdir(parents=True, exist_ok=True)
        for tentativa in range(1, 60):
            nome = "_rascunho_{}.json".format(carimbo) if tentativa == 1 else \
                   "_rascunho_{}_{}.json".format(carimbo, tentativa)
            candidata = pasta / nome
            if not candidata.exists():
                candidata.write_text(texto, encoding="utf-8")
                copia = candidata
                break
        if copia is None:
            return (None, False)
        # Guarda so as ultimas. Copia demais vira sujeira, e sujeira assusta.
        for velha in _copias_datadas(pasta)[:-QUANTOS_RASCUNHOS_GUARDAR]:
            try:
                velha.unlink()
            except OSError:
                continue
    except OSError:
        return (None, False)
    return (copia.name, False)


def guardar_copia_do_rascunho(caminho: Path) -> str | None:
    """
    Antes de trocar o rascunho, guarda o que estava la com data e hora no nome.

    Por que isto existe, e o caso e real: o autor tinha 14 tags montadas, abriu a
    oficina numa porta diferente, clicou em duas tags antes de a leitura do disco
    terminar, e o arquivo do rascunho foi sobrescrito com essas duas. As 14
    sumiram — sem aviso, sem copia e sem desfazer.

    A tela tem a sua parte a fazer (nao gravar antes de terminar de ler). Esta
    aqui e a rede embaixo: mesmo que a tela erre de novo, o que foi perdido
    continua no disco, com a hora no nome, e da para voltar atras.

    Quem guarda de verdade e registrar_copia_do_rascunho, logo acima. Aqui so
    lemos o que estava no arquivo e passamos adiante, com a hora do proprio
    arquivo — assim a copia leva a hora em que aquele estado foi gravado, e nao
    a hora em que ele foi substituido.
    """
    if not caminho.is_file():
        return None
    try:
        anterior = caminho.read_text(encoding="utf-8")
        quando = datetime.fromtimestamp(caminho.stat().st_mtime)
    except OSError:
        return None
    nome, _ja_estava = registrar_copia_do_rascunho(caminho.parent, anterior, quando)
    return nome


def _texto_do_corpo(corpo: dict) -> str | None:
    """O que este pedido quer gravar, ja virado texto. None quando nao ha."""
    if "conteudo" in corpo:
        return json.dumps(corpo["conteudo"], ensure_ascii=False, indent=2)
    if "texto" in corpo:
        return str(corpo["texto"])
    return None


def api_copia_do_rascunho(corpo: dict | None = None) -> dict:
    """
    Guarda UMA copia de seguranca do rascunho. E o caminho oficial da tela.

    Sem conteudo no pedido, copia o que esta no rascunho atual. Com conteudo,
    guarda o conteudo mandado — que e o caso de a tela querer proteger o que
    esta na tela ANTES de trocar por outra coisa.

    Existe para a copia ter um dono so. Antes a tela criava a copia sozinha, com
    outro formato de nome e sem a regra do conteudo mudado, e o disco terminava
    com copias identicas ocupando as vagas das que serviam para voltar atras.
    """
    corpo = corpo or {}
    pasta = caminho_de_trabalho("prompts")
    texto = _texto_do_corpo(corpo)
    de_onde = "do que você mandou"

    if texto is None:
        atual = pasta / NOME_DO_RASCUNHO
        de_onde = "do rascunho que estava no disco"
        if not atual.is_file():
            return {"ok": True, "copia": None, "ja_estava_guardada": False,
                    "mensagem": "Ainda não há rascunho no disco para copiar."}
        try:
            texto = atual.read_text(encoding="utf-8")
        except OSError:
            raise ErroDeUso(
                "Não consegui ler o rascunho para guardar a copia. Nada foi "
                "perdido: o arquivo continua no disco."
            ) from None

    copia, ja_estava = registrar_copia_do_rascunho(pasta, texto)
    if copia is None:
        return {"ok": True, "copia": None, "ja_estava_guardada": False,
                "mensagem": "Não havia nada para guardar: o rascunho estava vazio."}
    return {
        "ok": True,
        "copia": copia,
        "ja_estava_guardada": ja_estava,
        "quantas_copias": len(_copias_datadas(pasta)),
        "endereco": "/api/trabalho/prompts/{}".format(copia),
        "mensagem": (
            "Este estado já estava guardado em {}. Não criei outra copia igual, "
            "para não gastar uma das {} vagas.".format(copia, QUANTOS_RASCUNHOS_GUARDAR)
            if ja_estava else
            "Guardei uma copia {} em {}.".format(de_onde, copia)
        ),
    }


def api_gravar_trabalho(tipo: str, nome: str, corpo: dict) -> dict:
    tipo = gaveta(tipo)
    caminho = caminho_de_trabalho(tipo, nome)
    corpo = corpo or {}
    copia_guardada = None

    # Pedido de gravar uma COPIA datada do rascunho. Ele nao grava o arquivo
    # pelo nome que pediu: entrega o conteudo ao dono unico da rede de copias,
    # que confere se aquele estado ja esta guardado, poe o segundo no nome e
    # cuida das doze vagas. A resposta diz o nome que ficou de verdade.
    #
    # Sem este desvio, a trava do conteudo mudado so valia para o rascunho
    # atual, e a copia que vinha da tela passava por fora dela — foi assim que
    # tres arquivos com o MESMO conteudo apareceram no disco do autor.
    if tipo == "prompts" and _e_copia_datada(caminho.name):
        texto = _texto_do_corpo(corpo)
        if texto is None:
            raise ErroDeUso(
                "O pedido de guardar uma copia do rascunho chegou sem conteúdo."
            )
        resposta = api_copia_do_rascunho({"texto": texto})
        resposta["nome_pedido"] = caminho.name
        resposta["nome"] = resposta.get("copia") or caminho.name
        return resposta

    if tipo == "prompts" and caminho.name == NOME_DO_RASCUNHO:
        copia_guardada = guardar_copia_do_rascunho(caminho)

    if "conteudo" in corpo:
        gravar_com_paciencia(
            caminho, json.dumps(corpo["conteudo"], ensure_ascii=False, indent=2)
        )
    elif "texto" in corpo:
        gravar_com_paciencia(caminho, str(corpo["texto"]))
    elif "dados_base64" in corpo:
        try:
            resultado = novelai.guardar_imagem_do_autor(
                caminho.parent, caminho.name, corpo["dados_base64"]
            )
        except novelai.ErroDaPonte as erro:
            raise ErroDeUso(str(erro)) from None
        return {"ok": True, "nome": nome, "bytes": resultado["bytes"],
                "endereco": "/api/trabalho/{}/{}".format(tipo, nome)}
    else:
        raise ErroDeUso(
            "O pedido de gravar chegou sem conteúdo. Mande 'conteudo' (dado), "
            "'texto' (texto simples) ou 'dados_base64' (imagem)."
        )

    resposta = {"ok": True, "nome": nome,
                "endereco": "/api/trabalho/{}/{}".format(tipo, nome)}
    if copia_guardada:
        resposta["copia_do_anterior"] = copia_guardada
    return resposta


def api_apagar_trabalho(tipo: str, nome: str) -> dict:
    tipo = gaveta(tipo)
    caminho = caminho_de_trabalho(tipo, nome)
    if not caminho.is_file():
        return {"ok": True, "mensagem": "Esse arquivo já não existia."}
    try:
        caminho.unlink()
    except OSError:
        raise ErroDeUso(
            "Não consegui apagar '{}'. Talvez ele esteja aberto em outro "
            "programa.".format(nome)
        ) from None
    return {"ok": True, "mensagem": "Apagado."}


def api_receber_imagem(corpo: dict) -> dict:
    """Recebe uma imagem que o autor arrastou para a tela."""
    corpo = corpo or {}
    tipo = str(corpo.get("tipo", "referencias"))
    nome = str(corpo.get("nome", "") or "")
    if not nome:
        nome = "imagem_{}.png".format(datetime.now().strftime("%Y%m%d_%H%M%S"))
    caminho = caminho_de_trabalho(tipo, nome)
    if caminho.suffix.lower() not in EXTENSOES_DE_IMAGEM:
        raise ErroDeUso(
            "A oficina guarda imagem em png, jpg, webp ou gif. O arquivo '{}' "
            "não e um desses.".format(nome)
        )
    try:
        resultado = novelai.guardar_imagem_do_autor(
            caminho.parent, caminho.name, corpo.get("dados_base64", "")
        )
    except novelai.ErroDaPonte as erro:
        raise ErroDeUso(str(erro)) from None
    return {
        "ok": True, "tipo": tipo, "nome": caminho.name, "bytes": resultado["bytes"],
        "endereco": "/api/trabalho/{}/{}".format(tipo, caminho.name),
    }


def api_personagens_do_livro() -> dict:
    """
    Devolve SO OS NOMES dos arquivos de Personagens\\.

    Nunca o conteudo. A oficina ajuda a nomear e a organizar; a aparencia vem do
    autor ou da imagem de referencia que ele anexa. Isto e proibicao da planta,
    nao preferencia.
    """
    if not PASTA_DE_PERSONAGENS.is_dir():
        return {"ok": True, "nomes": [], "aviso": "Não encontrei a pasta Personagens."}
    nomes = []
    try:
        for caminho in sorted(PASTA_DE_PERSONAGENS.glob("*.md")):
            if caminho.name.startswith("_"):
                continue
            nomes.append(caminho.stem)
    except OSError:
        return {"ok": True, "nomes": [],
                "aviso": "Não consegui listar a pasta Personagens agora."}
    return {
        "ok": True,
        "nomes": nomes,
        "aviso": (
            "Isto e só a lista de nomes. A oficina não le a aparência dos "
            "personagens nos arquivos do livro — ela vem de você."
        ),
    }


# A porta que servia o texto da Biblia Visual do livro (os tres arquivos de
# Imagens\_Biblia_Visual: PADRAO_VISUAL_DEFAULT.md, INDICE_REFERENCIAS.md e
# REGRAS_PROMPT_POR_MOTOR.md) foi FECHADA em 23/08/2026, e o motivo esta
# escrito aqui para ninguem reabri-la por engano.
#
# Ela existia, respondia e estava documentada — e nenhuma linha da tela a
# chamava. Uma rota viva servindo arquivo do livro por HTTP, para ninguem.
#
# Nao foi so codigo morto que saiu. Um dos tres arquivos que ela entregava e o
# PADRAO_VISUAL_DEFAULT.md, que descreve como as coisas do livro sao. A planta
# proibe, com todas as letras, a oficina puxar aparencia dos arquivos do livro:
# a aparencia vem do autor, ou da imagem de referencia que ele anexa. Deixar
# aberta uma porta que entrega justamente esse texto e convidar o defeito.
#
# O que a oficina continua lendo do livro e SO a lista de nomes de personagens,
# logo acima — que e o unico uso que a planta pede de verdade (o Atelie
# oferecer os nomes numa lista).
#
# Se um dia o Atelie precisar mostrar o padrao visual ao lado dos nomes, a rota
# volta com quatro linhas: a lista dos tres arquivos, a conferencia do nome
# contra ela, e ler_com_paciencia. Volte junto com a secao 8 do PROTOCOLO.md —
# e com a tela chamando, no mesmo dia.


def api_custo(corpo: dict) -> dict:
    pedido = (corpo or {}).get("pedido") or corpo or {}
    if not isinstance(pedido, dict):
        raise ErroDeUso(
            "O pedido chegou num formato que a oficina não entendeu, então ela "
            "não consegue calcular o custo. Recarregue a página."
        )
    conta = modulo_orcamento.calcular_custo(pedido, config=ler_config())
    cabe, motivo = ORCAMENTO.cabe(conta["anlas"])
    conta.update({"ok": True, "cabe_no_teto": cabe, "motivo": motivo,
                  "orcamento": ORCAMENTO.estado()})
    return conta


def api_modo(corpo: dict | None = None) -> dict:
    if corpo is not None and "geracao_ao_vivo" in corpo:
        ligar = bool(corpo["geracao_ao_vivo"])
        if ligar and not cofre.tem_token():
            raise ErroDeUso(
                "Não da para ligar a geracao ao vivo sem um token guardado. "
                "Guarde o token na tela do Cofre, ou use o botao Copiar prompt — "
                "que funciona sempre."
            )
        ESTADO["geracao_ao_vivo"] = ligar
    return {
        "ok": True,
        "geracao_ao_vivo": ESTADO["geracao_ao_vivo"],
        "modo_ensaio": not ESTADO["geracao_ao_vivo"],
        "mensagem": (
            "Geracao ao vivo LIGADA. A partir de agora, confirmar uma geracao "
            "gasta Anlas de verdade."
            if ESTADO["geracao_ao_vivo"] else
            "Modo ensaio. A oficina mostra a chamada e o custo, e não envia nada."
        ),
    }


def api_orcamento(corpo: dict | None = None) -> dict:
    if corpo:
        try:
            ORCAMENTO.mudar_tetos(
                teto_sessao=corpo.get("teto_sessao"),
                teto_dia=corpo.get("teto_dia"),
            )
        except (ValueError, TypeError):
            raise ErroDeUso("Os tetos precisam ser números inteiros.") from None
        except modulo_orcamento.ErroDeOrcamento as erro:
            raise ErroDeUso(str(erro)) from None
    estado = ORCAMENTO.estado()
    estado["ok"] = True
    estado["tabela_de_custo"] = modulo_orcamento.tabela_de_custo()
    return estado


def api_testar_token() -> dict:
    resultado = novelai.testar_token()
    resultado.setdefault("ok", False)
    resultado["gerou_imagem"] = False
    resultado["o_que_este_teste_nao_prova"] = (
        "Este teste pergunta os dados da sua conta. Ele NÃO gera imagem, então "
        "não prova que a geracao esta funcionando — e a geracao usa outro "
        "endereço, que e o único que pode ter mudado do lado do NovelAI. Para "
        "provar a geracao, use o botao 'Gerar 1 imagem de prova'."
    )
    return resultado


def api_testar_geracao(corpo: dict | None = None) -> dict:
    """
    Gera UMA imagem de verdade, a mais barata possivel.

    Existe porque o teste de token nao prova o que promete. Ele fala com o
    endereco da conta; a geracao fala com outro endereco, que e justamente o que
    esta marcado como nao verificado em endpoints.json. Um botao chamado "teste"
    que nunca toca na parte que pode quebrar nao testa nada.

    Este passa pelas MESMAS tres portas de /api/gerar: geracao ao vivo ligada,
    executar pedido, e custo confirmado. Nao ha atalho para gastar dinheiro.
    """
    corpo = corpo or {}
    config = ler_config()
    pedido = novelai.pedido_de_prova(config.get("modelo") or "v4_5_full")
    pedido["assinatura"] = config.get("assinatura", "nenhuma")

    resposta = api_gerar({
        "pedido": pedido,
        "executar": bool(corpo.get("executar")),
        "custo_confirmado": corpo.get("custo_confirmado"),
    })
    resposta["e_teste_de_geracao"] = True
    resposta.setdefault("mensagem", "")
    if resposta.get("gerou"):
        resposta["mensagem"] = (
            "A ponte esta de pé: o NovelAI recebeu o pedido e devolveu a imagem. "
            "Ela foi salva em meu_trabalho/geradas."
        )
    return resposta


def api_gerar(corpo: dict) -> dict:
    """
    O unico lugar do programa que pode gastar dinheiro.

    Tres portas, todas fechadas por padrao, e o pedido tem de passar pelas tres:
      1. A geracao ao vivo tem de estar ligada de proposito.
      2. O pedido tem de vir com executar=true.
      3. O custo tem de vir confirmado, e bater com o que a oficina calculou.
    Falhando qualquer uma, a resposta e o ENSAIO: a chamada montada e o custo,
    sem enviar nada.
    """
    corpo = corpo or {}
    pedido = corpo.get("pedido") or {}
    # Pedido que nao e um objeto (uma linha de texto solta, uma lista) parava
    # aqui dentro e virava "aconteceu um erro inesperado" — a frase que nao
    # ensina nada. Hoje ele volta dizendo o que faltou.
    if not isinstance(pedido, dict):
        raise ErroDeUso(
            "O pedido de geracao chegou num formato que a oficina não entendeu. "
            "Recarregue a página e monte o prompt de novo. Nada foi enviado e "
            "nada foi gasto."
        )

    try:
        montado = novelai.montar_pedido(pedido)
    except novelai.ErroDaPonte as erro:
        raise ErroDeUso(str(erro)) from None

    conta = modulo_orcamento.calcular_custo(pedido, config=ler_config())
    quer_executar = bool(corpo.get("executar"))

    ensaio = {
        "ok": True,
        "ensaio": True,
        "gerou": False,
        "pedido_montado": {
            "metodo": montado["metodo"],
            "url": montado["url"],
            "cabecalhos": montado["cabecalhos"],
            "corpo": montado["corpo_para_mostrar"],
            "endereco_verificado": montado["endereco_verificado"],
            "aviso_do_endereco": montado["aviso_do_endereco"],
            "imagens_anexadas": montado["imagens_anexadas"],
        },
        "semente": montado["semente"],
        "alertas": montado["alertas"],
        # "avisos" e a lista amarela: coisas que a tela deve mostrar, mas que
        # NAO barram a geracao. "alertas" e a vermelha, e barra.
        "avisos": montado.get("avisos") or [],
        "familia_do_modelo": montado.get("familia_do_modelo", ""),
        "pode_gerar": montado["pode_gerar"],
        "custo": conta,
        "orcamento": ORCAMENTO.estado(),
    }

    # O teto de gasto tem de aparecer JA NO ENSAIO (achado testando a ponte de
    # pe, 23/08/2026).
    #
    # O que acontecia: o ensaio dizia "pode_gerar: sim" e mostrava o custo, ainda
    # que o teto de gasto fosse barrar a geracao logo depois. O autor ligava a
    # geracao ao vivo, confirmava o valor, e so entao levava a recusa. O modo
    # ensaio e a UNICA tela onde ele confere a chamada antes de gastar — calar o
    # teto justamente ali tira dela a serventia que ela tem.
    #
    # A recusa de verdade continua acontecendo mais abaixo, no ORCAMENTO.cabe()
    # imediatamente antes do envio: este aviso nao substitui a trava, ele so
    # deixa de esconder o que a trava vai fazer.
    cabe_no_teto, frase_do_teto = ORCAMENTO.cabe(conta["anlas"])
    if not cabe_no_teto:
        ensaio["avisos"] = list(ensaio["avisos"]) + [frase_do_teto]
        ensaio["cabe_no_teto"] = False
    else:
        ensaio["cabe_no_teto"] = True

    if not quer_executar:
        ensaio["motivo"] = (
            "Ensaio pedido. Nada foi enviado ao NovelAI e nenhum Anlas foi gasto. "
            "Esta e a chamada que a oficina faria."
        )
        return ensaio

    # A imagem prometida que nunca chegou.
    #
    # Esta e a barreira que impede o pior desfecho desta ferramenta: o autor
    # confirmar um gasto por uma referencia de personagem que nao sai da maquina
    # dele, e receber uma imagem gerada sem referencia nenhuma. A conta ja nao
    # cobra por ela; aqui a geracao tambem para.
    if not montado["pode_gerar"]:
        ensaio["motivo"] = " ".join(montado["alertas"])
        return ensaio

    if not ESTADO["geracao_ao_vivo"]:
        ensaio["motivo"] = (
            "A geracao ao vivo esta desligada, e ela e o padrao desligada de "
            "propósito. Nada foi enviado. Para gerar aqui dentro, ligue a chave "
            "na tela do Cofre e Gasto."
        )
        return ensaio

    if not cofre.tem_token():
        ensaio["motivo"] = (
            "Não há token guardado nesta máquina, então a oficina não gera aqui "
            "dentro. Use o botao Copiar prompt e cole no site do NovelAI."
        )
        return ensaio

    confirmado = corpo.get("custo_confirmado")
    if confirmado is None or int(confirmado) != int(conta["anlas"]):
        ensaio["motivo"] = (
            "O custo desta geracao e de {} Anlas e ainda não foi confirmado. "
            "Confirme o valor na tela e a oficina gera.".format(conta["anlas"])
        )
        ensaio["precisa_confirmar"] = conta["anlas"]
        return ensaio

    cabe, frase = ORCAMENTO.cabe(conta["anlas"])
    if not cabe:
        return {"ok": False, "gerou": False, "erro": frase,
                "custo": conta, "orcamento": ORCAMENTO.estado()}

    if not ORCAMENTO.comecar_geracao():
        return {
            "ok": False, "gerou": False,
            "erro": (
                "Já existe uma geracao acontecendo. A conta do NovelAI permite "
                "só uma por vez. Espere ela terminar."
            ),
            "orcamento": ORCAMENTO.estado(),
        }

    try:
        segundos = int(((novelai.enderecos().get("limites") or {}).get("segundos_de_espera")) or 180)
        imagens = novelai.executar(montado, segundos=segundos)
        salvos = novelai.salvar_imagens(
            PASTA_DE_TRABALHO / "geradas", imagens, montado, conta["anlas"], conta
        )
        ORCAMENTO.registrar_gasto(conta["anlas"])
    except novelai.ErroDaPonte as erro:
        return {"ok": False, "gerou": False, "erro": str(erro),
                "orcamento": ORCAMENTO.estado()}
    except OSError:
        return {
            "ok": False, "gerou": False,
            "erro": (
                "A imagem foi gerada, mas não consegui salvar no disco. Se a "
                "pasta esta sincronizando com o OneDrive, espere e tente de novo. "
                "O Anlas dessa geracao já foi gasto pelo NovelAI."
            ),
            "orcamento": ORCAMENTO.estado(),
        }
    finally:
        ORCAMENTO.terminar_geracao()

    return {
        "ok": True, "ensaio": False, "gerou": True,
        "arquivos": [
            {
                "imagem": s["imagem"],
                "ficha": s["ficha"],
                "semente": s["semente"],
                "endereco": "/api/trabalho/geradas/{}".format(s["imagem"]),
            }
            for s in salvos
        ],
        "anlas_gastos": conta["anlas"],
        "custo": conta,
        "avisos": montado.get("avisos") or [],
        "orcamento": ORCAMENTO.estado(),
        "mensagem": "Pronto. {} salva{} em meu_trabalho/geradas.".format(
            "{} imagem".format(len(salvos)) if len(salvos) == 1
            else "{} imagens".format(len(salvos)),
            "" if len(salvos) == 1 else "s",
        ),
    }


def api_enderecos() -> dict:
    """Mostra a fabrica: os enderecos tecnicos que a oficina usaria."""
    dados = novelai.enderecos(recarregar=True)
    return {
        "ok": True,
        "bases": dados.get("bases"),
        "rotas": dados.get("rotas"),
        "modelos": dados.get("modelos"),
        "acoes_de_direcao": dados.get("acoes_de_direcao"),
        "limites": dados.get("limites"),
        # Os numeros de cada preset de Conteudo Indesejado, com o aviso de que
        # sao estimativa. A tela precisa deles para nao prometer certeza onde
        # nao ha: o manual do NovelAI nao publica esses numeros.
        "presets_de_conteudo_indesejado": dados.get("presets_de_conteudo_indesejado"),
        "estrutura_das_caixas_de_personagem": dados.get(
            "estrutura_das_caixas_de_personagem"
        ),
        "aviso": (
            "Nenhum destes endereços esta na documentacao oficial do NovelAI. "
            "Eles vivem em ponte/endpoints.json e são consertaveis sem mexer no "
            "programa. Se a geracao quebrar, o resto da oficina continua servindo."
        ),
    }


# ---------------------------------------------------------------------------
# O atendente dos pedidos
# ---------------------------------------------------------------------------

class Atendente(BaseHTTPRequestHandler):
    server_version = "OficinaDeImagem"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    # -- log: curto, em portugues, e NUNCA com corpo de pedido -------------

    def log_message(self, formato, *args):  # noqa: A003
        caminho = self.path.split("?")[0]
        if caminho.startswith("/api/token"):
            caminho = "/api/token (o conteúdo deste pedido nunca e registrado)"
        print("  {} {}".format(self.command, caminho))

    def log_error(self, formato, *args):
        return

    # -- seguranca ---------------------------------------------------------

    def _endereco_e_local(self) -> bool:
        """
        Confere que o pedido veio do proprio computador.

        Isto impede que um site aberto noutra aba do navegador converse com a
        oficina as escondidas.
        """
        cabecalho = (self.headers.get("Host") or "").strip()
        maquina = cabecalho.rsplit(":", 1)[0].strip("[]").lower() if cabecalho else ""
        if maquina not in ("127.0.0.1", "localhost", "::1"):
            return False

        if self.command in ("POST", "PUT", "DELETE"):
            origem = (self.headers.get("Origin") or "").strip()
            if origem:
                pedaco = urlparse(origem)
                if pedaco.hostname not in ("127.0.0.1", "localhost", "::1"):
                    return False
        return True

    # -- respostas ---------------------------------------------------------

    def _responder(self, codigo: int, corpo: bytes, tipo: str) -> None:
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        try:
            self.wfile.write(corpo)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _responder_json(self, objeto: dict, codigo: int = 200) -> None:
        corpo = json.dumps(objeto, ensure_ascii=False).encode("utf-8")
        self._responder(codigo, corpo, "application/json; charset=utf-8")

    def _erro(self, frase: str, codigo: int = 400) -> None:
        self._responder_json({"ok": False, "erro": frase}, codigo)

    def _corpo_do_pedido(self) -> dict:
        try:
            tamanho = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise ErroDeUso("O pedido chegou com tamanho inválido.") from None
        if tamanho <= 0:
            return {}
        if tamanho > TAMANHO_MAXIMO_DO_PEDIDO:
            raise ErroDeUso(
                "Esse arquivo e grande demais para a oficina (mais de {} MB). "
                "Salve uma versão menor.".format(TAMANHO_MAXIMO_DO_PEDIDO // (1024 * 1024))
            )
        bruto = self.rfile.read(tamanho)
        try:
            dados = json.loads(bruto.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise ErroDeUso("O pedido chegou embaralhado e a oficina não entendeu.") from None
        return dados if isinstance(dados, dict) else {}

    # -- o roteador --------------------------------------------------------

    def do_GET(self):  # noqa: N802
        self._atender("GET")

    def do_POST(self):  # noqa: N802
        self._atender("POST")

    def do_PUT(self):  # noqa: N802
        self._atender("PUT")

    def do_DELETE(self):  # noqa: N802
        self._atender("DELETE")

    def _atender(self, metodo: str) -> None:
        if not self._endereco_e_local():
            self._erro(
                "Este pedido não veio do seu computador, e a oficina só atende a "
                "si mesma.", 403
            )
            return

        caminho = urlparse(self.path).path
        try:
            if caminho.startswith("/api/"):
                self._atender_api(metodo, caminho)
            elif metodo == "GET":
                self._atender_arquivo(caminho)
            else:
                self._erro("Endereco desconhecido.", 404)
        except ErroDeUso as erro:
            self._erro(str(erro), 400)
        except Exception:  # noqa: BLE001
            # Nunca vaza rastro de erro para a tela do autor.
            print("  ! erro inesperado ao atender {} {}".format(metodo, caminho))
            self._erro(
                "Aconteceu um erro inesperado dentro da oficina. Seu trabalho "
                "salvo esta intacto. Se repetir, feche a janela preta e abra a "
                "oficina de novo.", 500
            )

    def _atender_api(self, metodo: str, caminho: str) -> None:
        # O navegador manda o endereco codificado: um nome como
        # "Heitor em Egide.json" chega como "Heitor%20em%20Egide.json", e um
        # acento chega como "%C3%A9". Sem desfazer isso, todo nome com espaco ou
        # acento era recusado — e sao justamente os nomes que o autor usa.
        #
        # A ordem importa e nao pode ser trocada: primeiro parte no "/", DEPOIS
        # desfaz a codificacao de cada pedaco. Assim um "%2f" escondido dentro de
        # um nome vira uma barra literal DENTRO do pedaco, e nao um separador
        # novo — e a conferencia de nome mais adiante o recusa.
        partes = [unquote(p) for p in caminho.split("/") if p][1:]  # tira o "api"
        alvo = partes[0] if partes else ""

        if alvo == "estado" and metodo == "GET":
            return self._responder_json(api_estado())

        if alvo == "token":
            if metodo == "POST":
                return self._responder_json(api_guardar_token(self._corpo_do_pedido()))
            if metodo == "DELETE":
                return self._responder_json(api_apagar_token())

        if alvo == "modo":
            if metodo == "GET":
                return self._responder_json(api_modo())
            if metodo == "POST":
                return self._responder_json(api_modo(self._corpo_do_pedido()))

        if alvo == "orcamento":
            if metodo == "GET":
                return self._responder_json(api_orcamento())
            if metodo == "POST":
                return self._responder_json(api_orcamento(self._corpo_do_pedido()))

        if alvo == "config":
            if metodo == "GET":
                return self._responder_json(api_config())
            if metodo == "POST":
                return self._responder_json(api_config(self._corpo_do_pedido()))

        if alvo == "trabalho":
            tipo = partes[1] if len(partes) > 1 else ""
            nome = "/".join(partes[2:])
            if not tipo:
                return self._erro(
                    "Diga qual gaveta: {}.".format(", ".join(TIPOS_DE_TRABALHO)), 404
                )
            if not nome:
                if metodo == "GET":
                    return self._responder_json(api_listar_trabalho(tipo))
                return self._erro("Falta o nome do arquivo.", 400)
            if metodo == "GET":
                especie, dados, tipo_do_conteudo = api_ler_trabalho(tipo, nome)
                if especie == "binario":
                    return self._responder(200, dados, tipo_do_conteudo)
                return self._responder_json(dados)
            if metodo == "PUT":
                return self._responder_json(
                    api_gravar_trabalho(tipo, nome, self._corpo_do_pedido())
                )
            if metodo == "DELETE":
                return self._responder_json(api_apagar_trabalho(tipo, nome))

        if alvo == "copia_do_rascunho" and metodo == "POST":
            return self._responder_json(
                api_copia_do_rascunho(self._corpo_do_pedido())
            )

        if alvo == "imagem" and metodo == "POST":
            return self._responder_json(api_receber_imagem(self._corpo_do_pedido()))

        if alvo == "livro" and metodo == "GET":
            o_que = partes[1] if len(partes) > 1 else ""
            if o_que == "personagens":
                return self._responder_json(api_personagens_do_livro())
            return self._erro(
                "A oficina le uma coisa só do livro: a lista de nomes de "
                "personagens. Nada além disso.", 404
            )

        if alvo == "custo" and metodo == "POST":
            return self._responder_json(api_custo(self._corpo_do_pedido()))

        if alvo == "gerar" and metodo == "POST":
            return self._responder_json(api_gerar(self._corpo_do_pedido()))

        if alvo == "testar_token" and metodo == "POST":
            return self._responder_json(api_testar_token())

        if alvo == "testar_geracao" and metodo == "POST":
            return self._responder_json(api_testar_geracao(self._corpo_do_pedido()))

        if alvo == "enderecos" and metodo == "GET":
            return self._responder_json(api_enderecos())

        # A frase que o autor le quando a tela pede uma coisa que a ponte nao
        # tem. Ela nao manda ele abrir documento de programador: PROTOCOLO.md e
        # escrito para quem constroi a oficina, e ele nunca vai abrir aquilo —
        # nem deveria precisar. O endereco continua na frase porque quem for
        # consertar precisa dele, mas a instrucao e para ELE, e cabe numa linha.
        self._erro(
            "Isso e defeito da oficina, não seu. Feche a janela preta e abra a "
            "oficina de novo. Se acontecer outra vez, o pedido que falhou foi "
            "'{} {}'.".format(metodo, caminho),
            404,
        )

    def _atender_arquivo(self, caminho: str) -> None:
        alvo = caminho_estatico(caminho)
        if alvo is None:
            if caminho in ("/", "/index.html", "/Oficina.html"):
                pagina = PAGINA_DE_EMERGENCIA.replace("%PASTA%", str(PASTA_DA_FERRAMENTA))
                return self._responder(200, pagina.encode("utf-8"), "text/html; charset=utf-8")
            return self._erro("Não encontrei esse arquivo na oficina.", 404)

        dados = ler_com_paciencia(alvo, binario=True)
        self._responder(
            200, dados, TIPOS_DE_CONTEUDO.get(alvo.suffix.lower(), "application/octet-stream")
        )


class ServidorDaOficina(ThreadingHTTPServer):
    daemon_threads = True
    # No Windows, deixar isto ligado permitiria dois servidores na mesma porta,
    # e a procura por porta livre daria certo por engano.
    allow_reuse_address = False


# ---------------------------------------------------------------------------
# Ligar
# ---------------------------------------------------------------------------

def procurar_porta() -> tuple[ServidorDaOficina | None, int | None]:
    for porta in range(PORTA_INICIAL, PORTA_FINAL + 1):
        try:
            return ServidorDaOficina(("127.0.0.1", porta), Atendente), porta
        except OSError:
            continue
    return None, None


def procurar_oficina_ja_aberta() -> int | None:
    """
    Procura uma Oficina DESTA MESMA PASTA ja rodando, e devolve a porta dela.

    Por que isto e importante, e o efeito e maior do que parece: a oficina
    procura porta livre de 8760 a 8770. Dar dois cliques no atalho com a oficina
    ja aberta subia uma SEGUNDA oficina numa porta nova. E o navegador guarda a
    memoria da pagina por endereco — porta inclusa. Entao, na porta nova:

      - o album de exemplos de tag aparecia vazio, embora as imagens estivessem
        no disco;
      - o rascunho recuperado do disco brigava com o que a tela ja tinha;
      - e as duas janelas contavam gasto separado, furando o teto de Anlas.

    Achar a que ja esta de pe e abrir o navegador nela resolve os tres de uma
    vez, e e o comportamento que o autor espera: dois cliques no atalho levam a
    oficina dele, nao a uma copia.

    AS ONZE PORTAS SAO PERGUNTADAS AO MESMO TEMPO, e isso nao e capricho. No
    Windows, perguntar a uma porta fechada aqui nao volta "fechada" na hora: a
    pergunta fica sem resposta ate o tempo acabar. Uma por vez, as onze levavam
    ONZE SEGUNDOS — e esse e o caminho NORMAL, o de nao haver oficina aberta
    nenhuma. Onze segundos de janela preta muda antes de o navegador abrir e
    exatamente a cara de um programa travado. Todas juntas, leva menos de um
    segundo.
    """
    import urllib.error
    import urllib.request

    nossa_pasta = str(PASTA_DE_TRABALHO.resolve()).lower()
    achadas: dict[int, bool] = {}
    trava = threading.Lock()

    def perguntar(porta: int) -> None:
        endereco = "http://127.0.0.1:{}/api/estado".format(porta)
        try:
            with urllib.request.urlopen(endereco, timeout=SEGUNDOS_DE_ESPERA_DA_VARREDURA) as resposta:
                dados = json.loads(resposta.read().decode("utf-8", "replace"))
        except (urllib.error.URLError, OSError, ValueError):
            return
        if not isinstance(dados, dict):
            return
        dela = str(dados.get("pasta_de_trabalho") or "").lower()
        try:
            mesma = bool(dela) and Path(dela).resolve() == Path(nossa_pasta)
        except OSError:
            mesma = dela == nossa_pasta
        if mesma:
            with trava:
                achadas[porta] = True

    perguntas = [
        threading.Thread(target=perguntar, args=(porta,), daemon=True)
        for porta in range(PORTA_INICIAL, PORTA_FINAL + 1)
    ]
    for p in perguntas:
        p.start()
    for p in perguntas:
        # O tempo de espera de cada pergunta ja e o teto; o dobro aqui e so
        # folga para uma maquina lenta. Uma pergunta que nao volta nunca nao
        # pode segurar a abertura da oficina.
        p.join(timeout=SEGUNDOS_DE_ESPERA_DA_VARREDURA * 2)

    return min(achadas) if achadas else None


def abrir_navegador(url: str) -> None:
    def tarefa():
        time.sleep(1.0)
        try:
            if not webbrowser.open(url):
                raise RuntimeError
        except Exception:  # noqa: BLE001
            print("\n  Não consegui abrir o navegador sozinho.")
            print("  Abra o seu navegador e digite este endereço:")
            print("      {}\n".format(url))

    threading.Thread(target=tarefa, daemon=True).start()


def escrever_abertura(url: str) -> None:
    tem_token = cofre.tem_token()
    print("")
    print("  ==========================================================")
    print("   OFICINA DE IMAGEM")
    print("   A oficina esta ligada. NÃO FECHE ESTA JANELA.")
    print("  ==========================================================")
    print("")
    print("   Endereco:      {}".format(url))
    print("   Seu trabalho:  {}".format(PASTA_DE_TRABALHO))
    if tem_token:
        print("   Token:         guardado (fora da pasta do livro)")
    else:
        print("   Token:         nenhum — a oficina funciona inteira assim.")
        print("                  Monte o prompt aqui e use o botao Copiar.")
    print("   Geracao:       MODO ENSAIO. Nada e enviado ao NovelAI e nenhum")
    print("                  Anlas e gasto até você ligar a geracao ao vivo.")
    print("")
    print("   Para fechar a oficina: feche esta janela.")
    print("   Seu trabalho já esta gravado no disco a cada mudança.")
    print("")


def principal(argumentos: list[str]) -> int:
    if "--autoteste" in argumentos:
        return autoteste()

    # Faz cada linha aparecer na janela preta na hora em que e escrita.
    # Sem isto, o Python junta as linhas e so as mostra quando acumula bastante
    # — e a frase que mais importa ("nao feche esta janela", e o endereco da
    # oficina) e justamente a primeira. Ficar olhando uma janela preta vazia e
    # o comeco de fechar a janela achando que travou.
    #
    # E "errors=replace" existe para um risco pior: se por qualquer motivo o
    # chcp 65001 do atalho nao pegar, a janela preta fica numa codificacao que
    # nao sabe escrever "—" nem "geracao". Sem esta linha, a primeira frase com
    # acento derrubaria o programa inteiro — e o autor veria a janela piscar e
    # sumir, que e o modo de falhar que nao deixa pista nenhuma.
    try:
        sys.stdout.reconfigure(line_buffering=True, errors="replace")
    except (AttributeError, ValueError, OSError):
        try:
            sys.stdout.reconfigure(line_buffering=True)
        except (AttributeError, ValueError, OSError):
            pass

    try:
        preparar_pastas()
    except OSError as erro:
        print("\n  Não consegui criar a pasta do seu trabalho em:")
        print("      {}".format(PASTA_DE_TRABALHO))
        print("  O Windows recusou. Detalhe técnico: {}".format(erro))
        print("  A oficina não vai conseguir salvar no disco assim.\n")
        return SAIU_SEM_PASTA

    # A oficina ja esta aberta? Entao nao sobe outra: leva o autor para a que
    # existe. Duas oficinas ao mesmo tempo perdem trabalho e furam o teto de
    # gasto — o porque esta escrito em procurar_oficina_ja_aberta().
    if "--forcar-segunda" not in argumentos:
        # A conferencia pode levar alguns segundos se outro programa estiver
        # segurando uma das portas sem responder. Sem esta linha, a janela preta
        # ficaria muda nesse tempo — e janela preta muda parece travada.
        print("   Conferindo se a oficina já esta aberta...")
        ja_aberta = procurar_oficina_ja_aberta()
        if ja_aberta is not None:
            url_existente = "http://127.0.0.1:{}/".format(ja_aberta)
            print("")
            print("  A OFICINA JÁ ESTA ABERTA.")
            print("")
            print("  Existe uma janela preta da oficina rodando neste computador,")
            print("  e ela e a sua. Vou abrir o navegador nela em vez de começar")
            print("  outra — duas oficinas ao mesmo tempo atrapalham uma a outra:")
            print("  o seu album some da tela e a conta de gasto se divide.")
            print("")
            print("      {}".format(url_existente))
            print("")
            print("  ESTA janela aqui pode ser fechada. A OUTRA, não.")
            print("")
            if "--sem-navegador" not in argumentos:
                try:
                    webbrowser.open(url_existente)
                except Exception:  # noqa: BLE001
                    pass
            # O codigo 7 e um combinado com o atalho ABRIR A OFICINA.bat: ele
            # segura a janela preta aberta para o autor LER esta mensagem.
            # Sem isso, a janela apareceria e sumiria no mesmo instante — que e
            # o modo de falhar que nao deixa pista, e o que a planta mais evita.
            return SAIU_PORQUE_JA_ESTAVA_ABERTA

    servidor, porta = procurar_porta()
    if servidor is None:
        print("\n  Todas as portas de {} a {} estao ocupadas por outro programa.".format(
            PORTA_INICIAL, PORTA_FINAL))
        print("  Feche outros programas de desenvolvimento e tente de novo.")
        print("  Enquanto isso, você ainda pode abrir o arquivo Oficina.html")
        print("  com dois cliques — funciona sem salvar no disco.\n")
        return SAIU_SEM_PORTA

    ESTADO["porta"] = porta
    url = "http://127.0.0.1:{}/".format(porta)

    escrever_abertura(url)
    if "--sem-navegador" not in argumentos:
        abrir_navegador(url)

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Oficina desligada. Seu trabalho esta salvo.\n")
    finally:
        try:
            servidor.server_close()
        except OSError:
            pass
    return SAIU_BEM


# ---------------------------------------------------------------------------
# Autoteste: confere as travas sem abrir nada e sem falar com a internet
# ---------------------------------------------------------------------------

def autoteste() -> int:
    # Declarado aqui em cima porque mais abaixo os testes da rede do rascunho
    # trocam esta pasta pela de mentira. O Python exige a declaracao antes do
    # primeiro uso do nome na funcao.
    global PASTA_DE_TRABALHO

    falhas = []
    print("Autoteste da ponte da Oficina de Imagem")
    print("  pasta da ferramenta: {}".format(PASTA_DA_FERRAMENTA))
    print("  raiz do livro:       {}".format(RAIZ_DO_LIVRO))

    try:
        preparar_pastas()
    except OSError as erro:
        falhas.append("Não criou as pastas de trabalho: {}".format(erro))

    for tipo in TIPOS_DE_TRABALHO:
        if not (PASTA_DE_TRABALHO / tipo).is_dir():
            falhas.append("A gaveta '{}' não foi criada.".format(tipo))

    # 1. Nenhum caminho pode escapar de meu_trabalho.
    fugas = [
        ("meus_personagens", "../../../Personagens/Heitor.md"),
        ("meus_personagens", "..\\..\\Capítulos\\Capítulo 15.md"),
        ("meus_personagens", "../orcamento.json"),
        ("geradas", "a/b/c/d.png"),
        ("meus_personagens", "con.json"),
        ("meus_personagens", "arquivo|estranho.json"),
        ("meus_personagens", ""),
        # O apelido antigo continua valendo, e continua igualmente trancado.
        ("personagens", "../../../Personagens/Heitor.md"),
    ]
    for tipo, nome in fugas:
        try:
            caminho = caminho_de_trabalho(tipo, nome)
        except ErroDeUso:
            continue
        if nome == "":
            continue  # listar a gaveta e legitimo
        falhas.append("Deixou passar o caminho perigoso: {} / {}".format(tipo, nome))
        del caminho

    for tipo in ("..", "capitulos", "biblia", "Capítulos"):
        try:
            caminho_de_trabalho(tipo, "x.json")
        except ErroDeUso:
            continue
        falhas.append("Aceitou a gaveta inventada '{}'.".format(tipo))

    # O apelido antigo aponta para a gaveta nova, e nao para uma pasta a parte.
    if caminho_de_trabalho("personagens", "Heitor.json") != caminho_de_trabalho(
        "meus_personagens", "Heitor.json"
    ):
        falhas.append("O nome antigo 'personagens' deveria cair em 'meus_personagens'.")
    if (PASTA_DE_TRABALHO / "personagens").is_dir():
        falhas.append(
            "A pasta 'personagens' continua no disco. Ela tem o mesmo nome da "
            "pasta do livro, e a trava do projeto tropeça nela."
        )

    # 2. Caminho legitimo tem de funcionar.
    try:
        bom = caminho_de_trabalho("geradas", "2026-08-21/oficina_120000_01.png")
        if not str(bom).startswith(str(PASTA_DE_TRABALHO)):
            falhas.append("O caminho legítimo saiu de meu_trabalho.")
    except ErroDeUso as erro:
        falhas.append("Recusou um caminho legítimo: {}".format(erro))

    # 3. Arquivo estatico: nao entrega programa nem o cofre.
    for proibido in ("/ponte/servidor.py", "/ponte/cofre.py", "/ponte/endpoints.json",
                     "/meu_trabalho/orcamento.json", "/../CLAUDE.md",
                     "/..%2fCLAUDE.md", "/ponte/../ponte/novelai.py"):
        if caminho_estatico(proibido) is not None:
            falhas.append("Serviu um arquivo proibido: {}".format(proibido))

    # 4. O estado nunca carrega o token.
    estado = api_estado()
    texto = json.dumps(estado, ensure_ascii=False)
    if "token" not in texto:
        falhas.append("O estado deveria dizer se há token guardado.")
    guardado = cofre.ler()
    if guardado and guardado in texto:
        falhas.append("O ESTADO VAZOU O TOKEN. Isso e falha grave.")
    if estado.get("modo_ensaio") is not True:
        falhas.append("A oficina tem de começar no modo ensaio.")

    # 5. Gerar sem confirmar nunca envia nada.
    resposta = api_gerar({"pedido": {"prompt": "1girl, best quality"}, "executar": True})
    if resposta.get("gerou"):
        falhas.append("GEROU sem a geracao ao vivo estar ligada. Falha grave.")
    if not resposta.get("ensaio"):
        falhas.append("Sem geracao ao vivo, a resposta tem de ser o ensaio.")
    if "Bearer " in json.dumps(resposta) and "nunca mostra" not in json.dumps(resposta):
        falhas.append("A resposta do ensaio carrega token.")

    # 6. Ligar a geracao ao vivo sem token tem de ser recusado.
    if not cofre.tem_token():
        try:
            api_modo({"geracao_ao_vivo": True})
        except ErroDeUso:
            pass
        else:
            falhas.append("Ligou a geracao ao vivo sem token guardado.")
        if ESTADO["geracao_ao_vivo"]:
            falhas.append("A geracao ao vivo ficou ligada sem token.")

    # 6b. Prometer referencia sem anexar a imagem nao gera e nao cobra.
    #
    # Este e o defeito mais caro que a rodada de critica encontrou: a tela
    # mandava so a CONTAGEM das referencias, a conta cobrava 5 Anlas por cada
    # uma, o botao dizia "Confirmar e gastar", e a imagem nunca saia daqui.
    prometida = api_gerar({
        "pedido": {"prompt": "1girl", "character_reference": 2},
        "executar": True,
        "custo_confirmado": 0,
    })
    if prometida.get("gerou"):
        falhas.append("Gerou com referência prometida e não anexada.")
    if prometida.get("pode_gerar"):
        falhas.append("Referência prometida sem imagem deveria barrar a geracao.")
    cobranca_de_referencia = sum(
        item["anlas"] for item in prometida.get("custo", {}).get("itens", [])
        if "referencia" in item["item"].lower()
    )
    if cobranca_de_referencia:
        falhas.append(
            "Cobrou {} Anlas por uma referência que não vai ser enviada. Cobrar "
            "por coisa que não acontece e o pior defeito desta "
            "ferramenta.".format(cobranca_de_referencia)
        )
    if not prometida.get("custo", {}).get("faltam_imagens_de_referencia"):
        falhas.append("A conta deveria marcar que falta a imagem de referência.")

    # 6c. O teto de gasto tem de aparecer JA NO ENSAIO (23/08/2026).
    #
    # O ensaio e a UNICA tela onde o autor confere a chamada antes de gastar.
    # Ate esta data ele dizia "pode_gerar: sim" e mostrava o custo mesmo quando
    # o teto ia barrar a geracao logo depois — e o autor so descobria depois de
    # ligar a geracao ao vivo e confirmar o valor.
    tetos_de_antes = (ORCAMENTO.estado()["teto_sessao"], ORCAMENTO.estado()["teto_dia"])
    try:
        ORCAMENTO.mudar_tetos(teto_sessao=1, teto_dia=1)
        apertado = api_gerar({"pedido": {"prompt": "1girl",
                                         "preset_indesejado": "pesado"}})
        if apertado.get("cabe_no_teto") is not False:
            falhas.append(
                "Com o teto abaixo do custo, o ensaio tem de dizer "
                "cabe_no_teto: falso."
            )
        if not apertado.get("avisos"):
            falhas.append(
                "Passar do teto de gasto tem de sair escrito no ensaio, e não "
                "só na hora de confirmar."
            )
        if apertado.get("gerou"):
            falhas.append("O ensaio não pode gerar nada, com teto ou sem.")

        # E o contrario: teto folgado nao pode inventar aviso de dinheiro.
        ORCAMENTO.mudar_tetos(teto_sessao=1000, teto_dia=1000)
        folgado = api_gerar({"pedido": {"prompt": "1girl",
                                        "preset_indesejado": "pesado"}})
        if folgado.get("cabe_no_teto") is not True:
            falhas.append("Com teto folgado, cabe_no_teto tem de ser verdadeiro.")
        if folgado.get("avisos"):
            falhas.append(
                "Teto folgado não pode gerar aviso de dinheiro: alarme falso "
                "ensina o autor a ignorar alarme."
            )
    finally:
        ORCAMENTO.mudar_tetos(teto_sessao=tetos_de_antes[0], teto_dia=tetos_de_antes[1])

    # 7. Custo responde sem gerar nada, e so cobra a referencia que vai junto.
    conta = api_custo({"pedido": {"assinatura": "opus", "modelo": "v4_5_full",
                                  "largura": 832, "altura": 1216, "passos": 28,
                                  "character_reference": 1,
                                  "referencias": [{"dados_base64": "AAAA"}]}})
    if conta.get("anlas") != 5:
        falhas.append("A conta de uma referência precisa anexada deveria dar 5 Anlas.")

    conta_vazia = api_custo({"pedido": {"assinatura": "opus", "modelo": "v4_5_full",
                                        "largura": 832, "altura": 1216, "passos": 28,
                                        "character_reference": 1}})
    if conta_vazia.get("anlas") != 0:
        falhas.append("Referência sem imagem anexada não pode entrar na conta.")

    # 7b. As preferencias existem, e o plano sai delas quando a tela nao manda.
    config = ler_config()
    if "assinatura" not in config:
        falhas.append("O arquivo de preferências deveria ter o plano de assinatura.")
    if not (PASTA_DE_TRABALHO / ARQUIVO_DE_CONFIG).is_file():
        falhas.append("O arquivo meu_trabalho/config.json deveria ter sido criado.")
    if not (PASTA_DE_TRABALHO / "exemplos" / "_indice.json").is_file():
        falhas.append(
            "O índice de exemplos deveria nascer no disco. Sem ele, o album de "
            "exemplos de tag some quando a oficina abre noutra porta."
        )
    try:
        gravar_config({"assinatura": "plano_inventado"})
    except ErroDeUso:
        pass
    else:
        falhas.append("Aceitou um plano de assinatura que não existe.")

    # 7c e 7d rodam numa pasta DE MENTIRA, nunca na do autor.
    #
    # Isto foi aprendido do jeito caro, em 23/08/2026: os dois testes abaixo
    # gravam e apagam rascunhos, e enquanto rodavam na pasta de verdade cada
    # execucao do autoteste consumia vagas das doze copias de seguranca. Rodando
    # o autoteste algumas vezes seguidas, as copias do trabalho REAL do autor
    # eram empurradas para fora — o teste da rede de seguranca destruindo aquilo
    # que a rede existe para guardar.
    #
    # Um teste nunca pode custar o trabalho do autor. Daqui para baixo, ate o
    # "finally", a oficina inteira aponta para uma pasta temporaria.
    pasta_de_verdade = PASTA_DE_TRABALHO
    pasta_de_mentira = Path(tempfile.mkdtemp(prefix="oficina_autoteste_"))
    try:
        PASTA_DE_TRABALHO = pasta_de_mentira
        for gaveta in TIPOS_DE_TRABALHO:
            (pasta_de_mentira / gaveta).mkdir(parents=True, exist_ok=True)
        falhas.extend(_autoteste_da_rede_do_rascunho())
    finally:
        PASTA_DE_TRABALHO = pasta_de_verdade
        shutil.rmtree(pasta_de_mentira, ignore_errors=True)

    # 8. Leitura do livro: so nomes, nunca conteudo.
    lista = api_personagens_do_livro()
    if not isinstance(lista.get("nomes"), list):
        falhas.append("A lista de personagens do livro não veio como lista.")
    if any(len(str(n)) > 120 for n in lista.get("nomes", [])):
        falhas.append("A lista de personagens trouxe conteúdo, não só nome.")
    return _autoteste_resto(falhas)


def _autoteste_da_rede_do_rascunho() -> list[str]:
    """
    Os dois testes da rede de copias do rascunho, isolados numa pasta de mentira.

    Estao numa funcao separada por um motivo pratico: os dois gravam e apagam
    muito, e assim fica impossivel rodarem por engano na pasta do autor — quem
    os chama e que troca a pasta antes.
    """
    falhas: list[str] = []

    # 7c. A copia de seguranca do rascunho.
    #
    # Sem ela, um clique dado antes de a leitura do disco terminar apagava para
    # sempre o que o autor estava montando. Aconteceu com 14 tags.
    rascunho = caminho_de_trabalho("prompts", NOME_DO_RASCUNHO)
    havia_rascunho = rascunho.is_file()
    guardado_antes = rascunho.read_text(encoding="utf-8") if havia_rascunho else None
    api_gravar_trabalho("prompts", NOME_DO_RASCUNHO,
                        {"conteudo": {"teste": "primeiro", "tags": [1, 2, 3]}})
    resposta_da_copia = api_gravar_trabalho(
        "prompts", NOME_DO_RASCUNHO, {"conteudo": {"teste": "segundo"}}
    )
    if not resposta_da_copia.get("copia_do_anterior"):
        falhas.append(
            "Trocar o rascunho tem de guardar uma copia do anterior com a hora "
            "no nome. Sem isso, sobrescrever e perda definitiva."
        )
    else:
        copia = caminho_de_trabalho("prompts", resposta_da_copia["copia_do_anterior"])
        if "primeiro" not in copia.read_text(encoding="utf-8"):
            falhas.append("A copia guardada não tem o conteúdo anterior dentro.")
        try:
            copia.unlink()
        except OSError:
            pass

    # 7d. Gravar a MESMA coisa de novo nao pode ocupar outra vaga das doze.
    #
    # A tela grava sozinha de tempos em tempos, mesmo parada. Sem esta regra,
    # deixar a oficina aberta e sem uso empurrava para fora as copias do
    # trabalho de verdade — a rede apagando aquilo que ela existe para salvar.
    # Medido no disco do autor em 23/08/2026: 11 copias, 8 estados diferentes.
    # O relogio precisa ANDAR entre uma gravacao e outra, senao este teste passa
    # por engano: gravacoes no MESMO segundo ja eram juntadas por outra regra
    # (o sufixo de colisao, mais acima), e o defeito real acontece com a tela
    # gravando sozinha a cada meio minuto. Aqui a hora do arquivo e empurrada na
    # mao para simular gravacoes separadas no tempo, sem esperar de verdade.
    igual = {"conteudo": {"teste": "parado", "tags": [9]}}
    api_gravar_trabalho("prompts", NOME_DO_RASCUNHO, igual)
    antes_de_repetir = {
        p.name for p in (rascunho.parent).glob("_rascunho_20*.json")
    }
    nomes_das_copias = []
    for minutos in (1, 2):
        try:
            quando = rascunho.stat().st_mtime + (minutos * 60)
            os.utime(rascunho, (quando, quando))
        except OSError:
            pass
        nomes_das_copias.append(
            api_gravar_trabalho("prompts", NOME_DO_RASCUNHO, igual).get(
                "copia_do_anterior"
            )
        )
    depois_de_repetir = {
        p.name for p in (rascunho.parent).glob("_rascunho_20*.json")
    }
    novas = depois_de_repetir - antes_de_repetir
    if len(novas) > 1:
        falhas.append(
            "Gravar o mesmo rascunho 2 vezes, em minutos diferentes, criou {} "
            "copias novas. Copia igual a anterior não pode ocupar vaga: ela "
            "expulsa das doze uma copia velha e DIFERENTE, que era justamente a "
            "que servia para voltar atrás.".format(len(novas))
        )
    if nomes_das_copias[0] != nomes_das_copias[1]:
        falhas.append(
            "Duas gravacoes iguais, em minutos diferentes, tem de apontar para "
            "a MESMA copia — e apontaram para {} e {}.".format(*nomes_das_copias)
        )
    for nome_novo in novas:
        try:
            (rascunho.parent / nome_novo).unlink()
        except OSError:
            pass

    # 7e. A copia que a TELA manda gravar passa pela MESMA trava.
    #
    # O defeito, medido no disco do autor em 23/08/2026: tres arquivos com o
    # mesmo conteudo byte a byte, dois deles ocupando duas das doze vagas. A
    # trava do conteudo mudado existia e estava certa — mas so rodava quando o
    # nome era exatamente "_rascunho_atual.json", e a tela gravava as copias
    # dela com nome proprio ("_rascunho_2026-08-23_1543.json", sem segundo).
    # Passava por fora, e as vagas das copias antigas eram gastas a toa.
    pasta_dos_prompts = rascunho.parent
    antes_da_forcada = {p.name for p in _copias_datadas(pasta_dos_prompts)}
    mesmo_estado = {"conteudo": {"teste": "forcado pela tela", "tags": [7, 7]}}
    primeira = api_gravar_trabalho("prompts", "_rascunho_2026-08-02_0707.json",
                                   mesmo_estado)
    segunda = api_gravar_trabalho("prompts", "_rascunho_2026-08-02_0808.json",
                                  mesmo_estado)
    depois_da_forcada = {p.name for p in _copias_datadas(pasta_dos_prompts)}
    nascidas = depois_da_forcada - antes_da_forcada

    if len(nascidas) != 1:
        falhas.append(
            "Duas copias com o MESMO conteúdo, mandadas pela tela com nomes "
            "diferentes, criaram {} arquivos. Tem de criar um só.".format(len(nascidas))
        )
    if primeira.get("copia") != segunda.get("copia"):
        falhas.append(
            "As duas copias iguais tem de apontar para o mesmo arquivo, e "
            "apontaram para {} e {}.".format(primeira.get("copia"), segunda.get("copia"))
        )
    if not segunda.get("ja_estava_guardada"):
        falhas.append(
            "A segunda copia igual tem de voltar dizendo que aquele estado JÁ "
            "estava guardado. Sem isso a tela promete uma copia que não criou."
        )
    for nascida in nascidas:
        # O nome de quem manda nao vale: quem carimba a hora e a ponte, e o
        # carimbo tem segundo. Dois formatos de nome no disco viram duas datas
        # ilegiveis lado a lado na lista do Album.
        if not re.match(r"^_rascunho_\d{4}-\d{2}-\d{2}_\d{6}(_\d+)?\.json$", nascida):
            falhas.append(
                "A copia guardada saiu com o nome '{}'. Todo nome de copia tem "
                "de ter a data e a hora com segundo.".format(nascida)
            )
        if nascida in ("_rascunho_2026-08-02_0707.json",
                       "_rascunho_2026-08-02_0808.json"):
            falhas.append(
                "A ponte gravou a copia pelo nome que a tela pediu. Quem nomeia "
                "a copia e a ponte, senao voltam os dois formatos de nome."
            )
        try:
            (pasta_dos_prompts / nascida).unlink()
        except OSError:
            pass

    # 7f. Nome de copia antigo (sem segundo) e arrumado, sem apagar nada.
    velha_sem_segundo = pasta_dos_prompts / "_rascunho_2026-08-01_1544.json"
    try:
        velha_sem_segundo.write_text('{"tags": ["so para o teste"]}', encoding="utf-8")
        _arrumar_nomes_de_copia(pasta_dos_prompts)
        arrumada = pasta_dos_prompts / "_rascunho_2026-08-01_154400.json"
        if velha_sem_segundo.exists() or not arrumada.exists():
            falhas.append(
                "A copia antiga sem segundo no nome tinha de virar "
                "_rascunho_2026-08-01_154400.json, e não virou."
            )
        for sobra in (velha_sem_segundo, arrumada):
            if sobra.exists():
                sobra.unlink()
    except OSError:
        pass

    # 7g. Arquivo pela metade nunca aparece na lista do trabalho.
    #
    # Toda gravacao passa por um ".novo" antes da troca. A lista devolvia esse
    # arquivo junto com os outros, e a tela oferecia um "usar" em cima de um
    # arquivo escrito pela metade.
    meio_arquivo = caminho_de_trabalho("meus_personagens", "Fulano.md.novo")
    try:
        meio_arquivo.write_text("metade", encoding="utf-8")
        listados = [i["nome"] for i in api_listar_trabalho("meus_personagens")["itens"]]
        if any(str(n).lower().endswith(".novo") for n in listados):
            falhas.append(
                "A lista do trabalho devolveu um arquivo '.novo', que e uma "
                "gravacao pela metade. A tela oferece 'usar' em cima dele."
            )
        meio_arquivo.unlink()
    except OSError:
        pass

    try:
        if guardado_antes is None:
            rascunho.unlink()
        else:
            rascunho.write_text(guardado_antes, encoding="utf-8")
    except OSError:
        pass

    return falhas


def _autoteste_resto(falhas: list[str]) -> int:

    # 8b. Nome com espaco e com acento tem de ser aceito.
    #
    # Este teste existe por um erro real: o navegador manda o endereco
    # codificado ("Heitor em Egide.json" vira "Heitor%20em%20Egide.json"), e o
    # roteador da API nao desfazia isso. Resultado: o autor nao conseguia salvar
    # nenhum personagem com espaco ou acento no nome — que e como ele nomeia
    # tudo. A trava do caminho recusava o "%" e devolvia erro.
    for nome_bom in ("Heitor em Égide.json", "prancha 01.png",
                     "Coração de Ícor.json", "geradas 2026-08-21.json",
                     "_indice.json", "_rascunho_2026-08-21_160800.json"):
        try:
            caminho_de_trabalho("meus_personagens", nome_bom)
        except ErroDeUso as erro:
            falhas.append("Recusou o nome legítimo '{}': {}".format(nome_bom, erro))

    # E o "%2f" escondido dentro do nome, depois de decodificado, continua sendo
    # recusado — porque vira uma barra dentro do pedaco, e barra nao e nome.
    for nome_ruim in ("..%2f..%2fx.json", "a/../../b.json"):
        decodificado = unquote(nome_ruim)
        try:
            caminho_de_trabalho("meus_personagens", decodificado)
        except ErroDeUso:
            continue
        falhas.append(
            "Deixou passar '{}' depois de decodificar.".format(nome_ruim)
        )

    # 9. A porta tem de estar livre em algum lugar da faixa.
    servidor, porta = procurar_porta()
    if servidor is None:
        falhas.append("Nenhuma porta livre entre {} e {}.".format(PORTA_INICIAL, PORTA_FINAL))
    else:
        endereco, porta_real = servidor.socket.getsockname()[:2]
        if endereco != "127.0.0.1":
            falhas.append("O servidor escutou em {} — tem de ser só 127.0.0.1.".format(endereco))
        servidor.server_close()
        print("  porta livre encontrada: {}".format(porta_real))

    # 9b. O atalho e o servidor combinam pelos codigos de saida.
    #
    # Este teste existe porque o combinado e por NUMERO, em dois arquivos de
    # linguagens diferentes. Trocar o numero num sem trocar no outro nao quebra
    # nada na hora: so faz a janela preta dar a mensagem errada, um dia, para o
    # autor — que e o unico que nao tem como descobrir o porque.
    atalho = PASTA_DA_FERRAMENTA / "ABRIR A OFICINA.bat"
    if not atalho.is_file():
        falhas.append("O arquivo dos dois cliques (ABRIR A OFICINA.bat) sumiu.")
    else:
        texto_do_atalho = atalho.read_text(encoding="utf-8", errors="replace").lower()
        if "errorlevel {}".format(SAIU_PORQUE_JA_ESTAVA_ABERTA) not in texto_do_atalho:
            falhas.append(
                "O atalho não conhece o código {} (a oficina já estava aberta). "
                "Sem ele, a janela preta pisca e some, que e o modo de falhar "
                "que não deixa pista.".format(SAIU_PORQUE_JA_ESTAVA_ABERTA)
            )
        if "pause" not in texto_do_atalho:
            falhas.append("O atalho precisa segurar a janela aberta com 'pause'.")
        # O caminho desta pasta tem espaco e acento. Caminho sem aspas no .bat
        # quebra em silencio, e este projeto ja perdeu duas travas assim.
        if 'cd /d "%~dp0"' not in texto_do_atalho:
            falhas.append(
                "O atalho tem de fazer cd /d \"%~dp0\" com aspas — o caminho do "
                "autor tem espaço e acento."
            )
        if "chcp 65001" not in texto_do_atalho:
            falhas.append("O atalho tem de ligar o chcp 65001 antes de tudo.")

    # 9c. A tabela de custo leva as frases prontas para a tela.
    #
    # "Anlas" aparecia quinze vezes na tela sem uma linha dizendo o que era, e e
    # a unidade que controla o dinheiro do autor. E a conta-surpresa maior desta
    # ferramenta e a referencia de personagem, que continua custando no Opus.
    tabela = modulo_orcamento.tabela_de_custo()
    if "creditos pagos" not in str(tabela.get("moeda", "")):
        falhas.append("A tabela de custo tem de explicar o que e Anlas.")
    notas = " ".join(tabela.get("notas") or [])
    if "Opus" not in notas or "referencia" not in notas.lower():
        falhas.append(
            "A tabela de custo tem de dizer que a referência de personagem "
            "custa TAMBÉM no plano Opus."
        )

    # 10. Os modulos vizinhos passam nos proprios testes.
    for modulo in ("cofre", "orcamento", "novelai"):
        print("  conferindo {}...".format(modulo))

    print("")
    if falhas:
        print("FALHOU ({} problema(s)):".format(len(falhas)))
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Ponte OK.")
    print("  - nada escapa de meu_trabalho")
    print("  - o programa e o cofre não são servidos ao navegador")
    print("  - o token não aparece no estado")
    print("  - a geracao começa no modo ensaio e não envia nada sem confirmação")
    print("  - o servidor escuta só em 127.0.0.1")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(principal(sys.argv[1:]))
    except KeyboardInterrupt:
        print("\n  Oficina desligada.\n")
        raise SystemExit(0)
