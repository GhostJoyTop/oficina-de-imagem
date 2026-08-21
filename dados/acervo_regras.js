window.OFICINA_REGRAS =
{
  "versao_formato": "1.0.0",
  "fonte": "manual-novelai.html (docs.novelai.net)",
  "gerado_em": "2026-08-21",
  "modelos": [
    {
      "id": "v45_full",
      "nome": "V4.5 Full",
      "familia": "v4.5",
      "padrao": true,
      "use_quando": "Padrão recomendado — melhor fundo e melhor obediência ao prompt; dataset (conjunto de imagens de treino) mais amplo e menos filtrado.",
      "suporta": {
        "multi_personagem": true,
        "peso_numerico": true,
        "peso_negativo": true,
        "precise_reference": true,
        "vibe_transfer": true,
        "text_rendering": true
      },
      "origem": "§16 Qual modelo escolher"
    },
    {
      "id": "v45_curated",
      "nome": "V4.5 Curated",
      "familia": "v4.5",
      "padrao": false,
      "use_quando": "Dataset (conjunto de imagens de treino) mais limpo e focado — mais seguro para não gerar nada indesejado por acidente.",
      "suporta": {
        "multi_personagem": true,
        "peso_numerico": true,
        "peso_negativo": true,
        "precise_reference": true,
        "vibe_transfer": true,
        "text_rendering": true
      },
      "origem": "§16 Qual modelo escolher"
    },
    {
      "id": "v4_full",
      "nome": "V4 Full",
      "familia": "v4",
      "padrao": false,
      "use_quando": "Geração anterior — ainda válida, mesma lógica Full × Curated.",
      "suporta": {
        "multi_personagem": true,
        "peso_numerico": true,
        "peso_negativo": false,
        "precise_reference": false,
        "vibe_transfer": true,
        "text_rendering": true
      },
      "origem": "§16 Qual modelo escolher"
    },
    {
      "id": "v4_curated",
      "nome": "V4 Curated",
      "familia": "v4",
      "padrao": false,
      "use_quando": "Geração anterior, com dataset (conjunto de imagens de treino) mais limpo.",
      "suporta": {
        "multi_personagem": true,
        "peso_numerico": true,
        "peso_negativo": false,
        "precise_reference": false,
        "vibe_transfer": true,
        "text_rendering": true
      },
      "origem": "§16 Qual modelo escolher"
    },
    {
      "id": "anime_v3",
      "nome": "Anime V3",
      "familia": "v3",
      "padrao": false,
      "use_quando": "Modelo mais antigo. Aqui a ordem das tags pesa AINDA MAIS: tag no começo do prompt manda muito mais que nos modelos V4+.",
      "suporta": {
        "multi_personagem": false,
        "peso_numerico": false,
        "peso_negativo": false,
        "precise_reference": false,
        "vibe_transfer": true,
        "text_rendering": false
      },
      "origem": "§16 Qual modelo escolher"
    },
    {
      "id": "furry_v3",
      "nome": "Furry V3",
      "familia": "v3",
      "padrao": false,
      "use_quando": "Vocabulário de tags próprio, voltado a personagens antropomórficos (animais com corpo de gente).",
      "suporta": {
        "multi_personagem": false,
        "peso_numerico": false,
        "peso_negativo": false,
        "precise_reference": false,
        "vibe_transfer": true,
        "text_rendering": false
      },
      "origem": "§16 Qual modelo escolher"
    }
  ],
  "incompatibilidades": [
    {
      "id": "precise_x_vibe",
      "gravidade": "vermelha",
      "titulo": "Referência Precisa e Vibe Transfer não funcionam juntas",
      "explica": "O Precise Reference (que contém Character Reference e Style Reference) não roda na mesma geração que o Vibe Transfer. Escolha um dos dois.",
      "origem": "§08 e §19.1 callout"
    },
    {
      "id": "precise_so_v45",
      "gravidade": "vermelha",
      "titulo": "Referência Precisa só existe no V4.5",
      "explica": "Se as opções de Character Reference e Style Reference não aparecerem na tela, confira o modelo selecionado no topo.",
      "exige_modelo": "v4.5",
      "origem": "§08 e §19.1"
    },
    {
      "id": "duas_char_ref_misturam",
      "gravidade": "vermelha",
      "titulo": "Duas referências de personagem viram UM personagem só",
      "explica": "Várias Character References se misturam num personagem só. Elas não geram dois personagens. Para dois personagens, use as caixas de vários personagens.",
      "origem": "§08 tabela (custo soma se usar mais de uma referência) + briefing da sessão",
      "verificado": true
    },
    {
      "id": "peso_numerico_v4",
      "gravidade": "vermelha",
      "titulo": "Peso numérico exige V4 ou mais novo",
      "explica": "A forma 1.5::tag :: só funciona nos modelos V4, V4 Curated, V4.5 e V4.5 Curated.",
      "exige_modelo": "v4",
      "origem": "§05 Peso numérico"
    },
    {
      "id": "peso_negativo_v45",
      "gravidade": "vermelha",
      "titulo": "Peso negativo exige V4.5",
      "explica": "A forma -1::tag:: só funciona no V4.5 e no V4.5 Curated. Número negativo não enfraquece: inverte o conceito.",
      "exige_modelo": "v4.5",
      "origem": "§05 Peso negativo (só V4.5+)"
    },
    {
      "id": "multi_personagem_v4",
      "gravidade": "vermelha",
      "titulo": "Vários personagens exige V4 ou mais novo",
      "explica": "As caixas separadas por personagem (+ Add Character), até 6, só existem em V4 ou mais novo.",
      "exige_modelo": "v4",
      "origem": "§07 Vários personagens juntos"
    },
    {
      "id": "text_rendering_v4",
      "gravidade": "vermelha",
      "titulo": "Texto na imagem exige V4 ou mais novo",
      "explica": "O bloco Text: só funciona em V4 ou mais novo, e tem que ser a última coisa do prompt.",
      "exige_modelo": "v4",
      "origem": "§13 Texto e balões de fala"
    },
    {
      "id": "text_no_fim",
      "gravidade": "vermelha",
      "titulo": "O bloco Text: vai no fim absoluto",
      "explica": "Qualquer tag escrita depois do bloco Text: pode acabar aparecendo desenhada dentro da imagem.",
      "origem": "§13 Texto e balões de fala"
    },
    {
      "id": "contagem_so_no_base",
      "gravidade": "vermelha",
      "titulo": "Número de personagens só no prompt base",
      "explica": "1girl e 2girls vão só no prompt base. Dentro da caixa de cada personagem vai girl ou boy, sem número.",
      "origem": "§07 Vários personagens juntos"
    },
    {
      "id": "caixas_x_barra",
      "gravidade": "vermelha",
      "titulo": "Caixas de personagem e a barra | são exclusivas",
      "explica": "Dá para separar base e personagens numa linha só com o caractere |, mas aí você perde as caixas visuais. Um ou outro.",
      "origem": "§07 Vários personagens juntos"
    },
    {
      "id": "upscale_1024",
      "gravidade": "amarela",
      "titulo": "Upscale só até 1024×1024",
      "explica": "O Upscale (aumentar o tamanho sem mudar o conteúdo) só aceita imagens de até 1024×1024.",
      "origem": "§11 Aumentar resolução"
    }
  ],
  "brigas_de_tag": [
    {
      "id": "mono_x_cor",
      "gravidade": "amarela",
      "titulo": "monochrome / greyscale contra tag de cor",
      "explica": "Se você pediu preto e branco, confira que não sobrou nenhuma tag de cor específica no resto do prompt (tipo blue hair). Elas brigam e o resultado sai inconsistente.",
      "origem": "§04 callout Atenção com monochrome/greyscale"
    },
    {
      "id": "qualidade_x_texto",
      "gravidade": "amarela",
      "titulo": "Etiquetas de qualidade cancelam texto curto",
      "explica": "As etiquetas de qualidade incluem no text por padrão. Se um texto curto não aparecer na imagem, desligue essas etiquetas.",
      "origem": "§13 Texto e balões de fala"
    },
    {
      "id": "preset_x_aberracao",
      "gravidade": "amarela",
      "titulo": "O preset Pesado cancela chromatic aberration",
      "explica": "Alguns efeitos, como chromatic aberration, já estão dentro do preset Pesado de Conteúdo Indesejado. Se você pedir o efeito e ele não aparecer, é o preset cancelando.",
      "origem": "§04 callout Atenção + §06"
    },
    {
      "id": "qualidade_x_estilo",
      "gravidade": "amarela",
      "titulo": "Etiquetas de qualidade empurram para o anime padrão",
      "explica": "Ao perseguir um estilo artístico específico, desligue as etiquetas de qualidade ou enfraqueça com colchetes.",
      "origem": "§04 Estilos artísticos, parágrafo de abertura"
    },
    {
      "id": "heterocromia_conserto",
      "gravidade": "informativa",
      "titulo": "Cores de olho trocadas sem querer",
      "explica": "Se a IA embaralhar as cores dos olhos sozinha, ponha heterochromia no Conteúdo Indesejado.",
      "origem": "§03 item 2"
    },
    {
      "id": "sardas_artefato",
      "gravidade": "informativa",
      "titulo": "freckles gera manchas estranhas",
      "explica": "Pôr tattoo no Conteúdo Indesejado resolve, mesmo sem tatuagem nenhuma no pedido.",
      "origem": "§06 callout Truque de dedução"
    },
    {
      "id": "roupa_sem_cor",
      "gravidade": "amarela",
      "titulo": "Peça de roupa sem cor sai diferente a cada tentativa",
      "explica": "Escreva a cor junto de cada peça: blue skirt, não só skirt. E descreva cabeça, tronco e pernas separadamente.",
      "origem": "§03 item 6"
    }
  ],
  "ordens": {
    "regra_geral": "Tag mais perto do início do prompt pesa mais no resultado. No Anime V3 e anteriores isso é ainda mais forte.",
    "origem_regra": "§01 callout A regra mais importante + §16",
    "opcoes": [
      {
        "id": "padrao_manual",
        "nome": "Padrão do manual",
        "padrao": true,
        "motivo": "É a sequência que a documentação oficial recomenda: primeiro quem é, depois como aparece, e a qualidade por último.",
        "origem": "§02 A ordem que você escreve"
      },
      {
        "id": "estilo_primeiro",
        "nome": "Estilo em primeiro",
        "padrao": false,
        "motivo": "Tag de estilo afeta a imagem inteira e pesa muito. Os quatro exemplos de estilo do manual começam pelo bloco de estilo.",
        "origem": "§04 Combinações prontas — os quatro exemplos"
      }
    ],
    "baldes": [
      {
        "id": "assunto",
        "nome": "Assunto e contagem",
        "padrao_manual": 10,
        "estilo_primeiro": 10
      },
      {
        "id": "enquadramento",
        "nome": "Enquadramento",
        "padrao_manual": 20,
        "estilo_primeiro": 20
      },
      {
        "id": "foco",
        "nome": "Foco de objeto",
        "padrao_manual": 25,
        "estilo_primeiro": 25
      },
      {
        "id": "angulo",
        "nome": "Ângulo de câmera",
        "padrao_manual": 30,
        "estilo_primeiro": 30
      },
      {
        "id": "cabelo",
        "nome": "Cabelo",
        "padrao_manual": 40,
        "estilo_primeiro": 40
      },
      {
        "id": "olhos",
        "nome": "Olhos",
        "padrao_manual": 45,
        "estilo_primeiro": 45
      },
      {
        "id": "pele",
        "nome": "Pele e rosto",
        "padrao_manual": 50,
        "estilo_primeiro": 50
      },
      {
        "id": "corpo",
        "nome": "Corpo",
        "padrao_manual": 55,
        "estilo_primeiro": 55
      },
      {
        "id": "roupa_cabeca",
        "nome": "Roupa da cabeça",
        "padrao_manual": 60,
        "estilo_primeiro": 60
      },
      {
        "id": "roupa_tronco",
        "nome": "Roupa do tronco",
        "padrao_manual": 62,
        "estilo_primeiro": 62
      },
      {
        "id": "roupa_pernas",
        "nome": "Roupa das pernas",
        "padrao_manual": 64,
        "estilo_primeiro": 64
      },
      {
        "id": "roupa_calcado",
        "nome": "Calçado",
        "padrao_manual": 66,
        "estilo_primeiro": 66
      },
      {
        "id": "roupa_acessorio",
        "nome": "Acessório",
        "padrao_manual": 68,
        "estilo_primeiro": 68
      },
      {
        "id": "pose",
        "nome": "Pose e ação",
        "padrao_manual": 70,
        "estilo_primeiro": 70
      },
      {
        "id": "cena",
        "nome": "Cena, lugar, luz e clima",
        "padrao_manual": 80,
        "estilo_primeiro": 80
      },
      {
        "id": "epoca",
        "nome": "Época",
        "padrao_manual": 85,
        "estilo_primeiro": 6
      },
      {
        "id": "estilo",
        "nome": "Estilo",
        "padrao_manual": 90,
        "estilo_primeiro": 5
      },
      {
        "id": "efeitos",
        "nome": "Efeitos especiais",
        "padrao_manual": 95,
        "estilo_primeiro": 8
      },
      {
        "id": "qualidade",
        "nome": "Qualidade e estética",
        "padrao_manual": 98,
        "estilo_primeiro": 98
      },
      {
        "id": "texto",
        "nome": "Bloco de texto (Text:)",
        "padrao_manual": 999,
        "estilo_primeiro": 999
      }
    ],
    "estabilidade": "Empate no mesmo balde mantém a ordem em que o autor escolheu. Dentro de um balde, a preferência é dele."
  },
  "pesos": {
    "chaves": {
      "simbolo": "{tag}",
      "fator": 1.05,
      "acumula": true,
      "explica": "Cada par de chaves multiplica o peso por 1,05. Empilhar multiplica: {{tag}} é 1,1025×.",
      "modelo_minimo": "qualquer",
      "origem": "§05 Chaves e colchetes"
    },
    "colchetes": {
      "simbolo": "[tag]",
      "fator": 0.952380952,
      "explica": "Cada par de colchetes divide o peso por 1,05.",
      "modelo_minimo": "qualquer",
      "origem": "§05 Chaves e colchetes"
    },
    "numerico": {
      "simbolo": "1.5::tag ::",
      "explica": "Tudo entre o número e o :: final recebe aquele peso.",
      "modelo_minimo": "v4",
      "exemplo_oficial": "1girl, 1.5::rain, night ::, 0.5::coat ::, black shoes",
      "origem": "§05 Peso numérico"
    },
    "negativo": {
      "simbolo": "-1::tag::",
      "explica": "Número negativo não enfraquece: inverte o conceito. É mais preciso que mandar a tag para o Conteúdo Indesejado.",
      "modelo_minimo": "v4.5",
      "exemplos_oficiais": [
        "-1::hat::",
        "-2.5::flat color::",
        "-1::monochrome::",
        "-1::simple background::"
      ],
      "origem": "§05 Peso negativo (só V4.5+)"
    },
    "no_indesejado": "Na caixa de Conteúdo Indesejado as chaves e colchetes funcionam ao contrário: {tag} evita mais, [tag] evita menos.",
    "origem_indesejado": "§06 Conteúdo indesejado"
  },
  "conteudo_indesejado": {
    "explica": "Caixa separada, na mesma área do prompt. Tudo que estiver ali a IA tenta não desenhar.",
    "origem": "§06 Conteúdo indesejado",
    "aviso_lista_literal": "O manual NÃO publica a lista de palavras de cada preset, e trocar de modelo muda essa lista. Por isso os campos abaixo estão vazios: copie a lista da tela do NovelAI e cole aqui, se quiser vê-la na Oficina.",
    "presets": [
      {
        "id": "nenhum",
        "nome": "Nenhum",
        "conteudo_literal": null,
        "verificado": false,
        "explica": "Nada é evitado automaticamente.",
        "origem": "§06 (nome citado)"
      },
      {
        "id": "leve",
        "nome": "Leve",
        "conteudo_literal": null,
        "verificado": false,
        "explica": "Combate os defeitos mais comuns, sem apertar muito.",
        "origem": "§06 (nome citado)"
      },
      {
        "id": "pesado",
        "nome": "Pesado",
        "conteudo_literal": null,
        "verificado": false,
        "explica": "Lista mais longa contra defeitos comuns — mãos malformadas, marca d'água, baixa resolução. Contém chromatic aberration, então cancela esse efeito se você pedir.",
        "contem_confirmado": [
          "chromatic aberration"
        ],
        "origem": "§04 callout Atenção + §06"
      },
      {
        "id": "foco",
        "nome": "Variações por foco",
        "conteudo_literal": null,
        "verificado": false,
        "explica": "O manual cita que existem variações por foco, sem listar quais.",
        "origem": "§06 (citado sem detalhe)"
      }
    ],
    "preset_padrao": "O preset recomendado já vem ativado por padrão no site.",
    "defeitos_combatidos": [
      "mãos malformadas",
      "marca d'água",
      "baixa resolução"
    ]
  },
  "multi_personagem": {
    "maximo": 6,
    "modelo_minimo": "v4",
    "botao": "+ Add Character",
    "regra_contagem": "A contagem (1girl, 2girls) vai só no prompt base. Dentro da caixa vai girl ou boy, sem número.",
    "regra_posicao": "A ordem das caixas tende a virar a posição na imagem: primeira caixa à esquerda, segunda à direita.",
    "grade": {
      "colunas": 5,
      "linhas": 5,
      "explica": "Dá para indicar a posição aproximada numa grade 5×5, desligando a opção A escolha da IA."
    },
    "prefixos_acao": [
      {
        "prefixo": "source#",
        "exemplo": "source#hug",
        "explica": "Marca quem INICIA a ação."
      },
      {
        "prefixo": "target#",
        "exemplo": "target#hug",
        "explica": "Marca quem RECEBE a ação."
      },
      {
        "prefixo": "mutual#",
        "exemplo": "mutual#hug",
        "explica": "Marca a ação que os dois fazem igual, como um abraço correspondido."
      }
    ],
    "origem": "§07 Vários personagens juntos"
  },
  "referencias": {
    "resolucoes_nativas": [
      {
        "largura": 1024,
        "altura": 1536,
        "nome": "retrato"
      },
      {
        "largura": 1472,
        "altura": 1472,
        "nome": "quadrado"
      },
      {
        "largura": 1536,
        "altura": 1024,
        "nome": "paisagem"
      }
    ],
    "resolucao_explica": "O Character Reference sempre converte para uma destas três. Imagem menor é esticada, maior é reduzida.",
    "preparo": [
      "Corpo inteiro, personagem de pé, pose neutra, fundo simples.",
      "Ilustração limpa vence rascunho: traço solto dificulta o modelo enxergar os detalhes finos.",
      "Um recorte do rosto num canto da imagem ajuda — dá ao modelo uma leitura ampliada das feições.",
      "Ocupe o quadro: para gerar plano de tronco, uma referência de tronco mostra mais detalhe que uma de corpo inteiro reduzida."
    ],
    "controles": [
      {
        "id": "strength",
        "nome": "Strength (Força)",
        "explica": "O quanto a IA imita a referência. Força alta copia também a pose, o ângulo e a expressão da referência.",
        "aceita_negativo": true
      },
      {
        "id": "fidelity",
        "nome": "Fidelity (Fidelidade)",
        "explica": "O quão difícil é o prompt vencer a referência.",
        "aceita_negativo": true
      }
    ],
    "ferramentas": [
      {
        "id": "character_reference",
        "nome": "Character Reference",
        "leva": "a identidade do personagem (rosto, corpo, roupa)",
        "devolve": "o mesmo personagem, em pose e cena novas",
        "custo_anlas": 5,
        "custo_por": "imagem de referência",
        "modelo_minimo": "v4.5"
      },
      {
        "id": "style_reference",
        "nome": "Style Reference",
        "leva": "só o estilo visual da imagem, não quem está nela",
        "devolve": "outro personagem, com o seu traço",
        "custo_anlas": 5,
        "custo_por": "imagem de referência",
        "modelo_minimo": "v4.5"
      },
      {
        "id": "vibe_transfer",
        "nome": "Vibe Transfer",
        "leva": "uma inspiração geral — cor, clima, composição",
        "devolve": "uma imagem nova com o mesmo clima",
        "custo_anlas": 2,
        "custo_por": "imagem, uma vez só (fica em cache)",
        "modelo_minimo": "qualquer"
      },
      {
        "id": "image2image",
        "nome": "Image2Image",
        "leva": "a composição da imagem inteira",
        "devolve": "o mesmo enquadramento, com acabamento novo",
        "custo_anlas": 0,
        "custo_por": "sem custo extra",
        "modelo_minimo": "qualquer"
      }
    ],
    "origem": "§08 Reaproveitar arte que já existe + §19.1 e §19.2"
  },
  "image2image": {
    "strength": "Alto: a IA reinterpreta livremente. Baixo: fica perto do original.",
    "noise": "Ajuda a IA a inventar detalhe novo, como preencher um fundo que não existia. Ruído demais degrada a imagem em gerações repetidas.",
    "copia_perfeita": "Força e Ruído no mínimo reproduzem a imagem quase sem mudança — útil como passo prévio antes de Upscale ou Enhance.",
    "origem": "§09 Partir de uma imagem"
  },
  "inpaint": {
    "explica": "Você pinta uma máscara (área azul) só sobre a parte errada, e só ela é refeita.",
    "vazamento": "Cuidado ao encostar a borda da máscara perto de algo que quer manter: pixels vizinhos podem vazar para dentro da correção. Se acontecer, aumente a máscara.",
    "forca": "A Força do Inpaint controla o quanto a correção respeita o que estava embaixo da máscara. Força 1 deixa o prompt decidir tudo daquele pedaço.",
    "focado": "O Inpaint Focado seleciona um retângulo e faz upscale dele para cerca de 1 megapixel antes de corrigir — mais detalhe no resultado. Para assinantes Opus, esse modo não gasta Anlas mesmo em imagens grandes.",
    "origem": "§10 Corrigir só um pedaço"
  },
  "upscale_enhance": [
    {
      "id": "upscale",
      "nome": "Upscale",
      "faz": "Aumenta o tamanho (4×) sem alterar o conteúdo",
      "usa_prompt": false,
      "limite": "Só imagens até 1024×1024",
      "origem": "§11"
    },
    {
      "id": "enhance",
      "nome": "Enhance",
      "faz": "Passa a imagem pela geração de novo, melhorando detalhe",
      "usa_prompt": true,
      "limite": null,
      "nota": "O Strength e o Noise aqui se chamam Magnitude.",
      "origem": "§11"
    }
  ],
  "director_tools": [
    {
      "id": "remove_bg",
      "nome": "Remove BG",
      "pt": "Tirar o fundo",
      "faz": "Recorta o fundo. Oferece três versões: recortada, gerada do zero, ou uma mistura das duas. Serve também para tirar coisas na frente do personagem."
    },
    {
      "id": "line_art",
      "nome": "Line Art",
      "pt": "Só o traço",
      "faz": "Reduz a imagem só ao traço."
    },
    {
      "id": "sketch",
      "nome": "Sketch",
      "pt": "Rascunho",
      "faz": "Gera uma versão em rascunho da imagem final."
    },
    {
      "id": "colorize",
      "nome": "Colorize",
      "pt": "Colorir",
      "faz": "Colore um traço, ou re-colore algo que já tem cor. O campo Colorize Prompt define as cores."
    },
    {
      "id": "emotion",
      "nome": "Emotion",
      "pt": "Trocar a expressão",
      "faz": "Troca a expressão de um rosto.",
      "condicoes": [
        "Um personagem só, rosto de frente e expressão neutra.",
        "Se o desenho já tem expressão marcada, passe o Emotion antes para gerar a versão neutra, e use essa como base.",
        "A mudança NÃO fica restrita ao rosto — outras partes podem mudar junto.",
        "Imagem de baixa resolução ou baixo contraste dá problema."
      ],
      "controles": [
        "Emotion Level (o quanto a emoção é aplicada)",
        "Emotion Prompt (tags extras)"
      ]
    },
    {
      "id": "declutter",
      "nome": "Declutter",
      "pt": "Limpar sobras",
      "faz": "Remove texto solto, balão de fala de rascunho, ou ruído visual esquecido na imagem."
    }
  ],
  "director_tools_nota": "Qualquer resultado de uma dessas ferramentas pode virar a base para a próxima — dá para encadear (gerar → tirar fundo → colorir → trocar expressão) sem sair da imagem.",
  "director_tools_origem": "§12 Ferramentas de direção + §19.5 e §19.6",
  "text_rendering": {
    "modelo_minimo": "v4",
    "formato": "Text: sua frase aqui",
    "posicao": "Fim absoluto do prompt. Qualquer tag depois disso pode acabar aparecendo escrita na imagem.",
    "limite_caracteres": 120,
    "tags_obrigatorias": [
      "text",
      "english text"
    ],
    "varios_textos": "Textos diferentes se separam por uma linha em branco (Shift+Enter cria a quebra).",
    "avisos": [
      "Se um texto curto não aparecer, desligue as Etiquetas de Qualidade — elas incluem no text por padrão.",
      "Repetir o texto também em linguagem natural, descrevendo a fala, aumenta a confiabilidade."
    ],
    "origem": "§13 Texto e balões de fala"
  },
  "atalhos": [
    {
      "id": "prompt_chunks",
      "nome": "Prompt Chunks",
      "pt": "Pedaços salvos de prompt",
      "explica": "Salva um pedaço de prompt (um personagem inteiro, uma paleta de estilo) para reusar. Digite @ na caixa de prompt para chamar. Ficam guardados na conta.",
      "origem": "§14 Atalhos"
    },
    {
      "id": "prompt_randomizer",
      "nome": "Prompt Randomizer",
      "pt": "Sorteio de opções",
      "explica": "A IA sorteia entre opções que você lista, com ||opção1|opção2|opção3||. Cada geração sorteia de novo, mesmo com a mesma semente.",
      "exemplo": "1girl, ||red hair|blue hair|green hair||, rain",
      "origem": "§14 Atalhos"
    }
  ],
  "canvas": {
    "explica": "Tela de desenho embutida no site. Abre pelo botão Paint New Image, ou Edit Image sobre uma imagem.",
    "ferramentas": [
      "pincel",
      "borracha",
      "balde de tinta",
      "seleção",
      "laço",
      "conta-gotas",
      "borrão",
      "carimbo",
      "ajuste de matiz, saturação e brilho",
      "camadas",
      "camada de modelo 3D como guia de pose"
    ],
    "boneco_3d": {
      "formatos": [
        ".glb",
        ".gltf",
        ".pmd",
        ".pmx",
        ".vrm"
      ],
      "zip": "Se o modelo usa arquivos externos, como texturas, suba tudo junto num único .zip.",
      "passos": [
        "Abra o Canvas (botão Paint New Image, ou Edit Image sobre uma imagem).",
        "No painel de camadas, clique em Add 3D Model Layer.",
        "Clique em Import no canto superior esquerdo e escolha o arquivo do boneco.",
        "Tecla t = Model Transform (move, gira e redimensiona o boneco inteiro). Tecla p = Pose (seleciona osso por osso).",
        "Câmera: w a s d movem frente, esquerda, trás e direita; q e e movem cima e baixo; a roda do mouse aproxima.",
        "Salve com Save & Close e gere por Image2Image com o prompt do seu personagem."
      ],
      "por_que_funciona": "O Canvas gera uma imagem de base com a anatomia e a perspectiva já corretas. A IA só precisa vestir o seu personagem por cima. Use Noise mais alto nesse caso — áreas de cor chapada precisam de ruído para a IA criar textura."
    },
    "origem": "§09 O Canvas + §19.4 Técnica 2"
  },
  "custos": {
    "moeda": "Anlas",
    "itens": [
      {
        "id": "character_reference",
        "nome": "Character Reference",
        "anlas": 5,
        "por": "imagem de referência",
        "acumula": true,
        "explica": "Soma se você usar mais de uma referência.",
        "verificado": true,
        "origem": "§08 tabela e §19.1"
      },
      {
        "id": "style_reference",
        "nome": "Style Reference",
        "anlas": 5,
        "por": "imagem de referência",
        "acumula": true,
        "explica": "Incluído no mesmo custo do Precise Reference.",
        "verificado": true,
        "origem": "§08 tabela e §19.1"
      },
      {
        "id": "vibe_transfer",
        "nome": "Vibe Transfer",
        "anlas": 2,
        "por": "imagem, uma vez só",
        "acumula": false,
        "explica": "Custa 2 Anlas para codificar a imagem, uma vez. Depois fica em cache no navegador.",
        "verificado": true,
        "origem": "§08 tabela"
      },
      {
        "id": "image2image",
        "nome": "Image2Image",
        "anlas": 0,
        "por": "geração",
        "acumula": false,
        "explica": "Sem custo extra além da geração.",
        "verificado": true,
        "origem": "§19.1 diagrama"
      },
      {
        "id": "inpaint_focado_opus",
        "nome": "Inpaint Focado (assinante Opus)",
        "anlas": 0,
        "por": "uso",
        "acumula": false,
        "explica": "Para assinantes Opus, esse modo específico não gasta Anlas mesmo em imagens grandes.",
        "verificado": true,
        "origem": "§10 callout Inpaint Focado"
      }
    ],
    "planos": {
      "aviso": "ATENÇÃO: os preços e as cotas abaixo NÃO estão no manual-novelai.html. Vieram do briefing da sessão e podem ter mudado. Confira na página de assinatura do NovelAI antes de contar com eles.",
      "verificado": false,
      "lista": [
        {
          "id": "teste",
          "nome": "Teste grátis",
          "usd_mes": 0,
          "anlas_mes": 0,
          "imagens_gratis": 30,
          "extra": null,
          "verificado": false,
          "origem": "briefing da sessão — NÃO consta no manual-novelai.html"
        },
        {
          "id": "tablet",
          "nome": "Tablet",
          "usd_mes": 10,
          "anlas_mes": 1000,
          "imagens_gratis": 0,
          "extra": null,
          "verificado": false,
          "origem": "briefing da sessão — NÃO consta no manual-novelai.html"
        },
        {
          "id": "scroll",
          "nome": "Scroll",
          "usd_mes": 15,
          "anlas_mes": 1000,
          "imagens_gratis": 0,
          "extra": null,
          "verificado": false,
          "origem": "briefing da sessão — NÃO consta no manual-novelai.html"
        },
        {
          "id": "opus",
          "nome": "Opus",
          "usd_mes": 25,
          "anlas_mes": 10000,
          "imagens_gratis": 0,
          "extra": "Geração sem gastar Anlas em V4.5 ou inferior: uma por vez, tamanho normal, até 28 passos.",
          "verificado": false,
          "origem": "briefing da sessão — NÃO consta no manual-novelai.html"
        }
      ]
    },
    "limites": [
      {
        "id": "uma_geracao_por_vez",
        "titulo": "Uma geração por vez",
        "explica": "A NovelAI permite só uma geração simultânea por conta. Não dá para disparar dez de uma vez e ganhar tempo.",
        "verificado": true,
        "origem": "§19.8 Três limites reais"
      },
      {
        "id": "custo_api_igual",
        "titulo": "Pela API o custo é o mesmo",
        "explica": "Anlas gastos pela API são os mesmos gastos pelo site. Não há desconto nem cota extra.",
        "verificado": true,
        "origem": "§19.8 Três limites reais"
      },
      {
        "id": "nada_e_salvo",
        "titulo": "O NovelAI não guarda nada",
        "explica": "Fechar ou recarregar a página apaga todas as imagens da sessão. Baixe conforme for gerando — há um botão de baixar tudo em .zip no fim da barra de histórico.",
        "verificado": true,
        "origem": "§19.7 callout O risco número um"
      },
      {
        "id": "botao_salvar",
        "titulo": "Baixe pelo botão de salvar, não pelo botão direito",
        "explica": "Só o botão de salvar da imagem preserva o prompt e a semente dentro do arquivo, o que deixa você refazer aquele quadro depois.",
        "verificado": true,
        "origem": "§19.7 passo 8"
      },
      {
        "id": "barra_de_contexto",
        "titulo": "O prompt tem limite de tamanho",
        "explica": "A barra de contexto embaixo da caixa mostra quanto espaço sobra. Prompt longo e repetitivo não ajuda: é melhor ser específico do que extenso.",
        "verificado": true,
        "origem": "§01 Como o prompt funciona"
      }
    ]
  },
  "api": {
    "token": {
      "nome": "Token Persistente de API",
      "onde": "menu de conta do NovelAI",
      "avisos": [
        "Gerar um token novo invalida o anterior na hora.",
        "Depois de fechar a janela, o token não aparece de novo — copie e guarde antes.",
        "Ele vale como senha: quem tiver o seu token consegue gastar os seus Anlas."
      ]
    },
    "endpoints_publicados": false,
    "endpoints_nota": "A documentação oficial NÃO publica os endereços técnicos (endpoints) da geração de imagem. Ela só diz que o token serve para usar a API. Por isso a geração direta é a única parte da Oficina que pode quebrar por mudança do lado deles.",
    "bibliotecas_comunidade": [
      {
        "nome": "NekoAI-API",
        "linguagem": "Python",
        "cobre": [
          "Geração normal por prompt (V3 até V4.5)",
          "Image2Image com controle de força",
          "Vibe Transfer com cache automático da codificação",
          "Character Reference e vários personagens, com posição e conteúdo indesejado por personagem (V4/V4.5)",
          "Inpaint com máscara",
          "Director Tools — traço, rascunho, remover fundo, declutter, colorir, emoção"
        ],
        "autenticacao": "Token Persistente (recomendado) ou usuário e senha",
        "aviso": "É biblioteca de terceiros. Funciona porque acompanha o site. Se a NovelAI mudar algo internamente, ela pode quebrar até ser atualizada."
      }
    ],
    "ganha": "Gerar em lote sem ficar clicando, salvar as imagens direto numa pasta organizada, e repetir a mesma receita com variações automáticas.",
    "perde": "O Canvas, o boneco 3D e a edição visual. Essas partes são da interface do site e continuam sendo feitas lá.",
    "origem": "§19.8 Fazer isso pela API"
  },
  "avisos_permanentes": [
    {
      "id": "so_anime",
      "texto": "O NovelAI só faz anime. O mangá sai daqui. A aquarela do livro é feita em outro motor.",
      "origem": "§16 e decisão do autor"
    },
    {
      "id": "sem_pagina_manga",
      "texto": "O NovelAI não tem ferramenta de montar página de mangá com vários quadrinhos. Ele gera uma ilustração por vez. A página se monta fora, num editor de imagem comum.",
      "origem": "§15 callout O que não existe + §19.7"
    },
    {
      "id": "semente",
      "texto": "Para comparar suas próprias tentativas, use a mesma Semente (Seed) e mude o prompt aos poucos. Assim você vê o que cada tag muda, sem a variação aleatória atrapalhar.",
      "origem": "§03 callout Como comparar"
    },
    {
      "id": "bolinha_sugestao",
      "texto": "Enquanto você digita, o site sugere tags. Cada sugestão tem uma bolinha: quanto mais preenchida, mais o modelo conhece aquele conceito, e mais previsível é o resultado.",
      "origem": "§01 Como o prompt funciona"
    },
    {
      "id": "poucos_passos",
      "texto": "Se a IA ignorar seu prompt de estilo, aumente o Prompt Guidance (Orientação) e o Strength juntos. Teste com 10 a 15 passos: já mostram para onde a imagem vai, e gastam menos.",
      "origem": "§19.3 callout"
    }
  ]
}
;
