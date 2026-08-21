window.OFICINA_RECEITAS =
{
  "versao_formato": "1.0.0",
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
      "origem": "§04 Combinações prontas"
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
      "origem": "§04 Combinações prontas"
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
        "epo_year_xxxx",
        "est_limited_palette",
        "quem_1girl",
        "pos_standing",
        "pai_forest",
        "qua_best_quality"
      ],
      "troque": "O assunto, e o ano em year 1998.",
      "aviso": "A tag year XXXX precisa de um ano de verdade. Neste exemplo oficial o ano é 1998.",
      "origem": "§04 Combinações prontas"
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
      "origem": "§04 Combinações prontas"
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
          "prompt": "Text: I'm not going back.",
          "tags": []
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
      "origem": "§19.7 Modelo de quadro de mangá + passo a passo"
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
      "origem": "§08 e §19.2 callout A referência mais flexível"
    },
    {
      "id": "prancha_personagem",
      "nome": "Prancha de personagem (uma vista)",
      "familia": "referencia",
      "para_que": "Gerar a imagem de referência ideal: corpo inteiro, de pé, pose neutra, fundo simples.",
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
      "aviso": "Gere numa das três resoluções nativas: 1024×1536, 1472×1472 ou 1536×1024.",
      "origem": "§08 Como preparar a imagem de referência + §19.2"
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
      "origem": "§19.3 caminho A"
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
      "origem": "§19.3 caminho B"
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
      "origem": "§19.3 caminho C"
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
      "origem": "§19.4 Técnica 1"
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
      "origem": "§03 item 6 Evolução do exemplo oficial"
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
        "esp_speech_bubble",
        "pos_looking_at_another",
        "qua_best_quality"
      ],
      "bloco_texto": "Text: Aren't stochastic differential equations exciting?\n\nIs this about diffusion models again?",
      "aviso": "O -1::speech bubble:: é peso negativo, para evitar o balão desenhado e deixar só o texto. Peso negativo exige V4.5.",
      "nota": "Textos diferentes se separam por uma linha em branco. Cada texto até 120 caracteres.",
      "origem": "§13 Exemplo oficial"
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
      "origem": "§02 Exemplo do tutorial oficial de introdução"
    }
  ]
}
;
