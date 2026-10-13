import compat from 'eslint-plugin-compat';
export default [{
  files: ['assets/games/community-builders/**/*.js', 'assets/playtest/**/*.js', 'tools/**/*.mjs'],
  ignores: ['**/node_modules/**', '**/locales/**'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: Object.fromEntries(['window','document','navigator','localStorage','sessionStorage','location','history','CustomEvent','MutationObserver','ResizeObserver','requestAnimationFrame','cancelAnimationFrame','matchMedia','performance','Audio','URL','URLSearchParams','AbortController','fetch','caches','console','setTimeout','clearTimeout','setInterval','clearInterval','crypto','structuredClone','TextEncoder','TextDecoder','globalThis','process','Buffer','module','require','self','getComputedStyle','NodeFilter','Event'].map(n => [n,'readonly'])) },
  rules: { 'no-eval': 'error', 'no-implied-eval': 'error', 'no-duplicate-imports': 'error', 'no-unreachable': 'error', 'no-constant-condition': 'error', 'no-undef': 'error' }
}, {
  files: ['assets/games/community-builders/engine/**/*.js'],
  ignores: ['**/locales/**'],
  plugins: { compat },
  rules: { 'compat/compat': 'error' },
}];
