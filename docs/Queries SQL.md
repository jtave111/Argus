# Queries SQL

→ [[Banco de Dados]]

Geradas em `internal/db/` via `sqlc generate`. Arquivo fonte: `sql/queries.sql`.

## Users
| Query | Tipo | Descrição |
|-------|------|-----------|
| `CreateUser` | `:one` | Novo usuário |
| `GetUserByEmail` | `:one` | Login |
| `GetUserByID` | `:one` | Por ID |
| `UpdateUserLastLogin` | `:exec` | Atualiza último login |
| `DeactivateUser` | `:exec` | Desativa (is_active = false) |

## Organizations
| Query | Tipo | Descrição |
|-------|------|-----------|
| `CreateOrganization` | `:one` | Nova org |
| `GetOrganizationBySlug` | `:one` | Login de org |
| `GetOrganizationByAgentKey` | `:one` | Registro de agent |
| `ListOrganizationsByUser` | `:many` | Orgs de um usuário |

## User Organizations
| Query | Tipo | Descrição |
|-------|------|-----------|
| `AddUserToOrganization` | `:one` | Adiciona membro |
| `AcceptOrganizationInvite` | `:exec` | Aceita convite |
| `GetUserRole` | `:one` | Role do user na org |
| `ListOrganizationMembers` | `:many` | Membros da org |

## Invites
| Query | Tipo | Descrição |
|-------|------|-----------|
| `CreateInvite` | `:one` | Gera convite |
| `GetInviteByToken` | `:one` | Valida token |
| `UseInvite` | `:exec` | Marca como usado |

## Networks
| Query | Tipo | Descrição |
|-------|------|-----------|
| `CreateNetwork` | `:one` | Nova rede |
| `ListNetworksByOrg` | `:many` | Redes da org |
| `GetNetworkByID` | `:one` | Por ID |
| `DeactivateNetwork` | `:exec` | Desativa |

## Agents
| Query | Tipo | Descrição |
|-------|------|-----------|
| `RegisterAgent` | `:one` | Registra agent |
| `GetAgentByID` | `:one` | Por ID |
| `GetAgentByTokenHash` | `:one` | Autenticação gRPC |
| `ListAgentsByNetwork` | `:many` | Agents de uma rede |
| `ListAgentsByOrg` | `:many` | Agents de toda a org |
| `ListAgentsByUserOrg` | `:many` | Agents do empregado (viewer) |
| `BindAgentToUserOrg` | `:exec` | Vincula agent ao empregado |
| `UpdateAgentLastSeen` | `:exec` | Heartbeat |
| `SetAgentOffline` | `:exec` | Desconexão |
| `SetOfflineAgentsSince` | `:exec` | Sweep periódico |

## Hardware / Métricas / Serviços
| Query | Tipo | Descrição |
|-------|------|-----------|
| `UpsertAgentHardware` | `:one` | Hardware (upsert) |
| `GetAgentHardware` | `:one` | Hardware do agent |
| `InsertMetric` | `:one` | Nova métrica |
| `GetLatestMetric` | `:one` | Última métrica |
| `ListMetricsSince` | `:many` | Métricas para gráfico |
| `DeleteOldMetrics` | `:exec` | TTL de métricas |
| `UpsertService` | `:one` | Estado de serviço |
| `ListServicesByAgent` | `:many` | Serviços do agent |
| `UpdateServiceHealth` | `:exec` | Health check |

## Comandos / Audit
| Query | Tipo | Descrição |
|-------|------|-----------|
| `InsertCommandResult` | `:one` | Resultado de comando |
| `GetCommandResult` | `:one` | Por command_id |
| `ListCommandResultsByAgent` | `:many` | Histórico de comandos |
| `InsertAuditLog` | `:exec` | Log de auditoria |
| `ListAuditLogsByOrg` | `:many` | Audit log da org |
