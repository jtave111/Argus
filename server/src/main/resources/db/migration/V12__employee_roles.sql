-- Troca o single-role employees.role por uma tabela employee_roles (vários papéis por
-- funcionário), no mesmo espírito de user_roles.
--
-- Pensado para futura sincronização com Active Directory (grupos AD -> roles):
--   * `role` é flexível (VARCHAR, SEM CHECK rígido) — um grupo AD é um nome arbitrário;
--   * `source` marca a origem do papel (manual ou vindo do AD), pra um sync futuro
--     poder reconciliar só o que ele gerencia sem apagar o que foi atribuído à mão.
--
-- Diferença proposital pro user_roles: aquele é papel de SISTEMA de quem loga
-- (ADMIN/OWNER/SERVICE_DESK, com CHECK fechado); este é papel do FUNCIONÁRIO, aberto
-- pra absorver grupos do AD.
--
-- Data-safe: migra o role atual de cada employee antes de remover a coluna.


CREATE TABLE employee_roles (
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role        VARCHAR(100) NOT NULL,                  -- ex: OWNER, ADMIN, ou um grupo do AD
    source      VARCHAR(50)  NOT NULL DEFAULT 'manual', -- manual | active_directory
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (employee_id, role),
    CONSTRAINT chk_employee_role_source CHECK (source IN ('manual', 'active_directory'))
);
CREATE INDEX idx_employee_roles_role ON employee_roles(role);

-- Migra o role single-column (texto livre, default 'viewer') pra nova tabela,
-- normalizando pra maiúsculas como em user_roles.
INSERT INTO employee_roles (employee_id, role, source)
SELECT id, UPPER(role), 'manual' FROM employees;

-- Agora a fonte única de papéis do funcionário é employee_roles.
ALTER TABLE employees DROP COLUMN role;
