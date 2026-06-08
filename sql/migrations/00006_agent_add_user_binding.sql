-- +goose Up

ALTER TABLE agents
  ADD COLUMN user_organization_id UUID REFERENCES user_organizations(id) ON DELETE SET NULL,
  ADD COLUMN os_user              VARCHAR(100),   -- usuário do SO reportado pelo agent (ex: "zero", "SYSTEM")
  ADD COLUMN os_user_fullname     VARCHAR(255),   -- nome completo do usuário (ex: "João Tavares")
  ADD COLUMN os_user_email        VARCHAR(255);   -- e-mail corporativo (UPN / Active Directory)

CREATE INDEX idx_agents_user_org ON agents(user_organization_id);

-- +goose Down

DROP INDEX IF EXISTS idx_agents_user_org;

ALTER TABLE agents
  DROP COLUMN IF EXISTS user_organization_id,
  DROP COLUMN IF EXISTS os_user,
  DROP COLUMN IF EXISTS os_user_fullname,
  DROP COLUMN IF EXISTS os_user_email;
