#!/bin/bash

# Generate comprehensive security report for SafeSteamTools

echo "# SafeSteamTools Security Audit Report"
echo ""
echo "**Generated:** $(date)"
echo "**Environment:** $(uname -a)"
echo "**Node.js Version:** $(node --version)"
echo "**NPM Version:** $(npm --version)"
echo ""

echo "## 1. Dependency Vulnerability Scan"
echo ""
echo "### Root Dependencies"
echo '```'
npm audit --audit-level=moderate
echo '```'
echo ""

echo "### Backend Dependencies"
echo '```'
cd backend
npm audit --audit-level=moderate
cd ..
echo '```'
echo ""

echo "### Frontend Dependencies"
echo '```'
cd frontend
npm audit --audit-level=moderate
cd ..
echo '```'
echo ""

echo "## 2. Static Code Analysis"
echo ""
echo "### ESLint Security Scan"
echo '```'
npm run lint 2>&1 || echo "Linting completed with issues"
echo '```'
echo ""

echo "### TypeScript Strict Check"
echo '```'
npm run typecheck 2>&1 || echo "Type checking completed with issues"
echo '```'
echo ""

# Semgrep if available
if command -v semgrep >/dev/null 2>&1; then
    echo "### Semgrep Security Analysis"
    echo '```'
    semgrep --config=auto backend/src/ frontend/src/ --severity=ERROR 2>&1 || echo "Semgrep scan completed"
    echo '```'
    echo ""
else
    echo "### Semgrep Security Analysis"
    echo "⚠️ Semgrep not installed (install with: pip install semgrep)"
    echo ""
fi

echo "## 3. Build Security"
echo ""
echo "### Build Process"
echo '```'
echo "Build completed: $([ -d "dist" ] && echo "✅ Yes" || echo "❌ No")"
echo "Backend build: $([ -d "backend/dist" ] && echo "✅ Yes" || echo "❌ No")"
echo "Frontend build: $([ -d "frontend/build" ] || [ -d "frontend/.next" ] && echo "✅ Yes" || echo "❌ No")"
echo "Windows executable: $([ -f "dist/SafeSteamTools.exe" ] && echo "✅ Yes" || echo "❌ No")"
echo '```'
echo ""

if [ -f "dist/SafeSteamTools.exe" ]; then
    echo "### Executable Analysis"
    echo '```'
    echo "File size: $(ls -lh dist/SafeSteamTools.exe | awk '{print $5}')"
    echo "File type: $(file dist/SafeSteamTools.exe)"
    echo "SHA256: $(sha256sum dist/SafeSteamTools.exe | cut -d' ' -f1)"
    echo '```'
    echo ""
fi

echo "## 4. Malware Scanning"
echo ""

# ClamAV scan
if command -v clamscan >/dev/null 2>&1; then
    echo "### ClamAV Scan"
    echo '```'
    if [ -f "dist/SafeSteamTools.exe" ]; then
        clamscan dist/SafeSteamTools.exe 2>&1
    else
        echo "No executable found to scan"
    fi
    echo '```'
    echo ""
else
    echo "### ClamAV Scan"
    echo "⚠️ ClamAV not installed (install with: apt-get install clamav)"
    echo ""
fi

echo "## 5. Container Security"
echo ""

# Docker and Trivy scan
if command -v docker >/dev/null 2>&1 && command -v trivy >/dev/null 2>&1; then
    echo "### Docker Image Security Scan"
    echo '```'
    echo "Scanning backend image..."
    trivy image safesteamtools_backend:latest --severity HIGH,CRITICAL 2>&1 || echo "Backend scan completed"
    echo ""
    echo "Scanning frontend image..."
    trivy image safesteamtools_frontend:latest --severity HIGH,CRITICAL 2>&1 || echo "Frontend scan completed"
    echo '```'
    echo ""
else
    echo "### Docker Image Security Scan"
    echo "⚠️ Docker or Trivy not available"
    echo ""
fi

echo "## 6. Network Security"
echo ""
echo "### API Endpoints"
echo '```'
echo "Backend listens on: http://localhost:3001"
echo "CORS enabled for: ${CORS_ORIGIN:-http://localhost:3000}"
echo "Rate limiting: ${RATE_LIMIT_MAX_REQUESTS:-100} requests per ${RATE_LIMIT_WINDOW_MS:-900000}ms"
echo "HTTPS redirect: $(grep -q 'HTTPS' backend/src/middleware/security.ts && echo 'Yes' || echo 'No')"
echo '```'
echo ""

echo "## 7. Data Security"
echo ""
echo "### Environment Variables"
echo '```'
echo "Steam API key: $([ -n "$STEAM_API_KEY" ] && echo "✅ Set" || echo "❌ Not set")"
echo "Database URL: $([ -n "$DATABASE_URL" ] && echo "✅ Set" || echo "❌ Not set")"
echo "Secrets in code: $(grep -r 'STEAM_API_KEY' backend/src/ --exclude-dir=node_modules | grep -v 'process.env' | wc -l) hardcoded references"
echo '```'
echo ""

echo "## 8. Legal Compliance Check"
echo ""
echo "### Anti-Piracy Measures"
echo '```'
grep -r "DRM\|piracy\|crack\|bypass" backend/src/ frontend/src/ --ignore-case | head -5 2>/dev/null || echo "No suspicious terms found"
echo '```'
echo ""

echo "### Official API Usage"
echo '```'
grep -r "api.steampowered.com\|steamcommunity.com" backend/src/ | wc -l | xargs echo "Official Steam API calls:"
echo '```'
echo ""

echo "## 9. Summary"
echo ""
echo "### Security Status"
echo ""
echo "| Check | Status | Notes |"
echo "|-------|--------|-------|"
echo "| Dependencies | $(npm audit --audit-level=high >/dev/null 2>&1 && echo '✅ Clean' || echo '⚠️ Issues') | Run npm audit for details |"
echo "| Static Analysis | $(npm run lint >/dev/null 2>&1 && echo '✅ Clean' || echo '⚠️ Issues') | ESLint and TypeScript |"
echo "| Malware Scan | $(command -v clamscan >/dev/null 2>&1 && echo '✅ Available' || echo '⚠️ Not available') | ClamAV scanning |"
echo "| Build Security | $([ -f 'dist/SafeSteamTools.exe' ] && echo '✅ Complete' || echo '❌ Missing') | Executable created |"
echo "| Container Scan | $(command -v trivy >/dev/null 2>&1 && echo '✅ Available' || echo '⚠️ Not available') | Trivy container scanning |"
echo ""

echo "### Recommendations"
echo ""
echo "1. **For developers:**"
echo "   - Install missing security tools (semgrep, clamav, trivy)"
echo "   - Run full security scan before each release"
echo "   - Keep dependencies updated"
echo ""
echo "2. **For users:**"
echo "   - Verify SHA256 checksums"
echo "   - Scan executable with antivirus"
echo "   - Only download from official GitHub releases"
echo ""

echo "### Legal Notice"
echo ""
echo "SafeSteamTools is designed exclusively for viewing publicly available Steam data"
echo "through official APIs. Any use for circumventing game DRM, unlocking paid content,"
echo "modifying game files, or any form of piracy is strictly prohibited."
echo ""

echo "---"
echo "**Report generated by SafeSteamTools security scanner**"
echo "**$(date)**"