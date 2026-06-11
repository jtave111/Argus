# Autenticação

→ [[Argus]] | → [[Banco de Dados]]

Dois fluxos distintos de login.

## Fluxo 1 — Login de plataforma (admin/usuário)

```
POST /auth/login
  email + password → GetUserByEmail → bcrypt verify
  → JWT ou session
  → UpdateUserLastLogin
```

Tabela: `users`  
Roles via `user_organizations.role`: `admin`, `member`, `viewer`

## Fluxo 2 — Login de organização

```
POST /auth/org-login
  slug + password → GetOrganizationBySlug → bcrypt verify
  → acesso ao painel da org
```

Tabela: `organizations.password_hash`

## Registro de agent

```
Agent --token REGISTRATION_KEY → GetOrganizationByAgentKey
  → RegisterAgent (gera token único por agent)
  → agent salva token local, usa em cada conexão
```

## Convite de membro

```
admin → CreateInvite (token, role, expires_at)
  → email enviado
  → usuário GET /invite/:token → GetInviteByToken
  → aceita → AddUserToOrganization + UseInvite
  → AcceptOrganizationInvite
```

## Binding de empregado (viewer)

Empregado (role `viewer`) pode ver **apenas seu próprio device**:

```
agent.user_organization_id → user_organizations.id
  → filtra por ListAgentsByUserOrg($user_org_id)
```

Campos no agent: `os_user`, `os_user_fullname`, `os_user_email`  
(reportados pelo agent via SO — ex: `whoami`, Active Directory UPN)

Ver [[Agent]] e migration `00006_agent_add_user_binding`.

## Audit log

Toda ação importante → `InsertAuditLog` (org_id, user_id, action, target, ip, user_agent).
