# Protocolo gRPC

→ [[Argus]] | → [[Arquitetura]] | → [[Agent]] | → [[Server]]

Definido em `proto/argus.proto`.

## RPC

```protobuf
service AgentService {
  rpc Connect(stream AgentMessage) returns (stream ServerCommand);
}
```

Stream bidirecional única e persistente. Não criar RPCs unárias separadas.

## Agent → Server (`AgentMessage`)

| Tipo | Campos | Quando |
|------|--------|--------|
| `Heartbeat` | `timestamp` | Periódico |
| `Metrics` | `cpu_percent`, `ram_percent`, `disk_percent` | Periódico |
| `CommandResult` | `command_id`, `output`, `exit_code` | Resposta a comando |

## Server → Agent (`ServerCommand`)

| Tipo | Campos | Ação |
|------|--------|------|
| `ServiceCommand` | `action` (start/stop/restart/status), `service` | Gerenciar serviço |
| `ShellCommand` | `command` | Executar shell no endpoint |

## Como estender

Adicionar ao `oneof` do proto, não criar nova RPC:

```protobuf
oneof payload {
  Heartbeat heartbeat = 1;
  Metrics metrics = 2;
  CommandResult command_result = 3;
  // novo tipo aqui
}
```

Regenerar: `make proto`
