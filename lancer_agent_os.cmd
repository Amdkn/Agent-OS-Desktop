@echo off
REM Lanceur en un clic d'Agent OS — cible du raccourci du Bureau.
REM
REM Ce qu'il fait :
REM   1. si le serveur repond deja sur 5555, il ouvre simplement le navigateur
REM      (relancer un Vite sur un port pris echouerait, strictPort etant vrai) ;
REM   2. sinon il demarre Vite en arriere-plan, attend qu'il ecoute, puis ouvre.
REM
REM Le port est declare dans vite.config.ts. Le changer ici seul ne suffirait
REM pas — les deux doivent rester d'accord.
REM
REM PIEGE PAYE ICI : lance depuis un shell qui a Git Bash dans son PATH,
REM `timeout` resout vers la version GNU (« invalid time interval /t ») et non
REM vers celle de Windows. Meme famille que le piege du PATH documente dans le
REM canon du poste. D'ou les chemins absolus vers System32 ci-dessous.
setlocal
set PORT=5555
set URL=http://127.0.0.1:%PORT%/
set SYS=%SystemRoot%\System32
cd /d "%~dp0"

REM Le serveur tourne-t-il deja ? On teste le PORT, pas la presence d'un
REM processus node : il y en a toujours plusieurs et aucun ne prouve rien.
%SYS%\netstat.exe -ano | %SYS%\findstr.exe /C:"127.0.0.1:%PORT%" | %SYS%\findstr.exe /C:"LISTENING" >nul 2>&1
if %ERRORLEVEL%==0 (
    echo Agent OS repond deja sur %PORT%.
    start "" "%URL%"
    exit /b 0
)

echo Demarrage d'Agent OS sur %PORT% ...
start "agent-os" /min cmd /c "npm run dev > dev.log 2>&1"

REM Attente active bornee : jusqu'a 60 secondes, un test par seconde.
REM Sans borne, un echec de build laisserait la fenetre ouverte pour rien.
for /l %%i in (1,1,60) do (
    %SYS%\ping.exe -n 2 127.0.0.1 >nul 2>&1
    %SYS%\netstat.exe -ano | %SYS%\findstr.exe /C:"127.0.0.1:%PORT%" | %SYS%\findstr.exe /C:"LISTENING" >nul 2>&1
    if not errorlevel 1 (
        start "" "%URL%"
        exit /b 0
    )
)

echo Agent OS n'ecoute toujours pas sur %PORT% apres 60 s.
echo Voir le journal : "%~dp0dev.log"
pause
exit /b 1
