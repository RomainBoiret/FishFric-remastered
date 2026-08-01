# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `v1.x` (latest release / `main`) | Yes |
| Older tags / forks | No |

This repository is a **portfolio banking demo** with fictional data only. It is not a production bank and must not process real financial credentials.

## Reporting a vulnerability

Please **do not** open a public issue for security findings that could expose secrets, enable account takeover on the shared demo, or publish an exploit.

Preferred channel:

1. Use [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (**Report a vulnerability**), when available.
2. If private reporting is unavailable, contact the repository owner via a **private** GitHub channel (do not paste secrets or exploit PoCs in public issues, pull requests, or discussions).

When reporting, include:

- Affected version / commit
- Steps to reproduce
- Impact assessment (what an attacker could do)
- Any suggested fix (optional)

## Scope notes

- Demo accounts (`demo@fishfric.app`, `ami@fishfric.app`) are intentionally public and shared.
- Do **not** submit real banking credentials, personal financial information, or production secrets to the live demo or this repository.
- Secrets belong in local `.env`, Vercel project env, and GitHub Actions / Environment secrets — never in commits or `.env.example`.

## Response

This is a solo-maintained demo. Reports are reviewed on a best-effort basis. Confirmed issues that affect visitors of the live demo will be prioritized (e.g. secret exposure, auth bypass, destructive demo-reset abuse).
