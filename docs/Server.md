# Server

→ [[Argus]] | → [[Arquitetura]] | → [[Protocolo gRPC]]

Hub central. Recebe streams de múltiplos [[Agent|agentes]] simultaneamente.

## Responsabilidades

- Escutar conexões gRPC incoming
- Manter mapa de agents conectados (in-memory)
- Expor API REST + WebSocket para o dashboard
- Persistir dados no [[Banco de Dados]]
- Marcar agents offline quando heartbeat para

## Entrypoint

`cmd/server/main.go` — flags, config, wiring

## Implementação

`internal/server/server.go` — hub, gRPC listener, HTTP/WS API

## Fluxo de um agent se conectando

```
Agent.Connect(stream)
  → autenticar token_hash → GetAgentByTokenHash
  → registrar stream no hub
  → loop: receber AgentMessage
      Heartbeat   → UpdateAgentLastSeen
      Metrics     → InsertMetric
      CommandResult → InsertCommandResult
  → ao desconectar: SetAgentOffline
```

## Offline sweep

Job periódico: `SetOfflineAgentsSince($interval)` — marca offline agents sem heartbeat.

## API (planejada)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/agents` | Lista agents da org |
| POST | `/agents/:id/command` | Envia comando |
| WS | `/ws/metrics/:id` | Stream de métricas real-time |
