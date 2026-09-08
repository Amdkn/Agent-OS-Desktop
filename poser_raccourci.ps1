# Pose le raccourci « Agent OS » sur le Bureau.
#
# ATTENTION : fichier en ASCII pur. PowerShell 5.1 lit les .ps1 en
# Windows-1252 ; un caractere accentue UTF-8 y devient plusieurs octets et
# casse le parseur des dizaines de lignes plus bas. Piege deja paye sur ce
# poste (wsl-gardien.ps1, relais-gardien.ps1).
#
# A relancer si le raccourci est supprime ou si le chemin du projet change.

$ErrorActionPreference = 'Stop'

$cible   = Join-Path $PSScriptRoot 'lancer_agent_os.cmd'
$bureau  = [Environment]::GetFolderPath('Desktop')
$lien    = Join-Path $bureau 'Agent OS.lnk'

if (-not (Test-Path -LiteralPath $cible)) {
    throw "Lanceur introuvable : $cible"
}

$shell = New-Object -ComObject WScript.Shell
$r = $shell.CreateShortcut($lien)
$r.TargetPath       = $cible
$r.WorkingDirectory = $PSScriptRoot
$r.Description      = 'Demarre Agent OS sur 127.0.0.1:5555 et ouvre le navigateur'
# La fenetre console n'a rien a montrer en usage normal : elle sert seulement
# quand le demarrage echoue, et le lanceur fait alors un `pause`.
$r.WindowStyle      = 7   # 7 = reduite
# shell32.dll 14 = ecran/moniteur. Aucune icone propre n'existe dans le projet.
$r.IconLocation     = "$env:SystemRoot\System32\shell32.dll,14"
$r.Save()

if (Test-Path -LiteralPath $lien) {
    "raccourci pose : $lien"
    "  cible  : $cible"
} else {
    throw "La creation du raccourci n'a rien produit."
}
