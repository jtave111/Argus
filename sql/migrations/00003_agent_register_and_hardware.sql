-- +goose Up

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    fqdn VARCHAR(255),
    os VARCHAR(50) NOT NULL, -- linux / windows
    distro VARCHAR(100),
    arch VARCHAR(50) NOT NULL, -- amd64 / arm64
    kernel_version VARCHAR(150),
    ip_address VARCHAR(100) NOT NULL, -- IP principal de comunicação
    mac_address VARCHAR(100),
    agent_version VARCHAR(50) NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ,
    latitude DECIMAL(9,6),   -- Coordenadas geográficas reais com
    longitude DECIMAL(9,6),  -- precisão cirúrgica de ~11cm
    location_name VARCHAR(255), -- Ex: "Rack 04 - Sala de Servidores"
    city VARCHAR(100),
    country_code VARCHAR(2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Especificações técnicas e inventário de hardware fixo do servidor remoto
CREATE TABLE agent_hardware (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    cpu_model VARCHAR(255) NOT NULL,
    cpu_cores INT NOT NULL,
    cpu_threads INT NOT NULL,
    ram_total_bytes BIGINT NOT NULL,
    disk_total_bytes BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mapeamento de todas as interfaces físicas/virtuais ativas na máquina do agente
CREATE TABLE agent_network_interfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  interface_name VARCHAR(100) NOT NULL, -- eth0, wlan0, ens33
  ip_address VARCHAR(100) NOT NULL,
  mac_address VARCHAR(100),
  speed_mbps INT,
  is_up BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS agent_network_interfaces;
DROP TABLE IF EXISTS agent_hardware;
DROP TABLE IF EXISTS agents;