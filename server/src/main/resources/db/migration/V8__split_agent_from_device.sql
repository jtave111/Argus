-- Separa AGENT (o software/implant) de DEVICE (a máquina onde ele roda).
-- Até a V7 a tabela `agents` acumulava identidade da máquina (hostname, SO, hardware,
-- rede, localização) junto com o software. Esta migration extrai tudo que descreve a
-- MÁQUINA para `devices` e deixa `agents` só com o que é do software.
--
-- Data-safe: migra os dados existentes (agents -> devices) antes de remover colunas.
-- Em banco vazio os INSERT/UPDATE simplesmente não afetam linhas.
--
-- Decisões de modelagem:
--   * metrics e services      -> device_id  (recursos/daemons da máquina; sobrevivem à reinstalação do agent)
--   * command_results         -> agent_id   (auditoria do que o software executou; inalterado)
--   * localização             -> tabela device_location (permite histórico / device móvel)


-- 1. DEVICE: a máquina (física ou virtual) onde um agent roda.
CREATE TABLE devices (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id           UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    user_organization_id UUID REFERENCES user_organizations(id) ON DELETE SET NULL,
    hostname             VARCHAR(255) NOT NULL,
    fqdn                 VARCHAR(255),
    os                   VARCHAR(50) NOT NULL,  -- linux / windows
    distro               VARCHAR(100),
    arch                 VARCHAR(50) NOT NULL,  -- amd64 / arm64
    kernel_version       VARCHAR(150),
    ip_address           VARCHAR(100) NOT NULL, -- IP principal de comunicação
    mac_address          VARCHAR(100),
    os_user              VARCHAR(100),          -- usuário do SO (ex: "zero", "SYSTEM")
    os_user_fullname     VARCHAR(255),          -- nome completo (ex: "João Tavares")
    os_user_email        VARCHAR(255),          -- UPN / Active Directory
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_network  ON devices(network_id);
CREATE INDEX idx_devices_user_org ON devices(user_organization_id);


-- 2. DEVICE_LOCATION: localização geográfica do device, em tabela própria.
--    Sem UNIQUE(device_id) de propósito -> guarda histórico; a localização atual
--    é a linha mais recente por created_at.
CREATE TABLE device_location (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    latitude      DECIMAL(9,6),  -- precisão ~11cm
    longitude     DECIMAL(9,6),
    location_name VARCHAR(255),  -- Ex: "Rack 04 - Sala de Servidores"
    city          VARCHAR(100),
    country_code  VARCHAR(2),    -- ISO 3166 (BR, US)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_device_location_current ON device_location(device_id, created_at DESC);


-- 3. AGENTS ganha o vínculo com device (e o updated_at que faltava).
ALTER TABLE agents ADD COLUMN device_id  UUID REFERENCES devices(id) ON DELETE CASCADE;
ALTER TABLE agents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- 4. Migração de dados: um device por agent existente, depois religa e move a localização.
ALTER TABLE devices ADD COLUMN legacy_agent_id UUID;  -- mapa temporário agent -> device

INSERT INTO devices (
    legacy_agent_id, network_id, user_organization_id, hostname, fqdn, os, distro,
    arch, kernel_version, ip_address, mac_address, os_user, os_user_fullname,
    os_user_email, created_at
)
SELECT
    id, network_id, user_organization_id, hostname, fqdn, os, distro,
    arch, kernel_version, ip_address, mac_address, os_user, os_user_fullname,
    os_user_email, created_at
FROM agents;

UPDATE agents a
SET device_id = d.id
FROM devices d
WHERE d.legacy_agent_id = a.id;

INSERT INTO device_location (device_id, latitude, longitude, location_name, city, country_code)
SELECT d.id, a.latitude, a.longitude, a.location_name, a.city, a.country_code
FROM agents a
JOIN devices d ON d.legacy_agent_id = a.id
WHERE a.latitude     IS NOT NULL
   OR a.longitude    IS NOT NULL
   OR a.location_name IS NOT NULL
   OR a.city         IS NOT NULL
   OR a.country_code IS NOT NULL;

ALTER TABLE devices DROP COLUMN legacy_agent_id;


-- 5. agent_hardware -> device_hardware (hardware é inventário da máquina).
ALTER TABLE agent_hardware RENAME TO device_hardware;
ALTER TABLE device_hardware ADD COLUMN device_id UUID REFERENCES devices(id) ON DELETE CASCADE;
UPDATE device_hardware h SET device_id = a.device_id FROM agents a WHERE h.agent_id = a.id;
ALTER TABLE device_hardware DROP CONSTRAINT agent_hardware_pkey;
ALTER TABLE device_hardware DROP COLUMN agent_id;
ALTER TABLE device_hardware ALTER COLUMN device_id SET NOT NULL;
ALTER TABLE device_hardware ADD CONSTRAINT device_hardware_pkey PRIMARY KEY (device_id);


-- 6. agent_network_interfaces -> device_network_interfaces.
ALTER TABLE agent_network_interfaces RENAME TO device_network_interfaces;
ALTER TABLE device_network_interfaces ADD COLUMN device_id UUID REFERENCES devices(id) ON DELETE CASCADE;
UPDATE device_network_interfaces n SET device_id = a.device_id FROM agents a WHERE n.agent_id = a.id;
DROP INDEX unique_agent_interface;
ALTER TABLE device_network_interfaces DROP COLUMN agent_id;
ALTER TABLE device_network_interfaces ALTER COLUMN device_id SET NOT NULL;
CREATE UNIQUE INDEX unique_device_interface ON device_network_interfaces (device_id, interface_name);


-- 7. services -> device (daemons rodam na máquina).
ALTER TABLE services ADD COLUMN device_id UUID REFERENCES devices(id) ON DELETE CASCADE;
UPDATE services s SET device_id = a.device_id FROM agents a WHERE s.agent_id = a.id;
ALTER TABLE services DROP CONSTRAINT unique_agent_service;
DROP INDEX idx_services_agent;
ALTER TABLE services DROP COLUMN agent_id;
ALTER TABLE services ALTER COLUMN device_id SET NOT NULL;
ALTER TABLE services ADD CONSTRAINT unique_device_service UNIQUE (device_id, name);
CREATE INDEX idx_services_device ON services(device_id);


-- 8. metrics -> device (telemetria de recursos da máquina).
ALTER TABLE metrics ADD COLUMN device_id UUID REFERENCES devices(id) ON DELETE CASCADE;
UPDATE metrics m SET device_id = a.device_id FROM agents a WHERE m.agent_id = a.id;
DROP INDEX idx_metrics_agent_time;
ALTER TABLE metrics DROP COLUMN agent_id;
ALTER TABLE metrics ALTER COLUMN device_id SET NOT NULL;
CREATE INDEX idx_metrics_device_time ON metrics(device_id, created_at DESC);

-- command_results: permanece referenciando agent_id (auditoria do agent). Sem mudança.


-- 9. Finaliza agents: agora 1:1 com device e sem os atributos de máquina.
ALTER TABLE agents ALTER COLUMN device_id SET NOT NULL;
ALTER TABLE agents ADD CONSTRAINT unique_agent_device UNIQUE (device_id);

ALTER TABLE agents
    DROP COLUMN network_id,
    DROP COLUMN hostname,
    DROP COLUMN fqdn,
    DROP COLUMN os,
    DROP COLUMN distro,
    DROP COLUMN arch,
    DROP COLUMN kernel_version,
    DROP COLUMN ip_address,
    DROP COLUMN mac_address,
    DROP COLUMN latitude,
    DROP COLUMN longitude,
    DROP COLUMN location_name,
    DROP COLUMN city,
    DROP COLUMN country_code,
    DROP COLUMN user_organization_id,
    DROP COLUMN os_user,
    DROP COLUMN os_user_fullname,
    DROP COLUMN os_user_email;
