-- Completa a tabela `users` (identidade de login) e move os papéis de sistema para
-- uma tabela própria, conforme os TODOs em domain/User.java.
--
-- Lembrando o conceito: `users` é só AUTENTICAÇÃO (quem loga no Argus). A identidade
-- de RH do funcionário vive em `employees`; aqui ficam credenciais + handle de login.


-- 1. Identidade de login.
ALTER TABLE users ADD COLUMN name      VARCHAR(255);  -- nome completo de exibição
ALTER TABLE users ADD COLUMN user_name VARCHAR(100);  -- handle de login (ex: "jtavares")
CREATE UNIQUE INDEX unique_users_user_name ON users(user_name) WHERE user_name IS NOT NULL;

-- NOTA: password_hash NÃO foi renomeado para "password" de propósito — a coluna guarda
-- um HASH (bcrypt/argon2), não a senha. Manter "password_hash" evita a leitura errada de
-- que ali caberia texto plano. O campo Java pode se chamar como você quiser.


-- 2. Papéis de sistema do usuário (vários por usuário) — RoleUser { ADMIN, OWNER, SERVICE_DESK }.
CREATE TABLE user_roles (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role),
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'OWNER', 'SERVICE_DESK'))
);
