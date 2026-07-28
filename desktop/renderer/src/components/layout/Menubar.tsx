import { useState } from 'react';
import { useNav } from './App';

const MENUS: [string, [string, string][]][] = [
  ['Arquivo', [['Configurações', 'settings'], ['Meu perfil', 'profile'], ['Sair (logout)', '__logout']]],
  ['Exibir', [['Dashboard', 'dashboard'], ['Dispositivos', 'devices'], ['Agentes', 'agents'], ['Serviços', 'services'], ['Redes', 'networks'], ['Topologia', 'topology'], ['Mapa global', 'map'], ['Terminal', 'terminal']]],
  ['Navegar', [['Funcionários', 'employees'], ['Contas de Acesso', 'users'], ['Organização', 'organization'], ['Filiais', 'branches'], ['Setores', 'sectors']]],
  ['Sistema', [['Auditoria', 'audit'], ['Configurações', 'settings']]],
];

export default function Menubar() {
  const { go } = useNav();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="menubar" onMouseLeave={() => setOpen(null)}>
      <span style={{ fontWeight: 700, color: 'var(--red-hi)', padding: '0 10px 0 6px', fontSize: 12 }}>ARGUS</span>
      {MENUS.map(([label, items]) => (
        <div key={label} style={{ position: 'relative' }}>
          <div className={'menu-item' + (open === label ? ' open' : '')}
            onClick={() => setOpen(open === label ? null : label)}
            onMouseEnter={() => open && setOpen(label)}>{label}</div>
          {open === label && (
            <div style={{ position: 'absolute', top: 24, left: 0, minWidth: 190, background: 'var(--panel)', border: '1px solid var(--b3)', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
              {items.map(([lbl, view]) => (
                <div key={lbl} className="menu-item" style={{ height: 24, padding: '0 12px' }}
                  onClick={() => { setOpen(null); if (view === '__logout') { sessionStorage.removeItem('argus.auth'); location.reload(); } else go(view); }}>{lbl}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
