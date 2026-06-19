# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo layout

Argus is a **polyglot monorepo**. The only thing shared across components is the gRPC
contract in `proto/argus.proto` — each component generates its own stubs from it.

```
Argus/
├── proto/argus.proto       ← single source of truth for the agent↔server contract
├── argus-server/           ← central server — Java 21 + Spring Boot (Gradle)
├── argus-agent-linux/      ← agent for Linux — C++ + native gRPC (planned)
├── argus-agent-windows/    ← agent for Windows — .NET/C# + grpc-dotnet (planned)
└── sql/                    ← hand-written schema, queries, and migrations (PostgreSQL)
```

Each agent is **single-OS and native** (no cross-compilation, no shared agent code):
C++ talks to systemd directly, .NET talks to the Windows SCM directly. Do **not**
reintroduce a cross-platform abstraction layer for the agents — only `proto/` is shared.

## Build Commands

Server (run from `argus-server/`):
```bash
./gradlew build          # compile + generate Java/gRPC stubs from ../proto/argus.proto + test
./gradlew bootRun        # run the server (needs PostgreSQL reachable)
./gradlew test           # run tests
```
Proto stubs are generated automatically by the Gradle `com.google.protobuf` plugin —
there is no manual `protoc` step. The plugin reads `../proto` (see `sourceSets` in
`build.gradle.kts`).

## Architecture

Argus is a remote infrastructure control panel. Agents run inside remote networks and **dial out** to the central server — no inbound ports needed (NAT/firewall traversal).

```
[Home / local server]                [Remote network]
  Web Dashboard (SvelteKit)
  Argus Server (Java)  ◀──gRPC/TLS──  Agent (C++ / .NET, native binary)
  PostgreSQL
```

### Key design decisions

**gRPC bidirectional stream** — `AgentService.Connect` in `proto/argus.proto` is a single persistent `stream AgentMessage` / `stream ServerCommand` channel. The agent sends telemetry (heartbeat, metrics, command results); the server pushes commands (service actions, shell). Avoid adding separate unary RPCs; extend the `oneof` payloads instead. The proto carries both `go_package` (legacy) and `java_package = com.argus.proto`.

**Two native agents, one contract** — instead of a shared cross-platform agent, there is one agent per OS written in its native stack (C++ on Linux, .NET on Windows). They share nothing but `proto/argus.proto`. Add OS-level operations directly in each agent using its native API; never try to unify them in code.

**Agent owns the connection** — agent dials out, not the server. The agent holds the gRPC client connection and must handle reconnect loops. The server is passive — it receives incoming streams from agents.

### Server stack (`argus-server/`)

- **Java 21** with **Virtual Threads** enabled (`spring.threads.virtual.enabled=true`) to hold many concurrent agent streams cheaply.
- **Spring Boot 3.3.5**, built with **Gradle** (Kotlin DSL, wrapper pinned to 8.10.2).
- **gRPC** via the `net.devh:grpc-server-spring-boot-starter` (`@GrpcService` beans, server on port 9090).
- **Web/WebSocket** API for the dashboard via `spring-boot-starter-web` (port 8080).
- **JOOQ** for data access (SQL-first — pairs with the hand-written `sql/queries.sql`).
- **Flyway** for migrations (`src/main/resources/db/migration`).

#### Java package map (`com.argus`)

| Package | Role |
|---|---|
| `config` | Spring `@Configuration` beans (security, gRPC, CORS) |
| `grpc` | `@GrpcService` impls — the `AgentService.Connect` stream; delegates to `service` |
| `web` | REST controllers + WebSocket endpoints for the SvelteKit dashboard |
| `service` | Business logic, incl. the in-memory **agent hub** (live connection registry / command routing) |
| `domain` | Framework-agnostic domain model types |
| `persistence` | JOOQ repositories backed by `sql/queries.sql` |

### SQL (`sql/`)

Hand-written and authoritative. `schema.sql` is a `pg_dump` of the full schema;
`queries.sql` holds the queries the server runs; `migrations/` holds the versioned
DDL. **Note:** the migrations are still in **goose** format (`-- +goose Up`, named
`00001_*.sql`) and must be converted to Flyway (`V1__*.sql`, drop the `-- +goose Down`
blocks) before they run — see `argus-server/src/main/resources/db/migration/README.md`.

### Current state

`argus-server/` is a scaffold: the Spring Boot shell, build, and config exist, but the
gRPC service, web controllers, domain model, and JOOQ persistence are not yet
implemented (empty packages documented via `package-info.java`). The C++ and .NET agents
are not created yet. The old Go implementation has been removed.
