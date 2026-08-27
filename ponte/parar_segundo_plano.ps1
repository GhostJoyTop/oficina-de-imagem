# -*- coding: utf-8 -*-
#
# Para a Oficina de Imagem que estiver rodando SEM janela (a que a vigia
# ligou), e a propria vigia, se estiver religando. Chamado so pelo
# desinstalador ("DESLIGAR INICIO AUTOMATICO - desinstalar.bat").
#
# Nunca mexe em outro programa: so encerra processo cuja linha de comando
# aponta para o servidor.py DESTA MESMA PASTA, ligado com --sem-navegador -
# que e a marca de que foi a vigia quem o ligou, e nao a janela preta manual.

$pastaDaFerramenta = Split-Path -Parent $PSScriptRoot
$alvoServidor = Join-Path $pastaDaFerramenta "ponte\servidor.py"

$parouAlgo = $false

$processosDaOficina = Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($alvoServidor) -and $_.CommandLine.Contains('--sem-navegador') }

foreach ($p in $processosDaOficina) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Output "Parada a oficina em segundo plano: processo $($p.ProcessId)"
    $parouAlgo = $true
}

# A janela da vigia (o "vigia_silenciosa.bat" que fica religando) tambem tem
# que parar - senao ela liga a oficina de novo em 5 segundos.
$vigias = Get-CimInstance Win32_Process -Filter "Name = 'cmd.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains('vigia_silenciosa.bat') }

foreach ($v in $vigias) {
    Stop-Process -Id $v.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Output "Parada a vigia: processo $($v.ProcessId)"
    $parouAlgo = $true
}

if (-not $parouAlgo) {
    Write-Output "Nao encontrei nada da oficina rodando em segundo plano."
}
