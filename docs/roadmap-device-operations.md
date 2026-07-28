# Roadmap — Operação de Dispositivos (banco + backend + agente)

Este documento lista **tudo que a tela de Console de Operação do dispositivo
(`DeviceConsoleScreen`) exercita hoje em MOCK** e que precisará ser criado de verdade no
**schema (Flyway)**, no **backend (Spring)**, no **contrato gRPC (`proto/argus.proto`)** e
no **agente** (C++/.NET).

> Estado atual: a UI está pronta e navegável sobre dados falsos
> (`com.argus.desktop.mock.DeviceOps` + `RemoteScreenView` + `TimelineView`). Nada disto
> persiste nem fala com um agente real ainda. Cada seção abaixo diz o que falta.

Legenda de esforço: 🟢 pequeno · 🟡 médio · 🔴 grande/estratégico.

---

## 0. Fundação que várias funções compartilham

### 0.1 Trilha de comandos/ações (command bus) 🔴
Hoje só existe `command_results` (V5). Precisamos de um ciclo de vida de comando
enviado do servidor → agente → resultado, para TODA ação operacional (não só shell).

- **Migration** — nova tabela `device_commands`:
  - `id UUID PK`, `device_id FK`, `agent_id FK`, `issued_by_user_id FK`
  - `kind VARCHAR` (service.start, process.kill, host.reboot, quarantine.on, patch.apply, …)
  - `payload JSONB` (parâmetros da ação)
  - `status VARCHAR` (pending/sent/running/success/failed/timeout/cancelled)
  - `requested_at`, `sent_at`, `finished_at TIMESTAMPTZ`
  - `result JSONB`, `error TEXT`
- **proto** — hoje `ServerCommand` só tem `ServiceCommand`/`ShellCommand`. Trocar por um
  `oneof` extensível (um payload por tipo de operação) OU um envelope genérico
  `OperationCommand { string kind; string json_payload; }`. Recomendado o envelope genérico
  para não reescrever o proto a cada função nova.
- **backend** — `service.CommandBus`: enfileira, roteia pelo agent hub, correlaciona
  resposta, aplica timeout, persiste. Expor via REST `POST /devices/{id}/commands` +
  WebSocket para status ao vivo.
- **agente** — despachante por `kind` chamando a API nativa (systemd/SCM/etc.).

### 0.2 Trilha de eventos unificada (para a aba Forense) 🟡
- **Migration** — `device_events`:
  - `id BIGSERIAL PK`, `device_id FK`, `at TIMESTAMPTZ`, `severity`, `source`
    (agent/service/security/remote/system), `type`, `message TEXT`, `metadata JSONB`.
  - índice `(device_id, at DESC)`.
- Alimentada por: agente (logs relevantes), backend (ações executadas), heartbeats.
- Usada pela `TimelineView` (métricas × eventos) e pela aba Forense.

---

## 1. Visão geral (ações operacionais)

| Ação na UI | Precisa no banco | Precisa no backend/proto/agente |
|---|---|---|
| **Quarentena de rede** 🔴 | coluna `devices.network_isolated BOOLEAN` + `isolated_at`, `isolated_by` | comando `quarantine.on/off`; agente aplica regra de firewall que mantém só o túnel do agente |
| **Modo manutenção** 🟢 | `devices.maintenance_until TIMESTAMPTZ` | ao ativar, suprimir alertas e pausar automações no período |
| **Wake-on-LAN** 🟡 | `device_network_interfaces` já tem `mac_address` (V9) ✅ | envio de magic packet a partir de um agente na MESMA LAN (o servidor não alcança) → precisa de "agente relay" por rede |
| **Reiniciar/Desligar host** 🟢 | `device_commands` (§0.1) | comando `host.reboot`/`host.shutdown`; agente executa com aviso a sessões |
| **Coletar inventário** 🟡 | preenche `device_hardware`, `services`, `device_network_interfaces` | comando `inventory.collect`; agente varre e reporta |
| **Snapshot do estado** 🔴 | nova `device_snapshots (id, device_id, taken_at, taken_by, kind, blob/ref)` | captura config+processos+serviços num ponto; restauração é estratégica |
| **Simular falha (chaos)** 🔴 | `device_commands` | injeção de falha controlada no agente (fault injection) — cuidado operacional |
| **Diagnóstico automático** 🟡 | grava resultado em `device_events` | runbook de triagem no backend/agente |

---

## 2. Acesso remoto (estilo AnyDesk) 🔴 — o maior item

Hoje `RemoteScreenView` é um desenho sintético. Para acesso remoto real:

- **proto/canal** — novo stream dedicado (fora do canal de telemetria) para vídeo/entrada:
  `rpc RemoteDesktop(stream RemoteInput) returns (stream FramePacket)` ou WebRTC/relay TURN.
  Como o agente disca de dentro da rede, o servidor faz de **relay** entre operador e agente.
- **agente** — captura de tela (frame diff/H.264), injeção de teclado/mouse, canal de
  arquivos, sincronização de clipboard. Windows: DXGI/GDI; Linux: PipeWire/X11.
- **Migration** — `remote_sessions`:
  - `id UUID PK`, `device_id FK`, `operator_user_id FK`, `started_at`, `ended_at`,
    `mode VARCHAR` (view/control/files/shell), `recorded BOOLEAN`, `recording_ref TEXT`,
    `consent_granted BOOLEAN`, `consent_by VARCHAR`, `client_ip`.
  - a UI já lista "sessões anteriores" — vem daqui.
- **segurança/compliance** — consentimento do usuário final, marca d'água (já na UI),
  gravação da sessão (armazenamento), aprovação/expiração (ver §5 JIT), auditoria completa.
- **backend** — orquestra o relay, aplica política (view-only vs control), grava a sessão.

---

## 3. Processos 🟡

- **proto** — `ProcessList` (request) → lista de `ProcessInfo` (pid, user, name, cpu, mem,
  state, started_at, cmdline). Ações: `process.kill (pid, signal)`, `process.renice`,
  `process.dump`, `process.strace`.
- **agente** — lê `/proc` (Linux) ou `Process API`/ETW (Windows); executa kill/renice; gera
  core dump; anexa strace/ETW por N segundos e envia o artefato ao servidor.
- **banco** — em geral efêmero (não precisa persistir a lista); dumps/traces viram
  artefatos → tabela `device_artifacts (id, device_id, kind, ref, created_at, size_bytes)`.

---

## 4. Rede 🟡

- **proto** — `connections.list` → tuplas (proto, local, remote, state, process);
  `firewall.list` / `firewall.apply` (regra); `packet.capture (duration)`;
  `connection.drop`; `route.test (target)`.
- **agente** — `ss`/`netstat`, `nftables`/`iptables` (Linux) ou `netsh`/WFP (Windows);
  captura pcap (limitada por tempo/tamanho) e envia como artefato; mtr/traceroute.
- **banco** — `firewall_rules (id, device_id, direction, action, proto, port, source,
  enabled, managed_by)` se quisermos gerenciar regras de forma declarativa/versionada.
  Capturas de pacote → `device_artifacts`.

---

## 5. Segurança 🔴 — pilar Blue Team

| Função | Banco | Backend/agente |
|---|---|---|
| **Aplicar atualizações / patches** | `device_patches (id, device_id, name, severity, reference, requires_reboot, status, detected_at, applied_at)` | agente consulta gerenciador de pacotes/WSUS; aplica na janela |
| **Caça a ameaças (IOC)** | `ioc_indicators (id, type, value, source)` + `ioc_matches (device_id, indicator_id, path, at)` | agente varre arquivos/hashes contra a lista (YARA/hashes) |
| **Arquivo-canário (honeypot)** | `canary_files (id, device_id, path, created_at, triggered_at)` | agente planta arquivo isca e alerta se for acessado (anti-ransomware) |
| **Verificar drift** | `config_baselines (id, scope, ref)` + `config_drift (device_id, key, expected, actual, at)` | agente compara config atual vs baseline dourado |
| **Impressão digital de HW** | `hardware_fingerprints (device_id, fingerprint, taken_at)` | agente calcula hash de componentes; alerta se mudar (anti-adulteração) |
| **Rotacionar credenciais** | já há `agents.token_hash` (V3) + token lifecycle (V13) ✅ | girar token do agente + chaves SSH/host |
| **Acesso just-in-time (JIT)** | `access_grants (id, device_id, user_id, granted_by, scope, expires_at, approved BOOLEAN)` | fluxo de solicitação → aprovação → acesso temporário |
| **Isolar + coletar evidências** | reusa quarentena (§1) + `device_artifacts` | quarentena + coleta forense (memória/disco/processos) com hash |
| **Relatório de conformidade** | `compliance_reports (id, device_id, framework, score, generated_at, ref)` | agente/serviço avalia controles CIS/LGPD |

---

## 6. Automação 🟡

- **Migration** — `scheduled_tasks (id, device_id, name, cron, command_kind, payload JSONB,
  enabled, last_run, next_run)` e `runbooks (id, name, description, steps JSONB)` +
  `runbook_runs (id, runbook_id, device_id, status, started_at, finished_at, log)`.
- **backend** — agendador (Quartz ou cron interno) que emite comandos (§0.1) nos horários;
  motor de runbook que executa passos com verificação entre eles.
- **agente** — apenas executa os comandos recebidos; o "quando" fica no servidor.

---

## 7. Forense 🟡

- Depende de **§0.2 (device_events)** + histórico de `metrics` (V5) já existente ✅.
- **backend** — endpoint que devolve métricas + eventos de uma janela temporal alinhados,
  para a `TimelineView` "rebobinar". Export de pacote de evidências (zip + hash SHA-256) →
  `device_artifacts`.

---

## 8. Energia 🟢/🟡

- **Migration** — `metrics` poderia ganhar `power_watts REAL` (telemetria de energia);
  `power_profiles (device_id, profile, applied_at)` para o perfil econômico; custo é cálculo
  no servidor (tarifa configurável em `organizations.settings` JSONB — já existe V13).
- **agente** — lê consumo via RAPL/IPMI (Linux) ou contadores do SO quando disponível;
  aplica perfil de energia; agenda desligar/ligar (com WoL, §1).

---

## Resumo do que criar (checklist)

**Migrations novas (ordem sugerida a partir de V14):**
1. `device_commands` + `device_events` (fundação)
2. `devices += network_isolated, isolated_at/by, maintenance_until`
3. `remote_sessions`
4. `device_artifacts`
5. `device_patches`, `ioc_indicators`, `ioc_matches`, `canary_files`
6. `config_baselines`, `config_drift`, `hardware_fingerprints`
7. `access_grants`, `compliance_reports`
8. `scheduled_tasks`, `runbooks`, `runbook_runs`
9. `firewall_rules`, `device_snapshots`, `power_profiles` (+ `metrics.power_watts`)

**proto (`proto/argus.proto`):**
- Trocar `ServerCommand.oneof` por envelope genérico `OperationCommand{kind,json_payload}`
  (ou ampliar o oneof) — cobre serviço, processo, host, rede, segurança, automação.
- Novo stream `RemoteDesktop` (vídeo + input + arquivos + clipboard) com o servidor de relay.
- Mensagens de inventário/telemetria estendida (processos, conexões, energia).

**backend (`com.argus`):**
- `service.CommandBus` (roteamento + correlação + timeout + persistência).
- `service.RemoteRelay` (ponte operador↔agente).
- Agendador de `scheduled_tasks`/runbooks.
- REST/WebSocket: `/devices/{id}/commands`, `/devices/{id}/events`, `/devices/{id}/remote`,
  streams ao vivo para a UI.
- Trocar `com.argus.desktop.data.Data` para consumir esses endpoints (hoje devolve mock).

**agente (C++/.NET):**
- Despachante de `OperationCommand` por `kind` → API nativa.
- Captura de tela + input (acesso remoto).
- Coletores: processos, conexões, patches, energia, fingerprint de HW.
- Executores de segurança: IOC scan, canário, drift, coleta forense.

---

## Onde está o mock (para remover depois)

- `com.argus.desktop.mock.DeviceOps` — gera processos, conexões, logs, patches, sessões,
  tarefas, firewall, arquivos.
- `com.argus.desktop.ui.RemoteScreenView` — desktop remoto sintético.
- `com.argus.desktop.ui.TimelineView` — eventos falsos na linha do tempo.
- `com.argus.desktop.ui.screens.DeviceConsoleScreen` — os handlers só escrevem no console
  de operações; trocar cada um por chamada real ao `CommandBus`.
