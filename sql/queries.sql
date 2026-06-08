-- ============================================================
-- USERS
-- ============================================================

-- name: CreateUser :one
INSERT INTO users (email, password_hash)
VALUES ($1, $2)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: UpdateUserLastLogin :exec
UPDATE users SET last_login_at = NOW()
WHERE id = $1;

-- TODO: escreva uma query para desativar um usuário (is_active = false) pelo id
-- name: DeactivateUser :exec
UPDATE users SET is_active = FALSE
WHERE id = $1;


-- ============================================================
-- ORGANIZATIONS
-- ============================================================

-- name: CreateOrganization :one
INSERT INTO organizations (name, slug, email, password_hash, agent_registration_key)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetOrganizationBySlug :one
SELECT * FROM organizations
WHERE slug = $1 LIMIT 1;

-- name: GetOrganizationByAgentKey :one
SELECT * FROM organizations
WHERE agent_registration_key = $1 LIMIT 1;

-- TODO: escreva uma query que retorna todas as organizations onde um user está inserido
-- (join entre organizations e user_organizations filtrando por user_id e accepted_at IS NOT NULL)
-- name: ListOrganizationsByUser :many
SELECT o.*, uo.accepted_at
    FROM
        organizations o
    INNER JOIN
        user_organizations uo
    ON
        o.id = uo.organization_id
    WHERE
        uo.user_id = $1
    AND uo.accepted_at IS NOT NULL;


-- ============================================================
-- USER_ORGANIZATIONS
-- ============================================================

-- name: AddUserToOrganization :one
INSERT INTO user_organizations (user_id, organization_id, role, invited_by)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: AcceptOrganizationInvite :exec
UPDATE user_organizations SET accepted_at = NOW()
WHERE user_id = $1 AND organization_id = $2;

-- name: GetUserRole :one
SELECT role FROM user_organizations
WHERE user_id = $1 AND organization_id = $2 AND accepted_at IS NOT NULL
LIMIT 1;

-- TODO: escreva uma query que lista todos os membros de uma organização
-- (join users + user_organizations filtrando por organization_id)
-- name: ListOrganizationMembers :many
SELECT u.*, uo.accepted_at
    FROM
        users u
    INNER JOIN
        user_organizations uo
    ON
        u.id = uo.user_id
    WHERE
        uo.organization_id = $1
    AND
        uo.accepted_at IS NOT NULL;


-- ============================================================
-- ORGANIZATION_INVITES
-- ============================================================

-- name: CreateInvite :one
INSERT INTO organization_invites (organization_id, email, token, role, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetInviteByToken :one
SELECT * FROM organization_invites
WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()
LIMIT 1;

-- name: UseInvite :exec
UPDATE organization_invites SET used_at = NOW()
WHERE id = $1;

-- ============================================================
-- NETWORKS
-- ============================================================

-- name: CreateNetwork :one
INSERT INTO networks (organization_id, name, description, type, subnet, gateway, dns_primary, dns_secondary, vlan_id, latitude, longitude, location_name, address, city, country_code)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING *;

-- name: ListNetworksByOrg :many
SELECT * FROM networks
WHERE organization_id = $1 AND is_active = true
ORDER BY name;

-- name: GetNetworkByID :one
SELECT * FROM networks
WHERE id = $1 LIMIT 1;

-- TODO: escreva uma query para desativar uma network (is_active = false) pelo id
-- name: DeactivateNetwork :exec
UPDATE networks SET is_active = FALSE
WHERE id = $1;

-- ============================================================
-- AGENTS
-- ============================================================

-- name: RegisterAgent :one
INSERT INTO agents (network_id, token_hash, hostname, fqdn, os, distro, arch, kernel_version, ip_address, mac_address, agent_version, latitude, longitude, location_name, city, country_code)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING *;

-- name: GetAgentByID :one
SELECT * FROM agents WHERE id = $1 LIMIT 1;

-- name: GetAgentByTokenHash :one
SELECT * FROM agents WHERE token_hash = $1 LIMIT 1;

-- name: ListAgentsByNetwork :many
SELECT * FROM agents
WHERE network_id = $1
ORDER BY hostname;

-- TODO: escreva uma query que lista todos os agents de uma organização inteira
-- (join agents → networks filtrando por networks.organization_id)
-- name: ListAgentsByOrg :many
SELECT
    a.*
    FROM agents a
    INNER JOIN networks n
    ON n.id = a.network_id
    WHERE n.organization_id = $1
    ORDER BY n.name, a.hostname;


-- name: UpdateAgentLastSeen :exec
UPDATE agents SET last_seen = NOW(), is_online = true
WHERE id = $1;

-- name: SetAgentOffline :exec
UPDATE agents SET is_online = false
WHERE id = $1;

-- name: SetOfflineAgentsSince :exec
-- marca offline todos os agents que não mandam heartbeat há X tempo
-- $1 é um intervalo: ex '2 minutes'
UPDATE agents SET is_online = false
WHERE last_seen < NOW() - ($1::interval) AND is_online = true;

-- ============================================================
-- AGENT_HARDWARE
-- ============================================================

-- name: UpsertAgentHardware :one
INSERT INTO agent_hardware (agent_id, cpu_model, cpu_cores, cpu_threads, ram_total_bytes, disk_total_bytes, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (agent_id) DO UPDATE SET
  cpu_model        = EXCLUDED.cpu_model,
  cpu_cores        = EXCLUDED.cpu_cores,
  cpu_threads      = EXCLUDED.cpu_threads,
  ram_total_bytes  = EXCLUDED.ram_total_bytes,
  disk_total_bytes = EXCLUDED.disk_total_bytes,
  updated_at       = NOW()
RETURNING *;

-- name: GetAgentHardware :one
SELECT * FROM agent_hardware WHERE agent_id = $1;

-- ============================================================
-- METRICS
-- ============================================================

-- name: InsertMetric :one
INSERT INTO metrics (agent_id, cpu_percent, ram_percent, disk_percent, net_in_kbps, net_out_kbps)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetLatestMetric :one
SELECT * FROM metrics
WHERE agent_id = $1
ORDER BY created_at DESC
LIMIT 1;

-- TODO: escreva uma query que retorna as métricas de um agent a partir de uma data ($2)
-- útil para montar gráficos no dashboard
-- name: ListMetricsSince :many
SELECT  * FROM metrics WHERE metrics.agent_id = $1
   and created_at >= &2
   ORDER BY created_at ASC;

-- name: DeleteOldMetrics :exec
-- TTL: apaga métricas mais antigas que X. Ex: $1 = '30 days'
DELETE FROM metrics
WHERE created_at < NOW() - ($1::interval);

-- ============================================================
-- SERVICES
-- ============================================================

-- name: UpsertService :one
INSERT INTO services (agent_id, name, display_name, type, status, enabled, pid, uptime_seconds, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
ON CONFLICT (agent_id, name) DO UPDATE SET
  status         = EXCLUDED.status,
  enabled        = EXCLUDED.enabled,
  pid            = EXCLUDED.pid,
  uptime_seconds = EXCLUDED.uptime_seconds,
  updated_at     = NOW()
RETURNING *;

-- name: ListServicesByAgent :many
SELECT * FROM services
WHERE agent_id = $1
ORDER BY name;

-- TODO: escreva uma query para atualizar o health_status e last_health_check de um serviço pelo id
-- name: UpdateServiceHealth :exec
UPDATE services SET health_status = $1, last_health_check = date(now())
    WHERE services.id = $2;

-- ============================================================
-- COMMAND_RESULTS
-- ============================================================

-- name: InsertCommandResult :one
INSERT INTO command_results (agent_id, command_id, command_str, output, exit_code)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetCommandResult :one
SELECT * FROM command_results
WHERE command_id = $1 LIMIT 1;

-- TODO: escreva uma query que lista os últimos N resultados de comandos de um agent
-- dica: use LIMIT $2 e ORDER BY executed_at DESC
-- name: ListCommandResultsByAgent :many

SELECT * FROM command_results
    WHERE
        command_results.agent_id = $1
    ORDER BY
        executed_at
    DESC LIMIT $2;



-- ============================================================
-- AUDIT_LOGS
-- ============================================================

-- name: InsertAuditLog :exec
INSERT INTO audit_logs (organization_id, user_id, action, target_type, target_id, ip_address, user_agent)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- TODO: escreva uma query que lista os últimos N audit logs de uma organização
-- name: ListAuditLogsByOrg :many
