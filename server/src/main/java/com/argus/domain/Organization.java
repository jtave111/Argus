package com.argus.domain;

import org.jooq.JSON;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

public class Organization {

    private UUID id;
    private String name;
    private String slug;
    private String email;
    private String passwordHash;
    private String topSecret;
    //TODO: criar uma tabela com fk na organization id, talvez para dados da receita, CNPJ razão social e etc, pensar em como fazer isso quando for empresa americana europeia e etc
    private String agentRegistrationKey;
    private List<String> ipAllowlist;
    private Boolean isActive;
    private Instant createdAt;
    private String legalName;
    private String taxId;
    private String industry;
    private String webSite;
    //TODO concertar no banco
    private List<String> phoneNumbers;
    private List<String> faxNumbers;
    private String logoUrl;
    private String locale;
    private String timezone;
    private String billingEmail;

    //TODO: criar tabela de metodo de pagamento criar modelo de tipos de plano tipos de acessos Mudança racical aqui
    private Date planExpirationDate;

    private JSON settings;
    private String notes;
    private Instant updatedAt;
}
