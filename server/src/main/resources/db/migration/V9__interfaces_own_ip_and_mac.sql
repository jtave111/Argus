-- Centraliza IPs e MACs em device_network_interfaces e remove a duplicação que ficou
-- em `devices`. Até a V8, `devices` carregava ip_address/mac_address ("IP principal")
-- ao mesmo tempo que device_network_interfaces guardava o IP/MAC por interface — a mesma
-- informação em dois lugares.
--
-- A partir daqui:
--   * device_network_interfaces é a fonte única de IPs/MACs da máquina;
--   * cada interface pode ter IPv4 e IPv6 ao mesmo tempo (ipv4_address + ipv6_address);
--   * is_primary marca a interface principal de comunicação (no máx. uma por device);
--   * `devices` deixa de ter ip_address/mac_address.
--
-- Data-safe: migra o IP/MAC que estava em `devices` para uma interface principal antes
-- de remover as colunas. Em banco vazio os INSERT/UPDATE não afetam linhas.


-- 1. device_network_interfaces passa a ter ipv4 + ipv6 separados e a flag de principal.
ALTER TABLE device_network_interfaces RENAME COLUMN ip_address TO ipv4_address;
ALTER TABLE device_network_interfaces ALTER COLUMN ipv4_address DROP NOT NULL; -- interface pode ser só-IPv6
ALTER TABLE device_network_interfaces ADD COLUMN ipv6_address VARCHAR(100);
ALTER TABLE device_network_interfaces ADD COLUMN is_primary    BOOLEAN NOT NULL DEFAULT false;


-- 2. Migração de dados: o IP/MAC "principal" que estava em devices vira uma interface
--    marcada como principal. interface_name 'primary' é um placeholder — o agent
--    sobrescreve com o nome real (eth0, ens33...) no próximo inventário.
INSERT INTO device_network_interfaces (device_id, interface_name, ipv4_address, mac_address, is_primary)
SELECT id, 'primary', ip_address, mac_address, true
FROM devices;


-- 3. No máximo uma interface principal por device.
CREATE UNIQUE INDEX unique_device_primary_interface
  ON device_network_interfaces (device_id)
  WHERE is_primary;


-- 4. devices deixa de duplicar IP/MAC — agora é tudo via interfaces.
ALTER TABLE devices
    DROP COLUMN ip_address,
    DROP COLUMN mac_address;
