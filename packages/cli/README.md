# OwnSurface CLI

OwnSurface is a powerful security scanner and website intelligence platform. This CLI allows you to perform scans, detect tech stacks, and run offensive testing directly from your terminal.

## Installation

Install the CLI globally via npm:

```bash
npm install -g @ownsurface/cli
```

## Getting Started

### 1. Authenticate

You'll need an API key to use most features. You can get one at [ownsurface.com/dashboard/api-keys](https://ownsurface.com/dashboard/api-keys).

```bash
os login
```

### 2. Run a Scan

Quickly analyze any website's security and technology stack:

```bash
os scan https://example.com
```

## Features

- **Security Audits**: Identify misconfigured headers and network vulnerabilities.
- **Tech Detection**: Discover the frameworks and libraries (React, Next.js, etc.) used by a site.
- **Offensive Testing**: Run targeted tests for SQLi, XSS, and more.
- **Deep Scanning**: Multi-page crawler for comprehensive analysis.
- **MCP Support**: Use as a Model Context Protocol server.

## Usage

```bash
os --help
```

### Commands

- `os scan <url>`: Start a basic security and tech scan.
- `os deep-scan <domain>`: Start a deep, multi-page audit.
- `os offensive <domain>`: Trigger offensive security tests.
- `os monitor summary`: View your current monitoring status.

## Environment Variables

- `OWNSURFACE_API_KEY`: Set your API key in your environment.
- `OWNSURFACE_API_URL`: Override the API base URL (default: https://api.ownsurface.com).

## License

MIT
