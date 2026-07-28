<div align="center">

<pre>
 █████╗ ██████╗  ██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔════╝ ██║   ██║██╔════╝
███████║██████╔╝██║  ███╗██║   ██║███████╗
██╔══██║██╔══██╗██║   ██║██║   ██║╚════██║
██║  ██║██║  ██║╚██████╔╝╚██████╔╝███████║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
</pre>

**Painel de controle remoto para gerenciamento de infraestrutura (RMM)**

[![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![JavaFX](https://img.shields.io/badge/JavaFX-1F6FEB?style=flat-square&logo=openjdk&logoColor=white)](https://openjfx.io/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![gRPC](https://img.shields.io/badge/gRPC-244C5A?style=flat-square&logo=grpc&logoColor=white)](https://grpc.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![C++](https://img.shields.io/badge/C%2B%2B-00599C?style=flat-square&logo=cplusplus&logoColor=white)](https://isocpp.org/)
[![.NET](https://img.shields.io/badge/.NET-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

*Gerencie serviços, processos, métricas e redes de qualquer servidor — de qualquer lugar*

</div>

---

## Visão Geral

O **Argus** é uma plataforma de **RMM** (*Remote Monitoring & Management*) — gerenciamento e
monitoramento remoto de infraestrutura. Agentes leves rodam dentro das redes remotas e
**conectam para fora** ao servidor central, funcionando através de NAT e firewall **sem abrir
uma única porta de entrada**. É o mesmo padrão de conexão reversa (*dial-out*) de um C2 de RMM
legítimo (NinjaOne, Atera, Tactical RMM).

É um **monorepo poliglota**: cada componente usa a stack ideal para o seu papel e todos
compartilham um único contrato (`proto/argus.proto`).

```
┌──────────────────────────────────────────────────────────────────────┐
│  Sua casa / servidor local                                           │
│                                                                      │
│   ┌─────────────────────┐         ┌────────────────────────────┐    │
│   │  App Desktop        │◀───────▶│  Argus Server (Java)       │    │
│   │  JavaFX host +      │  HTTP/  │  Spring Boot · gRPC        │    │
│   │  renderer React     │  WS     │  REST + WebSocket API      │    │
│   │  (127.0.0.1, local) │         └────────────┬───────────────┘    │
│   └─────────────────────┘                      │                    │
│                                   ┌────────────▼───────────────┐    │
│                                   │  PostgreSQL                │    │
│                                   └────────────────────────────┘    │
└─────────────────────────────────────────────┲━━━━━━━━━━━━━━━━━━━━━━━┛
                                              ┃ gRPC / TLS
                          ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
                          ┃                                         ┃
          ┌───────────────┴────────────┐           ┌───────────────┴────────────┐
          │  Rede Remota A             │           │  Rede Remota B             │
          │  Agent Linux (C++)  ──────┼──dial out─┤  Agent Windows (.NET)      │
          │  systemd, /proc           │           │  SCM, WMI                  │
          └───────────────────────────┘           └────────────────────────────┘
```

O agente **inicia a conexão** — o servidor nunca precisa alcançar os endpoints. Uma única
stream gRPC bidirecional persistente carrega telemetria nos dois sentidos: o agente envia
métricas e resultados, o servidor envia comandos. O **server é o único componente exposto na
rede**; o app desktop é local.

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Métricas em tempo real** | CPU, RAM, disco e carga coletados pelo agente e exibidos via WebSocket |
| **Gerenciamento de serviços** | start · stop · restart · status + **config profunda** (unit file, env, limites, health check, logs) — Linux `systemd`, Windows SCM |
| **Console por dispositivo** | Abas: visão geral, acesso remoto, processos, rede, segurança, automação, forense, energia e **mensagens** (chat admin→usuário como notificação nativa) |
| **Topologia de rede** | Árvore hierárquica interativa (Cytoscape.js + dagre): organização → filiais → redes → dispositivos, com layouts árvore/radial |
| **Mapa de operações** | Mapa-múndi (Leaflet + tiles CartoDB dark) com sites geolocalizados e enlaces VPN animados; presente também como *hero* no Dashboard |
| **Base de conhecimento** | Grafo estilo Obsidian (Cytoscape + fcose) ligando entidades, incidentes e runbooks |
| **Gestão da empresa** | CRUD de filiais, setores, redes, funcionários e contas com **edição inline no grid** (sem diálogos) |
| **Parametrização** | Papéis e tipos configuráveis pelo usuário — nada hardcoded |
| **Integrações** | Entra ID/M365/Google/Okta/LDAP · Grafana/Prometheus/Datadog · GitHub/GitLab/Jira · Slack/Teams · EDR · vCenter/Proxmox |
| **Sincronização com AD** | Importa contas via LDAP e mapeia grupos → papéis |
| **Consulta CNPJ (Receita)** | Preenche os dados cadastrais da empresa a partir do CNPJ |
| **Auditoria** | Trilha imutável com timeline por severidade, drill-down do evento e export CSV |
| **Assistente IA** | Copiloto ciente do contexto da frota (dispositivos, incidentes, runbooks) |
| **Construtor de agentes** | Configure e gere instaladores dos agentes por SO direto na UI |
| **NAT traversal nativo** | Agente conecta para fora — sem VPN, sem port forwarding |
| **Alta concorrência** | Servidor Java com Virtual Threads (Java 21) para milhares de agentes |

---

## Arquitetura

`server` + `desktop` formam **um único monorepo Gradle** (um `settings.gradle.kts`, um
`./gradlew`). O `desktop` é o **host** (o "*main*", à la Electron/Tauri): ele **lança e serve**
a UI React (o **renderer**) num servidor local em `127.0.0.1` — porta efêmera, **nunca exposta
na rede**, sem URL de browser.

> **O renderer não é um "web app".** É a interface embarcada de um aplicativo desktop — modelo
> Electron/Tauri (host *main* + *renderer*), como VS Code e DBeaver. O único componente que
> toca a rede é o **server**.

A identidade visual imita o **ZombieKeeper** (o `globals.css` dele foi copiado): escuro,
monoespaçado, denso, cantos retos, accent **vermelho**.

### Protocolo gRPC

O contrato entre agente e servidor está em `proto/argus.proto` — a **fonte única da verdade**.
O servidor Java e os agentes (C++/.NET) geram seus stubs a partir dele. Uma única RPC
bidirecional:

```
AgentService.Connect(stream AgentMessage) → stream ServerCommand
```

| Agente → Servidor | Servidor → Agente |
|---|---|
| `Heartbeat` · `Metrics` (cpu/ram/disk) · `CommandResult` | `ServiceCommand` (start/stop/restart/status) · `ShellCommand` |

Evite adicionar RPCs unárias separadas — estenda os `oneof` do payload.

---

## Estrutura do Projeto

Monorepo organizado por **papel no produto** (diretórios em minúsculo; o ponto fica só no
pacote Java `com.argus.*`). O único elo entre os componentes é `proto/argus.proto`.

```
argus/
├── proto/argus.proto     ← contrato único agente ↔ servidor (fonte da verdade)
├── server/               ← backend · Java 21 + Spring Boot + gRPC (módulo Gradle)
│   └── src/main/         → java/com/argus/{config,grpc,web,service,domain,persistence}
│                           resources/db/migration/ → migrations Flyway (V1..V13)
├── desktop/              ← host desktop · Java 21 + JavaFX (o "main"/gatilho)
│   ├── src/main/java/com/argus/desktop/  → DesktopMain · LocalWebServer (serve 127.0.0.1)
│   └── renderer/         ← a UI · React 18 + TS + Vite + Tailwind + Leaflet + Cytoscape (npm)
│       └── src/          → components/{layout,screens,ui} · lib/{types,mock,store,fmt}
├── agents/               ← agentes nativos, 1 por SO, SEM código compartilhado:
│   ├── linux/            ←   C++ + gRPC nativo (systemd, /proc)   [planejado]
│   ├── windows/          ←   .NET/C# + grpc-dotnet (SCM, WMI)    [planejado]
│   └── macos/            ←   nativo (launchd)                     [planejado]
└── docs/                 ← data-model.md · packaging.md · roadmaps
```

O server **não** builda o front — quem builda e embute o `renderer/dist` é o `desktop`, num
único comando de raiz.

---

## Como rodar

Pré-requisitos: **JDK 21** e **Node 18+** (o Gradle chama o `npm` de `desktop/renderer`).
Rode tudo a partir da **raiz** do repositório.

```bash
# ── App desktop (o principal) ─────────────────────────────────────────
./gradlew :desktop:run        # ou: make desktop
#   builda o renderer, embute o dist e abre a janela JavaFX.
#   Funciona sozinho, com dados mock — não precisa do server.

# ── Backend (para trabalhar na API/gRPC) ──────────────────────────────
./gradlew :server:bootRun     # ou: make server   (precisa de PostgreSQL)
#   API HTTP/WebSocket na :8080 · gRPC na :9090

# ── Dev rápido só da UI (browser, hot-reload) ─────────────────────────
cd desktop/renderer && npm run dev     # http://localhost:5173  (só dev)

# ── Build / empacotamento ─────────────────────────────────────────────
./gradlew build                     # ou: make build — server + desktop (com o renderer)
./gradlew :desktop:jpackageImage    # app-image (base p/ AppImage no Linux)
./gradlew :desktop:jpackage         # instalador nativo (.deb/.exe/.dmg) — ver docs/packaging.md
```

O app roda hoje com **dados mock** (`desktop/renderer/src/lib/mock.ts`); a troca para a API
real é feita nesse único arquivo. Empacotamento detalhado em **`docs/packaging.md`**.

### Banco de dados (para o server)

```bash
# cluster PostgreSQL (só na primeira vez)
sudo -u postgres initdb --locale=C.UTF-8 --encoding=UTF8 -D '/var/lib/postgres/data'
sudo systemctl enable --now postgresql
psql -U postgres -c "CREATE USER argus WITH PASSWORD 'sua_senha';"
psql -U postgres -c "CREATE DATABASE argus OWNER argus;"
```

O **Flyway** roda as migrations (`V1..V13`, em `server/src/main/resources/db/migration/`) no
boot do servidor. Conexão via variáveis de ambiente (defaults em `application.yml`):

```bash
export ARGUS_DB_URL=jdbc:postgresql://localhost:5432/argus
export ARGUS_DB_USER=argus
export ARGUS_DB_PASSWORD=sua_senha
```

### Deploy do agente

```bash
# Linux
scp argus-agent usuario@192.168.1.x:/opt/argus/agent
ssh usuario@192.168.1.x "/opt/argus/agent --server grpcs://meu-servidor:443 --token TOKEN"
```
```powershell
# Windows (PowerShell como Administrador)
.\argus-agent.exe --server grpcs://meu-servidor:443 --token TOKEN
```

O agente aparece automaticamente no app após a primeira conexão. Os instaladores são
configurados/gerados na aba **Construtor de Agentes** (ver `docs/roadmap-agent-builder.md`).

---

## Estado atual

- **Renderer (UI): completo sobre dados mock** e buildando verde — todas as telas funcionam a
  partir de `desktop/renderer/src/lib/mock.ts` (o único ponto a trocar na integração).
- **Server: scaffold** — Spring Boot, build e config prontos; `gRPC`/`web`/`domain`/
  `persistence` ainda a implementar. Migrations `V1..V13` no lugar.
- **Host desktop:** carrega o renderer e empacota (jpackage).
- **Agentes:** ainda não implementados (planejados).

Roadmaps: `docs/roadmap-device-operations.md` · `docs/roadmap-agent-builder.md` ·
modelo de dados: `docs/data-model.md`.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Servidor | Java 21 · Spring Boot 3.3 · Virtual Threads · gRPC (net.devh) |
| Acesso a dados | JOOQ · Flyway · PostgreSQL |
| Host desktop | Java 21 · JavaFX (WebView) — lança e serve o renderer em 127.0.0.1 |
| UI (renderer) | React 18 · TypeScript · Vite · Tailwind · Leaflet · Cytoscape.js |
| Empacotamento | jpackage / org.beryx.runtime (.exe · .dmg · AppImage) |
| Agente Linux | C++ · gRPC nativo · systemd · /proc |
| Agente Windows | .NET / C# · grpc-dotnet · SCM · WMI |
| Protocolo | gRPC + Protocol Buffers 3 |
| Real-time | WebSocket |

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
