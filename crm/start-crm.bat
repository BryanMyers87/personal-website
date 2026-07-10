@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo ============================================================
    echo  Node.js isn't installed yet. One-time setup:
    echo  1. Go to https://nodejs.org
    echo  2. Download and run the installer marked "LTS"
    echo  3. Click Next through all the defaults, then Finish
    echo  4. Come back here and double-click this file again
    echo ============================================================
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing the app for the first time - this can take a few minutes, please wait...
    call npm install
)

echo Setting up the database...
call npx prisma migrate deploy

echo Starting the CRM in a new window...
start "Inflate AI CRM - leave this window open while you use the CRM" cmd /k "npm run dev"

echo Waiting for it to start...
timeout /t 6 /nobreak >nul

start "" http://localhost:3000/analytics

echo.
echo Done! Your browser should now be open to the CRM.
echo A window titled "Inflate AI CRM" is running the app in the background -
echo leave that window open while you work. Closing it stops the CRM.
echo You can close THIS window now.
echo.
pause
