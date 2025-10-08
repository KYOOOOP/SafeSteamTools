@echo off
REM SafeSteamTools Windows Release Creator
REM This batch file creates a Windows release with security scanning

echo SafeSteamTools Windows Release Creator
echo =====================================
echo.

set VERSION=%1
if "%VERSION%"=="" set VERSION=1.0.0

echo Building version: %VERSION%
echo.

REM Create directories
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
mkdir dist
mkdir release

echo Step 1: Dependency scanning...
npm audit --audit-level high
if errorlevel 1 (
    echo ERROR: High/critical vulnerabilities found!
    pause
    exit /b 1
)
echo ✅ Dependencies clean

echo.
echo Step 2: Building backend...
cd backend
npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
cd ..
echo ✅ Backend built

echo.
echo Step 3: Creating Windows executable...
cd backend
pkg package.json --targets node18-win-x64 --output ../dist/SafeSteamTools.exe
if errorlevel 1 (
    echo ERROR: Failed to create executable!
    pause
    exit /b 1
)
cd ..
echo ✅ Executable created

REM Check if Windows Defender is available
echo.
echo Step 4: Security scanning...
where /q powershell
if %errorlevel% == 0 (
    echo Running Windows Defender scan...
    powershell -Command "Start-MpScan -ScanType CustomScan -ScanPath '.\dist\SafeSteamTools.exe'"
    if errorlevel 1 (
        echo WARNING: Windows Defender scan failed or found threats!
        echo Please scan manually before distribution.
        pause
    ) else (
        echo ✅ Windows Defender scan passed
    )
) else (
    echo WARNING: PowerShell not available for security scanning
    echo Please scan SafeSteamTools.exe with antivirus before distribution
)

REM Package release
echo.
echo Step 5: Packaging release...
copy dist\SafeSteamTools.exe release\
copy README.md release\
copy LICENSE release\
copy .env.example release\

REM Create installation script
echo @echo off > release\INSTALL.bat
echo echo SafeSteamTools Setup >> release\INSTALL.bat
echo echo =================== >> release\INSTALL.bat
echo echo. >> release\INSTALL.bat
echo echo 1. Get Steam API key: https://steamcommunity.com/dev/apikey >> release\INSTALL.bat
echo echo 2. Copy .env.example to .env >> release\INSTALL.bat
echo echo 3. Edit .env and add your Steam API key >> release\INSTALL.bat
echo echo 4. Run SafeSteamTools.exe >> release\INSTALL.bat
echo echo. >> release\INSTALL.bat
echo if not exist .env copy .env.example .env >> release\INSTALL.bat
echo echo Press any key to continue... >> release\INSTALL.bat
echo pause ^>nul >> release\INSTALL.bat

REM Create ZIP archive
cd release
where /q powershell
if %errorlevel% == 0 (
    powershell -Command "Compress-Archive -Path * -DestinationPath SafeSteamTools-v%VERSION%-windows.zip"
    echo ✅ Release archive created
) else (
    echo WARNING: PowerShell not available for ZIP creation
    echo Please manually create ZIP archive from release folder
)

REM Generate checksums
where /q certutil
if %errorlevel% == 0 (
    echo.
    echo Generating SHA256 checksums...
    for %%f in (*.*) do (
        if not "%%f"=="SHA256SUMS.txt" (
            certutil -hashfile "%%f" SHA256 | find /v ":" | find /v "CertUtil" >> SHA256SUMS.txt
            echo %%f >> SHA256SUMS.txt
        )
    )
    echo ✅ Checksums generated
) else (
    echo WARNING: certutil not available for checksum generation
)

cd ..

echo.
echo 🎉 Windows release completed!
echo 📂 Files are in: release\
dir release

echo.
echo SECURITY REMINDERS:
echo 1. Scan SafeSteamTools.exe with antivirus
echo 2. Verify checksums
echo 3. Test executable before distribution
echo 4. Only distribute through official channels

echo.
echo Press any key to exit...
pause >nul