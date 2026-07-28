-- Introduz a estrutura corporativa: organization -> branch -> sector -> network,
-- separa ENDEREÇO em tabela própria e transforma user_organizations em EMPLOYEES.
--
-- Modelo mental:
--   * organization = a empresa (registro/documentação). Não é um lugar.
--   * branch       = filial / loja física. É onde mora a localização (via addresses).
--   * sector       = setor/departamento dentro da filial (TI, Caixa, Estoque...).
--   * network      = agora pertence a uma branch (e opcionalmente a um sector);
--                    perde a localização (herda da filial) e o organization_id (chega via branch).
--   * employee     = funcionário da empresa (antes user_organizations). user_id é NULÁVEL:
--                    só funcionário que também é admin/operador tem conta em `users`.
--
-- Data-safe: cria uma branch "Matriz" por organização e religa as networks existentes
-- nela antes de remover colunas. Em banco vazio os INSERT/UPDATE não afetam linhas.


-- 1. BRANCH: filial / loja física da empresa.
CREATE TABLE branches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,  -- ex: "Loja Shopping Iguatemi"
    code            VARCHAR(50),            -- código interno da filial
    phone           VARCHAR(50),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_branches_org ON branches(organization_id);
CREATE UNIQUE INDEX unique_branch_org_code ON branches(organization_id, code) WHERE code IS NOT NULL;


-- 2. ADDRESS: endereço da filial, em tabela própria (sem UNIQUE -> permite histórico).
--    O endereço atual é a linha mais recente por created_at.
CREATE TABLE addresses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id    UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    street       VARCHAR(255),
    number       VARCHAR(50),
    complement   VARCHAR(255),
    district     VARCHAR(100),   -- bairro
    city         VARCHAR(100),
    state        VARCHAR(100),   -- estado / província
    country_code VARCHAR(2),     -- ISO 3166 (BR, US)
    postal_code  VARCHAR(20),
    latitude     DECIMAL(9,6),
    longitude    DECIMAL(9,6),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_branch ON addresses(branch_id);


-- 3. SECTOR: setor/departamento dentro de uma filial.
CREATE TABLE sectors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,  -- ex: "TI", "Caixa", "Estoque"
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sector_branch_name UNIQUE (branch_id, name)
);
CREATE INDEX idx_sectors_branch ON sectors(branch_id);


-- 4. NETWORKS religadas à hierarquia: ganham branch_id (+ sector_id), perdem
--    organization_id e a localização (que agora vive na branch/addresses).
ALTER TABLE networks ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE networks ADD COLUMN sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL;

-- 4a. Uma branch "Matriz" por organização (coluna temporária pro mapeamento).
ALTER TABLE branches ADD COLUMN legacy_default_for_org UUID;
INSERT INTO branches (organization_id, name, legacy_default_for_org)
SELECT id, 'Matriz', id FROM organizations;

-- 4b. Religa as networks existentes na Matriz da sua organização.
UPDATE networks n
SET branch_id = b.id
FROM branches b
WHERE b.legacy_default_for_org = n.organization_id;

-- 4c. Move a localização que estava na network para um address da branch.
INSERT INTO addresses (branch_id, street, city, country_code, latitude, longitude)
SELECT DISTINCT ON (b.id) b.id, n.address, n.city, n.country_code, n.latitude, n.longitude
FROM networks n
JOIN branches b ON b.legacy_default_for_org = n.organization_id
WHERE n.address      IS NOT NULL
   OR n.city         IS NOT NULL
   OR n.country_code IS NOT NULL
   OR n.latitude     IS NOT NULL
   OR n.longitude    IS NOT NULL
ORDER BY b.id, n.created_at;

ALTER TABLE branches DROP COLUMN legacy_default_for_org;

ALTER TABLE networks ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE networks
    DROP COLUMN organization_id,
    DROP COLUMN latitude,
    DROP COLUMN longitude,
    DROP COLUMN location_name,
    DROP COLUMN address,
    DROP COLUMN city,
    DROP COLUMN country_code;
CREATE INDEX idx_networks_branch ON networks(branch_id);
CREATE INDEX idx_networks_sector ON networks(sector_id);


-- 5. EMPLOYEES (era user_organizations): funcionário da empresa.
ALTER TABLE user_organizations RENAME TO employees;
ALTER TABLE employees ALTER COLUMN user_id DROP NOT NULL;            -- funcionário pode não ter login
ALTER TABLE employees RENAME CONSTRAINT unique_user_org TO unique_employee_user_org;
ALTER TABLE employees ADD COLUMN full_name  VARCHAR(255);            -- identidade (pode não haver linha em users)
ALTER TABLE employees ADD COLUMN email      VARCHAR(255);
ALTER TABLE employees ADD COLUMN job_title  VARCHAR(100);            -- cargo (RH) — distinto do `role` (RBAC)
ALTER TABLE employees ADD COLUMN branch_id  UUID REFERENCES branches(id) ON DELETE SET NULL; -- filial onde trabalha
ALTER TABLE employees ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX idx_employees_org    ON employees(organization_id);
CREATE INDEX idx_employees_user   ON employees(user_id);
CREATE INDEX idx_employees_branch ON employees(branch_id);


-- 6. devices.user_organization_id -> devices.employee_id (o device é atribuído ao funcionário).
--    A FK acompanha o rename da tabela automaticamente; só renomeamos coluna e índice.
ALTER TABLE devices RENAME COLUMN user_organization_id TO employee_id;
ALTER INDEX idx_devices_user_org RENAME TO idx_devices_employee;
