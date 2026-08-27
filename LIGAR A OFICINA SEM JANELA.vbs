' ===========================================================================
'  LIGAR A OFICINA SEM JANELA
'
'  Dois cliques aqui (ou deixe o Windows fazer isso sozinho, se voce instalou
'  o inicio automatico) e a Oficina liga em segundo plano - nenhuma janela
'  preta aparece na tela.
'
'  Para saber se ela pegou, espere uns 5 segundos e de dois cliques em
'      ABRIR A OFICINA NO NAVEGADOR.url
'  Ou abra o arquivo de registro, dentro desta mesma pasta:
'      oficina_em_segundo_plano.log
'
'  Dar um clique aqui de novo NAO abre uma segunda oficina: o programa que
'  este arquivo chama confere sozinho se ja existe uma rodando.
' ===========================================================================

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
pasta = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = pasta
shell.Run """" & pasta & "\ponte\vigia_silenciosa.bat""", 0, False
