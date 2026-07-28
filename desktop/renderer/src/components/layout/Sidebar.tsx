import { useState } from 'react';
import { useNav } from './App';
import {
  LayoutDashboard, Server, Cpu, Activity, Network, Share2, Globe, TerminalSquare,
  Users, UserCog, Building2, Store, Layers, ScrollText, Settings, User, Package, Bot
} from 'lucide-react';

const ICON: Record<string, any> = {
  dashboard: LayoutDashboard, devices: Server, agents: Cpu, 'agent-builder': Package, services: Activity,
  networks: Network, topology: Share2, map: Globe, terminal: TerminalSquare,
  employees: Users, users: UserCog, organization: Building2, branches: Store,
  sectors: Layers, audit: ScrollText, assistant: Bot, settings: Settings, profile: User
};

const GROUPS: [string, [string, string][]][] = [
  ['', [['dashboard', 'Dashboard']]],
  ['Infraestrutura', [['devices', 'Dispositivos'], ['agents', 'Agentes'], ['agent-builder', 'Construtor de Agentes'], ['services', 'Serviços'], ['networks', 'Redes'], ['topology', 'Topologia'], ['map', 'Mapa global'], ['terminal', 'Terminal']]],
  ['Empresa', [['organization', 'Organização'], ['branches', 'Filiais'], ['sectors', 'Setores']]],
  ['Pessoas & Acesso', [['employees', 'Funcionários'], ['users', 'Contas de Acesso']]],
  ['Inteligência', [['assistant', 'Assistente IA'], ['knowledge', 'Base de Conhecimento']]],
  ['Sistema', [['audit', 'Auditoria'], ['settings', 'Configurações']]],
];

export default function Sidebar() {
  const { route, go } = useNav();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  return (
    <div className="navigator" style={{ width: 220 }}>
      <div className="navigator-hdr">◈ NAVEGADOR</div>
      <div className="fill scroll-y" style={{ padding: '3px 0' }}>
        {GROUPS.map(([group, items]) => (
          <div key={group || 'root'}>
            {group && (
              <div className="tree-section-hdr" onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}>
                <span className="tree-arrow">{collapsed[group] ? '▸' : '▾'}</span>{group}
              </div>
            )}
            {!collapsed[group] && items.map(([view, label]) => {
              const Icon = ICON[view] ?? Server;
              const active = route.view === view;
              return (
                <div key={view} className={'tree-item' + (active ? ' active' : '')} onClick={() => go(view)}>
                  <span className="tree-item-icon"><Icon size={13} /></span>
                  <span className="tree-item-label">{label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
