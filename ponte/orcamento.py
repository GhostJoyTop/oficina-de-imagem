# -*- coding: utf-8 -*-
"""
ORCAMENTO — o teto de gasto da oficina.

Por que isto existe: os Anlas gastos por aqui sao os MESMOS Anlas do site. Nao
ha desconto nem cota extra (tutorial, secao 19.8). E um programa que gera em
lote queima credito muito mais rapido do que um dedo clicando.

Entao esta parte faz quatro coisas, e nada alem disso:

  1. Calcula quanto uma geracao VAI custar, antes de gastar.
  2. Guarda quanto ja foi gasto hoje e nesta sessao.
  3. Barra a geracao que passaria do teto, e diz em portugues por que barrou.
  4. Impede duas geracoes ao mesmo tempo — que tambem e limite real da conta.

De onde vem o preco: a tabela de custo em Anlas e do Construtor A, no arquivo
dados\\acervo_regras.js. Este modulo LE aquele arquivo. Um arquivo so, uma
verdade so. Se ele nao existir ainda, entra a tabela de reserva daqui, que so
tem numeros que o tutorial declara.

O que o tutorial declara, e portanto o que a oficina afirma:
  - Character Reference / Style Reference: +5 Anlas por imagem de referencia.
  - Vibe Transfer: 2 Anlas para codificar cada imagem, UMA VEZ so.
  - Opus: geracao sem Anlas em V4.5 ou inferior, uma por vez, tamanho normal,
    ate 28 passos.
  - Teste gratis: 30 imagens.

O que o tutorial NAO declara, e portanto a oficina NAO afirma: a formula do
custo base de uma geracao paga. Onde ela entraria, a oficina responde
"estimativa", com o aviso na cara. Chutar um numero e apresenta-lo como fato
seria pior do que dizer que nao se sabe.
"""

from __future__ import annotations

import json
import os
import threading
import time
from datetime import date, datetime
from pathlib import Path

PASTA_DA_FERRAMENTA = Path(__file__).resolve().parent.parent
ARQUIVO_DE_REGRAS = PASTA_DA_FERRAMENTA / "dados" / "acervo_regras.js"

TETO_SESSAO_PADRAO = 100
TETO_DIA_PADRAO = 300

# Tamanho "normal" do NovelAI, para a regra do Opus. Cerca de 1 megapixel.
PIXELS_DO_TAMANHO_NORMAL = 1024 * 1024
PASSOS_GRATIS_NO_OPUS = 28
MODELOS_GRATIS_NO_OPUS = (
    "v4_5_full", "v4_5_curated", "v4_full", "v4_curated", "anime_v3", "furry_v3",
)

# A Referencia Precisa (Character Reference e Style Reference) so existe no
# V4.5. Cobrar por ela em outro modelo e cobrar por uma coisa que nao vai
# acontecer.
MODELOS_COM_REFERENCIA_PRECISA = ("v4_5_full", "v4_5_curated")

# Depois deste tempo, uma trava de geracao esquecida no disco e considerada
# orfa. Acontece quando a janela preta e fechada no meio de uma geracao: o
# arquivo fica la e, sem este prazo, travaria a oficina para sempre.
MINUTOS_ATE_A_TRAVA_VENCER = 15


def _achatar_modelo(chave: str) -> str:
    """
    Reduz o nome do modelo a uma forma unica, tirando pontuacao e caixa.

    Mesmo motivo do arquivo novelai.py: o Construtor A escreve "v45_full" e a
    ponte escrevia "v4_5_full". Sem achatar os dois, a regra do Opus (que gera
    sem gastar Anlas) nunca reconhecia o modelo, e a oficina cobrava do autor
    uma geracao que para ele e de graca.
    """
    return "".join(c for c in str(chave or "").lower() if c.isalnum())


MODELOS_GRATIS_ACHATADOS = tuple(_achatar_modelo(m) for m in MODELOS_GRATIS_NO_OPUS)
MODELOS_COM_REFERENCIA_ACHATADOS = tuple(
    _achatar_modelo(m) for m in MODELOS_COM_REFERENCIA_PRECISA
)

# Tabela de reserva. Usada so quando dados\acervo_regras.js ainda nao existe.
TABELA_DE_RESERVA = {
    "anlas_por_referencia_precisa": 5,
    "anlas_por_vibe_codificado": 2,
    "anlas_base_estimado": 5,
    "imagens_do_teste_gratis": 30,
}


class ErroDeOrcamento(Exception):
    """Erro ja escrito em portugues, pronto para a tela."""


# ---------------------------------------------------------------------------
# Ler a tabela de precos do Construtor A
# ---------------------------------------------------------------------------

def _ler_arquivo_de_dados(caminho: Path) -> dict | None:
    """
    Le um arquivo do formato combinado na planta:

        window.OFICINA_REGRAS =
        { ...JSON... }
        ;

    A regra e: descarta a primeira linha, descarta a ultima, e o miolo e JSON.
    Sao as quatro linhas de que a planta fala. Se qualquer coisa der errado,
    devolve None e a oficina segue com a tabela de reserva — nunca quebra.
    """
    try:
        texto = caminho.read_text(encoding="utf-8")
    except OSError:
        return None

    linhas = texto.splitlines()
    if len(linhas) < 3:
        return None

    # Tira a primeira linha (a atribuicao) e a ultima linha nao vazia (o ";").
    while linhas and not linhas[-1].strip():
        linhas.pop()
    if not linhas:
        return None
    miolo = "\n".join(linhas[1:-1])

    try:
        dados = json.loads(miolo)
    except (ValueError, TypeError):
        return None
    return dados if isinstance(dados, dict) else None


def _preco_do_item(custos: dict, identificador: str):
    """Procura um preco na lista 'itens' do Construtor A, pelo id."""
    for item in (custos.get("itens") or []):
        if isinstance(item, dict) and item.get("id") == identificador:
            valor = item.get("anlas")
            if isinstance(valor, (int, float)):
                return valor
    return None


def _imagens_do_teste_gratis(custos: dict):
    for plano in ((custos.get("planos") or {}).get("lista") or []):
        if isinstance(plano, dict) and plano.get("id") == "teste":
            valor = plano.get("imagens_gratis")
            if isinstance(valor, (int, float)):
                return valor
    return None


def tabela_de_custo() -> dict:
    """
    A tabela de precos, com as palavras que a tela precisa escrever ao lado.

    A tabela crua e numero; o que sai daqui e numero MAIS a frase em portugues.
    Existe assim porque o autor se declarou leigo e "Anlas" aparecia quinze
    vezes na tela sem uma linha dizendo o que era — sendo justamente a unidade
    que controla o dinheiro dele. A frase mora aqui, num lugar so, para a tela
    nao ter de inventar a dela.
    """
    tabela = _tabela_de_custo_crua()
    tabela["moeda"] = (
        "Anlas (os créditos pagos do NovelAI — cada imagem consome um tanto)"
    )
    tabela["notas"] = [
        "Character Reference e Style Reference: {} Anlas por imagem de "
        "referência, e soma quando há mais de uma.".format(
            tabela["anlas_por_referencia_precisa"]
        ),
        "A referência de personagem custa esses {} Anlas TAMBÉM no plano Opus. "
        "No Opus a geracao e de graça; a referência, não. Numa página de mangá "
        "com oito quadros e a referência em cada um, são {} Anlas.".format(
            tabela["anlas_por_referencia_precisa"],
            tabela["anlas_por_referencia_precisa"] * 8,
        ),
        "Vibe Transfer: {} Anlas para codificar cada imagem, uma vez só. "
        "Reusar a imagem já codificada não custa de novo.".format(
            tabela["anlas_por_vibe_codificado"]
        ),
        "O custo base de uma geracao paga e ESTIMATIVA nossa ({} Anlas por "
        "imagem). A documentacao do NovelAI não publica a formula. O número de "
        "verdade e o que o site mostrar.".format(tabela["anlas_base_estimado"]),
        "Teste gratis: {} imagens.".format(tabela["imagens_do_teste_gratis"]),
    ]
    return tabela


def _tabela_de_custo_crua() -> dict:
    """
    A tabela de precos em vigor, com a marca honesta de onde cada numero veio.

    O formato lido aqui e o que o Construtor A realmente escreveu:

        "custos": {
          "itens":  [ {"id": "character_reference", "anlas": 5}, ... ],
          "planos": {"lista": [ {"id": "teste", "imagens_gratis": 30}, ... ]}
        }

    Antes este codigo procurava chaves soltas dentro de "custos" (por exemplo
    "anlas_por_referencia_precisa"), que nunca existiram naquele arquivo. O
    resultado passava despercebido porque os valores de reserva eram iguais aos
    reais: a conta saia certa, mas a oficina anunciava na tela que tinha lido o
    acervo quando nao tinha lido nada. E um preco mudado no acervo jamais
    chegaria aqui.
    """
    regras = _ler_arquivo_de_dados(ARQUIVO_DE_REGRAS)
    tabela = dict(TABELA_DE_RESERVA)

    if not regras:
        tabela["_origem"] = (
            "tabela de reserva da ponte — não consegui ler dados/acervo_regras.js"
        )
        tabela["_lidos_do_acervo"] = []
        return tabela

    custos = regras.get("custos")
    if not isinstance(custos, dict):
        tabela["_origem"] = (
            "tabela de reserva da ponte — dados/acervo_regras.js existe, mas não "
            "tem a seção de custos"
        )
        tabela["_lidos_do_acervo"] = []
        return tabela

    lidos = []

    referencia = _preco_do_item(custos, "character_reference")
    if referencia is None:
        referencia = _preco_do_item(custos, "style_reference")
    if referencia is not None:
        tabela["anlas_por_referencia_precisa"] = referencia
        lidos.append("anlas_por_referencia_precisa")

    vibe = _preco_do_item(custos, "vibe_transfer")
    if vibe is not None:
        tabela["anlas_por_vibe_codificado"] = vibe
        lidos.append("anlas_por_vibe_codificado")

    gratis = _imagens_do_teste_gratis(custos)
    if gratis is not None:
        tabela["imagens_do_teste_gratis"] = gratis
        lidos.append("imagens_do_teste_gratis")

    # "anlas_base_estimado" NAO vem do acervo de proposito: o tutorial nao
    # publica a formula do custo base. Ele e estimativa nossa, e a tela diz isso.
    if lidos:
        tabela["_origem"] = "dados/acervo_regras.js ({})".format(", ".join(lidos))
    else:
        tabela["_origem"] = (
            "tabela de reserva da ponte — a seção de custos do acervo não trouxe "
            "nenhum preco reconhecido"
        )
    tabela["_lidos_do_acervo"] = lidos
    return tabela


# ---------------------------------------------------------------------------
# A conta do gasto
# ---------------------------------------------------------------------------

class Orcamento:
    """
    Guarda o gasto e os tetos. Um objeto so, criado pelo servidor na partida.

    O arquivo fica em meu_trabalho\\orcamento.json, que e a unica pasta onde
    esta ferramenta pode gravar.
    """

    def __init__(self, pasta_de_trabalho: Path):
        self.pasta = Path(pasta_de_trabalho)
        self.caminho = self.pasta / "orcamento.json"
        self.caminho_da_trava = self.pasta / "_gerando.trava"
        self._trava = threading.Lock()
        self.gerando = False
        self.gasto_na_sessao = 0
        self.teto_sessao = TETO_SESSAO_PADRAO
        self.teto_dia = TETO_DIA_PADRAO
        self.por_dia: dict[str, int] = {}
        self._carregar()

    # -- disco ------------------------------------------------------------

    def _carregar(self) -> None:
        """
        Le o arquivo do disco por cima do que esta na memoria.

        Isto e chamado ANTES de toda decisao de gasto, e nao so na partida. O
        motivo e concreto: a oficina procura porta livre de 8760 a 8770, entao e
        facil ficar com DUAS janelas abertas ao mesmo tempo. Cada uma tinha o seu
        proprio contador em memoria, cada uma achava que o teto do dia estava
        vazio, e a ultima a gravar apagava o gasto que a outra havia registrado.
        O teto do dia virava enfeite.
        """
        if not self.caminho.exists():
            return
        try:
            dados = json.loads(self.caminho.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return
        if not isinstance(dados, dict):
            return
        self.teto_sessao = int(dados.get("teto_sessao", TETO_SESSAO_PADRAO))
        self.teto_dia = int(dados.get("teto_dia", TETO_DIA_PADRAO))
        por_dia = dados.get("por_dia")
        if isinstance(por_dia, dict):
            self.por_dia = {
                str(k): int(v) for k, v in por_dia.items() if isinstance(v, (int, float))
            }

    def _gravar(self) -> None:
        dados = {
            "versao_formato": "1.0.0",
            "teto_sessao": self.teto_sessao,
            "teto_dia": self.teto_dia,
            "por_dia": self.por_dia,
            "atualizado_em": datetime.now().isoformat(timespec="seconds"),
            "_leia": (
                "Este arquivo e o controle de gasto da oficina. Apagar ele zera "
                "a contagem do dia, não devolve Anlas nenhum."
            ),
        }
        try:
            self.caminho.parent.mkdir(parents=True, exist_ok=True)
            temporario = self.caminho.with_suffix(".json.novo")
            temporario.write_text(
                json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            temporario.replace(self.caminho)
        except OSError:
            # Nao gravar o contador nunca pode derrubar a oficina.
            pass

    # -- consulta ---------------------------------------------------------

    def hoje(self) -> str:
        return date.today().isoformat()

    def gasto_hoje(self) -> int:
        # Rele o disco: com duas janelas da oficina abertas, o numero em memoria
        # desta janela pode nao incluir o que a outra acabou de gastar.
        self._carregar()
        return int(self.por_dia.get(self.hoje(), 0))

    def estado(self) -> dict:
        self._carregar()
        return {
            "gasto_hoje": self.gasto_hoje(),
            "teto_dia": self.teto_dia,
            "gasto_sessao": self.gasto_na_sessao,
            "teto_sessao": self.teto_sessao,
            "sobra_hoje": max(0, self.teto_dia - self.gasto_hoje()),
            "sobra_sessao": max(0, self.teto_sessao - self.gasto_na_sessao),
            "gerando": self.gerando or self._ha_trava_valida(),
            "arquivo": str(self.caminho),
        }

    def mudar_tetos(self, teto_sessao=None, teto_dia=None) -> dict:
        with self._trava:
            # Rele antes de mexer, para nao apagar o gasto que outra janela da
            # oficina registrou enquanto esta estava parada.
            self._carregar()
            if teto_sessao is not None:
                valor = int(teto_sessao)
                if valor < 0 or valor > 100000:
                    raise ErroDeOrcamento(
                        "O teto por sessão precisa ser um número entre 0 e 100000."
                    )
                self.teto_sessao = valor
            if teto_dia is not None:
                valor = int(teto_dia)
                if valor < 0 or valor > 100000:
                    raise ErroDeOrcamento(
                        "O teto por dia precisa ser um número entre 0 e 100000."
                    )
                self.teto_dia = valor
            self._gravar()
        return self.estado()

    # -- a trava de verdade ------------------------------------------------

    def cabe(self, anlas: int) -> tuple[bool, str]:
        """Devolve (cabe?, frase em portugues explicando)."""
        anlas = int(anlas)
        if anlas <= 0:
            return True, ""

        # Rele o disco antes de decidir. Com duas janelas da oficina abertas, o
        # numero em memoria desta aqui pode estar velho.
        self._carregar()

        if self.gasto_na_sessao + anlas > self.teto_sessao:
            return False, (
                "Esta geracao custaria {} Anlas e passaria do seu teto desta sessão "
                "({} de {} Anlas já usados). Nada foi gasto. Você pode aumentar o "
                "teto na tela do Cofre e Gasto, ou fechar e abrir a oficina para "
                "zerar a contagem da sessão.".format(
                    anlas, self.gasto_na_sessao, self.teto_sessao
                )
            )

        if self.gasto_hoje() + anlas > self.teto_dia:
            return False, (
                "Esta geracao custaria {} Anlas e passaria do seu teto de hoje "
                "({} de {} Anlas já usados). Nada foi gasto. O contador de hoje "
                "zera sozinho amanha; se quiser continuar agora, aumente o teto na "
                "tela do Cofre e Gasto.".format(
                    anlas, self.gasto_hoje(), self.teto_dia
                )
            )

        return True, ""

    def registrar_gasto(self, anlas: int) -> None:
        """
        Chamado SO depois de uma geracao real que deu certo.

        Soma em cima do que esta NO DISCO, nunca em cima do que estava em
        memoria. E o que faz duas janelas da oficina somarem o gasto em vez de
        uma apagar o da outra.
        """
        anlas = int(anlas)
        if anlas <= 0:
            return
        with self._trava:
            self._carregar()
            self.gasto_na_sessao += anlas
            dia = self.hoje()
            self.por_dia[dia] = int(self.por_dia.get(dia, 0)) + anlas
            self._gravar()

    # -- a trava de uma geracao por vez ------------------------------------
    #
    # Ela e um ARQUIVO, e nao uma trava de memoria, de proposito. Trava de
    # memoria so vale dentro de um programa; duas janelas da oficina sao dois
    # programas, e as duas disparariam geracao ao mesmo tempo — o que a conta do
    # NovelAI recusa de qualquer jeito, gastando a rodada do autor num erro.

    def _idade_da_trava(self) -> float | None:
        """Ha quantos segundos a trava foi criada? None se nao existe."""
        try:
            return max(0.0, time.time() - self.caminho_da_trava.stat().st_mtime)
        except OSError:
            return None

    def _ha_trava_valida(self) -> bool:
        idade = self._idade_da_trava()
        if idade is None:
            return False
        return idade < MINUTOS_ATE_A_TRAVA_VENCER * 60

    def comecar_geracao(self) -> bool:
        """
        Pega a trava de "uma geracao por vez". Devolve falso se ja ha uma
        acontecendo. Nao espera em fila de proposito: a resposta imediata
        ("espere a que esta rodando") e melhor que a tela travada.
        """
        with self._trava:
            idade = self._idade_da_trava()
            if idade is not None and idade >= MINUTOS_ATE_A_TRAVA_VENCER * 60:
                # Trava esquecida: a janela preta foi fechada no meio de uma
                # geracao. Sem este resgate, a oficina ficaria travada para
                # sempre e o autor nao teria como destravar sozinho.
                try:
                    self.caminho_da_trava.unlink()
                except OSError:
                    pass

            try:
                self.pasta.mkdir(parents=True, exist_ok=True)
                descritor = os.open(
                    str(self.caminho_da_trava),
                    os.O_CREAT | os.O_EXCL | os.O_WRONLY,
                )
            except FileExistsError:
                return False
            except OSError:
                # Nao conseguir criar o arquivo nao pode impedir o autor de
                # gerar. A trava de memoria desta janela ainda vale.
                if self.gerando:
                    return False
                self.gerando = True
                return True

            try:
                with os.fdopen(descritor, "w", encoding="utf-8") as arquivo:
                    arquivo.write(json.dumps({
                        "programa": os.getpid(),
                        "comecou_em": datetime.now().isoformat(timespec="seconds"),
                        "_leia": (
                            "Este arquivo existe enquanto uma geracao esta "
                            "acontecendo. Se ele ficou para tras, pode apagar: "
                            "a oficina o ignora depois de {} minutos.".format(
                                MINUTOS_ATE_A_TRAVA_VENCER
                            )
                        ),
                    }, ensure_ascii=False))
            except OSError:
                pass

            self.gerando = True
            return True

    def terminar_geracao(self) -> None:
        with self._trava:
            self.gerando = False
            try:
                self.caminho_da_trava.unlink()
            except OSError:
                pass


# ---------------------------------------------------------------------------
# O calculo do custo
# ---------------------------------------------------------------------------

def _imagens(quantas: int) -> str:
    """'1 imagem' ou '3 imagens'. Existe so para a frase sair certa em portugues."""
    return "{} {}".format(quantas, "imagem" if quantas == 1 else "imagens")


def _quantas_com_imagem(lista) -> int:
    """Conta so os itens que trazem imagem de verdade dentro."""
    quantas = 0
    for item in (lista or []):
        if isinstance(item, dict) and str(item.get("dados_base64") or "").strip():
            quantas += 1
    return quantas


def calcular_custo(pedido: dict, config: dict | None = None) -> dict:
    """
    Diz quanto uma geracao custaria, item por item, sem gerar nada.

    Entra um dicionario com o que a tela sabe. Sai a conta aberta, em portugues,
    com a marca clara do que e FATO do tutorial e do que e ESTIMATIVA nossa.

    DUAS REGRAS QUE ESTA CONTA NAO QUEBRA, e as duas nasceram de defeito real:

    1. So cobra pela imagem de referencia que VAI SER ENVIADA. Antes, a tela
       mandava a contagem ("duas referencias") sem mandar as imagens, e a conta
       cobrava 10 Anlas por duas referencias que nunca saiam do computador do
       autor. A conta agora olha as listas de verdade.

    2. So cobra Referencia Precisa no modelo onde ela existe, que e o V4.5. No
       V4 Full a tela ja avisa em vermelho que o recurso nao existe; cobrar por
       ele na linha de baixo e a oficina se contradizendo na mesma tela.

    O plano de assinatura vem do pedido; se a tela nao mandar, vem do arquivo de
    preferencias (meu_trabalho\\config.json). Sem isso, um assinante Opus veria
    "gastar 5 Anlas" numa geracao que para ele e de graca, e o teto do dia o
    barraria depois de 60 geracoes que nao custaram nada.
    """
    tabela = tabela_de_custo()
    pedido = pedido or {}
    config = config or {}

    quantidade = max(1, int(pedido.get("quantidade", 1) or 1))
    modelo = str(pedido.get("modelo", "v4_5_full"))
    largura = int(pedido.get("largura", 832) or 832)
    altura = int(pedido.get("altura", 1216) or 1216)
    passos = int(pedido.get("passos", 28) or 28)
    acao = str(pedido.get("acao", "gerar") or "gerar")

    assinatura = pedido.get("assinatura")
    de_onde_veio_a_assinatura = "a tela"
    if not assinatura:
        assinatura = config.get("assinatura")
        de_onde_veio_a_assinatura = "as suas preferencias"
    if not assinatura:
        assinatura = "nenhuma"
        de_onde_veio_a_assinatura = "o padrao (nenhum plano declarado)"
    assinatura = str(assinatura).lower()

    # O que a tela DISSE que ia anexar...
    referencias_prometidas = int(pedido.get("character_reference", 0) or 0) + int(
        pedido.get("style_reference", 0) or 0
    )
    vibes_prometidos = int(pedido.get("vibe_novos", 0) or 0)

    # ...e o que ela REALMENTE anexou.
    referencias = _quantas_com_imagem(pedido.get("referencias"))
    vibes_novos = _quantas_com_imagem(pedido.get("vibes"))

    referencias_sem_imagem = max(0, referencias_prometidas - referencias)
    vibes_sem_imagem = max(0, vibes_prometidos - vibes_novos)

    modelo_tem_referencia_precisa = (
        _achatar_modelo(modelo) in MODELOS_COM_REFERENCIA_ACHATADOS
    )

    itens = []
    total = 0
    ha_estimativa = False

    # 1. A geracao em si.
    tamanho_normal = (largura * altura) <= PIXELS_DO_TAMANHO_NORMAL
    passos_ok = passos <= PASSOS_GRATIS_NO_OPUS
    modelo_ok = _achatar_modelo(modelo) in MODELOS_GRATIS_ACHATADOS

    if acao == "director":
        itens.append({
            "item": "ferramenta de direcao",
            "anlas": 0,
            "estimativa": True,
            "motivo": (
                "O tutorial não declara o custo das ferramentas de direção. "
                "A oficina conta zero e avisa que não sabe."
            ),
        })
        ha_estimativa = True
    elif assinatura == "opus" and tamanho_normal and passos_ok and modelo_ok:
        itens.append({
            "item": "geracao base ({})".format(_imagens(quantidade)),
            "anlas": 0,
            "estimativa": False,
            "motivo": (
                "Assinatura Opus gera sem gastar Anlas em V4.5 ou inferior, "
                "tamanho normal e até 28 passos. Uma por vez."
            ),
        })
    else:
        base = int(tabela["anlas_base_estimado"]) * quantidade
        total += base
        ha_estimativa = True
        porque = []
        if assinatura != "opus":
            porque.append("você não esta no plano Opus")
        else:
            if not tamanho_normal:
                porque.append("a imagem e maior que o tamanho normal")
            if not passos_ok:
                porque.append("são mais de 28 passos")
            if not modelo_ok:
                porque.append("o modelo escolhido esta fora da regra do Opus")
        itens.append({
            "item": "geracao base ({})".format(_imagens(quantidade)),
            "anlas": base,
            "estimativa": True,
            "motivo": (
                "ESTIMATIVA. O tutorial não publica a formula do custo base, "
                "então a oficina usa {} Anlas por imagem só para não deixar o "
                "teto de gasto cego. O número certo aparece no site do NovelAI. "
                "Aqui a geracao seria paga porque {}.".format(
                    tabela["anlas_base_estimado"],
                    " e ".join(porque) if porque else "as condições do Opus não se aplicam",
                )
            ),
        })

    # 2. Precise Reference (Character Reference e Style Reference).
    if referencias > 0 and modelo_tem_referencia_precisa:
        preco = int(tabela["anlas_por_referencia_precisa"])
        custo = preco * referencias * quantidade
        total += custo
        itens.append({
            "item": "referência precisa ({} de referência)".format(_imagens(referencias)),
            "anlas": custo,
            "estimativa": False,
            "motivo": (
                "FATO do tutorial: +{} Anlas por imagem de referência, e soma "
                "quando há mais de uma. Esta cobrança vale TAMBÉM no plano Opus: "
                "no Opus a geracao e de graça, a referência não. Numa folha de "
                "mangá, ela soma a cada quadro.".format(preco)
            ),
        })
    elif referencias > 0:
        itens.append({
            "item": "referência precisa ({} de referência)".format(_imagens(referencias)),
            "anlas": 0,
            "estimativa": False,
            "motivo": (
                "Não cobrei nada por isto: a Referência Precisa só existe no "
                "modelo V4.5, e você escolheu outro. Ela não vai acontecer nesta "
                "geracao. Troque o modelo para V4.5 se quiser usa-lá."
            ),
        })

    if referencias_sem_imagem > 0:
        itens.append({
            "item": "referência que não vai ser enviada ({})".format(
                _imagens(referencias_sem_imagem)
            ),
            "anlas": 0,
            "estimativa": False,
            "motivo": (
                "Não cobrei nada por isto, e o motivo importa: gerar aqui dentro "
                "ainda não leva as suas imagens de referência ao NovelAI. Use o "
                "botao Copiar prompt e anexe a imagem no site — o resultado e o "
                "mesmo, e aí a referência funciona de verdade."
            ),
        })

    # 3. Vibe Transfer — so a codificacao, e so uma vez por imagem.
    if vibes_novos > 0:
        preco = int(tabela["anlas_por_vibe_codificado"])
        custo = preco * vibes_novos
        total += custo
        itens.append({
            "item": "codificar {} para o Vibe Transfer".format(_imagens(vibes_novos)),
            "anlas": custo,
            "estimativa": False,
            "motivo": (
                "FATO do tutorial: {} Anlas para codificar cada imagem, uma vez "
                "só. Depois de codificada, reusar não custa de novo.".format(preco)
            ),
        })

    if vibes_sem_imagem > 0:
        itens.append({
            "item": "Vibe Transfer que não vai ser enviado ({})".format(
                _imagens(vibes_sem_imagem)
            ),
            "anlas": 0,
            "estimativa": False,
            "motivo": (
                "Não cobrei nada por isto: a imagem do Vibe Transfer não chegou "
                "no pedido. Use o botao Copiar prompt e anexe no site do NovelAI."
            ),
        })

    faltam_imagens = bool(referencias_sem_imagem or vibes_sem_imagem)

    return {
        "anlas": total,
        "itens": itens,
        "tem_estimativa": ha_estimativa,
        "origem_da_tabela": tabela["_origem"],
        "assinatura_usada": assinatura,
        "de_onde_veio_a_assinatura": de_onde_veio_a_assinatura,
        "faltam_imagens_de_referencia": faltam_imagens,
        "moeda": (
            "Anlas (os créditos pagos do NovelAI — cada imagem consome um tanto)"
        ),
        "aviso": (
            "Parte desta conta e estimativa: a documentacao do NovelAI não publica "
            "a formula do custo base. O número de verdade e o que o site mostrar. "
            "A oficina estima por baixo só para o teto de gasto funcionar."
            if ha_estimativa else
            "Esta conta usa só os números que o tutorial declara."
        ),
    }


# ---------------------------------------------------------------------------
# Autoteste (roda com: python orcamento.py)
# ---------------------------------------------------------------------------

def _autoteste() -> int:
    import tempfile

    falhas = []

    # Custo: Opus com tudo dentro da regra da casa e de graca.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "quantidade": 1,
    })
    if conta["anlas"] != 0:
        falhas.append("Opus dentro da regra deveria custar 0, deu {}.".format(conta["anlas"]))

    # Custo: duas referencias ANEXADAS somam 10 Anlas (5 + 5), como o tutorial diz.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "quantidade": 1,
        "character_reference": 2,
        "referencias": [{"dados_base64": "AAAA"}, {"dados_base64": "BBBB"}],
    })
    if conta["anlas"] != 10:
        falhas.append("Duas referências anexadas deveriam custar 10, deu {}.".format(conta["anlas"]))

    # E a mesma conta, com a CONTAGEM mas sem as imagens, tem de dar ZERO.
    #
    # Este e o teste mais importante deste arquivo. O defeito que ele guarda:
    # a tela mandava "character_reference: 2" sem mandar as imagens, a conta
    # cobrava 10 Anlas, o botao dizia "Confirmar e gastar 10 Anlas", e a
    # referencia nunca saia do computador do autor. Ele pagava por um recurso
    # que nao acontecia.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "quantidade": 1,
        "character_reference": 2,
    })
    if conta["anlas"] != 0:
        falhas.append(
            "Referência sem imagem anexada NÃO pode ser cobrada. Cobrou {}.".format(
                conta["anlas"]
            )
        )
    if not conta.get("faltam_imagens_de_referencia"):
        falhas.append("A conta deveria avisar que a imagem de referência não vai ser enviada.")
    if not any("Copiar prompt" in i["motivo"] for i in conta["itens"]):
        falhas.append("O motivo deveria dizer ao autor o que fazer no lugar.")

    # Referencia Precisa nao existe fora do V4.5, e por isso nao pode ser cobrada.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_full",
        "largura": 832, "altura": 1216, "passos": 28,
        "character_reference": 1, "referencias": [{"dados_base64": "AAAA"}],
    })
    if conta["anlas"] != 0:
        falhas.append(
            "No V4 Full a Referência Precisa não existe, e não pode ser cobrada. "
            "Cobrou {}.".format(conta["anlas"])
        )

    # Custo: Vibe Transfer, 2 Anlas por imagem codificada.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "vibe_novos": 3,
        "vibes": [{"dados_base64": "A"}, {"dados_base64": "B"}, {"dados_base64": "C"}],
    })
    if conta["anlas"] != 6:
        falhas.append("Três vibes deveriam custar 6, deu {}.".format(conta["anlas"]))

    # O plano vem das preferencias quando a tela nao manda nenhum.
    conta = calcular_custo(
        {"modelo": "v4_5_full", "largura": 832, "altura": 1216, "passos": 28},
        config={"assinatura": "opus"},
    )
    if conta["anlas"] != 0:
        falhas.append(
            "Com o plano Opus guardado nas preferências, a geracao deveria sair "
            "de graça. Deu {} Anlas.".format(conta["anlas"])
        )
    if conta["assinatura_usada"] != "opus":
        falhas.append("A conta deveria dizer qual plano usou.")

    # Sem plano em lugar nenhum, a geracao e paga. Isso tambem tem de valer.
    conta = calcular_custo({"modelo": "v4_5_full", "largura": 832, "altura": 1216, "passos": 28})
    if conta["anlas"] <= 0:
        falhas.append("Sem plano declarado, a geracao tem de aparecer como paga.")

    # Os identificadores de modelo do Construtor A ("v45_full") tem de valer
    # tanto quanto os desta pasta ("v4_5_full"). Este teste existe porque a
    # divergencia entre as duas grafias fazia a oficina cobrar 5 Anlas por uma
    # geracao que, para um assinante Opus, e de graca.
    for grafia in ("v45_full", "v4_5_full", "V45_FULL", "v45_curated", "v4_5_curated"):
        conta = calcular_custo({
            "assinatura": "opus", "modelo": grafia,
            "largura": 832, "altura": 1216, "passos": 28,
        })
        if conta["anlas"] != 0:
            falhas.append(
                "O modelo '{}' deveria ser gratuito no Opus, e a conta deu {} "
                "Anlas.".format(grafia, conta["anlas"])
            )

    # A tabela de precos so pode dizer que veio do acervo quando veio mesmo.
    tabela = tabela_de_custo()
    lidos = tabela.get("_lidos_do_acervo")
    if not isinstance(lidos, list):
        falhas.append("A tabela deveria declarar quais preços vieram do acervo.")
    elif lidos and "acervo_regras.js" not in tabela["_origem"]:
        falhas.append("Leu preços do acervo mas não disse isso na origem.")
    elif not lidos and "reserva" not in tabela["_origem"]:
        falhas.append(
            "A origem diz acervo, mas nenhum preço foi lido de lá. Isso e a "
            "mentira exata que este teste existe para pegar."
        )
    if ARQUIVO_DE_REGRAS.exists() and not lidos:
        falhas.append(
            "O arquivo dados/acervo_regras.js existe, mas nenhum preço foi lido "
            "dele. O formato mudou e a ponte não acompanhou."
        )

    # Custo: passo de mais tira a gratuidade do Opus, e isso vira estimativa.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 50,
    })
    if not conta["tem_estimativa"] or conta["anlas"] <= 0:
        falhas.append("Mais de 28 passos deveria virar cobrança estimada.")

    with tempfile.TemporaryDirectory() as pasta:
        orc = Orcamento(Path(pasta))
        orc.mudar_tetos(teto_sessao=10, teto_dia=20)

        cabe, _ = orc.cabe(5)
        if not cabe:
            falhas.append("5 Anlas deveriam caber no teto de 10.")

        cabe, frase = orc.cabe(50)
        if cabe:
            falhas.append("50 Anlas NÃO deveriam caber no teto de 10.")
        if "Nada foi gasto" not in frase:
            falhas.append("A recusa deveria dizer que nada foi gasto.")

        orc.registrar_gasto(8)
        cabe, _ = orc.cabe(5)
        if cabe:
            falhas.append("Depois de gastar 8 de 10, mais 5 não deveria caber.")

        # A geracao 101 do dia: teto de dia barra.
        orc2 = Orcamento(Path(pasta))
        orc2.mudar_tetos(teto_sessao=100000, teto_dia=100)
        orc2.registrar_gasto(100)
        cabe, frase = orc2.cabe(1)
        if cabe:
            falhas.append("Passado o teto do dia, a próxima geracao tem de ser barrada.")

        # Uma geracao por vez.
        orc3 = Orcamento(Path(pasta))
        if not orc3.comecar_geracao():
            falhas.append("A primeira geracao deveria pegar a trava.")
        if orc3.comecar_geracao():
            falhas.append("A segunda geracao simultanea NÃO deveria passar.")
        orc3.terminar_geracao()
        if not orc3.comecar_geracao():
            falhas.append("Depois de terminar, a trava deveria liberar.")
        orc3.terminar_geracao()

        # DUAS JANELAS DA OFICINA — o caso que furava o teto.
        #
        # A oficina procura porta livre de 8760 a 8770, entao e facil acabar com
        # duas janelas abertas. Antes, cada uma tinha o proprio contador em
        # memoria: as duas achavam o teto vazio, e a ultima a gravar apagava o
        # gasto da outra. Aqui as duas sao objetos diferentes sobre o mesmo
        # arquivo, que e exatamente o que acontece na maquina do autor.
        outra_pasta = Path(pasta) / "duas_janelas"
        outra_pasta.mkdir()
        janela_a = Orcamento(outra_pasta)
        janela_b = Orcamento(outra_pasta)
        janela_a.mudar_tetos(teto_sessao=100000, teto_dia=50)
        janela_a.registrar_gasto(30)
        if janela_b.gasto_hoje() != 30:
            falhas.append(
                "A segunda janela não enxergou o gasto da primeira: viu {}.".format(
                    janela_b.gasto_hoje()
                )
            )
        cabe, _ = janela_b.cabe(30)
        if cabe:
            falhas.append(
                "A segunda janela deixou passar um gasto que estoura o teto do dia. "
                "E o furo exato que este teste existe para pegar."
            )
        janela_b.registrar_gasto(10)
        janela_c = Orcamento(outra_pasta)
        if janela_c.gasto_hoje() != 40:
            falhas.append(
                "Os gastos das duas janelas deveriam somar 40, deram {}.".format(
                    janela_c.gasto_hoje()
                )
            )

        # A trava de geracao tambem vale entre janelas, porque e um arquivo.
        if not janela_a.comecar_geracao():
            falhas.append("A primeira janela deveria pegar a trava de geracao.")
        if janela_b.comecar_geracao():
            falhas.append(
                "A SEGUNDA JANELA disparou geracao junto com a primeira. A conta "
                "do NovelAI permite só uma por vez."
            )
        janela_a.terminar_geracao()
        if not janela_b.comecar_geracao():
            falhas.append("Terminada a primeira, a segunda janela deveria conseguir gerar.")
        janela_b.terminar_geracao()

        # Trava esquecida no disco nao pode travar a oficina para sempre.
        trava = outra_pasta / "_gerando.trava"
        trava.write_text("{}", encoding="utf-8")
        antiga = time.time() - (MINUTOS_ATE_A_TRAVA_VENCER * 60 + 60)
        os.utime(trava, (antiga, antiga))
        janela_d = Orcamento(outra_pasta)
        if not janela_d.comecar_geracao():
            falhas.append(
                "Uma trava velha (janela preta fechada no meio de uma geracao) "
                "deveria vencer, e não travar a oficina para sempre."
            )
        janela_d.terminar_geracao()
        if trava.exists():
            falhas.append("Terminada a geracao, o arquivo de trava deveria sumir.")

        # O teto sobrevive a fechar e abrir a oficina.
        orc4 = Orcamento(Path(pasta))
        if orc4.teto_dia != 100:
            falhas.append("O teto gravado deveria voltar ao abrir de novo.")

    if falhas:
        print("FALHOU:")
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Orçamento OK: conta certa, teto barra, uma geracao por vez, e o teto persiste.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_autoteste())
