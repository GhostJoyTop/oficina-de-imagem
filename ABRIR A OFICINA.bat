@echo off
rem ===========================================================================
rem  OFICINA DE IMAGEM - o arquivo dos dois cliques.
rem
rem  Voce pode abrir este arquivo no Bloco de Notas e ler tudo o que ele faz.
rem  Ele e texto puro. Nao instala nada, nao baixa nada, nao muda nada no seu
rem  Windows. So liga a oficina e abre o seu navegador.
rem
rem  O que cada passo faz esta escrito ao lado dele.
rem ===========================================================================

rem  chcp 65001 liga a codificacao de texto que entende acento. Sem isso, o
rem  caminho "OneDrive - ANEEL" e as palavras com acento chegam corrompidos.
chcp 65001 >nul 2>&1

title OFICINA DE IMAGEM - nao feche esta janela

rem  Vai para a pasta onde ESTE arquivo esta, seja ela qual for. E o que faz a
rem  oficina funcionar mesmo com espaco e acento no caminho.
cd /d "%~dp0"

echo.
echo   ==========================================================
echo    OFICINA DE IMAGEM
echo    Ligando... nao feche esta janela.
echo   ==========================================================
echo.

rem  ---------------------------------------------------------------------
rem  Antes de tudo: o programa da ponte esta mesmo aqui?
rem  Sem esta conferencia, o Python reclamaria em ingles, com um monte de
rem  linha tecnica, e voce nao saberia o que fazer.
rem  ---------------------------------------------------------------------

if not exist "ponte\servidor.py" (
  echo   Falta um pedaco da oficina: nao encontrei o arquivo
  echo       ponte\servidor.py
  echo.
  echo   Isso quer dizer que a pasta foi copiada pela metade.
  echo.
  if exist "Oficina.html" (
    echo   Vou abrir a oficina assim mesmo, no modo simples. As tags, as
    echo   explicacoes, os desenhos e o botao Copiar prompt funcionam.
    echo   So nao da para salvar no disco: use o botao "Baixar meu trabalho"
    echo   antes de fechar a aba.
    echo.
    start "" "Oficina.html"
  ) else (
    echo   O arquivo Oficina.html tambem nao esta aqui, entao nao ha o que
    echo   abrir. Copie a pasta Oficina_de_Imagem inteira de novo.
    echo.
  )
  pause
  goto :eof
)

rem  ---------------------------------------------------------------------
rem  Procura o Python em tres lugares, nesta ordem.
rem  ---------------------------------------------------------------------

py -3 -c "pass" >nul 2>&1
if not errorlevel 1 goto usar_py

python -c "pass" >nul 2>&1
if not errorlevel 1 goto usar_python

set "PYTHON_FIXO=C:\Users\carlo\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if exist "%PYTHON_FIXO%" goto usar_fixo

goto sem_python

:usar_py
py -3 "ponte\servidor.py" %*
goto fim

:usar_python
python "ponte\servidor.py" %*
goto fim

:usar_fixo
"%PYTHON_FIXO%" "ponte\servidor.py" %*
goto fim

rem  ---------------------------------------------------------------------
rem  Sem Python: a oficina abre assim mesmo, no modo simples.
rem  ---------------------------------------------------------------------

:sem_python
echo   Este computador nao tem o Python, e e ele que salva no disco.
echo.
echo   Vou abrir a oficina no MODO SIMPLES. Tudo funciona: as tags, as
echo   explicacoes, os desenhos, a ordem das tags e o botao Copiar prompt,
echo   que e o caminho normal de trabalho.
echo.
echo   O que voce perde no modo simples:
echo     - salvar o seu trabalho no disco. Ele fica so na memoria do
echo       navegador, e a propria tela avisa isso o tempo todo. Use o botao
echo       "Baixar meu trabalho" antes de fechar a aba;
echo     - arrastar imagem para dentro da oficina;
echo     - gerar imagem aqui dentro.
echo.
echo   NAO adianta dar dois cliques neste arquivo de novo: foi ele que abriu
echo   a oficina assim, e o modo simples e o melhor que da sem o Python.
echo.
if exist "Oficina.html" (
  start "" "Oficina.html"
) else (
  echo   E tem outro problema: o arquivo Oficina.html nao esta nesta pasta.
  echo   A oficina foi copiada pela metade. Copie a pasta Oficina_de_Imagem
  echo   inteira de novo.
  echo.
)
echo   Feche esta janela quando terminar de ler.
echo.
pause
goto :eof

rem  ---------------------------------------------------------------------
rem  Fim. A janela FICA ABERTA em todo caminho que tem mensagem para ler.
rem  Janela que pisca e some e o pior jeito de falhar: nao deixa pista.
rem
rem  Os numeros abaixo sao combinados com ponte\servidor.py (procure por
rem  SAIU_PORQUE_JA_ESTAVA_ABERTA la dentro). A ordem tem de ser do MAIOR para
rem  o menor: "if errorlevel 7" quer dizer "7 ou mais", nao "igual a 7".
rem  ---------------------------------------------------------------------

:fim
if errorlevel 7 goto ja_estava_aberta
if errorlevel 1 goto parou_com_erro
goto :eof

rem  A mensagem inteira ja foi escrita acima, pelo proprio programa. Aqui so
rem  seguramos a janela aberta ate voce ler: sem o pause ela sumiria no mesmo
rem  instante, e janela que pisca e some nao deixa pista nenhuma.
:ja_estava_aberta
echo.
pause
goto :eof

:parou_com_erro
echo.
echo   ==========================================================
echo    A oficina parou. A mensagem acima diz o motivo.
echo   ==========================================================
echo.
echo   Se a mensagem nao ajudar, tente isto, nesta ordem:
echo     1. Feche esta janela e de dois cliques no arquivo de novo.
echo     2. Reinicie o computador e tente mais uma vez.
echo     3. Abra o arquivo Oficina.html com dois cliques. A oficina
echo        funciona sem esta janela, so nao salva no disco.
echo.
pause
goto :eof
