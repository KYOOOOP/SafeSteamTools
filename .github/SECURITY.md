# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅                |
| < 1.0   | ❌                |

## Security Features

SafeSteamTools is built with security as a primary concern:

### 🛡️ Built-in Security Controls
- **No credential collection** - Never requests Steam passwords or API keys from users
- **Read-only access** - Only views public Steam data through official APIs
- **Rate limiting** - Prevents API abuse and respects Steam's usage limits
- **Input validation** - All user inputs are sanitized and validated
- **Container sandboxing** - Docker containers run with minimal privileges
- **Dependency scanning** - Automated vulnerability checking for all dependencies

### 🔐 Release Security
Every release undergoes comprehensive security scanning:
- **Malware scanning** with ClamAV and VirusTotal
- **Dependency vulnerability** scanning with npm audit and Snyk
- **Static code analysis** with ESLint and Semgrep
- **Container security** scanning with Trivy
- **GPG signed releases** with SHA256 checksums

## Reporting a Vulnerability

**🚨 Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them responsibly:

### Preferred Method: GitHub Security Advisories
1. Go to [Security Advisories](https://github.com/KYOOOOP/SafeSteamTools/security/advisories)
2. Click "Report a vulnerability"
3. Fill out the form with as much detail as possible

### Alternative Method: Email
Send an email to: **security@[repository-owner-email]**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

## Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 7 days
- **Fix Development**: Depends on severity
  - Critical: Within 24-48 hours
  - High: Within 7 days
  - Medium: Within 30 days
  - Low: Next planned release
- **Public Disclosure**: After fix is released

## Security Severity Classification

### Critical
- Remote code execution
- Privilege escalation
- Data breach of user credentials
- Malware injection

### High
- Authentication bypass
- SQL injection
- Cross-site scripting (XSS)
- Sensitive information disclosure

### Medium
- Denial of service
- Information leakage
- Input validation issues

### Low
- Security misconfigurations
- Minor information disclosure

## What We Do Upon Receiving a Report

1. **Acknowledge** receipt within 48 hours
2. **Investigate** and reproduce the issue
3. **Assess** the severity and impact
4. **Develop** a fix in a private branch
5. **Test** the fix thoroughly
6. **Release** the security update
7. **Disclose** the vulnerability publicly (with credit)

## Security Best Practices for Users

### For End Users:
- **Always download** from official GitHub releases only
- **Verify checksums** using provided SHA256SUMS.txt
- **Scan executables** with your antivirus before running
- **Keep updated** to the latest version
- **Report suspicious behavior** immediately

### For Developers:
- **Review code changes** carefully in pull requests
- **Run security scans** before submitting PRs
- **Follow secure coding practices**
- **Keep dependencies updated**
- **Never commit secrets** to the repository

## Legal and Ethical Usage

SafeSteamTools is designed exclusively for legitimate purposes:

### ✅ Permitted Uses:
- Viewing your own public Steam profile
- Viewing friends' public Steam profiles
- Checking public game libraries and achievements
- Analyzing public inventory items
- Educational and research purposes

### ❌ Prohibited Uses:
- Attempting to access private/hidden Steam data
- Using the tool to circumvent Steam's privacy settings
- Scraping Steam data for commercial purposes without permission
- Any form of harassment or stalking
- Attempting to unlock paid content or circumvent DRM
- Using the tool for piracy or illegal activities

## Compliance and Auditing

### Regular Security Reviews
- Weekly automated security scans
- Monthly dependency updates
- Quarterly security audits
- Annual penetration testing (for major releases)

### Compliance
- Follows OWASP Top 10 guidelines
- Implements secure development lifecycle (SDLC)
- Maintains detailed security logs
- Provides transparency reports

## Contact

For security-related questions or concerns:
- **Security Issues**: Use GitHub Security Advisories
- **General Security Questions**: Open a regular GitHub issue with the "security" label
- **Urgent Security Matters**: Contact repository maintainers directly

---

**Thank you for helping keep SafeSteamTools secure!**

Responsible disclosure helps protect all users while allowing us to fix issues properly.