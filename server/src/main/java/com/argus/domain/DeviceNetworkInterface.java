package com.argus.domain;

import java.time.Instant;
import java.util.UUID;

public class DeviceNetworkInterface {

    private UUID id;
    private UUID deviceId;                 // device_id (NOT NULL) — dono da interface
    private String interfaceName;          // interface_name (NOT NULL) — eth0, wlan0, ens33 · única por device
    private String ipv4Address;
    private String ipv6Address;
    private String macAddress;
    private Integer speedMbps;
    private Boolean isUp;
    private Instant updatedAt;
    private Boolean isPrimary;
    private String type;
    private Integer mtu;
    private String gateway;
    private Integer prefixLength;
    private String duplex;
    private Boolean dhcpEnabled;
    private Boolean isVirtual;
    private String driver;
    private Instant createdAt;

    public DeviceNetworkInterface() {
    }

    public DeviceNetworkInterface(UUID id, UUID deviceId, String interfaceName, String ipv4Address, String ipv6Address,
                                  String macAddress, Integer speedMbps, Boolean isUp, Instant updatedAt, Boolean isPrimary,
                                  String type, Integer mtu, String gateway, Integer prefixLength, String duplex,
                                  
                                  Boolean dhcpEnabled, Boolean isVirtual, String driver, Instant createdAt) {
        this.id = id;
        this.deviceId = deviceId;
        this.interfaceName = interfaceName;
        this.ipv4Address = ipv4Address;
        this.ipv6Address = ipv6Address;
        this.macAddress = macAddress;
        this.speedMbps = speedMbps;
        this.isUp = isUp;
        this.updatedAt = updatedAt;
        this.isPrimary = isPrimary;
        this.type = type;
        this.mtu = mtu;
        this.gateway = gateway;
        this.prefixLength = prefixLength;
        this.duplex = duplex;
        this.dhcpEnabled = dhcpEnabled;
        this.isVirtual = isVirtual;
        this.driver = driver;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(UUID deviceId) {
        this.deviceId = deviceId;
    }

    public String getInterfaceName() {
        return interfaceName;
    }

    public void setInterfaceName(String interfaceName) {
        this.interfaceName = interfaceName;
    }

    public String getIpv4Address() {
        return ipv4Address;
    }

    public void setIpv4Address(String ipv4Address) {
        this.ipv4Address = ipv4Address;
    }

    public String getIpv6Address() {
        return ipv6Address;
    }

    public void setIpv6Address(String ipv6Address) {
        this.ipv6Address = ipv6Address;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public Integer getSpeedMbps() {
        return speedMbps;
    }

    public void setSpeedMbps(Integer speedMbps) {
        this.speedMbps = speedMbps;
    }

    public Boolean getUp() {
        return isUp;
    }

    public void setUp(Boolean up) {
        isUp = up;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getPrimary() {
        return isPrimary;
    }

    public void setPrimary(Boolean primary) {
        isPrimary = primary;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getMtu() {
        return mtu;
    }

    public void setMtu(Integer mtu) {
        this.mtu = mtu;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public Integer getPrefixLength() {
        return prefixLength;
    }

    public void setPrefixLength(Integer prefixLength) {
        this.prefixLength = prefixLength;
    }

    public String getDuplex() {
        return duplex;
    }

    public void setDuplex(String duplex) {
        this.duplex = duplex;
    }

    public Boolean getDhcpEnabled() {
        return dhcpEnabled;
    }

    public void setDhcpEnabled(Boolean dhcpEnabled) {
        this.dhcpEnabled = dhcpEnabled;
    }

    public Boolean getVirtual() {
        return isVirtual;
    }

    public void setVirtual(Boolean virtual) {
        isVirtual = virtual;
    }

    public String getDriver() {
        return driver;
    }

    public void setDriver(String driver) {
        this.driver = driver;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
