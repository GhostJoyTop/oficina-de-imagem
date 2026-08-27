# -*- coding: utf-8 -*-
#
# Cria o atalho que faz a Oficina de Imagem ligar sozinha quando o Windows
# liga. Chamado so pelo instalador ("LIGAR A OFICINA SEMPRE - instalar.bat").
#
# O que faz, e nada alem disso: guarda UM atalho (.lnk) na pasta de
# Inicializacao do proprio Windows, apontando para o
# "LIGAR A OFICINA SEM JANELA.vbs" desta pasta. Nao instala nada, nao baixa
# nada, nao mexe em nenhum outro programa.

$ErrorActionPreference = "Stop"

$pastaDaFerramenta = Split-Path -Parent $PSScriptRoot
$alvo = Join-Path $pastaDaFerramenta "LIGAR A OFICINA SEM JANELA.vbs"
$pastaDeInicio = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$atalho = Join-Path $pastaDeInicio "Oficina de Imagem.lnk"

if (-not (Test-Path $alvo)) {
    Write-Output "ERRO: nao encontrei $alvo"
    exit 1
}

$shell = New-Object -ComObject WScript.Shell
$s = $shell.CreateShortcut($atalho)
$s.TargetPath = "wscript.exe"
$s.Arguments = '"' + $alvo + '"'
$s.WorkingDirectory = $pastaDaFerramenta
$s.Description = "Liga a Oficina de Imagem em segundo plano, sem janela, quando o Windows inicia."
$s.Save()

Write-Output "OK: $atalho"
