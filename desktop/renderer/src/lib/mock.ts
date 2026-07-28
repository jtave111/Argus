// Dados MOCK (descartáveis) — cenário de rede de varejo espelhando o schema.
// Determinístico. Quando o backend existir, trocar `db` por chamadas à API real.
import type {
  Database, Device, Service, Agent, Branch, Sector, Network, NetworkLink,
  Employee, User, Metric, Hardware, NetworkInterface, CommandResult, AuditLog
} from './types';

let seed = 0xA11CE;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function ri(a: number, b: number) { return Math.floor(rnd() * (b - a + 1)) + a; }
function pick<T>(arr: T[]): T { return arr[Math.floor(rnd() * arr.length)]; }
function chance(p: number) { return rnd() < p; }
let idc = 0;
const uid = () => `${(++idc).toString(16).padStart(8, '0')}`;
const now = Date.now();
const ago = (ms: number) => new Date(now - ms).toISOString();
const DAY = 864e5, HOUR = 36e5, MIN = 6e4;

const CITIES: [string, string, number, number][] = [
  ['São Paulo', 'SP', -23.5505, -46.6333],
  ['Cajamar', 'SP', -23.3556, -46.8764],
  ['Rio de Janeiro', 'RJ', -22.9068, -43.1729],
  ['Curitiba', 'PR', -25.4284, -49.2733],
  ['Recife', 'PE', -8.0476, -34.877],
];

function build(): Database {
  const db: Database = {
    organization: {
      id: uid(), name: 'Nexus Varejo', legalName: 'Nexus Comércio Varejista S.A.',
      taxId: '12.345.678/0001-90', industry: 'Varejo', email: 'ti@nexusvarejo.com.br',
      phone: '+55 11 3000-0000', website: 'https://nexusvarejo.com.br',
      timezone: 'America/Sao_Paulo', locale: 'pt-BR', plan: 'enterprise',
      ipAllowlist: ['201.17.0.0/16', '187.45.32.0/20'], notes: 'Matriz, CD e lojas.'
    },
    users: [], employees: [], branches: [], sectors: [], networks: [], networkLinks: [],
    devices: [], hardware: [], interfaces: [], agents: [], services: [], metrics: [],
    commandResults: [], auditLogs: []
  };

  const specs: [string, string, number, boolean, string[]][] = [
    ['Matriz São Paulo', 'headquarters', 0, true, ['TI Corporativa', 'Data Center', 'Administrativo']],
    ['CD Cajamar', 'warehouse', 1, false, ['Logística', 'TI Local', 'Expedição']],
    ['Loja Iguatemi', 'store', 0, false, ['PDV / Caixa', 'Estoque', 'Gerência']],
    ['Loja Barra', 'store', 2, false, ['PDV / Caixa', 'Estoque']],
    ['Loja Batel', 'store', 3, false, ['PDV / Caixa', 'Estoque']],
    ['Filial Nordeste', 'office', 4, false, ['TI Local', 'Administrativo']],
  ];

  let subnet = 10;
  for (const [name, type, ci, hq, secs] of specs) {
    const [city, uf, lat, lon] = CITIES[ci];
    const bid = uid();
    const code = name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() + ri(10, 99);
    const branch: Branch = {
      id: bid, name, code, type, phone: `+55 ${ri(11, 85)} 3${ri(100, 999)}-${ri(1000, 9999)}`,
      email: name.toLowerCase().replace(/[^a-z]/g, '') + '@nexusvarejo.com.br',
      managerEmployeeId: null, headquarters: hq, active: true,
      address: {
        street: pick(['Av. Faria Lima', 'Rod. Anhanguera km 33', 'Av. das Américas', 'Rua Comendador Araújo', 'Av. Boa Viagem']),
        number: String(ri(100, 4999)), district: pick(['Centro', 'Itaim', 'Barra', 'Batel', 'Boa Viagem']),
        city, state: uf, countryCode: 'BR', postalCode: `${ri(10000, 89999)}-${ri(100, 999)}`,
        latitude: lat + (rnd() - 0.5) * 0.05, longitude: lon + (rnd() - 0.5) * 0.05
      }
    };
    db.branches.push(branch);

    const sectorObjs: Sector[] = secs.map(sn => ({
      id: uid(), branchId: bid, name: sn,
      code: sn.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
      type: sn.includes('TI') || sn.includes('Data') ? 'it' : sn.includes('Log') || sn.includes('Exped') ? 'logistics' : sn.includes('PDV') ? 'sales' : 'operations',
      floor: chance(0.5) ? `${ri(1, 5)}º andar` : null, managerEmployeeId: null, active: true
    }));
    db.sectors.push(...sectorObjs);
    const itSec = sectorObjs.find(s => s.type === 'it') || sectorObjs[0];

    const primary: Network = {
      id: uid(), branchId: bid, sectorId: itSec.id, name: `${name} — LAN`, type: 'lan',
      subnet: `10.${subnet}.0.0/24`, gateway: `10.${subnet}.0.1`, vlanId: 100 + subnet,
      domain: 'nexus.local', publicIp: `201.17.${ri(1, 254)}.${ri(1, 254)}`,
      ispProvider: pick(['Vivo Empresas', 'Claro NET', 'Algar']), bandwidthMbps: pick([200, 300, 500, 1000]),
      securityZone: 'trusted'
    };
    db.networks.push(primary);
    if (hq) {
      db.networks.push({
        id: uid(), branchId: bid, sectorId: itSec.id, name: 'Matriz — DMZ', type: 'dmz',
        subnet: `10.${subnet}.9.0/24`, gateway: `10.${subnet}.9.1`, vlanId: 900, domain: 'nexus.local',
        publicIp: `201.17.${ri(1, 254)}.${ri(1, 254)}`, ispProvider: 'Vivo Empresas',
        bandwidthMbps: 1000, securityZone: 'dmz'
      });
    }
    subnet += 10;

    const servers = type === 'headquarters' ? 6 : type === 'warehouse' ? 2 : 1;
    const workstations = type === 'store' ? 5 : 3;
    for (let k = 0; k < servers; k++) makeDevice(db, branch, primary, 'server', k);
    for (let k = 0; k < workstations; k++) makeDevice(db, branch, primary, type === 'store' ? 'pdv' : 'desktop', k);
  }

  // VPN matriz ↔ filiais
  const hqNet = db.networks.find(n => n.branchId === db.branches[0].id)!;
  db.branches.slice(1).forEach(b => {
    const rem = db.networks.find(n => n.branchId === b.id)!;
    db.networkLinks.push({
      id: uid(), networkAId: hqNet.id, networkBId: rem.id, linkType: 'vpn',
      bandwidthMbps: pick([50, 100, 200]), latencyMs: ri(4, 45), status: chance(0.85) ? 'up' : 'degraded'
    });
  });

  // usuários
  const us: [string, string, string[]][] = [
    ['João Tavares', 'jtavares', ['OWNER', 'ADMIN']], ['Marina Prado', 'mprado', ['ADMIN']],
    ['Carlos Nunes', 'cnunes', ['ADMIN']], ['Renata Lima', 'rlima', ['SERVICE_DESK']],
    ['Paulo Reis', 'preis', ['SERVICE_DESK']], ['Sofia Alves', 'salves', ['SERVICE_DESK']],
  ];
  us.forEach(([nm, un, roles]) => db.users.push({
    id: uid(), name: nm, userName: un, email: `${un}@nexusvarejo.com.br`,
    phone: `+55 11 9${ri(1000, 9999)}-${ri(1000, 9999)}`, mfaEnabled: chance(0.7),
    failedLoginAttempts: chance(0.2) ? ri(1, 3) : 0, active: true, roles,
    lastLoginAt: ago(ri(1, 72) * HOUR), lastLoginIp: `201.17.${ri(1, 254)}.${ri(1, 254)}`,
    createdAt: ago(ri(200, 600) * DAY)
  }));

  // funcionários
  const first = ['Ana', 'Bruno', 'Camila', 'Diego', 'Fernanda', 'Gustavo', 'Juliana', 'Marcelo', 'Patrícia', 'Rafael', 'Larissa', 'Thiago', 'Vanessa', 'André', 'Priscila'];
  const last = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Almeida', 'Ferreira', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Ribeiro', 'Carvalho'];
  const jobs = ['Analista de TI', 'Técnico de Suporte', 'Gerente de Loja', 'Operador de Caixa', 'Repositor', 'Coordenador de Logística', 'Analista de Redes', 'Auxiliar Administrativo', 'Supervisor de TI', 'Estoquista'];
  const rolespool = ['LEITURA', 'OPERACAO', 'INVENTARIO', 'SUPORTE_N1', 'GESTAO_LOJA'];
  for (let k = 0; k < 40; k++) {
    const b = pick(db.branches);
    const secs = db.sectors.filter(s => s.branchId === b.id);
    const fn = pick(first), ln = pick(last);
    const roles: Employee['roles'] = [];
    for (let r = 0; r < ri(1, 3); r++) roles.push({ role: pick(rolespool), source: chance(0.5) ? 'active_directory' : 'manual' });
    db.employees.push({
      id: uid(), userId: k < db.users.length && chance(0.9) ? db.users[k].id : null,
      branchId: b.id, sectorId: pick(secs).id, fullName: `${fn} ${ln}`,
      email: `${fn}.${ln}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@nexusvarejo.com.br',
      jobTitle: pick(jobs), employeeNumber: `MAT${ri(10000, 99999)}`, department: pick(secs).name,
      phone: `+55 ${ri(11, 85)} 3${ri(100, 999)}-${ri(1000, 9999)}`, mobile: `+55 ${ri(11, 85)} 9${ri(1000, 9999)}-${ri(1000, 9999)}`,
      status: chance(0.86) ? 'active' : pick(['on_leave', 'suspended', 'terminated'] as const),
      hireDate: ago(ri(60, 1500) * DAY).slice(0, 10),
      adObjectGuid: chance(0.6) ? `${ri(10000000, 99999999)}-guid` : null,
      adUpn: chance(0.6) ? `${fn}.${ln}@nexus.local`.toLowerCase() : null, roles
    });
  }

  // command results + audit
  const cmds = ['systemctl status nginx', 'df -h', 'uptime', 'docker ps', 'free -m', 'whoami', 'ip a'];
  const onlineAgents = db.agents.filter(a => a.online);
  for (let k = 0; k < 50; k++) {
    const a = onlineAgents.length ? pick(onlineAgents) : pick(db.agents);
    const svc = chance(0.4);
    const st = chance(0.85) ? 'success' : chance(0.5) ? 'failed' : 'timeout';
    db.commandResults.push({
      id: uid(), agentId: a.id, commandStr: svc ? `service ${pick(['nginx', 'postgresql', 'sshd'])} restart` : pick(cmds),
      commandType: svc ? 'service' : 'shell', status: st, exitCode: st === 'success' ? 0 : st === 'timeout' ? 124 : ri(1, 2),
      durationMs: ri(30, 4200), executedAt: ago(ri(1, 240) * HOUR)
    });
  }
  db.commandResults.sort((a, b) => a.executedAt < b.executedAt ? 1 : -1);

  const acts: [string, string, AuditLog['severity']][] = [
    ['user.login', 'user', 'info'], ['user.login_failed', 'user', 'warning'], ['agent.install', 'agent', 'info'],
    ['service.restart', 'service', 'info'], ['service.stop', 'service', 'warning'], ['shell.execute', 'agent', 'warning'],
    ['device.decommission', 'device', 'critical'], ['user.role_change', 'user', 'critical'],
  ];
  for (let k = 0; k < 70; k++) {
    const [action, target, sev] = pick(acts);
    db.auditLogs.push({
      id: uid(), userId: pick(db.users).id, action, targetType: target,
      ipAddress: `201.17.${ri(1, 254)}.${ri(1, 254)}`, severity: sev,
      status: action.includes('failed') ? 'failure' : 'success', createdAt: ago(ri(1, 400) * HOUR)
    });
  }
  db.auditLogs.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);

  // gerentes de filial
  db.branches.forEach(b => {
    const mgr = db.employees.find(e => e.branchId === b.id && /Gerente|Coordenador|Supervisor/.test(e.jobTitle));
    if (mgr) b.managerEmployeeId = mgr.id;
  });

  return db;
}

function makeDevice(db: Database, b: Branch, net: Network, kind: string, idx: number) {
  const isServer = kind === 'server';
  const os = isServer ? (chance(0.85) ? 'linux' : 'windows') : (chance(0.75) ? 'windows' : 'linux');
  const host = kind === 'pdv' ? `pdv-${b.code.toLowerCase()}-${String(idx + 1).padStart(2, '0')}`
    : isServer ? `srv-${b.code.toLowerCase()}-${['web', 'db', 'app', 'proxy', 'mon', 'bkp'][idx % 6]}`
      : `${kind}-${b.code.toLowerCase()}-${String(idx + 1).padStart(2, '0')}`;
  const status = chance(0.82) ? 'online' : chance(0.5) ? 'offline' : 'maintenance';
  const did = uid();
  const dev: Device = {
    id: did, networkId: net.id, employeeId: null, hostname: host, fqdn: `${host}.nexus.local`, os,
    distro: os === 'linux' ? pick(['Ubuntu 22.04', 'Debian 12', 'Rocky Linux 9']) : pick(['Windows Server 2022', 'Windows 11 Pro']),
    arch: chance(0.9) ? 'amd64' : 'arm64', kernelVersion: os === 'linux' ? pick(['6.5.0-35', '6.1.0-18', '5.14.0-427']) : null,
    osUser: kind === 'pdv' ? 'caixa' : os === 'windows' ? 'operador' : 'nexus',
    deviceType: isServer ? 'server' : kind === 'pdv' ? 'desktop' : 'desktop',
    manufacturer: pick(['Dell', 'HP', 'Lenovo', 'Positivo']), model: pick(['PowerEdge R650', 'ProLiant DL360', 'OptiPlex 7010']),
    serialNumber: `SN${ri(100000, 999999)}`, assetTag: `PAT-${ri(10000, 99999)}`,
    virtualization: isServer && chance(0.5) ? pick(['kvm', 'vmware', 'bare-metal']) : 'bare-metal',
    environment: isServer ? (b.headquarters ? 'production' : chance(0.7) ? 'production' : 'staging') : 'production',
    criticality: isServer ? (b.headquarters ? pick(['high', 'critical'] as const) : 'medium') : kind === 'pdv' ? 'high' : 'low',
    status: status as Device['status'], lastBootAt: ago(ri(1, 40) * DAY),
    tags: isServer ? ['infra'] : kind === 'pdv' ? ['pdv', 'loja'] : ['workstation']
  };
  db.devices.push(dev);

  const cores = isServer ? pick([8, 12, 16, 24]) : pick([4, 6, 8]);
  db.hardware.push({
    deviceId: did, cpuModel: pick(['Intel Xeon Silver 4310', 'Intel Core i5-12400', 'AMD EPYC 7313', 'AMD Ryzen 5 5600G']),
    cpuCores: cores, cpuThreads: cores * 2, ramTotalBytes: (isServer ? pick([32, 64, 128]) : pick([8, 16, 32])) * 1024 ** 3,
    diskTotalBytes: (isServer ? pick([512, 1024, 2048]) : pick([256, 512])) * 1024 ** 3, swapTotalBytes: pick([2, 4, 8]) * 1024 ** 3,
    biosVendor: pick(['American Megatrends', 'Dell Inc.', 'HPE']), biosVersion: `${ri(1, 3)}.${ri(0, 9)}`,
    gpuModel: pick(['Matrox G200', 'Intel UHD 730', 'NVIDIA T400']), bootMode: chance(0.8) ? 'uefi' : 'legacy'
  });

  const base = net.subnet.split('.').slice(0, 3).join('.');
  db.interfaces.push({
    id: uid(), deviceId: did, interfaceName: os === 'windows' ? 'Ethernet0' : 'eth0',
    ipv4Address: `${base}.${ri(20, 240)}`, ipv6Address: chance(0.4) ? `fe80::${ri(1000, 9999)}` : null,
    macAddress: Array.from({ length: 6 }, () => ri(0, 255).toString(16).padStart(2, '0')).join(':'),
    speedMbps: isServer ? pick([1000, 10000]) : 1000, type: 'ethernet', up: status === 'online', primary: true
  });

  const online = status === 'online';
  const as: Agent['status'] = online ? (chance(0.9) ? 'online' : 'degraded') : chance(0.3) ? 'updating' : 'offline';
  db.agents.push({
    id: uid(), deviceId: did, agentVersion: pick(['1.4.2', '1.4.1', '1.3.9', '1.5.0-rc1']), online, status: as,
    enabled: chance(0.95), connectedSince: online ? ago(ri(1, 20) * HOUR) : null,
    lastSeen: online ? ago(ri(2, 55) * 1000) : ago(ri(1, 48) * HOUR), lastIp: net.publicIp, protocolVersion: 'proto3/v1',
    installPath: os === 'linux' ? '/opt/argus/agent' : 'C:\\Program Files\\Argus\\agent.exe', runAsUser: os === 'linux' ? 'root' : 'SYSTEM'
  });

  const catL: [string, string, string, number | null][] = [['nginx', 'Nginx Web Server', 'web', 443], ['postgresql', 'PostgreSQL', 'database', 5432], ['redis', 'Redis', 'database', 6379], ['sshd', 'OpenSSH', 'daemon', 22], ['docker', 'Docker Engine', 'daemon', null], ['haproxy', 'HAProxy', 'proxy', 80]];
  const catW: [string, string, string, number | null][] = [['MSSQLSERVER', 'SQL Server', 'database', 1433], ['W3SVC', 'IIS', 'web', 80], ['Spooler', 'Spooler de Impressão', 'daemon', null], ['PDVService', 'Serviço PDV', 'daemon', 9600]];
  const cat = os === 'linux' ? catL : catW;
  const n = isServer ? ri(3, Math.min(6, cat.length)) : ri(1, 3);
  const chosen = [...cat].sort(() => rnd() - 0.5).slice(0, n);
  chosen.forEach(([nm, disp, tp, port]) => {
    const ss = !online ? 'unknown' : chance(0.85) ? 'running' : chance(0.5) ? 'stopped' : 'failed';
    db.services.push({
      id: uid(), deviceId: did, name: nm, displayName: disp, type: tp, status: ss as Service['status'],
      enabled: chance(0.9), pid: ss === 'running' ? ri(200, 60000) : null, port,
      healthStatus: ss === 'running' ? (chance(0.85) ? 'healthy' : 'unhealthy') : 'unknown',
      uptimeSeconds: ss === 'running' ? ri(3600, 90 * 86400) : 0, monitored: true, restartCount: ri(0, 12)
    });
  });

  if (online) {
    const bc = ri(8, 55), br = ri(30, 78), bd = ri(20, 88);
    for (let k = 59; k >= 0; k--) {
      const cl = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
      db.metrics.push({
        deviceId: did, cpuPercent: cl(bc + (rnd() * 22 - 8)), ramPercent: cl(br + (rnd() * 10 - 5)),
        diskPercent: cl(bd + (rnd() - 0.5)), temperatureCelsius: Math.round(38 + rnd() * 36),
        loadAvg1: Math.round(rnd() * cores * 0.9 * 100) / 100, processCount: ri(80, 420), createdAt: ago(k * MIN)
      });
    }
  }
}

export const db: Database = build();

/* consultas úteis */
export const deviceById = (id: string) => db.devices.find(d => d.id === id);
export const agentOfDevice = (id: string) => db.agents.find(a => a.deviceId === id);
export const hardwareOfDevice = (id: string) => db.hardware.find(h => h.deviceId === id);
export const interfacesOfDevice = (id: string) => db.interfaces.filter(i => i.deviceId === id);
export const servicesOfDevice = (id: string) => db.services.filter(s => s.deviceId === id);
export const metricsOfDevice = (id: string) => db.metrics.filter(m => m.deviceId === id);
export const latestMetric = (id: string) => { const m = metricsOfDevice(id); return m[m.length - 1]; };
export const networkById = (id: string) => db.networks.find(n => n.id === id);
export const branchById = (id: string) => db.branches.find(b => b.id === id);
export const branchOfDevice = (id: string) => { const d = deviceById(id); const n = d && networkById(d.networkId); return n && branchById(n.branchId); };
export const sectorsOfBranch = (id: string) => db.sectors.filter(s => s.branchId === id);
export const networksOfBranch = (id: string) => db.networks.filter(n => n.branchId === id);
export const devicesOfNetwork = (id: string) => db.devices.filter(d => d.networkId === id);
export const devicesOfBranch = (id: string) => { const nets = new Set(networksOfBranch(id).map(n => n.id)); return db.devices.filter(d => nets.has(d.networkId)); };
export const employeesOfBranch = (id: string) => db.employees.filter(e => e.branchId === id);
export const employeeById = (id: string | null) => id ? db.employees.find(e => e.id === id) : undefined;
export const userById = (id: string | null) => id ? db.users.find(u => u.id === id) : undefined;

/* ═══════════════════════════════════════════════════════════════════════════
 * MOCK — DADOS APENAS DE UI (remover/trocar por API na integração do backend)
 * Tudo que é conteúdo fixo de tela mora aqui, num lugar só, para exclusão fácil.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* Catálogo de integrações (tela Configurações → Integrações) */
export interface MockIntegration { id: string; name: string; cat: string; desc: string; color: string; connected?: boolean; fields: string[] }
export const integrationCategories = ['Identidade', 'Observabilidade', 'DevOps', 'Comunicação', 'Segurança', 'Virtualização'];
export const mockIntegrations: MockIntegration[] = [
  { id: 'entra', name: 'Microsoft Entra ID', cat: 'Identidade', color: '#0a84ff', connected: true, desc: 'Azure AD — SSO, sincronização de usuários e grupos.', fields: ['Tenant ID', 'Client ID', 'Client Secret'] },
  { id: 'm365', name: 'Microsoft 365', cat: 'Identidade', color: '#d83b01', desc: 'Perfis, e-mail e presença via Graph API.', fields: ['Tenant ID', 'Client ID', 'Client Secret'] },
  { id: 'google', name: 'Google Workspace', cat: 'Identidade', color: '#34a853', desc: 'Diretório de usuários e SSO OAuth.', fields: ['Domínio', 'Service Account JSON'] },
  { id: 'okta', name: 'Okta', cat: 'Identidade', color: '#007dc1', desc: 'IdP para SSO SAML/OIDC.', fields: ['Org URL', 'API Token'] },
  { id: 'ldap', name: 'LDAP / AD On-premise', cat: 'Identidade', color: '#8a6d3b', connected: true, desc: 'Active Directory local via LDAPS.', fields: ['Host', 'Base DN', 'Bind DN', 'Senha'] },
  { id: 'grafana', name: 'Grafana', cat: 'Observabilidade', color: '#f46800', connected: true, desc: 'Publica métricas e dashboards do Argus.', fields: ['URL', 'API Key'] },
  { id: 'prometheus', name: 'Prometheus', cat: 'Observabilidade', color: '#e6522c', connected: true, desc: 'Exporter de métricas dos agentes.', fields: ['Endpoint /metrics', 'Scrape interval'] },
  { id: 'azuremon', name: 'Azure Monitor', cat: 'Observabilidade', color: '#0078d4', desc: 'Envia logs e métricas ao Log Analytics.', fields: ['Workspace ID', 'Primary Key'] },
  { id: 'datadog', name: 'Datadog', cat: 'Observabilidade', color: '#632ca6', desc: 'APM e infraestrutura.', fields: ['API Key', 'App Key', 'Site'] },
  { id: 'elastic', name: 'Elastic / Kibana', cat: 'Observabilidade', color: '#00bfb3', desc: 'Ingestão de logs no Elasticsearch.', fields: ['URL', 'API Key', 'Índice'] },
  { id: 'github', name: 'GitHub', cat: 'DevOps', color: '#8b95a1', connected: true, desc: 'Runbooks como código e disparo de Actions.', fields: ['Organização', 'Personal Access Token'] },
  { id: 'gitlab', name: 'GitLab', cat: 'DevOps', color: '#fc6d26', desc: 'Pipelines CI/CD e issues.', fields: ['URL', 'Project Token'] },
  { id: 'jira', name: 'Jira', cat: 'DevOps', color: '#2684ff', desc: 'Abre incidentes como tickets.', fields: ['URL', 'E-mail', 'API Token'] },
  { id: 'servicenow', name: 'ServiceNow', cat: 'DevOps', color: '#62d84e', desc: 'ITSM — incidents e change requests.', fields: ['Instance', 'Usuário', 'Senha'] },
  { id: 'ansible', name: 'Ansible / AWX', cat: 'DevOps', color: '#1a1918', desc: 'Executa playbooks de remediação.', fields: ['URL', 'Token'] },
  { id: 'slack', name: 'Slack', cat: 'Comunicação', color: '#4a154b', connected: true, desc: 'Alertas e ChatOps por canal.', fields: ['Webhook URL', 'Canal padrão'] },
  { id: 'teams', name: 'Microsoft Teams', cat: 'Comunicação', color: '#5059c9', desc: 'Cartões de alerta via connector.', fields: ['Webhook URL'] },
  { id: 'telegram', name: 'Telegram', cat: 'Comunicação', color: '#2aabee', desc: 'Bot de notificações.', fields: ['Bot Token', 'Chat ID'] },
  { id: 'whatsapp', name: 'WhatsApp Business', cat: 'Comunicação', color: '#25d366', desc: 'Notificações críticas via Cloud API.', fields: ['Phone ID', 'Access Token'] },
  { id: 'pagerduty', name: 'PagerDuty', cat: 'Comunicação', color: '#06ac38', desc: 'Escalonamento e plantão on-call.', fields: ['Integration Key'] },
  { id: 'webhook', name: 'Webhook genérico', cat: 'Comunicação', color: '#888', desc: 'POST JSON para qualquer endpoint.', fields: ['URL', 'Header de auth'] },
  { id: 'crowdstrike', name: 'CrowdStrike Falcon', cat: 'Segurança', color: '#e01f3d', desc: 'EDR — telemetria e contenção de host.', fields: ['Client ID', 'Secret', 'Cloud'] },
  { id: 'sentinelone', name: 'SentinelOne', cat: 'Segurança', color: '#6b0aea', desc: 'EDR e resposta automatizada.', fields: ['Console URL', 'API Token'] },
  { id: 'wazuh', name: 'Wazuh', cat: 'Segurança', color: '#00a9e0', connected: true, desc: 'SIEM/XDR open-source.', fields: ['Manager URL', 'Usuário', 'Senha'] },
  { id: 'defender', name: 'Microsoft Defender', cat: 'Segurança', color: '#0078d4', desc: 'Alertas de endpoint via Graph Security.', fields: ['Tenant ID', 'Client ID', 'Secret'] },
  { id: 'vcenter', name: 'VMware vCenter', cat: 'Virtualização', color: '#607078', desc: 'Inventário e controle de VMs.', fields: ['Host', 'Usuário', 'Senha'] },
  { id: 'proxmox', name: 'Proxmox VE', cat: 'Virtualização', color: '#e57000', connected: true, desc: 'Nós, VMs e containers LXC.', fields: ['Host', 'Token ID', 'Secret'] },
  { id: 'hyperv', name: 'Hyper-V', cat: 'Virtualização', color: '#0078d4', desc: 'Hosts e VMs via WinRM.', fields: ['Host', 'Usuário', 'Senha'] },
];

/* Base de conhecimento (tela Base de Conhecimento) */
export const mockKnowledgeIncidents = ['Queda VPN Nordeste', 'Pico CPU Matriz', 'Falha PostgreSQL', 'Ransomware (contido)'];
export const mockKnowledgeRunbooks = ['Reiniciar pilha web', 'Recuperar banco', 'Isolar host', 'Rotacionar credenciais'];

/* Chat/notificações do dispositivo (aba Mensagens do console) */
export const mockMessageTemplates = [
  'Salve seu trabalho: manutenção programada às 18h.',
  'Por favor, reinicie a máquina ao final do expediente.',
  'Detectamos alto uso de CPU. Feche aplicativos não usados.',
  'Atualização de segurança será instalada em 30 min.',
];
export const mockMessageReplies = ['Ok, obrigado! Já vou fazer.', 'Entendido, pode deixar.', 'Beleza, obrigado pelo aviso.'];
export function mockDeviceThread(): { from: 'admin' | 'user'; text: string; ts: string }[] {
  return [
    { from: 'user', text: 'Bom dia, a impressora do setor está offline.', ts: '08:42' },
    { from: 'admin', text: 'Bom dia! Já estou verificando o serviço de spooler remotamente.', ts: '08:45' },
  ];
}

/* Auditoria — user-agents sintéticos para o detalhe do evento */
export const mockUserAgents = [
  'Argus Desktop/1.5 (Windows NT 10.0)', 'Argus Desktop/1.5 (X11; Linux x86_64)',
  'Mozilla/5.0 (Macintosh)', 'ArgusCLI/1.4 (ci-runner)',
];

/* ─── Consulta CNPJ (Receita) — mock ──────────────────────────────────────
 * Simula a resposta da BrasilAPI/ReceitaWS. Na integração, trocar por fetch real
 * (ex.: https://brasilapi.com.br/api/cnpj/v1/{cnpj}) mantendo o formato de retorno. */
export interface ReceitaData {
  taxId: string; legalName: string; tradeName: string; legalNature: string;
  cnae: string; cnaeCode: string; openingDate: string; shareCapital: string;
  registryStatus: string; companySize: string; email: string; phone: string;
  address: { street: string; number: string; district: string; city: string; state: string; countryCode: string; postalCode: string; latitude: number; longitude: number };
}
export async function receitaLookup(cnpj: string): Promise<ReceitaData | null> {
  const digits = cnpj.replace(/\D/g, '');
  await new Promise(r => setTimeout(r, 700)); // simula latência de rede
  if (digits.length !== 14) return null;
  return {
    taxId: digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
    legalName: 'Nexus Comércio Varejista S.A.', tradeName: 'Nexus Varejo',
    legalNature: '205-4 — Sociedade Anônima Fechada', cnae: 'Comércio varejista de mercadorias em geral (hipermercados)',
    cnaeCode: '47.11-3-01', openingDate: '2012-03-15', shareCapital: 'R$ 25.000.000,00',
    registryStatus: 'ATIVA', companySize: 'Demais (grande porte)', email: 'ti@nexusvarejo.com.br', phone: '+55 11 3000-0000',
    address: { street: 'Av. Brigadeiro Faria Lima', number: '3477', district: 'Itaim Bibi', city: 'São Paulo', state: 'SP', countryCode: 'BR', postalCode: '04538-133', latitude: -23.5853, longitude: -46.6789 },
  };
}

/* ─── Active Directory — usuários descobertos (mock da sincronização) ──────── */
export interface AdUser { samAccountName: string; displayName: string; upn: string; ou: string; groups: string[]; enabled: boolean; lastLogon: string; existing: boolean }
export const mockAdUsers: AdUser[] = [
  { samAccountName: 'jsilva', displayName: 'Joana Silva', upn: 'jsilva@nexus.local', ou: 'OU=TI,OU=Matriz', groups: ['Domain Admins', 'TI'], enabled: true, lastLogon: 'há 2 h', existing: false },
  { samAccountName: 'malmeida', displayName: 'Marcos Almeida', upn: 'malmeida@nexus.local', ou: 'OU=Suporte,OU=Matriz', groups: ['Service Desk'], enabled: true, lastLogon: 'há 1 d', existing: false },
  { samAccountName: 'rlima', displayName: 'Renata Lima', upn: 'rlima@nexus.local', ou: 'OU=Suporte,OU=Matriz', groups: ['Service Desk'], enabled: true, lastLogon: 'há 5 h', existing: true },
  { samAccountName: 'pcosta', displayName: 'Paulo Costa', upn: 'pcosta@nexus.local', ou: 'OU=Logistica,OU=CD', groups: ['Operadores'], enabled: false, lastLogon: 'há 40 d', existing: false },
  { samAccountName: 'fsantos', displayName: 'Fernanda Santos', upn: 'fsantos@nexus.local', ou: 'OU=Gerencia,OU=Lojas', groups: ['Gestores'], enabled: true, lastLogon: 'há 3 h', existing: false },
  { samAccountName: 'tgomes', displayName: 'Thiago Gomes', upn: 'tgomes@nexus.local', ou: 'OU=TI,OU=Matriz', groups: ['TI', 'Backup Operators'], enabled: true, lastLogon: 'há 8 h', existing: false },
];
export const adGroupToRole: Record<string, string> = {
  'Domain Admins': 'ADMIN', 'TI': 'ADMIN', 'Service Desk': 'SERVICE_DESK', 'Gestores': 'SERVICE_DESK', 'Operadores': 'READ_ONLY', 'Backup Operators': 'READ_ONLY',
};

/* ─── Parametrização (catálogos editáveis) ────────────────────────────────
 * Listas que a empresa pode estender (papéis, tipos, status). Nada hardcoded nos
 * componentes: formulários leem daqui. `system:true` = item base, não removível. */
export interface ParamItem { key: string; label: string; tone?: string; system?: boolean }
export interface ParamCatalog { id: string; name: string; desc: string; items: ParamItem[] }

export const mockParamCatalogs: ParamCatalog[] = [
  { id: 'systemRoles', name: 'Papéis de acesso (contas)', desc: 'Perfis de permissão das contas de login no Argus', items: [
    { key: 'OWNER', label: 'Proprietário', tone: 'red', system: true },
    { key: 'ADMIN', label: 'Administrador', tone: 'red', system: true },
    { key: 'SERVICE_DESK', label: 'Service Desk', tone: 'blue', system: true },
    { key: 'AUDITOR', label: 'Auditor', tone: 'purple' },
    { key: 'READ_ONLY', label: 'Somente leitura', tone: 'dim', system: true },
  ] },
  { id: 'employeeRoles', name: 'Papéis operacionais (funcionários)', desc: 'Funções atribuíveis a funcionários (sincronizáveis com AD)', items: [
    { key: 'LEITURA', label: 'Leitura', tone: 'dim' },
    { key: 'OPERACAO', label: 'Operação', tone: 'blue' },
    { key: 'INVENTARIO', label: 'Inventário', tone: 'cyan' },
    { key: 'SUPORTE_N1', label: 'Suporte N1', tone: 'green' },
    { key: 'GESTAO_LOJA', label: 'Gestão de Loja', tone: 'orange' },
  ] },
  { id: 'branchTypes', name: 'Tipos de filial', desc: 'Classificação das unidades', items: [
    { key: 'headquarters', label: 'Matriz', tone: 'red', system: true },
    { key: 'store', label: 'Loja', tone: 'blue', system: true },
    { key: 'warehouse', label: 'Centro de Distribuição', tone: 'orange' },
    { key: 'office', label: 'Escritório', tone: 'dim' },
  ] },
  { id: 'sectorTypes', name: 'Tipos de setor', desc: 'Natureza dos departamentos', items: [
    { key: 'it', label: 'TI', tone: 'cyan' }, { key: 'logistics', label: 'Logística', tone: 'orange' },
    { key: 'sales', label: 'Vendas', tone: 'green' }, { key: 'operations', label: 'Operações', tone: 'blue' },
    { key: 'admin', label: 'Administrativo', tone: 'dim' },
  ] },
  { id: 'networkTypes', name: 'Tipos de rede', desc: 'Segmentos de rede', items: [
    { key: 'lan', label: 'LAN', tone: 'blue', system: true }, { key: 'dmz', label: 'DMZ', tone: 'orange' },
    { key: 'wan', label: 'WAN', tone: 'purple' }, { key: 'vpn', label: 'VPN', tone: 'red' },
    { key: 'wifi', label: 'Wi-Fi', tone: 'cyan' }, { key: 'management', label: 'Gerência', tone: 'dim' },
  ] },
  { id: 'employeeStatus', name: 'Situações de funcionário', desc: 'Estados do vínculo empregatício', items: [
    { key: 'active', label: 'Ativo', tone: 'green', system: true }, { key: 'on_leave', label: 'Afastado', tone: 'orange' },
    { key: 'suspended', label: 'Suspenso', tone: 'red' }, { key: 'terminated', label: 'Desligado', tone: 'dim', system: true },
  ] },
];

/* Configuração profunda de serviço (modal Configurar da tela Serviços) */
export const mockServiceEnvByType: Record<string, [string, string][]> = {
  web: [['NODE_ENV', 'production'], ['PORT', '443'], ['WORKERS', '4']],
  database: [['PGDATA', '/var/lib/postgresql/data'], ['MAX_CONNECTIONS', '200']],
  proxy: [['BACKENDS', 'srv-web-01,srv-web-02'], ['TIMEOUT', '30s']],
  daemon: [['LOG_LEVEL', 'info']],
};
export function mockServiceLogLines(name: string): string[] {
  return [
    `${name}[1042]: Starting ${name} service...`,
    `${name}[1042]: Loaded configuration from /etc/${name}/${name}.conf`,
    `${name}[1042]: Listening on configured sockets`,
    `${name}[1042]: Ready to accept connections`,
    `${name}[1042]: health check OK (200) in 4ms`,
    `${name}[1042]: reaped worker, respawning`,
    `${name}[1042]: health check OK (200) in 3ms`,
  ];
}

/* Assistente IA — sugestões de perguntas */
export const mockAssistantSuggestions = [
  'Quantos dispositivos estão offline agora?',
  'Resuma os incidentes das últimas 24h',
  'Quais serviços estão com falha?',
  'Gere um runbook para reiniciar a pilha web',
  'Qual filial está com pior saúde?',
];
