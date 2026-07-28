# Argus — Backlog do Frontend (desktop/renderer)

Rastreamento dos pedidos do usuário. Marcado conforme entregue e verificado por screenshot.

## Concluído
- [x] Tema escuro intenso (near-black) + troca de tema com botão "Aplicar"
- [x] Mapa mundial (Leaflet) com pinos e arcos VPN — render corrigido
- [x] Topologia força-dirigida interativa (Canvas) — matriz/filial/rede/device/agente
- [x] Terminal realista (banner SSH, MOTD, prompt colorido)
- [x] Agentes vs Dispositivos: grid do agente distinto (conexão)
- [x] Assistente IA (chatbot ciente do contexto da frota)
- [x] Base de Conhecimento (grafo estilo Obsidian)
- [x] Configurações do Argus (Aparência/Conexão/AD/IA/Chaves/Firewall/Notificações)
- [x] **CRUD da empresa**: filiais, funcionários, contas de acesso, dados da organização
      (store reativa + Modal/Form reutilizáveis + validação + confirmação de exclusão)
- [x] **Chat admin→usuário no dispositivo** (aba Mensagens = notificação nativa)
- [x] **Integrações** (Entra/M365/Google/Okta/LDAP, Grafana/Prometheus/Azure Monitor/Datadog/Elastic,
      GitHub/GitLab/Jira/ServiceNow/Ansible, Slack/Teams/Telegram/WhatsApp/PagerDuty/Webhook,
      CrowdStrike/SentinelOne/Wazuh/Defender, vCenter/Proxmox/Hyper-V)

## Concluído (continuação)
- [x] **Auditoria mais precisa** — timeline por severidade (14d), filtros severidade/categoria/resultado,
      drill-down com ator/e-mail/IP/User-Agent/sessão/request-id/duração, diff antes-depois, export CSV
- [x] **CRUD de Setores e Redes** (completa o "gerenciador completo da empresa")

## Concluído (rodada 3)
- [x] **Mapa mundial autossuficiente** (canvas + asset local, sem Leaflet/tiles, offline) — era o crítico
- [x] **Serviços — configuração profunda** (7 abas: geral/recursos/ambiente/deps/health/unit/logs)
- [x] **Sistema de parametrização** (papéis/tipos configuráveis, Settings → Parametrização)
- [x] **Consulta CNPJ na Receita** (OrganizationForm "Buscar na Receita" + campos enriquecidos)
- [x] **Sincronização com Active Directory** (Contas de Acesso → importar objetos LDAP, grupos→papéis)
- [x] **Mock centralizado** em lib/mock.ts (regra permanente)
- [x] **Navegação reorganizada** (Infraestrutura · Empresa · Pessoas & Acesso · Inteligência · Sistema)

## Pendente (prioridade alta)
- [ ] **Grid editável no lugar de dialog** — usuário prefere um grid novo/personalizado a modal
      pop-up para criar/editar. Avaliar edição inline na tabela ou painel lateral fixo.
- [ ] **Contas de Acesso — mais informações** (detalhe do usuário: sessões, dispositivos, histórico,
      origem AD vs manual, política de senha) — parcial (AD sync feito)
- [ ] **Construtor de Agentes mais rico** (perfis, canais, políticas, preview do binário/instalador)

## Pendente (média)
- [ ] **Dashboard**: mapa-mundi como "hero" + KPIs chamativos
- [ ] **Navegação entre telas**: botões voltar consistentes / breadcrumb
- [ ] **Tela de login** com animação (inspiração: farid.GestaoVarejo em /run/media/zero/SHARED/dev/)
- [ ] **Ícones/identidade visual do Argus** (logo, favicon, splash)

## Notas de arquitetura
- Store: `src/lib/store.ts` (`useDb`, `create/update/remove`, `patchObject`, `genId`).
  Trocar por chamadas HTTP quando o backend existir — assinatura estável.
- UI base: `ui/Modal.tsx` (Modal/Confirm, z-index 5000 acima do Leaflet), `ui/Form.tsx`
  (Field/FormGrid/FormSection/Input/Select/Textarea/Toggle), `ui/kit.tsx`.
- Verificação visual: `vite preview` + Playwright (chromium-1228) — script em scratchpad.
