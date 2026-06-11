# Agent

→ [[Argus]] | → [[Arquitetura]] | → [[Protocolo gRPC]]

Binário leve que roda dentro da rede remota.

## Responsabilidades

- Dial-out ao [[Server]] via gRPC/TLS
- Enviar heartbeat + métricas periódicas
- Receber e executar comandos (service action, shell)
- Reconectar automaticamente ao cair

## Entrypoint

`cmd/agent/main.go` — flags: `--server`, `--token`

## Implementação

`internal/agent/agent.go` — gRPC client, reconnect loop, dispatch de comandos

## Plataformas

| OS | Build tag | Arquivo |
|----|-----------|---------|
| Linux amd64 | `linux` | `internal/platform/linux.go` |
| Linux ARM64 | `linux` | `internal/platform/linux.go` |
| Windows amd64 | `windows` | `internal/platform/windows.go` |

```bash
make agent-linux       # bin/agent-linux
make agent-linux-arm   # bin/agent-linux-arm
make agent-windows     # bin/agent.exe
```

## Registro no banco

Agent registra via `RegisterAgent` com `token_hash` único.  
Autenticado em cada conexão via `GetAgentByTokenHash`.

### Binding de usuário (migration 006)

Agent pode ser vinculado a um empregado via `user_organization_id`.  
Campos: `os_user`, `os_user_fullname`, `os_user_email`.  
Ver [[Autenticação]].

## Hardware coletado

Via `UpsertAgentHardware`: cpu_model, cpu_cores, cpu_threads, ram_total_bytes, disk_total_bytes.  
Via `agent_network_interfaces`: interfaces de rede com speed_mbps.

## Métricas enviadas

cpu_percent, ram_percent, disk_percent, net_in_kbps, net_out_kbps → `InsertMetric`.
