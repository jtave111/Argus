import { db } from '@/lib/mock';
import { useNav } from './App';

export default function StatusBar() {
  const online = db.devices.filter(d => d.status === 'online').length;
  const agents = db.agents.filter(a => a.online).length;
  const { go } = useNav();
  return (
    <div className="ide-status">
      <span className="status-seg on"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> Conectado</span>
      <span className="status-seg mono">PostgreSQL · argus@localhost:5432</span>
      <span style={{ flex: 1 }} />
      <span className="status-seg">{online}/{db.devices.length} online</span>
      <span className="status-seg">{agents} agentes</span>
      <span className="status-seg" style={{ cursor: 'pointer' }} onClick={() => go('profile')}>{db.users[0]?.name ?? 'conta'}</span>
      <span className="status-seg mono">UTF-8</span>
      <span className="status-seg mono">pt-BR</span>
    </div>
  );
}
