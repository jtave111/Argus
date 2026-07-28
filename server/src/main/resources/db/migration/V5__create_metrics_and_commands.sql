

-- Histórico contínuo de telemetria de desempenho enviado via gRPC streams
CREATE TABLE metrics (
 id BIGSERIAL PRIMARY KEY, -- BIGSERIAL devido ao altíssimo volume de escrita
 agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
 cpu_percent REAL NOT NULL,
 ram_percent REAL NOT NULL,
 disk_percent REAL NOT NULL,
 net_in_kbps INT,
 net_out_kbps INT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice composto focado no tempo para carregar gráficos do dashboard sem latência
CREATE INDEX idx_metrics_agent_time ON metrics(agent_id, created_at DESC);

-- Registro persistente dos comandos interativos enviados via shell remoto
CREATE TABLE command_results (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
 command_id VARCHAR(255) NOT NULL, -- ID correlacionado ao contrato do Protocol Buffer
 command_str TEXT NOT NULL,
 output TEXT,
 exit_code INT NOT NULL,
 executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cmd_results_agent ON command_results(agent_id);

