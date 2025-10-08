# SafeSteamTools 🛡️

> **Legal, malware-free implementation of steamtools.net features**

A secure, open-source web application that provides read-only views of public Steam data using official Steam Web APIs. Built with security-first principles and zero tolerance for malware or illegal activities.

## 🎯 Project Overview

SafeSteamTools allows users to:
- View public Steam profile information
- Browse owned games with playtime statistics
- Check achievements for publicly available games
- View public inventory items with market price estimates
- Export profile data as JSON

**IMPORTANT LEGAL NOTICE**: This application:
- ✅ Uses ONLY official Steam Web APIs
- ✅ Requires NO Steam passwords or credentials
- ✅ Operates in READ-ONLY mode
- ❌ Does NOT unlock paid content
- ❌ Does NOT circumvent DRM
- ❌ Does NOT modify game files
- ❌ Is NOT affiliated with Valve Corporation

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Next.js       │    │   Node.js    │    │   Steam Web     │
│   Frontend      │◄──►│   Backend    │◄──►│   API           │
│   (React/TS)    │    │   (Express)  │    │   (Official)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                       ┌──────────────┐
                       │  PostgreSQL  │
                       │  (Caching)   │
                       └──────────────┘
```

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (with Redis for caching)
- **Infrastructure**: Docker, Docker Compose
- **Testing**: Jest, Testing Library, Supertest
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (frontend) + Render/Railway (backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Steam Web API Key ([get one here](https://steamcommunity.com/dev/apikey))

### Local Development

1. **Clone and setup**:
   ```bash
   git clone https://github.com/KYOOOOP/SafeSteamTools.git
   cd SafeSteamTools
   cp .env.example .env
   ```

2. **Configure environment**:
   Edit `.env` and add your Steam API key:
   ```bash
   STEAM_API_KEY=your_steam_api_key_here
   ```

3. **Start with Docker**:
   ```bash
   docker-compose up --build
   ```

4. **Or start manually**:
   ```bash
   # Install dependencies
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   
   # Start database
   docker-compose up -d postgres redis
   
   # Start backend
   cd backend && npm run dev &
   
   # Start frontend
   cd frontend && npm run dev
   ```

5. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:frontend
npm run test:backend
npm run test:e2e
```

## 🔒 Security Features

- **Dependency Scanning**: Automated vulnerability checks with npm audit and Snyk
- **Static Analysis**: TypeScript strict mode, ESLint, Semgrep rules
- **Malware Scanning**: All artifacts scanned with multiple AV engines
- **Container Security**: Non-root Docker containers with capability limits
- **Rate Limiting**: API rate limiting and caching to prevent abuse
- **Secrets Management**: Environment-based configuration, no hardcoded secrets
- **Signed Releases**: GPG-signed releases with SHA256 checksums

## 📋 API Endpoints

### Profile
```bash
# Get public profile info
curl http://localhost:3001/api/profile/76561198000000000

# Expected response:
{
  "steamid": "76561198000000000",
  "personaname": "PlayerName",
  "avatarfull": "https://...",
  "realname": "Real Name",
  "loccountrycode": "US",
  "communityvisibilitystate": 3
}
```

### Games
```bash
# Get owned games
curl http://localhost:3001/api/games/76561198000000000
```

### Inventory
```bash
# Get inventory for app ID
curl http://localhost:3001/api/inventory/76561198000000000/730
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel + Render
- Docker containers
- Kubernetes

## 🔐 Security Audit

This project undergoes automated security scanning:
- **Dependency vulnerabilities**: `npm audit` + Snyk
- **Static analysis**: ESLint + TypeScript + Semgrep
- **Container scanning**: Trivy + Docker Scout
- **Malware detection**: ClamAV + VirusTotal integration

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for latest scan results.

## 📄 Release Process

See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for complete release procedures including:
- Build verification
- Security scanning
- Artifact signing
- Publication steps

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and security checks
4. Submit a pull request

All PRs must pass:
- Unit tests (80%+ coverage)
- Security scans (no critical vulnerabilities)
- Static analysis checks
- Malware scans

## 📜 License

MIT License - see [LICENSE](./LICENSE) file.

## ⚖️ Legal & Ethical Statement

This software is designed exclusively for viewing publicly available Steam data through official APIs. Any use for:
- Circumventing game DRM
- Unlocking paid content
- Modifying game files
- Automating purchases or trades
- Any form of piracy

**IS STRICTLY PROHIBITED** and violates the software's intended use.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/KYOOOOP/SafeSteamTools/issues)
- **Security**: See [SECURITY.md](./SECURITY.md) for responsible disclosure
- **Documentation**: [Wiki](https://github.com/KYOOOOP/SafeSteamTools/wiki)

---

**Not affiliated with Valve Corporation or Steam.**