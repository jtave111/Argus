// Modelo de domínio do Argus (espelha o schema PostgreSQL V1–V13).

export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'unknown';
export type AgentStatus = 'online' | 'offline' | 'degraded' | 'updating';
export type ServiceStatus = 'running' | 'stopped' | 'failed' | 'unknown';
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';
export type Environment = 'production' | 'staging' | 'development';

export interface Organization {
  id: string; name: string; legalName: string; taxId: string; industry: string;
  email: string; phone: string; website: string; timezone: string; locale: string;
  plan: string; ipAllowlist: string[]; notes: string;
  // enriquecimento via Receita (opcionais — preenchidos pela consulta de CNPJ)
  tradeName?: string; legalNature?: string; cnae?: string; cnaeCode?: string;
  openingDate?: string; shareCapital?: string; registryStatus?: string; companySize?: string;
  stateRegistration?: string; address?: Address;
}

export interface User {
  id: string; name: string; userName: string; email: string; phone: string;
  mfaEnabled: boolean; failedLoginAttempts: number; active: boolean; roles: string[];
  lastLoginAt: string; lastLoginIp: string; createdAt: string;
}

export interface EmployeeRole { role: string; source: 'manual' | 'active_directory'; }

export interface Employee {
  id: string; userId: string | null; branchId: string; sectorId: string;
  fullName: string; email: string; jobTitle: string; employeeNumber: string;
  department: string; phone: string; mobile: string; status: EmployeeStatus;
  hireDate: string; adObjectGuid: string | null; adUpn: string | null;
  roles: EmployeeRole[];
}

export interface Address {
  street: string; number: string; district: string; city: string; state: string;
  countryCode: string; postalCode: string; latitude: number; longitude: number;
}

export interface Branch {
  id: string; name: string; code: string; type: string; phone: string; email: string;
  managerEmployeeId: string | null; headquarters: boolean; active: boolean; address: Address;
}

export interface Sector {
  id: string; branchId: string; name: string; code: string; type: string;
  floor: string | null; managerEmployeeId: string | null; active: boolean;
}

export interface Network {
  id: string; branchId: string; sectorId: string; name: string; type: string;
  subnet: string; gateway: string; vlanId: number; domain: string; publicIp: string;
  ispProvider: string; bandwidthMbps: number; securityZone: string;
}

export interface NetworkLink {
  id: string; networkAId: string; networkBId: string; linkType: string;
  bandwidthMbps: number; latencyMs: number; status: 'up' | 'degraded' | 'down';
}

export interface Device {
  id: string; networkId: string; employeeId: string | null; hostname: string; fqdn: string;
  os: string; distro: string; arch: string; kernelVersion: string | null;
  osUser: string; deviceType: string; manufacturer: string; model: string;
  serialNumber: string; assetTag: string; virtualization: string;
  environment: Environment; criticality: Criticality; status: DeviceStatus;
  lastBootAt: string; tags: string[];
}

export interface Hardware {
  deviceId: string; cpuModel: string; cpuCores: number; cpuThreads: number;
  ramTotalBytes: number; diskTotalBytes: number; swapTotalBytes: number;
  biosVendor: string; biosVersion: string; gpuModel: string; bootMode: string;
}

export interface NetworkInterface {
  id: string; deviceId: string; interfaceName: string; ipv4Address: string | null;
  ipv6Address: string | null; macAddress: string; speedMbps: number; type: string;
  up: boolean; primary: boolean;
}

export interface Agent {
  id: string; deviceId: string; agentVersion: string; online: boolean; status: AgentStatus;
  enabled: boolean; connectedSince: string | null; lastSeen: string; lastIp: string;
  protocolVersion: string; installPath: string; runAsUser: string;
}

export interface Service {
  id: string; deviceId: string; name: string; displayName: string; type: string;
  status: ServiceStatus; enabled: boolean; pid: number | null; port: number | null;
  healthStatus: HealthStatus; uptimeSeconds: number; monitored: boolean; restartCount: number;
}

export interface Metric {
  deviceId: string; cpuPercent: number; ramPercent: number; diskPercent: number;
  temperatureCelsius: number; loadAvg1: number; processCount: number; createdAt: string;
}

export interface CommandResult {
  id: string; agentId: string; commandStr: string; commandType: string; status: string;
  exitCode: number; durationMs: number; executedAt: string;
}

export interface AuditLog {
  id: string; userId: string; action: string; targetType: string; ipAddress: string;
  severity: 'info' | 'warning' | 'critical'; status: 'success' | 'failure'; createdAt: string;
}

export interface Database {
  organization: Organization;
  users: User[]; employees: Employee[]; branches: Branch[]; sectors: Sector[];
  networks: Network[]; networkLinks: NetworkLink[]; devices: Device[]; hardware: Hardware[];
  interfaces: NetworkInterface[]; agents: Agent[]; services: Service[]; metrics: Metric[];
  commandResults: CommandResult[]; auditLogs: AuditLog[];
}
