@echo off

cd /d "%~dp0"

:: Перейти в родительскую папку
cd ..

:: Вывести текущую директорию для проверки
echo Current directory: %cd%

:: Launch the backend server in the background
echo Launching Backend...
start /b cmd /c "node backend\server.js"

:: Launch the frontend server in the background
echo Launching Frontend...
cd frontend\html
start /b cmd /c "npx http-server"

:: Open the frontend in the default browser
echo Opening Frontend in Default Browser...
start http://127.0.0.1:8080/index.html

:: Automatically close the batch script
exit
