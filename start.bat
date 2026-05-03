@echo off
echo =========================================
echo   Avvio Ambiente Sviluppo - EVEN G2
echo =========================================
echo.

echo Sto chiudendo processi residui (Vite e Simulatore)...
:: Chiude Vite (porta 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
:: Chiude il Simulatore se rimasto aperto
taskkill /f /im evenhub-simulator.exe >nul 2>&1
:: Chiude Node se necessario (opzionale, ma aiuta la pulizia)
:: taskkill /f /im node.exe >nul 2>&1

echo.
echo Avvio del server web (Vite)...
start cmd /k "npm run dev"

echo.
echo Attendo che il server sia pronto (5 secondi)...
timeout /t 5 /nobreak > NUL

echo.
echo Avvio del simulatore EvenHub...
:: Lanciamo il simulatore in una nuova finestra
start cmd /k "evenhub-simulator http://localhost:5173"

echo.
echo =========================================
echo  FATTO! Se il simulatore non appare:
echo  1. Controlla la barra delle applicazioni.
echo  2. Assicurati che non ci siano errori nella finestra di Vite.
echo =========================================
pause
