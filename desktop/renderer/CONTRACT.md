# Contrato do frontend (desktop/renderer) — para construir as telas

Stack: **React 18 + TypeScript + Vite + Tailwind + Leaflet**. Visual = **ZombieKeeper**
(dark, mono, denso, cantos retos, accent VERMELHO). Cada tela é UM arquivo em
`src/components/screens/<Nome>.tsx` com `export default`. Você **sobrescreve o stub** do seu
arquivo — não edite outros arquivos (evita conflito).

## Imports disponíveis

```ts
import { db, deviceById, agentOfDevice, hardwareOfDevice, interfacesOfDevice,
  servicesOfDevice, metricsOfDevice, latestMetric, networkById, branchById,
  branchOfDevice, sectorsOfBranch, networksOfBranch, devicesOfNetwork, devicesOfBranch,
  employeesOfBranch, employeeById, userById } from '@/lib/mock';
import { bytes, pct, mbps, relative, dateTime, date, uptime, duration, initials, L } from '@/lib/fmt';
import { Badge, StatBox, Panel, PageHeader, Table, Btn, Meter } from '@/components/ui/kit';
import WorldMap from '@/components/ui/WorldMap';        // mapa Leaflet (sites + arcs)
import { useNav } from '@/components/layout/App';        // const { go } = useNav(); go('device', id)
import type { Device, Service, ... } from '@/lib/types';
```

## Kit de UI (use SEMPRE — é o que dá o visual ZK)

- `<PageHeader title subtitle actions={<Btn>…</Btn>} />` — topo da tela.
- `<Panel title="TÍTULO EM CAIXA-ALTA" right={…} style={{flex:1}}>…</Panel>` — painel com header.
- `<StatBox label value meta tone />` — caixa de KPI. tone: green|red|orange|blue|purple|cyan|dim.
- `<Table cols={['A','B']}>{rows.map(r => <tr key><td>…</td></tr>)}</Table>` — ou use `<table className="zk-table">` direto.
- `<Badge tone dot>texto</Badge>` — pílula colorida.
- `<Btn onClick variant="primary|danger">…</Btn>` — botão (.zk-btn). Texto fica CAIXA-ALTA via CSS.
- `<Meter value={0..100} />` — barra fina com cor por uso.
- Classes CSS prontas do globals.css: `.zk-table .stat-box .sec-hdr .badge .tree-item .zk-input .zk-btn .mono .cell-ip .cell-proc .priv-root .col .row .fill .scroll-y`.
- Cores por CSS var: `--tx0 --tx1 --tx2 --tx3 --panel --panel2 --inset --b1 --b2 --red --red-hi --green --orange --cyan --yellow --purple --blue`.
- Ícones: `lucide-react` (ex.: `import { Server } from 'lucide-react'` → `<Server size={13} />`).

## Rótulos/cores de status (helper L)

`L.device(s)`, `L.agent(s)`, `L.service(s)`, `L.health(s)`, `L.employee(s)`, `L.criticality(s)`
retornam `[label, tone]`. Ex.: `const [lbl, tone] = L.device(d.status); <Badge tone dot>{lbl}</Badge>`.
`L.branchType(t)`, `L.systemRole(r)` retornam string.

## Layout padrão de uma tela

```tsx
export default function X() {
  return (
    <div className="col fill">
      <PageHeader title="…" subtitle="…" actions={<Btn variant="primary">Ação</Btn>} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        {/* StatBoxes numa row, depois Panels com tabelas */}
      </div>
    </div>
  );
}
```

Veja `src/components/screens/Dashboard.tsx` como EXEMPLAR já pronto — siga o mesmo padrão.

## Navegação entre telas

`const { go } = useNav();` — `go('device', d.id)` abre console do dispositivo; `go('branch', b.id)`;
`go('employee', e.id)`. Linhas de tabela clicáveis: `<tr style={{cursor:'pointer'}} onClick={()=>go(...)}>`.

## Regras

- PT-BR. Denso (fonte 12px já é padrão). Tabelas com `.zk-table`. Nada de libs novas.
- Telas com `id` recebem `{ id }: { id: string }` como prop.
- Mock é somente-leitura para telas de lista; telas interativas (serviços) podem mutar `db`
  localmente com `useState` para refletir a ação (start/stop) — os dados são mock mesmo.
