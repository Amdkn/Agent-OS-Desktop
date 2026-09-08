@echo off
REM Lanceur de Life OS 2026 local sur port 4444
setlocal
set PORT=4444
set SYS=%SystemRoot%\System32
cd /d "C:\Users\amado\vps-archive-2026-06-17\srv\aspace\web\Life-OS-2026"
%SYS%\netstat.exe -ano | %SYS%\findstr.exe /C:":%PORT%" | %SYS%\findstr.exe /C:"LISTENING" >nul 2>&1
if %ERRORLEVEL%==0 ( echo Life OS repond deja sur %PORT%. & exit /b 0 )
echo Demarrage de Life OS sur %PORT% ...
start "life-os" /min cmd /c "npm run dev > dev.log 2>&1"
exit /b 0
