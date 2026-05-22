import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptDir);
const distDir = join(rootDir, 'dist');
const indexFile = join(distDir, 'index.html');

const routes = [
  'about',
  'services',
  'industries',
  'testimonials',
  'blog',
  'contact',
  'service-request',
  'privacy',
  'terms',
];

if (!existsSync(indexFile)) {
  throw new Error('dist/index.html was not found. Run this script after vite build.');
}

for (const route of routes) {
  const routeDir = join(distDir, route);
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(indexFile, join(routeDir, 'index.html'));
}

copyFileSync(indexFile, join(distDir, '404.html'));

console.log(`Generated SPA fallback pages for ${routes.length} routes.`);
