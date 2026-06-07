<div align="center">

```
 █████╗ ██████╗  ██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔════╝ ██║   ██║██╔════╝
███████║██████╔╝██║  ███╗██║   ██║███████╗
██╔══██║██╔══██╗██║   ██║██║   ██║╚════██║
██║  ██║██║  ██║╚██████╔╝╚██████╔╝███████║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
```

**Painel de controle remoto para gerenciamento de infraestrutura**

[![Go](https://img.shields.io/badge/Go_1.23-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev/)
[![gRPC](https://img.shields.io/badge/gRPC-244C5A?style=flat-square&logo=grpc&logoColor=white)](https://grpc.io/)
[![Protobuf](https://img.shields.io/badge/Protocol_Buffers-4285F4?style=flat-square&logo=google&logoColor=white)](https://protobuf.dev/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

*Gerencie serviços, processos, métricas e redes de qualquer servidor — de qualquer lugar*

</div>

---

## Visão Geral

O **Argus** é uma plataforma de gerenciamento remoto de infraestrutura. Agentes leves rodam dentro das redes remotas e **conectam para fora** ao servidor central — funcionam através de NAT e firewall sem precisar abrir uma única porta.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Sua casa / servidor local                                           │
│                                                                      │
│   ┌─────────────────────┐         ┌────────────────────────────┐    │
│   │  Dashboard Web      │◀───────▶│  Argus Server (Go)         │    │
│   │  SvelteKit          │  HTTP/  │  gRPC listener             │    │
│   └─────────────────────┘  WS     │  REST + WebSocket API      │    │
│                                   └────────────┬───────────────┘    │
│                                                │                    │
│                                   ┌────────────▼───────────────┐    │
│                                   │  PostgreSQL                │    │
│                                   └────────────────────────────┘    │
└─────────────────────────────────────────────┲━━━━━━━━━━━━━━━━━━━━━━━┘
                                              ┃ gRPC / TLS
                          ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
                          ┃                                         ┃
          ┌───────────────┴────────────┐           ┌───────────────┴────────────┐
          │  Rede Remota A             │           │  Rede Remota B             │
          │                           │           │                            │
          │  Agent (Linux / ARM)  ────┼──dial out─┤  Agent (Windows)           │
          │  systemctl, /proc         │           │  sc.exe, WMI               │
          └───────────────────────────┘           └────────────────────────────┘
```

O agente **inicia a conexão** — o servidor nunca precisa alcançar os endpoints. Uma única stream gRPC bidirecional persistente carrega telemetria nos dois sentidos: o agente envia métricas e resultados, o servidor envia comandos.

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Métricas em tempo real** | CPU, RAM e disco coletados pelo agente e exibidos no dashboard via WebSocket |
| **Gerenciamento de serviços** | start · stop · restart · status — Linux via `systemctl`, Windows via `sc.exe` |
| **Execução de shell** | Envio de comandos arbitrários aos endpoints com retorno de stdout e exit code |
| **Suporte multi-plataforma** | Binários para Linux amd64, Linux ARM64 (Raspberry Pi) e Windows amd64 |
| **NAT traversal nativo** | Agente conecta para fora — sem VPN, sem port forwarding |
| **Reconexão automática** | Agente mantém a stream viva e reconecta ao cair |
| **Dashboard SOC** | Inventário de endpoints, status semafórico e feed de métricas (SvelteKit, planejado) |
| **Autenticação por token** | Cada agente se autentica com `--token` no handshake gRPC |

---

## Protocolo gRPC

O contrato entre agente e servidor está definido em `proto/argus.proto`. Uma única RPC bidirecional:

```
AgentService.Connect(stream AgentMessage) → stream ServerCommand
```

**Agente → Servidor** (`AgentMessage.payload`)

| Tipo | Campos | Frequência |
|------|--------|------------|
| `Heartbeat` | `timestamp` | Periódico |
| `Metrics` | `cpu_percent`, `ram_percent`, `disk_percent` | Periódico |
| `CommandResult` | `command_id`, `output`, `exit_code` | Sob demanda |

**Servidor → Agente** (`ServerCommand.payload`)

| Tipo | Campos | Ação |
|------|--------|------|
| `ServiceCommand` | `action` (start/stop/restart/status), `service` | Gerenciar serviço |
| `ShellCommand` | `command` | Executar no shell do endpoint |

---

## Estrutura do Projeto

```
Argus/
├── cmd/
│   ├── server/main.go       ← entrypoint do servidor (flags, config, wiring)
│   └── agent/main.go        ← entrypoint do agente (--server, --token)
├── internal/
│   ├── server/server.go     ← hub central: recebe streams, expõe API
│   ├── agent/agent.go       ← cliente gRPC, reconexão, dispatch de comandos
│   └── platform/
│       ├── linux.go         ← systemctl, /proc  [build tag: linux]
│       └── windows.go       ← sc.exe, WMI       [build tag: windows]
├── proto/
│   └── argus.proto          ← fonte da verdade do contrato agente ↔ servidor
├── web/                     ← dashboard SvelteKit (embedado no binário — planejado)
├── bin/                     ← binários compilados (ignorado pelo git)
├── Makefile
└── go.mod
```

---

## Build

### Pré-requisitos

- Go 1.23+
- `protoc` + plugins Go (apenas para regenerar o proto):

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### Compilar

```bash
# Servidor central
make server

# Agente Linux (amd64)
make agent-linux

# Agente Linux ARM64 (Raspberry Pi, servidores ARM)
make agent-linux-arm

# Agente Windows
make agent-windows

# Regenerar código Go a partir do proto
make proto

# Limpar binários
make clean
```

Os binários são gerados em `bin/`.

---

## Deploy do Agente

Copie o binário para a máquina remota e execute:

```bash
# Linux
scp bin/agent-linux usuario@192.168.1.x:/opt/argus/agent
ssh usuario@192.168.1.x "/opt/argus/agent --server grpcs://meu-servidor:443 --token TOKEN"
```

```powershell
# Windows (PowerShell como Administrador)
.\agent.exe --server grpcs://meu-servidor:443 --token TOKEN
```

O agente aparece automaticamente no dashboard após a primeira conexão.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Agent + Server | Go 1.23 |
| Protocolo | gRPC + Protocol Buffers 3 |
| Frontend | SvelteKit (embedado no binário do server) |
| Real-time | WebSocket + SSE |
| Banco de dados | PostgreSQL |
| Gerenciamento Linux | systemctl · /proc |
| Gerenciamento Windows | sc.exe · WMI |

---

## Contribuindo

```bash
git clone https://github.com/jtave111/argus.git
cd argus
git checkout -b feat/nome-da-feature
git commit -m "feat: descrição da feature"
git push origin feat/nome-da-feature
```

---

## Licença

Distribuído sob a licença **MIT**.

---

<div align="center">

*Visibilidade total · Controle remoto · Zero port forwarding*

</div>
