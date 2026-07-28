import { useState } from 'react';
import { mockAdUsers, adGroupToRole, type AdUser } from '@/lib/mock';
import { create, genId } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/kit';
import { RefreshCw, Check, Server } from 'lucide-react';

/** Mapeia grupos do AD para papéis do Argus via catálogo de mapeamento. */
function rolesFor(u: AdUser): string[] {
  const r = new Set<string>();
  u.groups.forEach(g => { const role = adGroupToRole[g]; if (role) r.add(role); });
  if (r.size === 0) r.add('READ_ONLY');
  return [...r];
}

export default function AdSyncModal({ onClose, onImported }: { onClose: () => void; onImported: (n: number) => void }) {
  const [phase, setPhase] = useState<'connecting' | 'listing'>('connecting');
  const importable = mockAdUsers.filter(u => !u.existing);
  const [sel, setSel] = useState<Record<string, boolean>>(() => Object.fromEntries(importable.filter(u => u.enabled).map(u => [u.samAccountName, true])));

  // simula a conexão LDAP
  useState(() => { setTimeout(() => setPhase('listing'), 850); return 0; });

  const chosen = importable.filter(u => sel[u.samAccountName]);
  const doImport = () => {
    chosen.forEach(u => create('users', {
      id: genId(), name: u.displayName, userName: u.samAccountName, email: u.upn,
      phone: '', mfaEnabled: false, failedLoginAttempts: 0, active: u.enabled, roles: rolesFor(u),
      lastLoginAt: '', lastLoginIp: '', createdAt: new Date().toISOString(),
    }));
    onImported(chosen.length); onClose();
  };

  return (
    <Modal title={<span className="row" style={{ gap: 8, alignItems: 'center' }}><Server size={15} /> Sincronizar com Active Directory</span>}
      subtitle="ldaps://dc01.nexus.local · OU=Nexus" onClose={onClose} width={680}
      footer={<>
        <button className="zk-btn" onClick={onClose}>Cancelar</button>
        <button className="zk-btn primary" disabled={phase !== 'listing' || chosen.length === 0} onClick={doImport}>Importar {chosen.length} conta(s)</button>
      </>}>
      {phase === 'connecting' ? (
        <div className="col" style={{ alignItems: 'center', gap: 10, padding: 30, color: 'var(--tx2)' }}>
          <RefreshCw size={22} className="pulse" style={{ color: 'var(--red-hi)' }} />
          <div>Conectando ao controlador de domínio e enumerando objetos de usuário…</div>
        </div>
      ) : (
        <>
          <div className="row" style={{ gap: 10, marginBottom: 10, fontSize: 11, color: 'var(--tx2)' }}>
            <span>{mockAdUsers.length} objetos encontrados</span>·
            <span style={{ color: 'var(--green)' }}>{importable.length} novos</span>·
            <span style={{ color: 'var(--tx3)' }}>{mockAdUsers.length - importable.length} já existentes</span>
          </div>
          <table className="zk-table">
            <thead><tr><th style={{ width: 28 }}></th><th>Conta</th><th>Nome</th><th>OU</th><th>Grupos → papéis</th><th>Estado</th></tr></thead>
            <tbody>
              {mockAdUsers.map(u => {
                const exists = u.existing;
                return (
                  <tr key={u.samAccountName} style={{ opacity: exists ? 0.5 : 1 }}>
                    <td>{exists ? <Check size={13} style={{ color: 'var(--tx3)' }} /> : <input type="checkbox" checked={!!sel[u.samAccountName]} onChange={e => setSel(s => ({ ...s, [u.samAccountName]: e.target.checked }))} />}</td>
                    <td className="mono">{u.samAccountName}</td>
                    <td>{u.displayName}</td>
                    <td className="mono" style={{ fontSize: 10, color: 'var(--tx3)' }}>{u.ou}</td>
                    <td>{rolesFor(u).map(r => <Badge key={r} tone="red">{r}</Badge>)}</td>
                    <td>{exists ? <Badge tone="dim">importado</Badge> : <Badge tone={u.enabled ? 'green' : 'orange'}>{u.enabled ? 'ativo' : 'desativado'}</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--tx3)' }}>Os papéis são derivados dos grupos do AD (configurável em Configurações → Parametrização e Active Directory). A sincronização periódica pode ser agendada nas configurações de AD.</div>
        </>
      )}
    </Modal>
  );
}
