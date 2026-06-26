@echo off
title Servidor Local Sagaflix (React)
color 0A
echo ===================================================
echo Iniciando o Servidor Local da Sagaflix...
echo ===================================================
echo.
echo O navegador devera abrir automaticamente.
echo Para desligar o servidor depois, basta fechar esta janela preta.
echo.
cd /d "%~dp0"
call npm run dev
pause
