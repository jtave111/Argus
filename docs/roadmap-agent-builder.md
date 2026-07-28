# Roadmap — Construtor de Agentes (banco + backend + build dos agentes)

A aba **Construtor de Agentes** (`desktop/renderer/.../screens/AgentBuilder.tsx`) hoje é **mock**:
configura parâmetros, mostra o manifesto e o comando de instalação, e "gera" builds
fictícios. Este documento lista o que precisa existir de verdade.

## Conceito

O operador configura um agente (servidor de dial-out, token de registro, SO alvo,
capacidades, heartbeat) e o Argus **produz um instalador pronto** para rodar na máquina
alvo. O agente instalado disca para fora (NAT traversal) e aparece na frota.

## 1. Banco (migrations novas, a partir da V14)

- `agent_profiles` — perfis salvos de configuração:
  `id, organization_id, name, server_url, target_os, arch, heartbeat_seconds, run_as,
   features JSONB, created_by, created_at, updated_at`.
- `agent_builds` — cada build gerado:
  `id, profile_id, version, target_os, arch, artifact_ref, size_bytes, sha256,
   built_by, built_at, config_snapshot JSONB`.
- `agent_registration_keys` — já há `organizations.agent_registration_key` (V1); considerar
  chaves múltiplas/rotacionáveis: `id, organization_id, key_hash, label, expires_at, revoked`.
  O token no instalador é uma dessas chaves; o agente troca por um `token_hash` real (V3) no
  primeiro handshake.

## 2. Backend (Spring)

- `service.AgentBuildService`: recebe a config, valida, dispara o pipeline de build e
  persiste o artefato + hash. Endpoints REST:
  - `GET/POST /agent-profiles`
  - `POST /agent-builds` (gera) · `GET /agent-builds/{id}` · `GET /agent-builds/{id}/download`
- **Como buildar de verdade** (o ponto central): o servidor Java **não compila C++/.NET**.
  Opções profissionais:
  1. **Config-injection (mais simples):** manter binários pré-compilados por SO/arch
     (feitos no CI dos `argus-agent/*`) e o build só **injeta** a config (server/token/
     features) — via arquivo `config.json` embutido, assinatura, e reempacotamento
     (`.msi`/`.deb`/`.pkg`). É o que a maioria dos RMM faz.
  2. **CI on-demand:** o servidor dispara um job (GitHub Actions/GitLab CI) que compila o
     agente do SO alvo com a config e devolve o artefato.
  - Recomendado começar por (1): CI publica os binários base; o Argus injeta config e assina.

## 3. Agentes (`argus-agent/{linux,windows,macos}`)

- Cada agente lê um `config.json` (ao lado do binário ou embutido) com: `server_url`,
  `registration_token`, `heartbeat_seconds`, `features[]`, `run_as`, `protocol_version`.
- Registро: no primeiro contato, envia o `registration_token`; o servidor valida contra
  `agent_registration_keys`, cria a linha em `agents` (V3) e devolve o `token_hash` definitivo.
- Capacidades (features) ligam/desligam módulos: métricas, serviços, shell, acesso remoto,
  inventário, auto-update. A aba já modela exatamente essas flags.
- Instaladores por SO: `.deb`/script (Linux, systemd unit), `.msi` (Windows, serviço SCM),
  `.pkg` (macOS, launchd). São produzidos pelo CI de cada agente, não pelo servidor.

## 4. proto

Nenhuma mudança obrigatória para instalar; o handshake de registro pode reusar o
`AgentMessage` inicial. Se quiser telemetria do build/versão, estender o `Heartbeat` com
`agent_version` e `features`.

## Onde está o mock (para remover depois)

- `desktop/renderer/src/components/screens/AgentBuilder.tsx` — form + preview + builds fictícios.
  Trocar o handler `doBuild()` e as listas por chamadas aos endpoints acima.
