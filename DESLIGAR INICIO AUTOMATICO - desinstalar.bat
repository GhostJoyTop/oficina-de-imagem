@echo off
rem ===========================================================================
rem  DESLIGA O INICIO AUTOMATICO E PARA A OFICINA QUE ESTA EM SEGUNDO PLANO.
rem
rem  Dois cliques aqui:
rem    1. tira o atalho da pasta de Inicializacao do Windows - a oficina
rem       deixa de ligar sozinha quando voce entra no Windows;
rem    2. desliga a oficina que estiver rodando agora em segundo plano.
rem
rem  Se voce tiver a janela preta comum aberta (por ter usado
rem  "ABRIR A OFICINA.bat" na mao), essa janela NAO e afetada - feche-a como
rem  sempre fez, fechando a propria janela.
rem ===========================================================================

chcp 65001 >nul 2>&1
title DESLIGANDO O INICIO AUTOMATICO DA OFICINA
cd /d "%~dp0"

echo.
echo   ==========================================================
echo    OFICINA DE IMAGEM - desligar o inicio automatico
echo   ==========================================================
echo.
echo   Tirando o atalho de inicio automatico...
del /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Oficina de Imagem.lnk" >nul 2>&1

echo   Parando a oficina que estiver em segundo plano...
powershell -NoProfile -ExecutionPolicy Bypass -File "ponte\parar_segundo_plano.ps1"

echo.
echo   ==========================================================
echo    PRONTO.
echo   ==========================================================
echo.
echo   A oficina nao liga mais sozinha, e a copia que estava em segundo
echo   plano foi desligada.
echo.
echo   Para voltar a usar a oficina, de dois cliques em
echo       ABRIR A OFICINA.bat
echo   (o de sempre, com a janela preta) ou em
echo       LIGAR A OFICINA SEMPRE - instalar.bat
echo   (se quiser ligar o modo sem janela de novo).
echo.
pause
