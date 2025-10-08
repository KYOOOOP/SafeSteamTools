SafeSteamTools v1.0.0 - Legal Steam Data Viewer
===============================================

🛡️ SECURITY NOTICE: This software is 100% legal and malware-free

✅ Uses ONLY official Steam Web APIs
✅ Requires NO Steam passwords or credentials  
✅ Accesses only PUBLIC Steam profile data
❌ Does NOT unlock paid content or circumvent DRM
❌ Not affiliated with Valve Corporation

QUICK START:
============

** OPTION 1: Windows Executable (Recommended) **
1. Wait for SafeSteamTools.exe (automated build in progress)
2. Download when available from GitHub Releases
3. Run SafeSteamTools.exe
4. Open http://localhost:3001

** OPTION 2: Docker (Immediate Use) **
1. Install Docker Desktop
2. Clone: git clone https://github.com/KYOOOOP/SafeSteamTools.git
3. Setup: cp .env.example .env
4. Add Steam API key to .env file
5. Run: docker-compose up --build
6. Open http://localhost:3000 (frontend) or http://localhost:3001 (API)

** OPTION 3: Build Your Own Executable **
1. Install Node.js 18+
2. Clone the repository
3. Run build-executable.bat
4. Use generated SafeSteamTools.exe

GET STEAM API KEY:
==================
1. Go to: https://steamcommunity.com/dev/apikey
2. Sign in with Steam
3. Enter any domain name (e.g., localhost)
4. Copy the 32-character API key
5. Add to .env file as: STEAM_API_KEY=your_key_here

FEATURES:
=========
- View public Steam profiles
- Browse owned games with playtime
- Check achievements (public games only)
- View inventory items with price estimates
- Export profile data as JSON
- No Steam login required

SECURITY:
=========
Every release is automatically scanned for:
- Malware (70+ antivirus engines via VirusTotal)
- Vulnerabilities (npm audit + Snyk)
- Code quality (ESLint + TypeScript)
- Container security (Trivy scanning)

SUPPORT:
========
- Issues: https://github.com/KYOOOOP/SafeSteamTools/issues
- Documentation: https://github.com/KYOOOOP/SafeSteamTools
- Security: See SECURITY.md for responsible disclosure

LEGAL:
======
SafeSteamTools is designed exclusively for viewing publicly available
Steam data through official APIs. Any use for circumventing game DRM,
unlocking paid content, or piracy is strictly prohibited.

Not affiliated with Valve Corporation or Steam.

---
Generated: October 8, 2025
Version: 1.0.0