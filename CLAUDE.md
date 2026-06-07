# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
make server           # build central server → bin/server
make agent-linux      # build agent for Linux amd64 → bin/agent-linux
make agent-linux-arm  # build agent for Linux ARM64 → bin/agent-linux-arm
make agent-windows    # build agent for Windows amd64 → bin/agent.exe
make proto            # regenerate Go from proto/argus.proto
make clean            # remove bin/
```

Proto codegen requires `protoc`, `protoc-gen-go`, and `protoc-gen-go-grpc` on PATH.

Run a single package's tests:
```bash
go test ./internal/agent/...
```

## Architecture

Argus is a remote infrastructure control panel. Agents run inside remote networks and **dial out** to the central server — no inbound ports needed (NAT/firewall traversal).

```
[Home / local server]                [Remote network]
  Web Dashboard (SvelteKit)
  Argus Server  ◀──gRPC/TLS──  Agent (lightweight binary)
  PostgreSQL
```

### Key design decisions

**gRPC bidirectional stream** — `AgentService.Connect` in `proto/argus.proto` is a single persistent `stream AgentMessage` / `stream ServerCommand` channel. The agent sends telemetry (heartbeat, metrics, command results); the server pushes commands (service actions, shell). Avoid adding separate unary RPCs; extend the `oneof` payloads instead.

**Platform abstraction via build tags** — `internal/platform/linux.go` (`//go:build linux`) and `windows.go` (`//go:build windows`) expose identical function signatures (`ServiceAction`, `ListServices`). Add new OS-level operations by implementing the same signature in both files; never add `runtime.GOOS` switches.

**Agent owns the connection** — agent dials out, not the server. `internal/agent/agent.Agent` holds the gRPC client conn and must handle reconnect loops. `internal/server/server.Server` is passive — it receives incoming streams from agents.

### Package map

| Path | Role |
|---|---|
| `cmd/server/` | Server entrypoint — flags, config, wires `internal/server` |
| `cmd/agent/` | Agent entrypoint — `--server`, `--token` flags, wires `internal/agent` |
| `internal/server/` | Hub: manages connected agents, gRPC listener, HTTP/WebSocket API |
| `internal/agent/` | gRPC client, reconnect loop, command dispatch |
| `internal/platform/` | OS-specific service management (build-tag selected) |
| `proto/` | Source of truth for agent↔server contract |
| `web/` | SvelteKit dashboard (planned, not yet created) — will be embedded in server binary |

### Current state

Most `internal/` code is stubs with `TODO` comments. `go.mod` has no external dependencies yet — add `google.golang.org/grpc` and `google.golang.org/protobuf` before running `make proto` output.
