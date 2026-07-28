/** @type {import('tailwindcss').Config} */
// Paleta idêntica ao ZombieKeeper-Client (DBeaver-dark com accent vermelho).
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { mono: ['ui-monospace', 'JetBrains Mono', 'Consolas', 'Courier New', 'monospace'] },
      colors: {
        zk: {
          bg: '#1e1e1e', panel: '#252526', panel2: '#2d2d2d', panel3: '#383838',
          inset: '#1c1c1c', inset2: '#181818',
          b1: '#333333', b2: '#3d3d3d', b3: '#555555',
          tx0: '#d4d4d4', tx1: '#a8a8a8', tx2: '#767676', tx3: '#4a4a4a',
          red: '#cc4444', redhi: '#e05c6e', red2: '#3a1820', red3: '#280f16',
          green: '#4ec94e', orange: '#d4935a', cyan: '#5eb8d4',
          yellow: '#c8b050', purple: '#a07fd4', blue: '#5a96d4'
        }
      }
    }
  },
  plugins: []
};
