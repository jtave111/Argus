package com.argus.domain;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class Device {
    private UUID id;
    private UUID networkId;               // network_id (NOT NULL) — segmento lógico onde a máquina está na topologia
    private UUID userOrganizationId;      // user_organization_id (nullable) — responsável/dono dentro da org
    private String hostname;              // NOT NULL
    private String fqdn;
    private String os;                    // NOT NULL — linux / windows
    private String distro;
    private String arch;                  // NOT NULL — amd64 / arm64
    private String kernelVersion;
    private String osUser;                // usuário do SO (ex: "zero", "SYSTEM")
    private String osUserFullName;        // os_user_fullname
    private String osUserEmail;           // os_user_email (UPN / Active Directory)

    private String deviceType;            // server/desktop/laptop/vm/container/network_device/mobile
    private String manufacturer;
    private String model;
    private String serialNumber;
    private String assetTag;              // patrimônio
    private String virtualization;        // bare-metal/kvm/vmware/hyperv/docker
    private String environment;           // production/staging/development
    private String criticality;           // low/medium/high/critical
    private String status;                // online/offline/maintenance/decommissioned (NOT NULL default 'unknown')
    private String timezone;
    private Instant lastBootAt;           // TIMESTAMPTZ
    private List<String> tags;            // TEXT[]
    private String notes;
    private Map<String, String> metadata; // JSONB

    private Instant createdAt;
    private Instant updatedAt;

 

}
