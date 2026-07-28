

CREATE TABLE networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'lan', -- lan / wan / dmz / vpn / cloud
  subnet VARCHAR(100) NOT NULL, -- Ex: 192.168.1.0/24
  gateway VARCHAR(100),
  dns_primary VARCHAR(100),
  dns_secondary VARCHAR(100),
  vlan_id INT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  location_name VARCHAR(255), -- Ex: "Sede Central - Bloco A"
  address VARCHAR(255),
  city VARCHAR(100),
  country_code VARCHAR(2) NOT NULL, -- ISO 3166 (BR, US)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE network_topology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_a_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  network_b_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  link_type VARCHAR(50) NOT NULL, -- vpn / peering / tunnel
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX unique_topology_pair ON network_topology (
  LEAST(network_a_id::text, network_b_id::text),
  GREATEST(network_a_id::text, network_b_id::text)
);

