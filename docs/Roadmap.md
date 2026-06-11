# Roadmap

→ [[Argus]]

## Fase 1 — Fundação (atual)

- [x] Schema PostgreSQL (6 migrations)
- [x] Queries sqlc (42 funções geradas)
- [x] Proto definido (`AgentService.Connect`)
- [ ] `internal/agent/` — loop gRPC real + reconexão
- [ ] `internal/server/` — hub, receber streams, salvar DB
- [ ] `cmd/server/` — pool PostgreSQL, flags, wire

## Fase 2 — Funcionalidade core

- [ ] Agent envia heartbeat + métricas reais (`/proc`, WMI)
- [ ] Agent executa `ServiceAction` (systemctl / sc.exe)
- [ ] Agent executa `ShellCommand` e retorna output
- [ ] Server expõe REST API (list agents, send command)
- [ ] Autenticação JWT
- [ ] Offline sweep periódico (`SetOfflineAgentsSince`)

## Fase 3 — Dashboard

- [ ] SvelteKit — inventário de agents
- [ ] WebSocket — métricas real-time
- [ ] Gráficos de CPU/RAM/disco (usando `ListMetricsSince`)
- [ ] Painel de serviços por agent
- [ ] Terminal web (stream ShellCommand)

## Fase 4 — Multi-tenant completo

- [ ] Fluxo de convite de membro
- [ ] Role-based access (admin / member / viewer)
- [ ] Viewer vê apenas seu device ([[Autenticação]])
- [ ] Audit log UI

## Dependências a adicionar

```bash
go get google.golang.org/grpc
go get google.golang.org/protobuf
# então:
make proto
```
