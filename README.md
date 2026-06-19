<div align="center">

<pre>
 █████╗ ██████╗  ██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔════╝ ██║   ██║██╔════╝
███████║██████╔╝██║  ███╗██║   ██║███████╗
██╔══██║██╔══██╗██║   ██║██║   ██║╚════██║
██║  ██║██║  ██║╚██████╔╝╚██████╔╝███████║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
</pre>

**Painel de controle remoto para gerenciamento de infraestrutura**

[![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![C++](https://img.shields.io/badge/C%2B%2B-00599C?style=flat-square&logo=cplusplus&logoColor=white)](https://isocpp.org/)
[![.NET](https://img.shields.io/badge/.NET-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
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

É um **monorepo poliglota**: cada componente usa a stack ideal para o seu papel e todos compartilham um único contrato (`proto/argus.proto`).

```
┌──────────────────────────────────────────────────────────────────────┐
│  Sua casa / servidor local                                           │
│                                                                      │
│   ┌─────────────────────┐         ┌────────────────────────────┐    │
│   │  Dashboard Web      │◀───────▶│  Argus Server (Java)       │    │
│   │  SvelteKit          │  HTTP/  │  Spring Boot · gRPC        │    │
│   └─────────────────────┘  WS     │  REST + WebSocket API      │    │
│                                   └────────────┬───────────────┘    │
│                                                │                    │
│                                   ┌────────────▼───────────────┐    │
│                                   │  PostgreSQL                │    │
│                                   └────────────────────────────┘    │
└─────────────────────────────────────────────┲━━━━━━━━━━━━━━━━━━━━━━━┛
                                              ┃ gRPC / TLS
                          ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
                          ┃                                         ┃
          ┌───────────────┴────────────┐           ┌───────────────┴────────────┐
          │  Rede Remota A             │           │  Rede Remota B             │
          │                           │           │                            │
          │  Agent Linux (C++)  ──────┼──dial out─┤  Agent Windows (.NET)      │
          │  systemd, /proc           │           │  SCM, WMI                  │
          └───────────────────────────┘           └────────────────────────────┘
```

O agente **inicia a conexão** — o servidor nunca precisa alcançar os endpoints. Uma única stream gRPC bidirecional persistente carrega telemetria nos dois sentidos: o agente envia métricas e resultados, o servidor envia comandos.

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Métricas em tempo real** | CPU, RAM e disco coletados pelo agente e exibidos no dashboard via WebSocket |
| **Gerenciamento de serviços** | start · stop · restart · status — Linux via `systemd`, Windows via SCM |
| **Execução de shell** | Envio de comandos arbitrários aos endpoints com retorno de stdout e exit code |
| **Agentes nativos por SO** | C++ no Linux (incl. ARM/Raspberry Pi), .NET no Windows — binários enxutos, sem runtime extra |
| **NAT traversal nativo** | Agente conecta para fora — sem VPN, sem port forwarding |
| **Reconexão automática** | Agente mantém a stream viva e reconecta ao cair |
| **Alta concorrência** | Servidor Java com Virtual Threads (Java 21) segura milhares de agentes simultâneos |
| **Dashboard SOC** | Inventário de endpoints, status semafórico e feed de métricas (SvelteKit, planejado) |
| **Autenticação por token** | Cada agente se autentica com `--token` no handshake gRPC |

---

## Protocolo gRPC

O contrato entre agente e servidor está definido em `proto/argus.proto` — a **fonte única da verdade**. O servidor Java e os agentes (C++/.NET) geram seus stubs a partir dele. Uma única RPC bidirecional:

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
├── proto/
│   └── argus.proto            ← contrato único agente ↔ servidor (fonte da verdade)
├── argus-server/              ← servidor central — Java 21 + Spring Boot (Gradle)
│   ├── build.gradle.kts
│   └── src/main/
│       ├── java/com/argus/
│       │   ├── config/        ← beans @Configuration
│       │   ├── grpc/          ← @GrpcService — stream AgentService.Connect
│       │   ├── web/           ← controllers REST + WebSocket (dashboard)
│       │   ├── service/       ← regras de negócio + hub de agentes
│       │   ├── domain/        ← modelo de domínio
│       │   └── persistence/   ← repositórios JOOQ
│       └── resources/
│           ├── application.yml
│           └── db/migration/  ← migrations Flyway
├── argus-agent-linux/         ← agente Linux — C++ + gRPC nativo (planejado)
├── argus-agent-windows/       ← agente Windows — .NET/C# + grpc-dotnet (planejado)
└── sql/                       ← schema, queries e migrations (PostgreSQL)
```

---

## Setup Local

### Banco de dados

```bash
# Inicializar cluster PostgreSQL (só na primeira vez)
sudo -u postgres initdb --locale=C.UTF-8 --encoding=UTF8 -D '/var/lib/postgres/data'
sudo systemctl enable --now postgresql

# Criar usuário e banco
psql -U postgres -c "CREATE USER argus WITH PASSWORD 'sua_senha';"
psql -U postgres -c "CREATE DATABASE argus OWNER argus;"
```

O **Flyway** roda as migrations automaticamente quando o servidor sobe (`spring.flyway`).
As migrations em `sql/migrations/` ainda estão no formato **goose** e precisam ser
convertidas para o padrão Flyway — veja `argus-server/src/main/resources/db/migration/README.md`.

Configure a conexão por variáveis de ambiente (com defaults em `application.yml`):

```bash
export ARGUS_DB_URL=jdbc:postgresql://localhost:5432/argus
export ARGUS_DB_USER=argus
export ARGUS_DB_PASSWORD=sua_senha
```

---

## Build

### Servidor (`argus-server/`)

Pré-requisito: **JDK 21**. O Gradle Wrapper cuida do resto (inclusive o `protoc`).

```bash
cd argus-server

./gradlew build      # compila, gera os stubs do proto e roda os testes
./gradlew bootRun    # sobe o servidor (precisa do PostgreSQL acessível)
```

O servidor expõe a API HTTP/WebSocket na porta `8080` e o listener gRPC na `9090`.

### Agentes

- **Linux (C++)** → `argus-agent-linux/` *(planejado)* — compila nativo no Linux com gRPC C++.
- **Windows (.NET)** → `argus-agent-windows/` *(planejado)* — `dotnet publish` com grpc-dotnet.

---

## Deploy do Agente

Copie o binário para a máquina remota e execute apontando para o servidor:

```bash
# Linux
scp argus-agent usuario@192.168.1.x:/opt/argus/agent
ssh usuario@192.168.1.x "/opt/argus/agent --server grpcs://meu-servidor:443 --token TOKEN"
```

```powershell
# Windows (PowerShell como Administrador)
.\argus-agent.exe --server grpcs://meu-servidor:443 --token TOKEN
```

O agente aparece automaticamente no dashboard após a primeira conexão.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Servidor | Java 21 · Spring Boot · Virtual Threads |
| Acesso a dados | JOOQ · Flyway · PostgreSQL |
| Agente Linux | C++ · gRPC nativo |
| Agente Windows | .NET / C# · grpc-dotnet |
| Protocolo | gRPC + Protocol Buffers 3 |
| Frontend | SvelteKit |
| Real-time | WebSocket + SSE |
| Gerenciamento Linux | systemd · /proc |
| Gerenciamento Windows | SCM · WMI |

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
