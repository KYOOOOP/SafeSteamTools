@echo off
echo SafeSteamTools Setup
echo ===================
echo.
echo Welcome to SafeSteamTools - Legal Steam Data Viewer
echo.
echo IMPORTANT: This is a development setup until automated build completes
echo.
echo To use SafeSteamTools right now:
echo 1. Install Node.js 18+ from https://nodejs.org
echo 2. Install Docker Desktop from https://docker.com
echo 3. Get Steam API key from https://steamcommunity.com/dev/apikey
echo 4. Run: git clone https://github.com/KYOOOOP/SafeSteamTools.git
echo 5. Run: cd SafeSteamTools
echo 6. Run: cp .env.example .env
echo 7. Edit .env file and add your Steam API key
echo 8. Run: docker-compose up --build
echo 9. Open http://localhost:3001 in your browser
echo.
echo For the Windows executable (SafeSteamTools.exe):
echo - The automated build is currently running
echo - Check back in 10-15 minutes for the compiled executable
echo - Or use build-executable.bat to build locally
echo.
echo Security Features:
echo - Uses ONLY official Steam Web APIs
echo - No passwords or credentials required
echo - Scanned for malware before every release
echo - Completely open source
echo.
echo Support: https://github.com/KYOOOOP/SafeSteamTools/issues
echo.
echo Press any key to continue...
pause >nul