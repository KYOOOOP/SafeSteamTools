@echo off
REM SafeSteamTools Windows Executable Builder
REM This script builds SafeSteamTools.exe from source

echo SafeSteamTools Windows Executable Builder
echo =========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

REM Build backend
echo Building backend...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)

REM Install pkg globally
echo Installing pkg...
npm install -g pkg
if %errorlevel% neq 0 (
    echo ERROR: Failed to install pkg
    pause
    exit /b 1
)

REM Create executable
echo Creating Windows executable...
pkg package.json --targets node18-win-x64 --output ../SafeSteamTools.exe
if %errorlevel% neq 0 (
    echo ERROR: Failed to create executable
    pause
    exit /b 1
)

cd ..

REM Check if executable was created
if not exist SafeSteamTools.exe (
    echo ERROR: SafeSteamTools.exe was not created
    pause
    exit /b 1
)

echo.
echo SUCCESS: SafeSteamTools.exe created successfully!
echo File size:
for %%f in (SafeSteamTools.exe) do echo %%~zf bytes

echo.
echo Next steps:
echo 1. Copy .env.example to .env
echo 2. Edit .env and add your Steam API key
echo 3. Run SafeSteamTools.exe
echo 4. Open http://localhost:3001 in your browser

echo.
echo Get your Steam API key at: https://steamcommunity.com/dev/apikey

echo.
echo Press any key to exit...
pause >nul