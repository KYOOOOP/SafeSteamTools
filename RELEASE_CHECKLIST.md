# SafeSteamTools Release Checklist 🛡️

> **CRITICAL**: All releases must pass comprehensive security scanning before publication

This checklist ensures every SafeSteamTools release is secure, signed, and malware-free.

## Pre-Release Requirements

### 1. Code Quality Verification
```bash
# Run all tests with coverage
npm run test:coverage

# Verify minimum 80% coverage
# Backend: check backend/coverage/lcov-report/index.html
# Frontend: check frontend/coverage/lcov-report/index.html

# Type checking
npm run typecheck

# Linting
npm run lint
```

### 2. Security Scanning (MANDATORY)

#### Dependency Vulnerability Scanning
```bash
# NPM Audit (must pass with no high/critical vulnerabilities)
npm audit --audit-level high
cd backend && npm audit --audit-level high
cd frontend && npm audit --audit-level high

# Snyk scanning (install with: npm install -g snyk)
snyk test
cd backend && snyk test
cd frontend && snyk test
```

#### Static Code Analysis
```bash
# TypeScript strict checking
npm run typecheck

# ESLint security rules
npm run lint

# Semgrep security analysis (install: pip install semgrep)
semgrep --config=auto backend/src/
semgrep --config=auto frontend/src/
```

## Build Process

### 3. Create Production Builds
```bash
# Clean previous builds
rm -rf dist/ build/ *.exe *.zip *.tar.gz

# Build backend
cd backend
npm run build
cd ..

# Build frontend
cd frontend
npm run build
cd ..

# Build Docker images
docker-compose build --no-cache
```

### 4. Create Windows Executable
```bash
# Install pkg globally if not installed
npm install -g pkg

# Create Windows executable from backend
cd backend
pkg package.json --targets node18-win-x64 --output ../dist/SafeSteamTools.exe
cd ..

# Verify executable was created
ls -la dist/SafeSteamTools.exe
```

## Security Verification (CRITICAL)

### 5. Malware Scanning

#### Local Antivirus Scanning
```bash
# Scan with ClamAV (install: apt-get install clamav)
freshclam  # Update virus definitions
clamscan --recursive --infected dist/

# For Windows executable specifically
clamscan dist/SafeSteamTools.exe
```

#### Windows Defender Scan (if on Windows)
```powershell
# Run Windows Defender scan
Start-MpScan -ScanType CustomScan -ScanPath "./dist/SafeSteamTools.exe"
```

#### VirusTotal Upload (Optional but Recommended)
```bash
# Upload to VirusTotal for multi-engine scanning
# Manual upload at: https://www.virustotal.com/gui/
# Or use vt-cli: https://github.com/VirusTotal/vt-cli

vt scan file dist/SafeSteamTools.exe
```

### 6. Container Security Scanning
```bash
# Scan Docker images with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image safesteamtools_backend:latest

docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image safesteamtools_frontend:latest
```

### 7. Generate Security Report
```bash
# Create security scan report
./scripts/generate-security-report.sh > SECURITY_REPORT.md

# Verify all scans passed
grep -i "CRITICAL\|HIGH" SECURITY_REPORT.md
# Should return no results for a clean build
```

## Release Packaging

### 8. Create Release Archives
```bash
# Create release directory
mkdir -p release/

# Copy executable and documentation
cp dist/SafeSteamTools.exe release/
cp README.md LICENSE SECURITY_REPORT.md release/
cp .env.example release/

# Create zip archive for Windows users
cd release
zip -r SafeSteamTools-v1.0.0-windows.zip *
cd ..

# Create tarball for source
tar -czf SafeSteamTools-v1.0.0-source.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  .
```

### 9. Generate Checksums
```bash
# Generate SHA256 checksums
cd release
sha256sum * > SHA256SUMS.txt
cd ..

# Display checksums for verification
cat release/SHA256SUMS.txt
```

## Code Signing (Production Only)

### 10. Sign Windows Executable
```bash
# For production releases, sign the executable
# Requires valid code signing certificate

# Using signtool (Windows)
signtool sign /f "certificate.p12" /p "password" /t http://timestamp.digicert.com dist/SafeSteamTools.exe

# Verify signature
signtool verify /pa dist/SafeSteamTools.exe
```

### 11. GPG Sign Release Files
```bash
# Sign release files with GPG
cd release
for file in *.zip *.tar.gz; do
  gpg --detach-sign --armor "$file"
done
cd ..

# Verify signatures
cd release
for file in *.sig; do
  gpg --verify "$file"
done
cd ..
```

## Publication

### 12. GitHub Release
```bash
# Create git tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Upload to GitHub Releases
# Manual: Go to https://github.com/KYOOOOP/SafeSteamTools/releases/new
# Or use GitHub CLI:
gh release create v1.0.0 release/* \
  --title "SafeSteamTools v1.0.0" \
  --notes-file CHANGELOG.md
```

### 13. Post-Release Verification
```bash
# Download and verify published release
wget https://github.com/KYOOOOP/SafeSteamTools/releases/download/v1.0.0/SafeSteamTools-v1.0.0-windows.zip
sha256sum SafeSteamTools-v1.0.0-windows.zip

# Compare with generated checksum
grep SafeSteamTools-v1.0.0-windows.zip release/SHA256SUMS.txt
```

## Emergency Response

### If Malware is Detected
1. **STOP** - Do not publish the release
2. Quarantine all build artifacts
3. Review recent code changes
4. Re-scan the source code
5. Rebuild from clean environment
6. Re-run all security scans
7. Document the incident

### If Vulnerabilities are Found
1. **STOP** - Do not publish with known vulnerabilities
2. Update vulnerable dependencies
3. Run security scans again
4. Test functionality after updates
5. Proceed with build process

## Security Scan Commands Summary

**CRITICAL**: All these commands must pass before any release:

```bash
#!/bin/bash
# Quick security check script

echo "🔍 Running security checks..."

# Dependency scanning
npm audit --audit-level high || exit 1
echo "✅ Dependency scan passed"

# Static analysis
npm run lint || exit 1
echo "✅ Linting passed"

# Build
npm run build || exit 1
echo "✅ Build completed"

# Malware scan
clamscan --recursive --infected dist/ || exit 1
echo "✅ Malware scan passed"

echo "🎉 All security checks passed - ready for release!"
```

## Verification Commands for Users

Provide these commands to users for release verification:

```bash
# Verify SHA256 checksum
sha256sum SafeSteamTools.exe
# Compare with published SHA256SUMS.txt

# Verify GPG signature (if available)
gpg --verify SafeSteamTools-v1.0.0-windows.zip.asc SafeSteamTools-v1.0.0-windows.zip

# Scan with antivirus before running
clamscan SafeSteamTools.exe
```

---

**⚠️ NEVER SKIP SECURITY SCANS**

Every release must be verified clean by multiple security tools before publication. When in doubt, don't release.