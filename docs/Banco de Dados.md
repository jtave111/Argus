# Banco de Dados

→ [[Argus]] | → [[Arquitetura]]

PostgreSQL. Migrations via **goose**. Código Go gerado via **sqlc**.

## Migrations

| # | Arquivo | Tabelas |
|---|---------|---------|
| 001 | `auth_init_users_and_orgs` | users, organizations, user_organizations, organization_invites, audit_logs |
| 002 | `network_create_topology` | networks, network_topology |
| 003 | `agent_register_and_hardware` | agents, agent_hardware, agent_network_interfaces |
| 004 | `service_monitor_and_dependencies` | services, service_dependencies |
| 005 | `create_metrics_and_commands` | metrics, command_results |
| 006 | `agent_add_user_binding` | ALTER agents: user_organization_id, os_user, os_user_fullname, os_user_email |

### Rodar migrations

```bash
goose -dir sql/migrations postgres "host=localhost user=zero password=... dbname=argus sslmode=disable" up
```

## Schema simplificado

```
users ──────────────────────────────────────────────────────┐
  id, email, password_hash, is_active, last_login_at         │
                                                              │
organizations                                                 │
  id, name, slug, email, password_hash,                      │
  agent_registration_key, is_active                          │
       │                                                      │
       │ user_organizations (pivot)                          │
       ├──────────────────────────────── users               │
       │  user_id, organization_id, role, invited_by,        │
       │  accepted_at                                         │
       │                                                      │
       └── networks                                           │
             id, organization_id, name, type, subnet,         │
             latitude, longitude, location_name               │
                  │                                           │
                  └── agents ──────────────────── user_org ──┘
                        id, network_id, token_hash,
                        hostname, os, arch, ip_address,
                        latitude, longitude,
                        user_organization_id (binding)
                             │
                        ┌────┴────────────────────┐
                   agent_hardware            metrics
                   services                 command_results
```

## sqlc

Gera `internal/db/`: `models.go`, `querier.go`, `queries.sql.go`

```bash
sqlc generate
```

Ver [[Queries SQL]] para lista de todas as queries.
