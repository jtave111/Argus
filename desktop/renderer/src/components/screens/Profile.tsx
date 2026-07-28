import { useState } from 'react';
import { db } from '@/lib/mock';
import { PageHeader, Panel, Badge, Btn } from '@/components/ui/kit';
import { L, dateTime, date, initials } from '@/lib/fmt';
import { themeNames, currentTheme, applyTheme, applyAccent } from '@/lib/theme';

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="row" style={{ justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid var(--b1)' }}>
    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>{k}</span><span style={{ fontSize: 12, textAlign: 'right' }}>{v}</span>
  </div>;
}

// [accent, highlight]
const ACCENTS: [string, string][] = [
  ['#cc4444', '#e05c6e'], ['#3d6fb0', '#5a96d4'], ['#3d8b40', '#4ec94e'],
  ['#d4935a', '#e0a870'], ['#a07fd4', '#b89ae0'], ['#5eb8d4', '#7ccae2'], ['#c8b050', '#d8c46a'],
];

export default function Profile() {
  const u = db.users[0];
  const emp = db.employees.find(e => e.userId === u.id);
  const [theme, setTheme] = useState(currentTheme());
  const [accent, setAccent] = useState('#cc4444');
  const [density, setDensity] = useState('Confortável');

  return (
    <div className="col fill">
      <PageHeader title="Meu perfil" subtitle="Sua conta e preferências" />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 16, padding: 16, border: '1px solid var(--b2)', background: 'var(--panel)', marginBottom: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `color-mix(in srgb, ${accent} 18%, transparent)`, border: `1px solid ${accent}`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700 }}>{initials(u.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{u.name}</div>
            <div style={{ color: 'var(--tx2)', marginBottom: 8 }}>@{u.userName} · {u.email}</div>
            <div className="row" style={{ gap: 6 }}>{u.roles.map(r => <Badge key={r} tone="red">{L.systemRole(r)}</Badge>)}{u.mfaEnabled && <Badge tone="green">MFA ativo</Badge>}</div>
          </div>
          <Btn>Editar perfil</Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Panel title="CONTA">
            <KV k="Nome" v={u.name} /><KV k="Usuário" v={<span className="mono">@{u.userName}</span>} /><KV k="E-mail" v={<span className="mono">{u.email}</span>} />
            <KV k="Telefone" v={u.phone} /><KV k="Situação" v={u.active ? 'Ativa' : 'Inativa'} /><KV k="Criada em" v={date(u.createdAt)} />
            <KV k="Vínculo (RH)" v={emp ? `${emp.fullName} · ${emp.jobTitle}` : '—'} />
          </Panel>
          <Panel title="SEGURANÇA">
            <KV k="MFA" v={<Badge tone={u.mfaEnabled ? 'green' : 'orange'}>{u.mfaEnabled ? 'Ativo' : 'Inativo'}</Badge>} />
            <KV k="Tentativas falhas" v={<Badge tone={u.failedLoginAttempts ? 'red' : 'green'}>{u.failedLoginAttempts}</Badge>} />
            <div className="row" style={{ gap: 6, padding: 10 }}><Btn>Alterar senha</Btn><Btn variant="primary">{u.mfaEnabled ? 'Reconfigurar MFA' : 'Ativar MFA'}</Btn></div>
          </Panel>
          <Panel title="SESSÃO ATUAL">
            <KV k="Último login" v={dateTime(u.lastLoginAt)} /><KV k="IP de origem" v={<span className="mono">{u.lastLoginIp}</span>} />
            <KV k="Cliente" v="Argus Desktop 0.1.0" /><KV k="Organização" v={db.organization.name} />
          </Panel>
        </div>

        <Panel title="PERSONALIZAÇÃO" right={<Btn variant="primary" onClick={() => { applyTheme(theme); applyAccent(accent[0] as any, accent[1] as any); }}>Aplicar</Btn>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, padding: 14 }}>
            <div>
              <div className="stat-box-lbl" style={{ marginBottom: 8 }}>Tema</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {themeNames().map(t => (
                  <button key={t} className={'zk-btn' + (theme === t ? ' active' : '')}
                    onClick={() => { setTheme(t); applyTheme(t); }} style={{ justifyContent: 'flex-start' }}>{t}</button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--tx3)' }}>Clique aplica na hora; "Aplicar" fixa tema + cor.</div>
            </div>
            <div>
              <div className="stat-box-lbl" style={{ marginBottom: 8 }}>Cor de destaque</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {ACCENTS.map(c => (
                  <button key={c[0]} onClick={() => { setAccent(c[0]); applyAccent(c[0], c[1]); }} title="Aplicar cor"
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c[0], border: accent === c[0] ? '2px solid var(--tx0)' : '1px solid var(--b3)', cursor: 'pointer' }} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: 'var(--tx3)' }}>Aplica a botões, seleção e destaques.</div>
            </div>
            <div>
              <div className="stat-box-lbl" style={{ marginBottom: 8 }}>Densidade</div>
              <div className="row" style={{ gap: 6, marginBottom: 14 }}>{['Compacta', 'Confortável', 'Espaçosa'].map(d => <button key={d} className={'zk-btn' + (density === d ? ' active' : '')} onClick={() => setDensity(d)}>{d}</button>)}</div>
              <div className="stat-box-lbl" style={{ marginBottom: 8 }}>Avatar</div>
              <div className="row" style={{ gap: 6 }}><Btn>Enviar imagem</Btn><Btn>Usar iniciais</Btn></div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
