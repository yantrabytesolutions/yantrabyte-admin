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
  'servicerequest',
  'track',
  'track-ticket',
  'privacy',
  'terms',
  'quotation',
  'my-invoices',
  'portal',
  'services/cctv-installation',
  'services/laptop-repair',
  'services/desktop-repair',
  'services/networking',
  'services/printer-services',
  'services/amc-support',
  'services/am-support',
  'services/wifi-solutions',
  'services/server-setup',
  'services/data-recovery',
  'services/cloud-solutions',
  'services/access-control',
  'services/it-consulting',
  'services/hardware-upgrades',
  'blog/tips-choosing-right-cctv-system',
  'blog/secure-office-network-cyber-threats',
  'blog/complete-guide-office-wifi-setup',
  'blog/smart-office-automation-boost-productivity',
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
