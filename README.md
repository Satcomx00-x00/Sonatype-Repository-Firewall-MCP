# Sonatype Repository Firewall MCP

A **state-of-the-art Model Context Protocol (MCP) server** for the [Sonatype Repository Firewall](https://www.sonatype.com/products/sonatype-repository-firewall) and [IQ Server](https://help.sonatype.com/iqserver) REST APIs.

Built with [FastMCP](https://github.com/punkpeye/fastmcp) + [Zod](https://zod.dev) — fully typed, SOLID-principled, with structured logging and in-process tracing.

---

## Features

| Category | Capability |
|---|---|
| 🔥 Firewall Metrics | Dashboard metrics — quarantined counts, repository stats |
| 🔒 Quarantine | Summary of quarantined components per repository |
| ✅ Auto-Release | Summary and configuration of auto-release-from-quarantine |
| 📦 Applications | List / get applications registered in IQ Server |
| 🏢 Organizations | List all IQ Server organizations |
| 📊 Policy Reports | List and fetch raw report data with violations |
| 🔍 Component Evaluation | Submit components for policy evaluation; fetch results |
| 🚫 Policy Waivers | List active waivers per application |
| 🔗 Source Control | Retrieve SCM integration configuration |
| ⚙️ Nexus Integration | Get/update IQ config, verify connection, enable/disable firewall *(optional)* |

---

## Installation

```bash
npm install @satcomx00-x00/sonatype-repository-firewall-mcp
```

Or install globally:

```bash
npm install -g @satcomx00-x00/sonatype-repository-firewall-mcp
```

---

## Configuration

Copy the example environment file and set your values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `IQ_SERVER_URL` | ✅ | `http://localhost:8070` | Base URL of your Sonatype IQ Server |
| `IQ_SERVER_USERNAME` | ✅ | `admin` | IQ Server username |
| `IQ_SERVER_PASSWORD` | ✅ | `admin123` | IQ Server password |
| `NEXUS_URL` | ❌ | — | Nexus Repository Manager URL *(enables Nexus tools)* |
| `NEXUS_USERNAME` | ❌ | — | Nexus username |
| `NEXUS_PASSWORD` | ❌ | — | Nexus password |
| `HTTP_TIMEOUT_MS` | ❌ | `30000` | HTTP request timeout (ms) |
| `HTTP_RETRY_COUNT` | ❌ | `3` | Retries on transient errors (max 5) |
| `HTTP_RETRY_DELAY_MS` | ❌ | `500` | Base back-off delay between retries (ms) |
| `MCP_TRANSPORT` | ❌ | `stdio` | Transport: `stdio` or `httpStream` |
| `MCP_HTTP_PORT` | ❌ | `3000` | HTTP port when `MCP_TRANSPORT=httpStream` |
| `LOG_LEVEL` | ❌ | `info` | Log level: `debug` \| `info` \| `warn` \| `error` |

---

## Usage

### stdio (default — for MCP clients like Claude Desktop, Continue, etc.)

```bash
# Run directly
npx sonatype-firewall-mcp

# Or with environment variables
IQ_SERVER_URL=https://iq.example.com IQ_SERVER_USERNAME=admin IQ_SERVER_PASSWORD=secret npx sonatype-firewall-mcp
```

### HTTP Stream

```bash
MCP_TRANSPORT=httpStream MCP_HTTP_PORT=3000 npx sonatype-firewall-mcp
```

### Claude Desktop configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sonatype-firewall": {
      "command": "npx",
      "args": ["-y", "@satcomx00-x00/sonatype-repository-firewall-mcp"],
      "env": {
        "IQ_SERVER_URL": "https://iq.example.com",
        "IQ_SERVER_USERNAME": "admin",
        "IQ_SERVER_PASSWORD": "your-password"
      }
    }
  }
}
```

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode (tsx, no build required)
npm run dev

# Build TypeScript
npm run build

# Type-check only
npm run lint

# Start built server
npm start
```

---

## Architecture

The project follows **SOLID principles**:

| Principle | Implementation |
|---|---|
| **S**ingle Responsibility | Each module owns one concern: `config.ts` → env vars, `http-client.ts` → HTTP, `iq-service.ts` → IQ API calls, tools → MCP registrations |
| **O**pen/Closed | Tools are plain values; adding new tools = add to the array, never modify existing tools |
| **L**iskov Substitution | `HttpClient` accepted anywhere `HttpClientOptions`-compatible |
| **I**nterface Segregation | Small focused interfaces: `Span`, `Logger`, `HttpClientOptions` |
| **D**ependency Inversion | Services receive `HttpClient` via constructor; tools receive services; `index.ts` composes everything |

### Directory structure

```
src/
├── config.ts              # Env-var parsing & Zod validation
├── server.ts              # FastMCP server factory
├── index.ts               # Entry point – wires everything together
├── types/
│   └── firewall.ts        # TypeScript types for all Sonatype API shapes
├── services/
│   ├── iq-service.ts      # Sonatype IQ Server REST API wrapper
│   └── nexus-service.ts   # Nexus Repository Manager REST API wrapper
├── tools/
│   ├── iq-tools.ts        # MCP tools for IQ Server endpoints
│   └── nexus-tools.ts     # MCP tools for Nexus endpoints
└── utils/
    ├── http-client.ts     # Generic HTTP client (auth, retry, timeout)
    ├── logger.ts          # Structured JSON logger (→ stderr)
    └── tracer.ts          # Lightweight in-process span tracer
```

---

## Available MCP Tools

### Sonatype IQ Server

| Tool | Description |
|---|---|
| `get_firewall_metrics` | Firewall dashboard metrics |
| `get_quarantine_summary` | Quarantined components summary |
| `get_release_quarantine_summary` | Auto-released from quarantine summary |
| `get_release_quarantine_configuration` | Auto-release configuration & conditions |
| `list_applications` | List all IQ Server applications |
| `get_application` | Get a specific application by ID |
| `list_organizations` | List all organizations |
| `list_application_reports` | List policy evaluation reports for an app |
| `get_report_data` | Get raw report data with violations |
| `evaluate_components` | Submit components for policy evaluation |
| `get_evaluation_results` | Get results of a submitted evaluation |
| `list_waivers` | List active policy waivers for an app |
| `get_source_control` | Get SCM configuration for an owner |

### Nexus Repository Manager *(requires `NEXUS_URL`)*

| Tool | Description |
|---|---|
| `get_nexus_iq_configuration` | Get IQ Server integration configuration |
| `update_nexus_iq_configuration` | Update IQ Server integration settings |
| `verify_nexus_iq_connection` | Test connection from Nexus to IQ Server |
| `enable_nexus_firewall` | Enable Repository Firewall integration |
| `disable_nexus_firewall` | Disable Repository Firewall integration |

---

## CI / CD

The repository ships two GitHub Actions workflows:

### `ci.yml` — Continuous Integration

Runs on every **push** and **pull request** targeting `main` / `master`:

1. Checks out the code
2. Installs dependencies with `npm ci`
3. Type-checks with `tsc --noEmit`
4. Builds with `tsc`
5. Runs `npm test`

Tests against Node.js **18**, **20**, and **22** in parallel.

### `publish.yml` — Publish to npm

Triggered when a **GitHub Release is published** (or manually via `workflow_dispatch`):

1. Builds the package
2. Verifies contents with `npm pack --dry-run`
3. Publishes to the **public npm registry** with provenance attestation

#### Required secret

Add `NPM_TOKEN` to your repository secrets (**Settings → Secrets and variables → Actions**):

1. Generate an **Automation** token at <https://www.npmjs.com/settings/~/tokens>
2. Add it as `NPM_TOKEN` in the repository / environment secrets
3. The workflow uses the `npm-publish` GitHub environment — create that environment in **Settings → Environments** and scope the secret there for additional protection

#### Releasing a new version

```bash
# Bump version
npm version patch   # or minor / major

# Push commit + tag
git push --follow-tags

# Create a GitHub Release from the tag — the publish workflow fires automatically
```

---

## License

GPL-3.0 — See [LICENSE](./LICENSE)
