// Formatação PT-BR + rótulos/cores de status (paleta ZombieKeeper).

export function bytes(n: number): string {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}
export const pct = (n: number) => `${Math.round(n)}%`;
export const mbps = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)} Gbps` : `${n} Mbps`;

export function relative(iso: string | null): string {
  if (!iso) return '—';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return 'agora';
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60); if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24); if (d < 30) return `há ${d} d`;
  const mo = Math.round(d / 30); return mo < 12 ? `há ${mo} mês${mo > 1 ? 'es' : ''}` : `há ${Math.round(mo / 12)} ano(s)`;
}
export function dateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function date(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function uptime(sec: number): string {
  if (!sec) return '—';
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}
export function duration(ms: number): string { return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`; }
export function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** classe de badge (globals.css) por status. */
export type Tone = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'cyan' | 'dim';
export const toneVar: Record<Tone, string> = {
  green: 'var(--green)', red: 'var(--red-hi)', orange: 'var(--orange)',
  blue: 'var(--blue)', purple: 'var(--purple)', cyan: 'var(--cyan)', dim: 'var(--tx2)'
};

export const L = {
  device: (s: string): [string, Tone] => ({
    online: ['Online', 'green'], offline: ['Offline', 'red'],
    maintenance: ['Manutenção', 'orange'], unknown: ['Desconhecido', 'dim']
  } as Record<string, [string, Tone]>)[s] ?? ['—', 'dim'],
  agent: (s: string): [string, Tone] => ({
    online: ['Conectado', 'green'], offline: ['Desconectado', 'red'],
    degraded: ['Degradado', 'orange'], updating: ['Atualizando', 'blue']
  } as Record<string, [string, Tone]>)[s] ?? ['—', 'dim'],
  service: (s: string): [string, Tone] => ({
    running: ['Ativo', 'green'], stopped: ['Parado', 'dim'],
    failed: ['Falhou', 'red'], unknown: ['Desconhecido', 'dim']
  } as Record<string, [string, Tone]>)[s] ?? ['—', 'dim'],
  health: (s: string): [string, Tone] => ({
    healthy: ['Saudável', 'green'], unhealthy: ['Instável', 'red'], unknown: ['Sem check', 'dim']
  } as Record<string, [string, Tone]>)[s] ?? ['—', 'dim'],
  employee: (s: string): [string, Tone] => ({
    active: ['Ativo', 'green'], on_leave: ['Afastado', 'orange'],
    suspended: ['Suspenso', 'red'], terminated: ['Desligado', 'dim']
  } as Record<string, [string, Tone]>)[s] ?? ['—', 'dim'],
  criticality: (s: string): [string, Tone] => ({
    low: ['Baixa', 'dim'], medium: ['Média', 'blue'], high: ['Alta', 'orange'], critical: ['Crítica', 'red']
  } as Record<string, [string, Tone]>)[s] ?? ['—', 'dim'],
  branchType: (s: string) => ({ store: 'Loja', warehouse: 'Centro de Distribuição', office: 'Escritório', datacenter: 'Data Center', headquarters: 'Matriz' } as Record<string, string>)[s] ?? s,
  systemRole: (s: string) => ({ ADMIN: 'Administrador', OWNER: 'Proprietário', SERVICE_DESK: 'Service Desk' } as Record<string, string>)[s] ?? s,
};
