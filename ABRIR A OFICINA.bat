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
echo   Nao encontrei o Python neste computador.
echo.
echo   Vou abrir a oficina no MODO SIMPLES. Tudo funciona: as tags, as
echo   explicacoes, os desenhos, a ordem das tags e o botao Copiar prompt.
echo.
echo   O que voce perde no modo simples:
echo     - salvar o seu trabalho no disco (ele fica so na memoria do
echo       navegador, e a propria tela avisa isso o tempo todo);
echo     - arrastar imagem para dentro da oficina;
echo     - gerar imagem aqui dentro.
echo.
echo   Nada disso impede voce de trabalhar: monte o prompt, clique em
echo   Copiar, e cole no site do NovelAI.
echo.
if exist "Oficina.html" (
  start "" "Oficina.html"
) else (
  echo   E tem outro problema: o arquivo Oficina.html nao esta nesta pasta.
  echo   A oficina foi copiada pela metade.
  echo.
)
echo   Feche esta janela quando terminar de ler.
echo.
pause
goto :eof

rem  ---------------------------------------------------------------------
rem  Fim. Se o programa parou com erro, a janela FICA ABERTA com a mensagem.
rem  Janela que pisca e some e o pior jeito de falhar: nao deixa pista.
rem  ---------------------------------------------------------------------

:fim
if errorlevel 1 (
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
)
goto :eof
