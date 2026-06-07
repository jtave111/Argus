-- +goose Up

-- Serviços e daemons monitorados ativamente por cada agente
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Nome interno (nginx, postgresql, sshd)
  display_name VARCHAR(255) NOT NULL, -- Nome amigável (Nginx Web Server)
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'daemon', -- web / database / daemon / cron / proxy
  status VARCHAR(50) NOT NULL DEFAULT 'unknown', -- running / stopped / failed / unknown
  enabled BOOLEAN NOT NULL DEFAULT false,
  pid INT,
  run_as_user VARCHAR(100),
  port INT,
  protocol VARCHAR(10) DEFAULT 'tcp', -- tcp / udp
  restart_policy VARCHAR(50) DEFAULT 'on-failure',
  health_check_cmd VARCHAR(255),
  health_check_url VARCHAR(255),
  last_health_check TIMESTAMPTZ,
  health_status VARCHAR(50) DEFAULT 'unknown', -- healthy / unhealthy / unknown
  uptime_seconds BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agent_service UNIQUE (agent_id, name)
);

-- Árvore de dependência estrutural entre serviços (Serviço A necessita do Serviço B)
CREATE TABLE service_dependencies (
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, depends_on_id)
);

CREATE INDEX idx_services_agent ON services(agent_id);

-- +goose Down
DROP TABLE IF EXISTS service_dependencies;
DROP TABLE IF EXISTS services;