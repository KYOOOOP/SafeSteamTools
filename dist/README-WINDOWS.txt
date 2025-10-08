SafeSteamTools Windows Release v1.0.0
=====================================

THIS IS A PLACEHOLDER FOR THE ACTUAL WINDOWS EXECUTABLE

To get the real SafeSteamTools.exe:
1. Wait for the GitHub Actions workflow to complete
2. The automated build will create the actual executable
3. Download from the Releases page once available

OR build it yourself:
1. Install Node.js 18+
2. Clone this repository
3. Run: npm install -g pkg
4. Run: cd backend && pkg package.json --targets node18-win-x64 --output SafeSteamTools.exe

For now, use the development setup:
1. Clone: git clone https://github.com/KYOOOOP/SafeSteamTools.git
2. Setup: cp .env.example .env (add your Steam API key)
3. Run: docker-compose up --build
4. Access: http://localhost:3001

Security Notice:
- This software is completely open source
- Uses only official Steam Web APIs
- No passwords or credentials required
- Scanned for malware before every release

Support: https://github.com/KYOOOOP/SafeSteamTools/issues