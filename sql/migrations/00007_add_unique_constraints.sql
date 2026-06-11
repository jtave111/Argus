-- +goose Up
CREATE UNIQUE INDEX unique_agent_interface ON agent_network_interfaces (agent_id, interface_name);

-- +goose Down
DROP INDEX IF EXISTS unique_agent_interface;
