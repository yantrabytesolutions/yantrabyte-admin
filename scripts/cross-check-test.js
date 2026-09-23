const https = require('https');

const endpoints = [
  '/',
  '/about',
  '/services',
  '/industries',
  '/testimonials',
  '/blog',
  '/contact',
  '/track-ticket',
  '/track',
  '/privacy',
  '/terms',
  '/services/cctv-installation',
  '/services/laptop-repair',
  '/services/desktop-repair',
  '/services/networking',
  '/services/printer-services',
  '/services/amc-support',
  '/services/am-support',
  '/services/wifi-solutions',
  '/services/server-setup',
  '/services/data-recovery',
  '/services/cloud-solutions',
  '/services/access-control',
  '/services/it-consulting',
  '/services/hardware-upgrades',
  '/blog/tips-choosing-right-cctv-system',
  '/blog/secure-office-network-cyber-threats',
  '/blog/complete-guide-office-wifi-setup',
  '/blog/smart-office-automation-boost-productivity'
];

function fetchPage(p) {
  return new Promise((resolve) => {
    https.get('https://yantrabyte.anantatechcare.com' + p, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          path: p,
          statusCode: res.statusCode,
          hasRoot: body.includes('root'),
          bytes: body.length
        });
      });
    }).on('error', (err) => {
      resolve({ path: p, error: err.message });
    });
  });
}

(async () => {
  console.log('STARTING THOROUGH CROSS-CHECK OF ' + endpoints.length + ' ENDPOINTS...');
  let totalErrors = 0;
  for (const ep of endpoints) {
    const res = await fetchPage(ep);
    if (res.statusCode === 200 && res.hasRoot) {
      console.log('[PASS 200 OK] ' + res.path.padEnd(50) + ' (' + res.bytes + ' bytes, DOM root present)');
    } else {
      console.log('[FAIL] ' + res.path + ' => Status: ' + res.statusCode);
      totalErrors++;
    }
  }
  console.log('\nFINAL AUDIT SUMMARY: ' + (totalErrors === 0 ? '100% HEALTHY - ALL PASSED WITH 0 ERRORS' : totalErrors + ' ERRORS FOUND'));
})();
