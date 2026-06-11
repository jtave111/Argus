# Argus

Painel de controle remoto para infraestrutura multi-tenant.

## Links principais

- [[Arquitetura]] — visão geral do sistema
- [[Banco de Dados]] — schema PostgreSQL
- [[Protocolo gRPC]] — contrato agente ↔ servidor
- [[Agent]] — binário leve nas redes remotas
- [[Server]] — hub central
- [[Autenticação]] — usuários, orgs, tokens
- [[Roadmap]] — próximos passos

## Stack

| Camada | Tech |
|--------|------|
| Agent + Server | Go 1.23 |
| Protocolo | gRPC + Protobuf 3 |
| Frontend | SvelteKit (planejado) |
| Banco | PostgreSQL + goose + sqlc |
| Real-time | WebSocket / SSE |

## Repositório

`github.com/jtave111/argus`
