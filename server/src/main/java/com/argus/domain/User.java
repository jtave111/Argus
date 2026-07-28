package com.argus.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class User {

    private UUID id;

    private String name;
    private String userName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String locale;
    private String timezone;
    private String passwordHash;
    private String totpSecret;
    private boolean mfaEnabled;
    private Instant passwordChangedAt;
    private Instant emailVerifiedAt;
    private int failedLoginAttempts;
    private Instant lockedUntil;
    private boolean isActive;
    private List<RoleUser> roles;
    private Instant lastLoginAt;
    private String lastLoginIp;
    private Instant createdAt;
    private Instant updatedAt;

    public User(){

    }

    public User(
                UUID id, String name, String userName,
                String email, String phone, String avatarUrl,
                String locale, String timezone, String passwordHash,
                String totpSecret, boolean mfaEnabled,Instant passwordChangedAt,
                Instant emailVerifiedAt, int failedLoginAttempts,
                Instant lockedUntil, boolean isActive,
                List<RoleUser> roles, Instant lastLoginAt,
                String lastLoginIp, Instant createdAt,
                Instant updatedAt
            ) {

        this.id = id;
        this.name = name;
        this.userName = userName;
        this.email = email;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.locale = locale;
        this.timezone = timezone;
        this.passwordHash = passwordHash;
        this.totpSecret = totpSecret;
        this.mfaEnabled = mfaEnabled;
        this.passwordChangedAt = passwordChangedAt;
        this.emailVerifiedAt = emailVerifiedAt;
        this.failedLoginAttempts = failedLoginAttempts;
        this.lockedUntil = lockedUntil;
        this.isActive = isActive;
        this.roles = roles;
        this.lastLoginAt = lastLoginAt;
        this.lastLoginIp = lastLoginIp;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getTotpSecret() {
        return totpSecret;
    }

    public void setTotpSecret(String totpSecret) {
        this.totpSecret = totpSecret;
    }

    public boolean isMfaEnabled() {
        return mfaEnabled;
    }

    public void setMfaEnabled(boolean mfaEnabled) {
        this.mfaEnabled = mfaEnabled;
    }

    public Instant getPasswordChangedAt() {
        return passwordChangedAt;
    }

    public void setPasswordChangedAt(Instant passwordChangedAt) {
        this.passwordChangedAt = passwordChangedAt;
    }

    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public void setEmailVerifiedAt(Instant emailVerifiedAt) {
        this.emailVerifiedAt = emailVerifiedAt;
    }

    public int getFailedLoginAttempts() {
        return failedLoginAttempts;
    }

    public void setFailedLoginAttempts(int failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts;
    }

    public Instant getLockedUntil() {
        return lockedUntil;
    }

    public void setLockedUntil(Instant lockedUntil) {
        this.lockedUntil = lockedUntil;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public List<RoleUser> getRoles() {
        return roles;
    }

    public void setRoles(List<RoleUser> roles) {
        this.roles = roles;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getLastLoginIp() {
        return lastLoginIp;
    }

    public void setLastLoginIp(String lastLoginIp) {
        this.lastLoginIp = lastLoginIp;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}


enum RoleUser {
    ADMIN,
    OWNER,
    SERVICE_DESK
}
