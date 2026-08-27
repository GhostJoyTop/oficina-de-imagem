@echo off
rem ===========================================================================
rem  VIGIA SILENCIOSA - mantem a Oficina ligada sozinha, sem janela nenhuma.
rem
rem  Ninguem ve esta janela: quem chama este arquivo e o
rem  "LIGAR A OFICINA SEM JANELA.vbs", que a esconde. Tudo que apareceria na
rem  janela preta normal vai para o arquivo de registro, uma pasta acima:
rem      oficina_em_segundo_plano.log
rem
rem  O que ela faz, em uma frase: liga a oficina; se a oficina parar sozinha
rem  por qualquer motivo (erro nao previsto, queda), espera 5 segundos e liga
rem  de novo. Sozinha, sem voce precisar notar nem clicar em nada.
rem
rem  Para desligar de vez (parar a vigia e a oficina, e tirar o inicio
rem  automatico do Windows), use:
rem      "DESLIGAR INICIO AUTOMATICO - desinstalar.bat"
rem ===========================================================================

chcp 65001 >nul 2>&1
cd /d "%~dp0.."

set "REGISTRO=oficina_em_segundo_plano.log"

rem  Um respiro antes da primeira tentativa. Quando o Windows acaba de ligar,
rem  o OneDrive pode ainda estar baixando os arquivos desta pasta - sem este
rem  respiro, a primeira tentativa podia falhar por um problema que se
rem  resolve sozinho dez segundos depois.
timeout /t 5 /nobreak >nul

py -3 -c "pass" >nul 2>&1
if not errorlevel 1 goto usar_py

python -c "pass" >nul 2>&1
if not errorlevel 1 goto usar_python

set "PYTHON_FIXO=C:\Users\carlo\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if exist "%PYTHON_FIXO%" goto usar_fixo

echo %date% %time% - Python nao encontrado. A vigia nao consegue ligar a oficina. >> "%REGISTRO%"
goto :eof

:usar_py
set "PY=py -3"
goto ligar

:usar_python
set "PY=python"
goto ligar

:usar_fixo
set "PY=%PYTHON_FIXO%"
goto ligar

:ligar
echo. >> "%REGISTRO%"
echo ==== %date% %time% - ligando a oficina em segundo plano ==== >> "%REGISTRO%"
%PY% "ponte\servidor.py" --sem-navegador >> "%REGISTRO%" 2>&1

rem  Codigo 7 quer dizer "ja tinha uma oficina desta pasta aberta" - nao foi
rem  uma queda, foi outra copia (a vigia de uma sessao anterior, ou o atalho
rem  manual) chegando primeiro. Quem ja esta de pe manda; esta vigia para aqui
rem  em vez de brigar por porta para sempre.
if errorlevel 7 (
  echo %date% %time% - ja havia uma oficina rodando; esta vigia para aqui. >> "%REGISTRO%"
  goto :eof
)

echo %date% %time% - a oficina parou ^(codigo %errorlevel%^). Religando em 5s. >> "%REGISTRO%"
timeout /t 5 /nobreak >nul
goto ligar
