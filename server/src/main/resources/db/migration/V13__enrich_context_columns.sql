-- Enriquecimento de contexto: adiciona colunas em várias tabelas pra dar mais
-- profundidade ao modelo (inventário, hierarquia corporativa, rede, identidade, AD).
--
-- Tudo é ADITIVO (ADD COLUMN, nulável ou com DEFAULT) -> data-safe, roda de uma vez.
-- Tabelas-ponte puras (user_roles, employee_roles, service_dependencies) ficam de fora.
-- Pode trimar à vontade: cada bloco é por tabela.


-- ───────────────────────── organizations (registro/documentação da empresa) ──────────
ALTER TABLE organizations
    ADD COLUMN legal_name     VARCHAR(255),               -- razão social
    ADD COLUMN tax_id         VARCHAR(50),                -- CNPJ / EIN
    ADD COLUMN industry       VARCHAR(100),               -- setor de atuação
    ADD COLUMN website        VARCHAR(255),
    ADD COLUMN phone          VARCHAR(50),
    ADD COLUMN logo_url       VARCHAR(512),
    ADD COLUMN timezone       VARCHAR(64),                -- ex: America/Sao_Paulo
    ADD COLUMN locale         VARCHAR(10),                -- pt-BR / en-US
    ADD COLUMN billing_email  VARCHAR(255),
    ADD COLUMN plan_expires_at TIMESTAMPTZ,
    ADD COLUMN settings       JSONB,
    ADD COLUMN notes          TEXT,
    ADD COLUMN updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ───────────────────────── users (login / autenticação) ──────────────────────────────
ALTER TABLE users
    ADD COLUMN phone                VARCHAR(50),
    ADD COLUMN avatar_url           VARCHAR(512),
    ADD COLUMN locale               VARCHAR(10),
    ADD COLUMN timezone             VARCHAR(64),
    ADD COLUMN mfa_enabled          BOOLEAN NOT NULL DEFAULT false, -- flag do 2FA (par do totp_secret)
    ADD COLUMN email_verified_at    TIMESTAMPTZ,
    ADD COLUMN password_changed_at  TIMESTAMPTZ,
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN locked_until         TIMESTAMPTZ,                    -- bloqueio por tentativas
    ADD COLUMN last_login_ip        VARCHAR(45),
    ADD COLUMN updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ───────────────────────── employees (Gestão de Usuários / RH) ────────────────────────
ALTER TABLE employees
    ADD COLUMN employee_number  VARCHAR(50),                 -- matrícula
    ADD COLUMN department       VARCHAR(100),
    ADD COLUMN phone            VARCHAR(50),
    ADD COLUMN mobile           VARCHAR(50),
    ADD COLUMN status           VARCHAR(30) NOT NULL DEFAULT 'active', -- active/on_leave/suspended/terminated
    ADD COLUMN hire_date        DATE,
    ADD COLUMN termination_date DATE,
    ADD COLUMN manager_id       UUID REFERENCES employees(id) ON DELETE SET NULL, -- chefe direto
    ADD COLUMN sector_id        UUID REFERENCES sectors(id)   ON DELETE SET NULL, -- setor onde trabalha
    ADD COLUMN ad_object_guid   VARCHAR(100),                -- identidade no Active Directory
    ADD COLUMN ad_upn           VARCHAR(255),                -- userPrincipalName
    ADD COLUMN photo_url        VARCHAR(512);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_sector  ON employees(sector_id);


-- ───────────────────────── branches (filiais — hierarquia corporativa) ────────────────
ALTER TABLE branches
    ADD COLUMN type                VARCHAR(50) NOT NULL DEFAULT 'store', -- store/warehouse/office/datacenter/headquarters
    ADD COLUMN email               VARCHAR(255),
    ADD COLUMN timezone            VARCHAR(64),
    ADD COLUMN parent_branch_id    UUID REFERENCES branches(id)  ON DELETE SET NULL, -- regional → loja
    ADD COLUMN manager_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    ADD COLUMN cost_center         VARCHAR(50),
    ADD COLUMN opened_at           DATE,
    ADD COLUMN is_headquarters     BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN notes               TEXT;
CREATE INDEX idx_branches_parent  ON branches(parent_branch_id);
CREATE INDEX idx_branches_manager ON branches(manager_employee_id);


-- ───────────────────────── sectors (setores — hierarquia de departamentos) ────────────
ALTER TABLE sectors
    ADD COLUMN code                VARCHAR(50),
    ADD COLUMN type                VARCHAR(50),  -- it/finance/operations/sales/logistics/hr
    ADD COLUMN parent_sector_id    UUID REFERENCES sectors(id)   ON DELETE SET NULL, -- sub-setores
    ADD COLUMN manager_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    ADD COLUMN floor               VARCHAR(50),  -- andar / localização dentro da filial
    ADD COLUMN cost_center         VARCHAR(50),
    ADD COLUMN is_active           BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_sectors_parent ON sectors(parent_sector_id);


-- ───────────────────────── networks (contexto de rede) ───────────────────────────────
ALTER TABLE networks
    ADD COLUMN domain           VARCHAR(255),   -- domínio DNS / search domain
    ADD COLUMN public_ip        VARCHAR(45),    -- IP público de saída (egress)
    ADD COLUMN isp_provider     VARCHAR(100),
    ADD COLUMN bandwidth_mbps   INT,            -- capacidade do link
    ADD COLUMN mtu              INT,
    ADD COLUMN dhcp_enabled     BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN dhcp_range_start VARCHAR(45),
    ADD COLUMN dhcp_range_end   VARCHAR(45),
    ADD COLUMN security_zone    VARCHAR(50),    -- trusted/untrusted/dmz/guest
    ADD COLUMN tags             TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ───────────────────────── device_network_interfaces (detalhe por interface) ──────────
ALTER TABLE device_network_interfaces
    ADD COLUMN type          VARCHAR(50),   -- ethernet/wifi/loopback/virtual/bridge/tunnel
    ADD COLUMN mtu           INT,
    ADD COLUMN gateway       VARCHAR(45),
    ADD COLUMN prefix_length INT,           -- máscara em CIDR (ex: 24)
    ADD COLUMN duplex        VARCHAR(10),    -- full / half
    ADD COLUMN dhcp_enabled  BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN is_virtual    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN driver        VARCHAR(100),
    ADD COLUMN created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ───────────────────────── agents (ciclo de vida do software/conexão) ─────────────────
ALTER TABLE agents
    ADD COLUMN status           VARCHAR(30) NOT NULL DEFAULT 'offline', -- online/offline/degraded/updating
    ADD COLUMN enabled          BOOLEAN NOT NULL DEFAULT true,          -- liga/desliga ADMIN (≠ is_online)
    ADD COLUMN connected_since  TIMESTAMPTZ,
    ADD COLUMN disconnected_at  TIMESTAMPTZ,
    ADD COLUMN last_ip          VARCHAR(45),    -- IP de onde o agent discou
    ADD COLUMN protocol_version VARCHAR(20),    -- versão do contrato gRPC
    ADD COLUMN install_path     VARCHAR(512),
    ADD COLUMN run_as_user      VARCHAR(100),
    ADD COLUMN auto_update      BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN last_error       TEXT,
    ADD COLUMN token_issued_at  TIMESTAMPTZ,
    ADD COLUMN token_expires_at TIMESTAMPTZ,
    ADD COLUMN config           JSONB;
CREATE INDEX idx_agents_status ON agents(status);


-- ───────────────────────── devices (inventário da máquina) ────────────────────────────
ALTER TABLE devices
    ADD COLUMN device_type    VARCHAR(50),   -- server/desktop/laptop/vm/container/network_device/mobile
    ADD COLUMN manufacturer   VARCHAR(100),
    ADD COLUMN model          VARCHAR(100),
    ADD COLUMN serial_number  VARCHAR(100),
    ADD COLUMN asset_tag      VARCHAR(100),  -- patrimônio
    ADD COLUMN virtualization VARCHAR(50),   -- bare-metal/kvm/vmware/hyperv/docker
    ADD COLUMN environment    VARCHAR(30),   -- production/staging/development
    ADD COLUMN criticality    VARCHAR(20),   -- low/medium/high/critical
    ADD COLUMN status         VARCHAR(30) NOT NULL DEFAULT 'unknown', -- online/offline/maintenance/decommissioned
    ADD COLUMN timezone       VARCHAR(64),
    ADD COLUMN last_boot_at   TIMESTAMPTZ,
    ADD COLUMN tags           TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN notes          TEXT,
    ADD COLUMN metadata       JSONB;
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_type   ON devices(device_type);


-- ───────────────────────── device_hardware (especificação fixa) ───────────────────────
ALTER TABLE device_hardware
    ADD COLUMN bios_vendor      VARCHAR(100),
    ADD COLUMN bios_version     VARCHAR(100),
    ADD COLUMN motherboard      VARCHAR(255),
    ADD COLUMN gpu_model        VARCHAR(255),
    ADD COLUMN swap_total_bytes BIGINT,
    ADD COLUMN boot_mode        VARCHAR(20);   -- uefi / legacy


-- ───────────────────────── services (mais contexto do daemon) ─────────────────────────
ALTER TABLE services
    ADD COLUMN version            VARCHAR(100),
    ADD COLUMN exec_start         VARCHAR(512),  -- comando / ExecStart da unit
    ADD COLUMN working_dir        VARCHAR(512),
    ADD COLUMN config_path        VARCHAR(512),
    ADD COLUMN log_path           VARCHAR(512),
    ADD COLUMN memory_limit_bytes BIGINT,
    ADD COLUMN monitored          BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN last_restart_at    TIMESTAMPTZ,
    ADD COLUMN restart_count      INT NOT NULL DEFAULT 0;


-- ───────────────────────── metrics (mais sinais de telemetria) ────────────────────────
ALTER TABLE metrics
    ADD COLUMN swap_percent        REAL,
    ADD COLUMN load_avg_1          REAL,
    ADD COLUMN load_avg_5          REAL,
    ADD COLUMN load_avg_15         REAL,
    ADD COLUMN temperature_celsius REAL,
    ADD COLUMN process_count       INT,
    ADD COLUMN uptime_seconds      BIGINT;


-- ───────────────────────── command_results (auditoria de execução) ────────────────────
ALTER TABLE command_results
    ADD COLUMN status            VARCHAR(30),  -- pending/running/success/failed/timeout
    ADD COLUMN command_type      VARCHAR(50),  -- shell / service
    ADD COLUMN stderr            TEXT,
    ADD COLUMN started_at        TIMESTAMPTZ,
    ADD COLUMN duration_ms       BIGINT,
    ADD COLUMN issued_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_command_results_user ON command_results(issued_by_user_id);


-- ───────────────────────── audit_logs (rastreabilidade) ───────────────────────────────
ALTER TABLE audit_logs
    ADD COLUMN severity   VARCHAR(20) NOT NULL DEFAULT 'info', -- info/warning/critical
    ADD COLUMN status     VARCHAR(20),    -- success / failure
    ADD COLUMN session_id UUID,
    ADD COLUMN request_id VARCHAR(100),
    ADD COLUMN metadata   JSONB;


-- ───────────────────────── network_topology (qualidade do link) ───────────────────────
ALTER TABLE network_topology
    ADD COLUMN bandwidth_mbps INT,
    ADD COLUMN latency_ms     INT,
    ADD COLUMN is_active      BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN status         VARCHAR(30);  -- up / down / degraded


-- ───────────────────────── addresses (tipo de endereço) ───────────────────────────────
ALTER TABLE addresses
    ADD COLUMN label      VARCHAR(50),   -- main / billing / shipping
    ADD COLUMN phone      VARCHAR(50),
    ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT false;
