package com.argus.domain;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

public class Agent {

    private UUID id;
    private UUID network_id;
    private String tokenHash;
    private String hostname; //TODO: hostname do agent ?
    private String fqdn;

    private String ipv4Address;
    //TODO: criar coluna ipv6  na migration


    private String ipv6Address;
    private String macAddress;
    private String agentVersion;
    private boolean isActive; //TODO: renomear a coluna
    private Date lastSeen;
    //TODO: criar tabela agent location com fk no UUID id do agent  na migration em vez de hardcoda as cordenadas aqui
    private Date createdAt;
    //TODO: criar coluna na migration
    private Date updatedAt;
    private UUID organizationId;

    //TODO: DEVICE (AGENT DEVE SER O INPLANT NO DEVICE, NO CENARIO ATUAL PRESURMIRMSOS QUE O AGENT JA E PROPIO DEVICE E ISSO ESTA ERRADO)
    /*
    private String operatingSystem;
    private String distro;
    private String architecture;
    private String kernelVersion;
    private String os_user_fullname
    private String os_user_email
    private possivel sincronização no Active directory?
     */

}
