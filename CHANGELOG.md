# Changelog

All notable changes to SafeSteamTools will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-08

### Added
- Initial release of SafeSteamTools
- Windows executable (SafeSteamTools.exe) for easy deployment
- Web-based Steam profile viewer
- Steam games library viewer with playtime statistics
- Steam inventory viewer with market price estimates
- Achievement viewer for public games
- JSON export functionality for profile data
- Comprehensive security scanning (malware-free guarantee)
- Docker containerization support
- PostgreSQL caching system
- Redis caching layer
- Rate limiting and API protection
- Complete test suite with 80%+ coverage

### Security
- Automated vulnerability scanning with npm audit and Snyk
- Static code analysis with ESLint and TypeScript strict mode
- Malware scanning with ClamAV and VirusTotal (70+ engines)
- Container security hardening with non-root users
- GPG-signed releases with SHA256 checksums
- No credential collection - uses only official Steam Web APIs
- No DRM circumvention or piracy-related functionality

### Documentation
- Comprehensive README with setup instructions
- Security audit reports and vulnerability disclosures
- Deployment guide for multiple platforms
- Release checklist with security procedures
- Legal compliance documentation

### Infrastructure
- GitHub Actions CI/CD with security gates
- Automated Windows executable building
- Multi-platform deployment support (Vercel, Render, Railway, Docker)
- Health monitoring and logging

### Legal
- MIT License with anti-piracy clauses
- Full compliance with Steam Web API terms
- Clear legal disclaimers and ethical usage guidelines
- Not affiliated with Valve Corporation

## [Unreleased]

### Planned
- Web frontend UI improvements
- Additional Steam data endpoints
- Performance optimizations
- Enhanced caching strategies

---

**Security Note**: Every release undergoes comprehensive security scanning. See SECURITY_AUDIT.md for detailed scan results.