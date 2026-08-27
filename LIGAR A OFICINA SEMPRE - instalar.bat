@echo off
rem ===========================================================================
rem  LIGA A OFICINA AGORA, E O WINDOWS FAZ ISSO SOZINHO DAQUI PARA FRENTE.
rem
rem  Dois cliques aqui:
rem    1. liga a oficina agora mesmo, em segundo plano - nenhuma janela preta
rem       aparece;
rem    2. guarda um atalho na pasta de Inicializacao do Windows, para a
rem       oficina ligar sozinha toda vez que voce entrar no Windows.
rem
rem  So mexe nesta pasta e num lugar do proprio Windows feito exatamente para
rem  isso (a pasta de Inicializacao). Nao instala nenhum programa novo, nao
rem  baixa nada da internet. Para desfazer tudo isto, use
rem      "DESLIGAR INICIO AUTOMATICO - desinstalar.bat"
rem ===========================================================================

chcp 65001 >nul 2>&1
title INSTALANDO O INICIO AUTOMATICO DA OFICINA
cd /d "%~dp0"

echo.
echo   ==========================================================
echo    OFICINA DE IMAGEM - ligar sempre
echo   ==========================================================
echo.
echo   Ligando a oficina agora, em segundo plano...
wscript.exe "LIGAR A OFICINA SEM JANELA.vbs"

echo   Guardando o atalho de inicio automatico do Windows...
powershell -NoProfile -ExecutionPolicy Bypass -File "ponte\criar_atalho_inicio.ps1"

if errorlevel 1 (
  echo.
  echo   Nao consegui guardar o atalho de inicio automatico. A oficina esta
  echo   ligada agora mesmo, mas depois de reiniciar o computador voce vai
  echo   precisar clicar aqui de novo.
  echo.
  pause
  goto :eof
)

echo.
echo   ==========================================================
echo    PRONTO.
echo   ==========================================================
echo.
echo   A oficina esta ligada agora, em segundo plano, sem janela preta.
echo   Da proxima vez que voce ligar o computador, ela liga sozinha - voce
echo   nao precisa mais clicar em nada para isso.
echo.
echo   Se ela cair por algum motivo, a propria vigia religa sozinha em
echo   5 segundos. Voce nao vai ver isso acontecer.
echo.
echo   PARA USAR NO DIA A DIA: de dois cliques em
echo       ABRIR A OFICINA NO NAVEGADOR.url
echo.
echo   PARA DESLIGAR ESSE INICIO AUTOMATICO: de dois cliques em
echo       DESLIGAR INICIO AUTOMATICO - desinstalar.bat
echo.
pause
