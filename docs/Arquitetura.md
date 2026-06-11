# Arquitetura

→ [[Argus]]

## Fluxo principal

```
[Sua rede]
  Dashboard (SvelteKit)
       ↕ HTTP / WebSocket
  Argus Server (Go)
       ↕ gRPC/TLS  (agent dialout — sem inbound)
  Agent (Linux / Windows / ARM)
```

## Componentes

- [[Server]] — recebe streams, expõe REST + WebSocket
- [[Agent]] — binário leve, dial-out, reconexão automática
- [[Protocolo gRPC]] — stream bidirecional única
- [[Banco de Dados]] — PostgreSQL multi-tenant

## Decisões de design

### Agent dialout
Agente **inicia** a conexão. Servidor nunca precisa alcançar o endpoint.  
Sem VPN, sem port forwarding, atravessa NAT/firewall nativamente.

### Stream única
`AgentService.Connect` = um único `stream AgentMessage ↔ stream ServerCommand`.  
Não criar RPCs unárias separadas — estender os `oneof` payloads.

### Build tags por plataforma
`internal/platform/linux.go` → `//go:build linux`  
`internal/platform/windows.go` → `//go:build windows`  
Mesmas assinaturas (`ServiceAction`, `ListServices`). Nunca usar `runtime.GOOS`.

## Multi-tenant

```
Organization
  └── Network (n redes por org)
        └── Agent (n agents por rede)
              └── user_organization_id → UserOrganization (binding empregado)
```

Ver [[Autenticação]] para fluxo de login.
