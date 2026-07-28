// Ícones de marca (SVG inline, offline) para as integrações. Marcas simplificadas e
// reconhecíveis; fallback por categoria quando não há ícone específico.
import type { ReactNode } from 'react';
import { Fingerprint, Activity, GitBranch, MessagesSquare, ShieldAlert, Server } from 'lucide-react';

const S = (children: ReactNode) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">{children}</svg>;

const ICONS: Record<string, ReactNode> = {
  entra: S(<><path d="M12 2 3 20h4l5-10 5 10h4L12 2Z" fill="#0a84ff" /></>),
  m365: S(<><rect x="3" y="3" width="8" height="8" fill="#f25022" /><rect x="13" y="3" width="8" height="8" fill="#7fba00" /><rect x="3" y="13" width="8" height="8" fill="#00a4ef" /><rect x="13" y="13" width="8" height="8" fill="#ffb900" /></>),
  defender: S(<><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" fill="#0078d4" /><path d="M12 4 6 6.2V11c0 3.7 2.5 6.9 6 8.6V4Z" fill="#3aa0f3" /></>),
  google: S(<><path d="M21 12.2c0-.6-.1-1.2-.2-1.8H12v3.5h5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1C19.9 17.5 21 15.1 21 12.2Z" fill="#4285f4" /><path d="M12 21c2.4 0 4.5-.8 6-2.2l-3.1-2.4c-.8.6-1.9.9-2.9.9-2.3 0-4.2-1.5-4.9-3.6H3.9v2.5C5.4 19.1 8.5 21 12 21Z" fill="#34a853" /><path d="M7.1 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7V7.8H3.9C3.3 9.1 3 10.5 3 12s.3 2.9.9 4.2l3.2-2.5Z" fill="#fbbc05" /><path d="M12 6.7c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.5 3.9 14.4 3 12 3 8.5 3 5.4 4.9 3.9 7.8l3.2 2.5C7.8 8.2 9.7 6.7 12 6.7Z" fill="#ea4335" /></>),
  okta: S(<><circle cx="12" cy="12" r="9" stroke="#007dc1" strokeWidth="4" /></>),
  ldap: S(<><circle cx="12" cy="7" r="3" fill="#8a6d3b" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#8a6d3b" strokeWidth="2" /></>),
  grafana: S(<><circle cx="12" cy="12" r="9" fill="#f46800" /><path d="M8 15c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#fff" strokeWidth="1.6" /><circle cx="12" cy="8.5" r="1.5" fill="#fff" /></>),
  prometheus: S(<><circle cx="12" cy="12" r="9" fill="#e6522c" /><path d="M12 5c2 2 2 4 0 6s-2 4 0 6" stroke="#fff" strokeWidth="1.4" /></>),
  azuremon: S(<><path d="M12 2 3 20h4l5-10 5 10h4L12 2Z" fill="#0078d4" /></>),
  datadog: S(<><path d="M20 4v10l-3 1 .5-4-2 3.5-5 1 8-11.5Z" fill="#632ca6" /><circle cx="9" cy="16" r="2" fill="#632ca6" /></>),
  elastic: S(<><path d="M4 6h11a4 4 0 0 1 0 8H8" stroke="#00bfb3" strokeWidth="2.4" /><path d="M5 18h9" stroke="#fec514" strokeWidth="2.4" /></>),
  github: S(<><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.4 4.7-4.6 4.9.3.3.6.9.6 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" fill="#c9d1d9" /></>),
  gitlab: S(<><path d="M12 21 4 12l1-6 3 6h8l3-6 1 6-8 9Z" fill="#fc6d26" /></>),
  jira: S(<><path d="M12 2 3 11a2 2 0 0 0 0 2l9 9 4.5-4.5L9 11l3-3-0-6Z" fill="#2684ff" /><path d="M12 8l6 6-3 3" fill="#0052cc" /></>),
  servicenow: S(<><circle cx="12" cy="12" r="9" fill="#62d84e" /><path d="M8 12a4 4 0 1 1 8 0" stroke="#032d42" strokeWidth="1.6" /></>),
  ansible: S(<><circle cx="12" cy="12" r="9" stroke="#1a1918" strokeWidth="2" /><path d="M12 6 8 17l6-4-2-1" fill="#1a1918" /></>),
  slack: S(<><rect x="10" y="3" width="3" height="8" rx="1.5" fill="#e01e5a" /><rect x="13" y="10" width="8" height="3" rx="1.5" fill="#36c5f0" /><rect x="11" y="13" width="3" height="8" rx="1.5" fill="#2eb67d" /><rect x="3" y="11" width="8" height="3" rx="1.5" fill="#ecb22e" /></>),
  teams: S(<><rect x="3" y="6" width="12" height="12" rx="2" fill="#5059c9" /><text x="9" y="15" fontSize="8" fill="#fff" textAnchor="middle" fontFamily="Arial">T</text><circle cx="18" cy="8" r="3" fill="#7b83eb" /></>),
  telegram: S(<><circle cx="12" cy="12" r="10" fill="#2aabee" /><path d="M6 12l11-4-2 9-3-2-2 2-1-3 6-4-7 3Z" fill="#fff" /></>),
  whatsapp: S(<><circle cx="12" cy="12" r="10" fill="#25d366" /><path d="M8 8c-1 1-1 3 1 5s4 2 5 1l-1.5-1.5-1.5.5-2-2 .5-1.5L8 8Z" fill="#fff" /></>),
  pagerduty: S(<><rect x="6" y="3" width="5" height="18" fill="#06ac38" /><path d="M11 3h4a4 4 0 0 1 0 8h-4" fill="#06ac38" /></>),
  webhook: S(<><circle cx="8" cy="8" r="2.5" stroke="#888" strokeWidth="1.6" /><circle cx="17" cy="15" r="2.5" stroke="#888" strokeWidth="1.6" /><circle cx="7" cy="17" r="2.5" stroke="#888" strokeWidth="1.6" /><path d="M9 9l4 6m1-2h-6" stroke="#888" strokeWidth="1.4" /></>),
  crowdstrike: S(<><circle cx="12" cy="12" r="9" fill="#e01f3d" /><path d="M8 9c1 3 3 5 6 5-2 1-5 1-7-1s-1-5 1-4Z" fill="#fff" /></>),
  sentinelone: S(<><path d="M12 2 4 5v7c0 5 4 8 8 10 4-2 8-5 8-10V5l-8-3Z" fill="#6b0aea" /><path d="M12 8v8" stroke="#fff" strokeWidth="2" /></>),
  wazuh: S(<><path d="M12 2 4 5v7c0 5 4 8 8 10 4-2 8-5 8-10V5l-8-3Z" fill="#00a9e0" /></>),
  vcenter: S(<><rect x="4" y="5" width="16" height="4" rx="1" fill="#607078" /><rect x="4" y="10" width="16" height="4" rx="1" fill="#7a8a92" /><rect x="4" y="15" width="16" height="4" rx="1" fill="#607078" /></>),
  proxmox: S(<><rect x="3" y="3" width="18" height="18" rx="2" fill="#e57000" /><text x="12" y="16" fontSize="9" fill="#fff" textAnchor="middle" fontFamily="Arial" fontWeight="bold">P</text></>),
  hyperv: S(<><rect x="3" y="3" width="8" height="8" fill="#0078d4" /><rect x="13" y="3" width="8" height="8" fill="#0078d4" opacity=".7" /><rect x="3" y="13" width="8" height="8" fill="#0078d4" opacity=".7" /><rect x="13" y="13" width="8" height="8" fill="#0078d4" opacity=".4" /></>),
};

const CAT_FALLBACK: Record<string, ReactNode> = {
  Identidade: <Fingerprint size={18} />, Observabilidade: <Activity size={18} />, DevOps: <GitBranch size={18} />,
  Comunicação: <MessagesSquare size={18} />, Segurança: <ShieldAlert size={18} />, Virtualização: <Server size={18} />,
};

export function BrandIcon({ id, cat }: { id: string; cat: string }) {
  return <>{ICONS[id] ?? CAT_FALLBACK[cat] ?? <Server size={18} />}</>;
}
