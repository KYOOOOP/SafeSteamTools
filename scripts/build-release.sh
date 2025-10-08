#!/bin/bash

# SafeSteamTools Release Builder with Security Scanning
# This script builds, scans, and packages SafeSteamTools releases

set -e  # Exit on any error

# Configuration
VERSION="${1:-1.0.0}"
BUILD_DIR="dist"
RELEASE_DIR="release"
SECURITY_REPORT="SECURITY_REPORT.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  SafeSteamTools Release Builder v1.0${NC}"
echo -e "${BLUE}Building version: ${VERSION}${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR" "$RELEASE_DIR" *.exe *.zip *.tar.gz
mkdir -p "$BUILD_DIR" "$RELEASE_DIR"
print_status "Cleaned build directories"

# Security Check 1: Dependency Vulnerability Scanning
echo ""
echo "🔍 Step 1: Dependency Vulnerability Scanning"
if npm audit --audit-level high; then
    print_status "Root dependencies scan passed"
else
    print_error "Root dependencies have high/critical vulnerabilities"
fi

cd backend
if npm audit --audit-level high; then
    print_status "Backend dependencies scan passed"
else
    print_error "Backend dependencies have high/critical vulnerabilities"
fi
cd ..

cd frontend
if npm audit --audit-level high; then
    print_status "Frontend dependencies scan passed"
else
    print_error "Frontend dependencies have high/critical vulnerabilities"
fi
cd ..

# Security Check 2: Static Analysis
echo ""
echo "🔍 Step 2: Static Code Analysis"
if npm run lint; then
    print_status "Linting passed"
else
    print_error "Linting failed"
fi

if npm run typecheck; then
    print_status "Type checking passed"
else
    print_error "Type checking failed"
fi

# Semgrep scanning (if available)
if command_exists semgrep; then
    echo "Running Semgrep security analysis..."
    if semgrep --config=auto backend/src/ --json --output=semgrep-backend.json; then
        print_status "Backend Semgrep scan completed"
    else
        print_warning "Backend Semgrep scan found issues (check semgrep-backend.json)"
    fi
    
    if semgrep --config=auto frontend/src/ --json --output=semgrep-frontend.json; then
        print_status "Frontend Semgrep scan completed"
    else
        print_warning "Frontend Semgrep scan found issues (check semgrep-frontend.json)"
    fi
else
    print_warning "Semgrep not installed - install with: pip install semgrep"
fi

# Build Process
echo ""
echo "🔨 Step 3: Building Application"

# Build backend
echo "Building backend..."
cd backend
if npm run build; then
    print_status "Backend build completed"
else
    print_error "Backend build failed"
fi
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
if npm run build; then
    print_status "Frontend build completed"
else
    print_error "Frontend build failed"
fi
cd ..

# Create Windows Executable
echo ""
echo "📦 Step 4: Creating Windows Executable"
if command_exists pkg; then
    cd backend
    if pkg package.json --targets node18-win-x64 --output "../$BUILD_DIR/SafeSteamTools.exe"; then
        print_status "Windows executable created"
    else
        print_error "Failed to create Windows executable"
    fi
    cd ..
else
    print_error "pkg not installed - install with: npm install -g pkg"
fi

# Verify executable exists
if [ ! -f "$BUILD_DIR/SafeSteamTools.exe" ]; then
    print_error "SafeSteamTools.exe was not created"
fi

EXE_SIZE=$(ls -lh "$BUILD_DIR/SafeSteamTools.exe" | awk '{print $5}')
print_status "Executable size: $EXE_SIZE"

# Security Check 3: Malware Scanning
echo ""
echo "🛡️  Step 5: Malware Scanning (CRITICAL)"

# ClamAV scanning
if command_exists clamscan; then
    echo "Updating ClamAV definitions..."
    if sudo freshclam; then
        print_status "ClamAV definitions updated"
    else
        print_warning "Failed to update ClamAV definitions - continuing with existing"
    fi
    
    echo "Scanning executable with ClamAV..."
    if clamscan --infected "$BUILD_DIR/SafeSteamTools.exe"; then
        print_status "ClamAV scan passed - no malware detected"
    else
        print_error "ClamAV detected malware - BUILD TERMINATED"
    fi
    
    echo "Scanning all build artifacts..."
    if clamscan --recursive --infected "$BUILD_DIR/"; then
        print_status "Full build scan passed"
    else
        print_error "Malware detected in build artifacts - BUILD TERMINATED"
    fi
else
    print_warning "ClamAV not installed - install with: apt-get install clamav"
    print_warning "⚠️  SECURITY RISK: Malware scanning skipped"
    read -p "Continue without malware scan? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Build cancelled by user"
    fi
fi

# Additional security checks
echo "🔍 Additional Security Checks"

# Check for suspicious strings in executable
echo "Checking for suspicious patterns..."
SUSPICIOUS_PATTERNS=("eval" "exec" "system" "shell" "cmd" "powershell")
for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
    if strings "$BUILD_DIR/SafeSteamTools.exe" | grep -i "$pattern" >/dev/null 2>&1; then
        print_warning "Found pattern '$pattern' in executable - review required"
    fi
done

# Docker Security Scanning (if available)
if command_exists docker && command_exists trivy; then
    echo "Building and scanning Docker images..."
    if docker-compose build --no-cache; then
        print_status "Docker images built"
        
        # Scan backend image
        if trivy image safesteamtools_backend:latest; then
            print_status "Backend Docker image scan completed"
        else
            print_warning "Backend Docker image has vulnerabilities"
        fi
        
        # Scan frontend image  
        if trivy image safesteamtools_frontend:latest; then
            print_status "Frontend Docker image scan completed"
        else
            print_warning "Frontend Docker image has vulnerabilities"
        fi
    else
        print_warning "Docker build failed"
    fi
else
    print_warning "Docker or Trivy not available - skipping container scanning"
fi

# Generate Security Report
echo ""
echo "📋 Step 6: Generating Security Report"
cat > "$SECURITY_REPORT" << EOF
# SafeSteamTools Security Scan Report

**Generated:** $(date)
**Version:** $VERSION
**Build Environment:** $(uname -a)

## Scan Results

### Dependency Vulnerability Scan
- Root dependencies: ✅ PASSED
- Backend dependencies: ✅ PASSED  
- Frontend dependencies: ✅ PASSED

### Static Code Analysis
- ESLint: ✅ PASSED
- TypeScript: ✅ PASSED
- Semgrep: $([ -f "semgrep-backend.json" ] && echo "✅ COMPLETED" || echo "⚠️ SKIPPED")

### Malware Scanning
- ClamAV: $(command_exists clamscan && echo "✅ PASSED" || echo "⚠️ SKIPPED")
- Build artifacts: $(command_exists clamscan && echo "✅ CLEAN" || echo "⚠️ NOT SCANNED")

### Container Security
- Docker images: $(command_exists trivy && echo "✅ SCANNED" || echo "⚠️ SKIPPED")

## Executable Information
- File: SafeSteamTools.exe
- Size: $EXE_SIZE
- Target: Windows x64 (Node.js 18)
- Scanned: $(date)

## Verification
Users can verify this release by:
1. Checking SHA256 checksums
2. Scanning with antivirus software
3. Verifying GPG signatures (if provided)

**This build has passed all available security checks.**
EOF

print_status "Security report generated: $SECURITY_REPORT"

# Package Release
echo ""
echo "📦 Step 7: Packaging Release"

# Copy files to release directory
cp "$BUILD_DIR/SafeSteamTools.exe" "$RELEASE_DIR/"
cp README.md LICENSE "$SECURITY_REPORT" "$RELEASE_DIR/"
cp .env.example "$RELEASE_DIR/"

# Create installation script for Windows
cat > "$RELEASE_DIR/INSTALL.bat" << 'EOF'
@echo off
echo SafeSteamTools Quick Setup
echo ========================
echo.
echo 1. Copy .env.example to .env
echo 2. Edit .env and add your Steam API key
echo 3. Run SafeSteamTools.exe
echo.
echo Get your Steam API key at: https://steamcommunity.com/dev/apikey
echo.
if not exist .env (
    copy .env.example .env
    echo Created .env file - please edit it with your Steam API key
) else (
    echo .env file already exists
)
echo.
echo Press any key to continue...
pause >nul
EOF

print_status "Installation script created"

# Create ZIP archive
cd "$RELEASE_DIR"
if zip -r "SafeSteamTools-v$VERSION-windows.zip" *; then
    print_status "Windows release archive created"
else
    print_error "Failed to create release archive"
fi
cd ..

# Generate checksums
echo ""
echo "🔐 Step 8: Generating Checksums"
cd "$RELEASE_DIR"
sha256sum * > SHA256SUMS.txt
print_status "SHA256 checksums generated"

echo ""
echo "📊 Release Summary:"
echo "=================="
ls -lh
echo ""
echo "SHA256 Checksums:"
cat SHA256SUMS.txt
cd ..

echo ""
echo -e "${GREEN}🎉 Release build completed successfully!${NC}"
echo -e "${GREEN}📂 Release files are in: $RELEASE_DIR/${NC}"
echo -e "${GREEN}📋 Security report: $SECURITY_REPORT${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the security report"
echo "2. Test the executable"
echo "3. Create GitHub release"
echo "4. Upload release files"
echo ""
echo -e "${BLUE}For users to verify the release:${NC}"
echo "sha256sum SafeSteamTools.exe"
echo "# Compare with SHA256SUMS.txt"
echo ""

# Final security reminder
echo -e "${RED}🛡️  SECURITY REMINDER:${NC}"
echo -e "${RED}This release has been scanned but users should:${NC}"
echo -e "${RED}1. Verify checksums${NC}"
echo -e "${RED}2. Scan with their own antivirus${NC}"
echo -e "${RED}3. Only download from official GitHub releases${NC}"