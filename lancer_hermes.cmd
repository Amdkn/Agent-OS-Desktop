@echo off
cd /d C:\Users\amado\hermes-workspace
start /b "" powershell -ExecutionPolicy Bypass -File .\start-hermes.ps1
npx.cmd vite dev --host 127.0.0.1 --port 3000 --strictPort

