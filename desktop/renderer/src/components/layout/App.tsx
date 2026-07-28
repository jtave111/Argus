import { useState, createContext, useContext } from 'react';
import Menubar from './Menubar';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import Dashboard from '@/components/screens/Dashboard';
import Devices from '@/components/screens/Devices';
import DeviceConsole from '@/components/screens/DeviceConsole';
import Agents from '@/components/screens/Agents';
import AgentBuilder from '@/components/screens/AgentBuilder';
import Services from '@/components/screens/Services';
import Networks from '@/components/screens/Networks';
import Topology from '@/components/screens/Topology';
import MapScreen from '@/components/screens/MapScreen';
import Terminal from '@/components/screens/Terminal';
import Employees from '@/components/screens/Employees';
import EmployeeDetail from '@/components/screens/EmployeeDetail';
import Users from '@/components/screens/Users';
import Organization from '@/components/screens/Organization';
import Branches from '@/components/screens/Branches';
import BranchDetail from '@/components/screens/BranchDetail';
import Sectors from '@/components/screens/Sectors';
import Audit from '@/components/screens/Audit';
import Assistant from '@/components/screens/Assistant';
import KnowledgeBase from '@/components/screens/KnowledgeBase';
import Profile from '@/components/screens/Profile';
import Settings from '@/components/screens/Settings';
import Login from '@/components/screens/Login';

export interface Route { view: string; id?: string }
interface Nav { route: Route; go: (view: string, id?: string) => void }
const NavCtx = createContext<Nav>({ route: { view: 'dashboard' }, go: () => {} });
export const useNav = () => useContext(NavCtx);

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard', devices: 'Dispositivos', device: 'Console', agents: 'Agentes',
  services: 'Serviços', networks: 'Redes', topology: 'Topologia', map: 'Mapa global',
  terminal: 'Terminal', 'agent-builder': 'Construtor de Agentes', employees: 'Funcionários', employee: 'Funcionário', users: 'Contas de Acesso',
  organization: 'Organização', branches: 'Filiais', branch: 'Filial', sectors: 'Setores',
  audit: 'Auditoria', assistant: 'Assistente IA', knowledge: 'Base de Conhecimento', profile: 'Meu perfil', settings: 'Configurações'
};

function render(route: Route) {
  switch (route.view) {
    case 'dashboard': return <Dashboard />;
    case 'devices': return <Devices />;
    case 'device': return <DeviceConsole id={route.id!} />;
    case 'agents': return <Agents />;
    case 'agent-builder': return <AgentBuilder />;
    case 'services': return <Services />;
    case 'networks': return <Networks />;
    case 'topology': return <Topology />;
    case 'map': return <MapScreen />;
    case 'terminal': return <Terminal />;
    case 'employees': return <Employees />;
    case 'employee': return <EmployeeDetail id={route.id!} />;
    case 'users': return <Users />;
    case 'organization': return <Organization />;
    case 'branches': return <Branches />;
    case 'branch': return <BranchDetail id={route.id!} />;
    case 'sectors': return <Sectors />;
    case 'audit': return <Audit />;
    case 'assistant': return <Assistant />;
    case 'knowledge': return <KnowledgeBase />;
    case 'profile': return <Profile />;
    case 'settings': return <Settings />;
    default: return <Dashboard />;
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'dashboard' });
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('argus.auth') === '1');
  const go = (view: string, id?: string) => setRoute({ view, id });

  if (!authed) return <Login onLogin={() => { sessionStorage.setItem('argus.auth', '1'); setAuthed(true); }} />;

  return (
    <NavCtx.Provider value={{ route, go }}>
      <div className="col" style={{ height: '100vh', overflow: 'hidden' }}>
        <Menubar />
        <div className="row fill" style={{ alignItems: 'stretch' }}>
          <Sidebar />
          <div className="col fill">
            {/* aba de documento */}
            <div className="ide-tab-bar">
              <div className="ide-tab active">
                <span className="ide-tab-icon">▸</span>
                {LABELS[route.view] ?? route.view}
              </div>
            </div>
            <div className="ide-content fill">{render(route)}</div>
          </div>
        </div>
        <StatusBar />
      </div>
    </NavCtx.Provider>
  );
}
