// Sistema de temas — sobrescreve as CSS vars do globals.css em documentElement.
// Trocar de tema aplica um conjunto completo de variáveis (chrome + accent).

type Vars = Record<string, string>;

// Base de "chrome" escuro (fundo/paineis/bordas/texto). Os temas escuros herdam e só
// trocam o accent; o tema claro redefine tudo.
// Escuro intenso (quase preto, alto contraste) — mais "vivo" que o cinza apagado do ZK original.
const DARK: Vars = {
  '--bg': '#0d0d0f', '--panel': '#151517', '--panel2': '#1c1c1f', '--panel3': '#26262a',
  '--inset': '#101012', '--inset2': '#0a0a0b',
  '--b1': '#242427', '--b2': '#323236', '--b3': '#48484e',
  '--tx0': '#e8e8ea', '--tx1': '#b4b4ba', '--tx2': '#7a7a82', '--tx3': '#4c4c54',
};

/** accent(base, hi, bg-dim, bg-deeper) → mapeia a família --red* (usada em botões/seleção/ativo). */
function accent(base: string, hi: string, dim: string, deep: string): Vars {
  return { '--red': base, '--red-hi': hi, '--red2': dim, '--red3': deep };
}

export const THEMES: Record<string, Vars> = {
  'ZombieKeeper': { ...DARK, ...accent('#e0483f', '#ff5c66', '#3a1216', '#25090c') },
  'Escuro Azul': { ...DARK, ...accent('#3d6fb0', '#5a96d4', '#182838', '#0f1a26') },
  'Escuro Verde': { ...DARK, ...accent('#3d8b40', '#4ec94e', '#173a17', '#0d220d') },
  'One Dark': {
    '--bg': '#282c34', '--panel': '#2c313a', '--panel2': '#333842', '--panel3': '#3e4451',
    '--inset': '#21252b', '--inset2': '#1b1e23', '--b1': '#3a3f4b', '--b2': '#454b58', '--b3': '#5c6370',
    '--tx0': '#abb2bf', '--tx1': '#9098a5', '--tx2': '#6b7280', '--tx3': '#4b5263',
    ...accent('#61afef', '#7cc0f5', '#1e3346', '#152532'),
  },
  'Nord': {
    '--bg': '#2e3440', '--panel': '#3b4252', '--panel2': '#434c5e', '--panel3': '#4c566a',
    '--inset': '#272c36', '--inset2': '#21252e', '--b1': '#3b4252', '--b2': '#4c566a', '--b3': '#616e88',
    '--tx0': '#eceff4', '--tx1': '#d8dee9', '--tx2': '#8fbcbb', '--tx3': '#616e88',
    ...accent('#5e81ac', '#88c0d0', '#2c3a4a', '#222d3a'),
  },
  'Claro (DBeaver)': {
    '--bg': '#ffffff', '--panel': '#f3f3f3', '--panel2': '#e8e8e8', '--panel3': '#dcdcdc',
    '--inset': '#fafafa', '--inset2': '#f0f0f0', '--b1': '#dcdcdc', '--b2': '#c8c8c8', '--b3': '#a8a8a8',
    '--tx0': '#1f1f1f', '--tx1': '#444444', '--tx2': '#6e6e6e', '--tx3': '#9a9a9a',
    ...accent('#2f65ca', '#3d7ad6', '#dbe6f7', '#c7d8f0'),
  },
};

const KEY = 'argus-theme';

export function themeNames(): string[] { return Object.keys(THEMES); }
export function currentTheme(): string {
  const s = localStorage.getItem(KEY);
  return s && THEMES[s] ? s : 'ZombieKeeper';
}

export function applyTheme(name: string) {
  const t = THEMES[name];
  if (!t) return;
  const root = document.documentElement;
  Object.entries(t).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', name);
  localStorage.setItem(KEY, name);
}

/** Aplica só o accent (cor de destaque) por cima do tema atual. */
export function applyAccent(base: string, hi: string) {
  const root = document.documentElement;
  const dim = mix(base, '#000000', 0.72), deep = mix(base, '#000000', 0.82);
  Object.entries(accent(base, hi, dim, deep)).forEach(([k, v]) => root.style.setProperty(k, v));
}

function mix(hex: string, other: string, t: number): string {
  const a = parse(hex), b = parse(other);
  const c = a.map((x, i) => Math.round(x * (1 - t) + b[i] * t));
  return '#' + c.map(x => x.toString(16).padStart(2, '0')).join('');
}
function parse(h: string): number[] {
  const n = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
}

export function initTheme() { applyTheme(currentTheme()); }
