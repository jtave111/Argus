// Store reativa sobre o `db` mock. Enquanto o backend não existe, as mutações
// (criar/editar/remover) persistem em memória na sessão e re-renderizam a UI.
// Quando a API real chegar, trocar estas funções por chamadas HTTP mantendo a
// mesma assinatura — os componentes não mudam.
import { useSyncExternalStore } from 'react';
import { db, mockParamCatalogs, type ParamCatalog, type ParamItem } from './mock';

let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

/** Assina o store; retorna o `db` vivo. Re-renderiza a cada mutação. */
export function useDb() {
  useSyncExternalStore(subscribe, () => version, () => version);
  return db;
}

/** ID sintético estável para novos registros (enquanto não há backend). */
let idc = 0xF000;
export const genId = () => (++idc).toString(16).padStart(8, '0');

type Coll = { [K in keyof typeof db]: (typeof db)[K] extends Array<infer _> ? K : never }[keyof typeof db];

/** Insere um registro numa coleção do db e notifica. */
export function create<K extends Coll>(coll: K, row: (typeof db)[K][number]) {
  (db[coll] as any[]).unshift(row);
  emit();
  return row;
}

/** Aplica um patch parcial ao registro com `id` e notifica. */
export function update<K extends Coll>(coll: K, id: string, patch: Partial<(typeof db)[K][number]>) {
  const arr = db[coll] as any[];
  const i = arr.findIndex(r => r.id === id);
  if (i >= 0) { arr[i] = { ...arr[i], ...patch }; emit(); return arr[i]; }
  return null;
}

/** Aplica um patch a um objeto singular (ex.: organization) e notifica. */
export function patchObject<K extends keyof typeof db>(key: K, patch: Partial<(typeof db)[K]>) {
  (db as any)[key] = { ...(db as any)[key], ...patch };
  emit();
}

/** Remove o registro com `id` de uma coleção e notifica. */
export function remove<K extends Coll>(coll: K, id: string) {
  const arr = db[coll] as any[];
  const i = arr.findIndex(r => r.id === id);
  if (i >= 0) { arr.splice(i, 1); emit(); return true; }
  return false;
}

/* ─── Parametrização ─────────────────────────────────────────────────────── */
const catalogs: ParamCatalog[] = mockParamCatalogs;

/** Assina e retorna os catálogos de parametrização (reativos). */
export function useCatalogs() { useSyncExternalStore(subscribe, () => version, () => version); return catalogs; }
/** Itens de um catálogo por id (não-reativo — usar dentro de componente que já assina). */
export const catalogItems = (id: string): ParamItem[] => catalogs.find(c => c.id === id)?.items ?? [];
/** Rótulo legível de uma chave num catálogo. */
export const paramLabel = (id: string, key: string) => catalogItems(id).find(i => i.key === key)?.label ?? key;

export function addParam(catalogId: string, item: ParamItem) {
  const c = catalogs.find(x => x.id === catalogId); if (!c) return;
  if (c.items.some(i => i.key === item.key)) return;
  c.items.push(item); emit();
}
export function removeParam(catalogId: string, key: string) {
  const c = catalogs.find(x => x.id === catalogId); if (!c) return;
  const it = c.items.find(i => i.key === key); if (!it || it.system) return; // sistema não remove
  c.items = c.items.filter(i => i.key !== key); emit();
}
export function updateParam(catalogId: string, key: string, patch: Partial<ParamItem>) {
  const c = catalogs.find(x => x.id === catalogId); if (!c) return;
  c.items = c.items.map(i => i.key === key ? { ...i, ...patch } : i); emit();
}
