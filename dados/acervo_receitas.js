window.OFICINA_RECEITAS =
{
  "versao_formato": "1.3.0",
  "fonte": "manual-novelai.html (docs.novelai.net)",
  "gerado_em": "2026-08-21",
  "receitas": [
    {
      "id": "estilo_aquarela",
      "nome": "Aquarela tradicional",
      "familia": "estilo",
      "para_que": "Dar à imagem o acabamento de pintura em aquarela.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "traditional media, watercolor (medium), painterly, muted color, 1girl, standing, forest, best quality, very aesthetic",
      "tags_base": [
        "est_traditional_media",
        "est_watercolor_medium",
        "est_painterly",
        "est_muted_color",
        "quem_1girl",
        "pos_standing",
        "pai_forest",
        "qua_best_quality",
        "aes_very_aesthetic"
      ],
      "troque": "O assunto (1girl, standing, forest). O bloco de estilo fica igual.",
      "aviso": "Este é o estilo aquarela DENTRO do NovelAI, que é um motor de anime. Não é o padrão de aquarela da ilustração do livro, que é feito em outro motor.",
      "origem": "§04 Combinações prontas",
      "ordem": "estilo_primeiro",
      "prompt_montado": "traditional media, watercolor (medium), painterly, muted color, 1girl, standing, forest, best quality, very aesthetic",
      "ordem_bate": true,
      "ordem_nota": null,
      "prompt_oficial": "traditional media, watercolor (medium), painterly, muted color, 1girl, standing, forest, best quality, very aesthetic",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "estilo_ukiyoe",
      "nome": "Xilogravura japonesa (ukiyo-e)",
      "familia": "estilo",
      "para_que": "Dar à imagem o acabamento de gravura japonesa antiga.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "ukiyo-e, traditional media, ink (medium), flat color, limited palette, 1girl, standing, forest, best quality, very aesthetic",
      "tags_base": [
        "est_ukiyo_e",
        "est_traditional_media",
        "est_ink_medium",
        "est_flat_color",
        "est_limited_palette",
        "quem_1girl",
        "pos_standing",
        "pai_forest",
        "qua_best_quality",
        "aes_very_aesthetic"
      ],
      "troque": "O assunto. O bloco de estilo fica igual.",
      "aviso": null,
      "origem": "§04 Combinações prontas",
      "ordem": "estilo_primeiro",
      "prompt_montado": "ukiyo-e, traditional media, ink (medium), flat color, limited palette, 1girl, standing, forest, best quality, very aesthetic",
      "ordem_bate": true,
      "ordem_nota": null,
      "prompt_oficial": "ukiyo-e, traditional media, ink (medium), flat color, limited palette, 1girl, standing, forest, best quality, very aesthetic",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "estilo_pixel",
      "nome": "Jogo retrô em pixel art",
      "familia": "estilo",
      "para_que": "Dar à imagem o visual de jogo antigo, feito de pixels grandes.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "pixel art, dithering, year 1998, limited palette, 1girl, standing, forest, best quality",
      "tags_base": [
        "est_pixel_art",
        "est_dithering",
        {
          "id": "epo_year_xxxx",
          "valor": "year 1998"
        },
        "est_limited_palette",
        "quem_1girl",
        "pos_standing",
        "pai_forest",
        "qua_best_quality"
      ],
      "troque": "O assunto, e o ano em year 1998.",
      "aviso": "A tag year XXXX precisa de um ano de verdade. Neste exemplo oficial o ano é 1998.",
      "origem": "§04 Combinações prontas",
      "ordem": "estilo_primeiro",
      "prompt_montado": "pixel art, limited palette, year 1998, dithering, 1girl, standing, forest, best quality",
      "ordem_bate": false,
      "ordem_nota": "A Oficina agrupa por tipo: as tags de estilo saem juntas, depois o ano, depois o efeito. O exemplo do manual intercala os três. São as mesmas tags — só a ordem dentro do bloco de estilo muda, e o motor trata as duas igual.",
      "prompt_oficial": "pixel art, dithering, year 1998, limited palette, 1girl, standing, forest, best quality",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "estilo_cinema",
      "nome": "Cinematográfico, quase foto",
      "familia": "estilo",
      "para_que": "Dar à imagem o acabamento de fotografia de cinema.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "photorealistic, realistic, depth of field, bokeh, backlighting, 1girl, standing, forest, best quality, very aesthetic",
      "tags_base": [
        "est_photorealistic",
        "est_realistic",
        "est_depth_of_field",
        "est_bokeh",
        "est_backlighting",
        "quem_1girl",
        "pos_standing",
        "pai_forest",
        "qua_best_quality",
        "aes_very_aesthetic"
      ],
      "troque": "O assunto. O bloco de estilo fica igual.",
      "aviso": null,
      "origem": "§04 Combinações prontas",
      "ordem": "estilo_primeiro",
      "prompt_montado": "photorealistic, realistic, depth of field, bokeh, backlighting, 1girl, standing, forest, best quality, very aesthetic",
      "ordem_bate": true,
      "ordem_nota": null,
      "prompt_oficial": "photorealistic, realistic, depth of field, bokeh, backlighting, 1girl, standing, forest, best quality, very aesthetic",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "quadro_manga",
      "nome": "Quadro de mangá (estilo e personagem fixos)",
      "familia": "manga",
      "para_que": "Gerar os quadros de uma página mantendo o mesmo traço e o mesmo personagem. Troque só a ação e o enquadramento entre um quadro e outro.",
      "modelo_sugerido": "v45_full",
      "blocos": [
        {
          "rotulo": "ESTILO (igual em todos os quadros)",
          "prompt": "monochrome, greyscale, halftone, high contrast, lineart, best quality",
          "tags": [
            "est_monochrome",
            "est_greyscale",
            "est_halftone",
            "est_high_contrast",
            "est_lineart",
            "qua_best_quality"
          ]
        },
        {
          "rotulo": "PERSONAGEM (igual em todos os quadros)",
          "prompt": "1boy, solo, short brown hair, stubble, scar on face, leather jacket",
          "tags": [
            "quem_1boy",
            "quem_solo",
            "cab_short_hair",
            "cab_brown_hair",
            "cab_stubble",
            "pel_scar_on_face",
            "rou_leather_jacket"
          ]
        },
        {
          "rotulo": "QUADRO 1 — a ação e o enquadramento mudam",
          "prompt": "close-up, looking at viewer, angry, rain, text, english text",
          "tags": [
            "enq_close_up",
            "pos_looking_at_viewer",
            "pos_angry",
            "pai_rain",
            "esp_text",
            "esp_english_text"
          ]
        },
        {
          "rotulo": "TEXTO (fim absoluto do prompt)",
          "prompt": "I'm not going back.",
          "tags": [],
          "exibir_como": "Text: I'm not going back.",
          "eh_bloco_de_texto": true,
          "textos": [
            "I'm not going back."
          ]
        }
      ],
      "aviso": "Este exemplo usa monochrome e greyscale. Tire as tags de cor do resto do prompt, senão elas brigam.",
      "passos": [
        "Grave o personagem primeiro. Salve a referência dele como Prompt Chunk, e chame com @ em cada quadro.",
        "Escreva a lista de quadros antes de gerar. Uma linha por quadro: o que acontece, quem aparece, e qual o enquadramento.",
        "Varie o enquadramento entre quadros: close-up numa reação, wide shot para situar o lugar, from below para dar poder a alguém.",
        "Mantenha o bloco de estilo idêntico em cada quadro.",
        "Fixe a paleta com monochrome ou greyscale se quer o preto e branco clássico.",
        "Ponha a fala com Text Rendering, ou gere sem fala e escreva os balões depois.",
        "Limpe com Declutter o texto solto e os balões de rascunho que a IA inventar.",
        "Baixe cada quadro pelo botão de salvar da imagem, não pelo botão direito.",
        "Monte a página fora do NovelAI, num editor de imagem qualquer."
      ],
      "origem": "§19.7 Modelo de quadro de mangá + passo a passo",
      "tags_base": [
        "est_monochrome",
        "est_greyscale",
        "est_halftone",
        "est_high_contrast",
        "est_lineart",
        "qua_best_quality",
        "quem_1boy",
        "quem_solo",
        "cab_short_hair",
        "cab_brown_hair",
        "cab_stubble",
        "pel_scar_on_face",
        "rou_leather_jacket",
        "enq_close_up",
        "pos_looking_at_viewer",
        "pos_angry",
        "pai_rain",
        "esp_text",
        "esp_english_text"
      ],
      "textos": [
        "I'm not going back."
      ],
      "bloco_texto": [
        "I'm not going back."
      ],
      "exibir_como": "Text: I'm not going back.",
      "ordem": "estilo_primeiro",
      "prompt_montado": "monochrome, greyscale, high contrast, lineart, halftone, 1boy, solo, close-up, short hair, brown hair, stubble, scar on face, leather jacket, looking at viewer, angry, rain, best quality, text, english text",
      "ordem_bate": null,
      "ordem_nota": "As quatro caixas do modelo viram um prompt só, com o estilo na frente. A fala fica no fim absoluto, montada pela Oficina.",
      "prompt_oficial": null,
      "verificado": true,
      "verificado_nota": "O manual escreve este modelo em quatro caixas separadas (§19.7). A Oficina junta as quatro num prompt só. As tags são as mesmas.",
      "prompt_da_oficina": null
    },
    {
      "id": "folha_referencia",
      "nome": "Folha de referência do personagem",
      "familia": "referencia",
      "para_que": "Gerar uma prancha com várias vistas do mesmo personagem. É a referência mais flexível: serve para gerar qualquer ângulo depois.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "multiple views, turnaround, reference sheet, no text",
      "tags_base": [
        "mv_multiple_views",
        "mv_turnaround",
        "mv_reference_sheet",
        "esp_no_text"
      ],
      "troque": "Acrescente as tags de aparência do seu personagem depois deste bloco.",
      "aviso": "A tag no text evita que a IA escreva anotações de design na imagem.",
      "origem": "§08 e §19.2 callout A referência mais flexível",
      "ordem": "padrao_manual",
      "prompt_montado": "multiple views, turnaround, reference sheet, no text",
      "ordem_bate": true,
      "ordem_nota": null,
      "prompt_oficial": "multiple views, turnaround, reference sheet, no text",
      "verificado": true,
      "verificado_nota": "O manual não escreve isto como prompt: ele manda usar estas quatro tags, com estas palavras, no aviso de §19.2.",
      "prompt_da_oficina": null
    },
    {
      "id": "prancha_personagem",
      "nome": "Prancha de personagem (uma vista)",
      "familia": "referencia",
      "para_que": "Gerar a imagem de referência ideal: corpo inteiro, de pé, pose neutra, fundo simples. O manual pede isso em prosa; estas tags são a tradução feita pela Oficina, não um prompt copiado do manual.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "character image, full body, standing, simple background, facing viewer, no text",
      "tags_base": [
        "sim_character_image",
        "enq_full_body",
        "pos_standing",
        "pai_simple_background",
        "ang_facing_viewer",
        "esp_no_text"
      ],
      "troque": "Acrescente as tags de aparência do seu personagem.",
      "aviso": "Gere numa das três resoluções nativas: 1024×1536, 1472×1472 ou 1536×1024. Estas tags são escolha da Oficina, não um prompt do manual.",
      "origem": "§08 Como preparar a imagem de referência + §19.2 — os dois em prosa. O manual não traz nenhuma linha de tags para esta receita.",
      "ordem": "padrao_manual",
      "prompt_montado": "character image, full body, facing viewer, standing, simple background, no text",
      "ordem_bate": null,
      "ordem_nota": "O manual não escreve este prompt, então não há ordem do manual para comparar. Ele descreve a referência ideal em prosa (corpo inteiro, de pé, pose neutra, fundo simples), e a Oficina traduziu isso em tags.",
      "prompt_oficial": null,
      "verificado": false,
      "verificado_nota": "O manual não escreve este prompt. Ele descreve a referência ideal em prosa (corpo inteiro, de pé, pose neutra, fundo simples), e a Oficina traduziu isso em tags. A grafia character image existe no manual, mas numa lista de tags — nunca dentro de um prompt.",
      "prompt_da_oficina": "character image, full body, standing, simple background, facing viewer, no text"
    },
    {
      "id": "trocar_estilo_a",
      "nome": "Trocar o estilo — caminho A (Image2Image fraco)",
      "familia": "retoque",
      "para_que": "Dar um acabamento novo ao seu desenho preservando quase tudo: pose, enquadramento e cores gerais.",
      "modelo_sugerido": "v45_full",
      "ferramenta": "Image2Image",
      "ajustes": {
        "strength": "perto de 0,3",
        "noise": "baixo"
      },
      "prompt_base": "traditional media, watercolor (medium), painterly, muted color, 1boy, solo, standing, short brown hair, blue jacket, best quality, very aesthetic",
      "tags_base": [
        "est_traditional_media",
        "est_watercolor_medium",
        "est_painterly",
        "est_muted_color",
        "quem_1boy",
        "quem_solo",
        "pos_standing",
        "cab_short_hair",
        "cab_brown_hair",
        "rou_blue_jacket",
        "qua_best_quality",
        "aes_very_aesthetic"
      ],
      "preserva": "quase tudo — pose, enquadramento, cores gerais",
      "aviso": "Descreva no prompt o que ESTÁ na imagem e também o que você quer mudar. O manual diz que isso melhora muito o resultado.",
      "origem": "§19.3 caminho A",
      "ordem": "estilo_primeiro",
      "prompt_montado": "traditional media, watercolor (medium), painterly, muted color, 1boy, solo, short hair, brown hair, blue jacket, standing, best quality, very aesthetic",
      "ordem_bate": false,
      "ordem_nota": "O manual escreve short brown hair numa tag só; a Oficina usa as duas tags separadas (short hair, brown hair), como o próprio armazém de tags manda, e põe a roupa antes da pose.",
      "prompt_oficial": "traditional media, watercolor (medium), painterly, muted color, 1boy, solo, standing, short brown hair, blue jacket, best quality, very aesthetic",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "trocar_estilo_b",
      "nome": "Trocar o estilo — caminho B (Traço e recolorização)",
      "familia": "retoque",
      "para_que": "Refazer só a cor, mantendo a forma exata do desenho.",
      "modelo_sugerido": "v45_full",
      "ferramenta": "Director Tools → Line Art, depois Colorize",
      "ajustes": {
        "colorize_prompt": "as cores que você quer"
      },
      "prompt_base": null,
      "tags_base": [],
      "preserva": "a forma exata do desenho; só a cor é refeita",
      "aviso": null,
      "origem": "§19.3 caminho B",
      "ordem": "padrao_manual",
      "prompt_montado": null,
      "ordem_bate": null,
      "ordem_nota": "Esta receita não monta prompt: ela é um caminho de ferramenta.",
      "prompt_oficial": null,
      "verificado": true,
      "verificado_nota": "O manual descreve este caminho em passos (§19.3 caminho B). Ele não tem prompt: é um caminho de ferramenta.",
      "prompt_da_oficina": null
    },
    {
      "id": "trocar_estilo_c",
      "nome": "Trocar o estilo — caminho C (Character Reference)",
      "familia": "retoque",
      "para_que": "Manter só o personagem e refazer pose e cena no estilo novo.",
      "modelo_sugerido": "v45_full",
      "ferramenta": "Character Reference",
      "ajustes": {
        "strength": "médio, para o estilo do prompt vencer"
      },
      "prompt_base": null,
      "tags_base": [],
      "preserva": "só o personagem — pose e cena são refeitas",
      "aviso": "Custa +5 Anlas por imagem de referência e só existe no V4.5.",
      "origem": "§19.3 caminho C",
      "ordem": "padrao_manual",
      "prompt_montado": null,
      "ordem_bate": null,
      "ordem_nota": "Esta receita não monta prompt: ela é um caminho de ferramenta.",
      "prompt_oficial": null,
      "verificado": true,
      "verificado_nota": "O manual descreve este caminho em passos (§19.3 caminho C). Ele não tem prompt: é um caminho de ferramenta.",
      "prompt_da_oficina": null
    },
    {
      "id": "trocar_pose",
      "nome": "Trocar a pose, mantendo o personagem",
      "familia": "retoque",
      "para_que": "Pôr o mesmo personagem numa pose nova.",
      "modelo_sugerido": "v45_full",
      "ferramenta": "Character Reference com Strength moderado",
      "ajustes": {
        "strength": "moderado — baixe até a pose nova aparecer"
      },
      "prompt_base": "1boy, solo, running, from side, outstretched arms, looking back, city street, night, best quality, very aesthetic",
      "tags_base": [
        "quem_1boy",
        "quem_solo",
        "pos_running",
        "ang_from_side",
        "pos_outstretched_arms",
        "pos_looking_back",
        "pai_city_street",
        "pai_night",
        "qua_best_quality",
        "aes_very_aesthetic"
      ],
      "aviso": "Strength alto copia a pose da referência junto — é exatamente o que você não quer aqui. Baixe até a pose nova aparecer.",
      "alternativa": "Para pose precisa, use o boneco 3D dentro do Canvas do site.",
      "origem": "§19.4 Técnica 1",
      "ordem": "padrao_manual",
      "prompt_montado": "1boy, solo, from side, running, outstretched arms, looking back, city street, night, best quality, very aesthetic",
      "ordem_bate": false,
      "ordem_nota": "A Oficina põe o ângulo (from side) antes da ação (running). O manual escreve ao contrário.",
      "prompt_oficial": "1boy, solo, running, from side, outstretched arms, looking back, city street, night, best quality, very aesthetic",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "roupa_consistente",
      "nome": "Roupa consistente — do vago ao completo",
      "familia": "personagem",
      "para_que": "Ver com os próprios olhos por que a roupa muda a cada tentativa, e como resolver.",
      "modelo_sugerido": "v45_full",
      "etapas": [
        {
          "rotulo": "Vago — sai uma roupa diferente a cada tentativa",
          "prompt": "witch hat, robe"
        },
        {
          "rotulo": "Melhor, com cor",
          "prompt": "witch hat, blue headwear, blue robe"
        },
        {
          "rotulo": "Completo, peça por peça",
          "prompt": "witch hat, blue headwear, blue cape, white shirt, long sleeves, corset, leather belt, leather pouch, short skirt, blue skirt, frilled skirt, black pantyhose, brown gloves, knee boots"
        }
      ],
      "tags_base": [
        "rou_witch_hat",
        "rou_blue_headwear",
        "rou_blue_cape",
        "rou_white_shirt",
        "rou_long_sleeves",
        "rou_corset",
        "rou_leather_belt",
        "rou_leather_pouch",
        "rou_short_skirt",
        "rou_blue_skirt",
        "rou_frilled_skirt",
        "rou_black_pantyhose",
        "rou_brown_gloves",
        "rou_knee_boots"
      ],
      "aviso": "Repare que blue robe virou blue cape na versão final: a IA gostava de acrescentar uma capa sozinha, então o manual assumiu isso no prompt em vez de lutar contra.",
      "origem": "§03 item 6 Evolução do exemplo oficial",
      "ordem": "padrao_manual",
      "prompt_montado": "witch hat, blue headwear, blue cape, white shirt, long sleeves, corset, short skirt, blue skirt, frilled skirt, black pantyhose, knee boots, leather belt, leather pouch, brown gloves",
      "ordem_bate": false,
      "ordem_nota": "A Oficina agrupa a roupa por parte do corpo: cabeça, tronco, pernas, calçado e acessório, nessa ordem. O manual escreve o cinto e a bolsa mais cedo. São as mesmas 14 peças.",
      "prompt_oficial": "witch hat, blue headwear, blue cape, white shirt, long sleeves, corset, leather belt, leather pouch, short skirt, blue skirt, frilled skirt, black pantyhose, brown gloves, knee boots",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "texto_na_imagem",
      "nome": "Duas falas na mesma imagem",
      "familia": "manga",
      "para_que": "Escrever texto dentro da imagem, sem balão desenhado.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "2girls, text, english text, park, cowboy shot, -1::speech bubble::, looking at another, best quality",
      "tags_base": [
        "quem_2girls",
        "esp_text",
        "esp_english_text",
        "pai_park",
        "enq_cowboy_shot",
        {
          "id": "esp_speech_bubble",
          "peso": {
            "tipo": "numerico",
            "valor": -1
          }
        },
        "pos_looking_at_another",
        "qua_best_quality"
      ],
      "bloco_texto": [
        "Aren't stochastic differential equations exciting?",
        "Is this about diffusion models again?"
      ],
      "aviso": "O -1::speech bubble:: é peso negativo, usado para evitar o balão desenhado e deixar só o texto. Peso negativo exige o modelo V4.5.",
      "nota": "Textos diferentes se separam por uma linha em branco. Cada texto até 120 caracteres.",
      "origem": "§13 Exemplo oficial",
      "textos": [
        "Aren't stochastic differential equations exciting?",
        "Is this about diffusion models again?"
      ],
      "exibir_como": "Text: Aren't stochastic differential equations exciting?\n\nIs this about diffusion models again?",
      "modelo_minimo": "v4.5",
      "ordem": "padrao_manual",
      "prompt_montado": "2girls, cowboy shot, looking at another, park, -1::speech bubble::, text, english text, best quality",
      "ordem_bate": false,
      "ordem_nota": "A Oficina agrupa por tipo: enquadramento, pose, lugar, e as tags especiais no fim. O peso negativo do balão (-1::speech bubble::) sai igual ao do manual.",
      "prompt_oficial": "2girls, text, english text, park, cowboy shot, -1::speech bubble::, looking at another, best quality",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "primeiro_prompt",
      "nome": "Primeiro prompt (o exemplo de introdução)",
      "familia": "basico",
      "para_que": "O exemplo mais simples do manual, para você ver a ordem funcionando.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "1girl, flower field, sunset, messy hair, brown hair, green eyes, from side, school uniform",
      "tags_base": [
        "quem_1girl",
        "pai_flower_field",
        "pai_sunset",
        "cab_messy_hair",
        "cab_brown_hair",
        "olh_green_eyes",
        "ang_from_side",
        "rou_school_uniform"
      ],
      "aviso": null,
      "origem": "§02 Exemplo do tutorial oficial de introdução",
      "ordem": "padrao_manual",
      "prompt_montado": "1girl, from side, messy hair, brown hair, green eyes, school uniform, flower field, sunset",
      "ordem_bate": false,
      "ordem_nota": "Este é o exemplo de introdução do manual, escrito na ordem em que a pessoa pensa. A Oficina o reordena e mostra o porquê de cada mudança — é exatamente para isso que a Régua de Ordem existe.",
      "prompt_oficial": "1girl, flower field, sunset, messy hair, brown hair, green eyes, from side, school uniform",
      "verificado": true,
      "verificado_nota": null,
      "prompt_da_oficina": null
    },
    {
      "id": "cenario_abatedouro_clandestino",
      "nome": "Abatedouro clandestino",
      "familia": "cenario",
      "para_que": "Gerar uma cena genérica de abatedouro/matadouro clandestino, industrial e abandonado — o tipo de cenário do Cap. 10. A prosa cita o abatedouro 24 vezes mas nunca descreve o interior dele (ver Imagens\\_Biblia_Visual\\INVENTARIO_VISUAL_DO_LIVRO.md, itens 'abatedouro' e §12). Por isso esta receita é um PONTO DE PARTIDA genérico, não o retrato oficial da cena do livro — ela não inventa aparência que o texto não deu.",
      "modelo_sugerido": "v45_full",
      "prompt_base": "no humans, warehouse, abandoned, industrial, dirty, rust, hook, chain, meat, blood on ground, veins, ceiling light, grey theme, glowing",
      "tags_base": [
        "pai_no_humans",
        "pai_warehouse",
        "con_abandoned",
        "con_industrial",
        "mat_dirty",
        "obj_rust",
        "obj_hook",
        "obj_chain",
        "com_meat",
        "obj_blood_on_ground",
        "cri_veins",
        "con_ceiling_light",
        "est_grey_theme",
        "est_glowing"
      ],
      "aviso": "Não existe tag de metal cru no Danbooru/NovelAI (nem 'metal', nem 'steel', nem 'iron' — ver CONTRATO.md seção 1). Decisão D9 do autor: aceitar a falta e cobrir por outro caminho — brilho (glowing), veios (veins, que valem para carcaça pendurada, não só para bicho vivo) e cor (grey theme). Nenhuma tag desta receita vem do manual do NovelAI: ele não tem receita de abatedouro. Todas vêm do acervo criado em 27/08/2026 a partir do Danbooru, e continuam 'verificada: false' cada uma — a ficha de cada tag já mostra o aviso amarelo na tela.",
      "origem": "Oficina — combinação montada pelo Construtor A a partir de tags já existentes no acervo, a pedido do autor (decisão D9, REFERENCIAS_COAUTOR_fafa8949.md). Base de lore: Imagens\\_Biblia_Visual\\INVENTARIO_VISUAL_DO_LIVRO.md ('abatedouro', 24 menções em C10, e §12 — 'nunca mostrado por dentro').",
      "ordem": "padrao_manual",
      "prompt_montado": "veins, hook, chain, meat, blood on ground, no humans, warehouse, abandoned, industrial, dirty, rust, ceiling light, grey theme, glowing",
      "ordem_bate": null,
      "ordem_nota": "Não há prompt do manual para comparar — esta receita não vem dele. O prompt_montado é o que os baldes de cada tag realmente produzem (veins = 10; hook, chain, meat, blood on ground = 68; no humans, warehouse, abandoned, industrial, dirty, rust, ceiling light = 80; grey theme = 90; glowing = 95), calculado a partir do campo ordem de cada tag no acervo, com empate mantendo a ordem em que a Oficina escreveu (regra da seção 7 do CONTRATO.md).",
      "prompt_oficial": null,
      "verificado": false,
      "verificado_nota": "O manual do NovelAI não tem receita de abatedouro nem de cenário de matadouro. Todas as 14 tags vêm do acervo criado a partir do Danbooru em 27/08/2026 (todas 'verificada: false'), e a combinação em si é escolha da Oficina, não do manual.",
      "prompt_da_oficina": "no humans, warehouse, abandoned, industrial, dirty, rust, hook, chain, meat, blood on ground, veins, ceiling light, grey theme, glowing"
    }
  ],
  "mudou_em": "2026-08-27 (D9): nasce a receita cenario_abatedouro_clandestino, primeira da família nova 'cenario' — 14 tags já existentes no acervo, nenhuma do manual. Ver CONTRATO.md seção 1 e aviso da própria receita.",
  "nota_prefixo_texto": "Nenhum campo deste arquivo carrega o prefixo Text:. Quem o põe é o motor da tela (Motor.blocoTexto). Os campos textos e bloco_texto trazem só a fala. Para MOSTRAR na tela com o prefixo, use exibir_como.",
  "nota_verificado": "verificado = true quer dizer que as tags e o arranjo desta receita vêm do manual. false quer dizer que a Oficina montou o prompt. Quando é false, prompt_oficial é nulo e o texto fica em prompt_da_oficina. A tela tem de dizer isso ao autor — o campo verificado_nota já traz a frase pronta."
}
;
