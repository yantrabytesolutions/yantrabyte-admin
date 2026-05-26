const fs = require('fs');

const adminPanelPath = 'src/admin/AdminPanel.tsx';
const billingPath = 'src/admin/BillingSoftware.tsx';

let adminContent = fs.readFileSync(adminPanelPath, 'utf8');
let billingContent = fs.readFileSync(billingPath, 'utf8');

const hwSvgsHtml = `
      '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M8 11V9"/><path d="M16 11V9"/><path d="M12 11V9"/><path d="M2 15h20"/><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1.063a2 2 0 0 0 0-3.837Z"/></svg>',
      '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>',
      '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1"/><path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"/><path d="M21 21v-2h-4"/><path d="M3 5h4V3"/><path d="M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3"/></svg>',
      '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>'
`;

const emailTarget = `const emailHwSvg = [
      '<svg viewBox="0 0 100 60" width="70" height="42" fill="none" stroke="#0B5394" stroke-width="2"><rect x="5" y="10" width="90" height="40" rx="3" fill="#0B5394" fill-opacity="0.15"/><rect x="12" y="16" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="12" y="30" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="48" y="16" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="48" y="30" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="0" y="20" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><rect x="0" y="34" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><rect x="94" y="20" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><rect x="94" y="34" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><line x1="8" y1="50" x2="50" y2="50"/><line x1="50" y1="50" x2="92" y2="50"/></svg>',
      '<svg viewBox="0 0 100 60" width="70" height="42" fill="none" stroke="#0B5394" stroke-width="2"><rect x="5" y="8" width="90" height="44" rx="4" fill="#0B5394" fill-opacity="0.15"/><circle cx="50" cy="30" r="14" fill="#0B5394" fill-opacity="0.15"/><circle cx="50" cy="30" r="6" fill="#0B5394" fill-opacity="0.25"/><circle cx="50" cy="30" r="2" fill="#0B5394" fill-opacity="0.4"/><rect x="76" y="18" width="12" height="4" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="76" y="26" width="12" height="4" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="10" y="46" width="30" height="3" fill="#0B5394" fill-opacity="0.3"/></svg>',
      '<svg viewBox="0 0 80 70" width="56" height="49" fill="none" stroke="#0B5394" stroke-width="2"><rect x="4" y="4" width="72" height="46" rx="3" fill="#0B5394" fill-opacity="0.08"/><rect x="8" y="8" width="64" height="38" rx="2" fill="#0B5394" fill-opacity="0.15"/><rect x="36" y="50" width="8" height="6" fill="#0B5394" fill-opacity="0.3"/><rect x="28" y="56" width="24" height="4" rx="2" fill="#0B5394" fill-opacity="0.3"/><rect x="22" y="60" width="36" height="3" fill="#0B5394" fill-opacity="0.3"/></svg>',
      '<svg viewBox="0 0 100 50" width="70" height="35" fill="none" stroke="#0B5394" stroke-width="2"><rect x="4" y="14" width="14" height="22" rx="3" fill="#0B5394" fill-opacity="0.15"/><rect x="8" y="8" width="6" height="10" rx="1" fill="#0B5394" fill-opacity="0.25"/><path d="M18 18 Q35 8 50 18 Q65 28 82 18" fill="none" stroke="#0B5394" stroke-opacity="0.3" stroke-width="2.5"/><rect x="82" y="10" width="14" height="16" rx="2" fill="#0B5394" fill-opacity="0.15"/><rect x="86" y="14" width="3" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="92" y="14" width="3" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/></svg>',
    ];`;

const emailReplacement = `const emailHwSvg = [${hwSvgsHtml}    ];`;
billingContent = billingContent.replace(emailTarget, emailReplacement);
adminContent = adminContent.replace(emailTarget, emailReplacement);

const reactTarget = `            {[...Array(36)].map((_, i) => (
              <svg key={i} viewBox="0 0 100 60" width="70" height="42" fill="none" stroke="#0B5394" strokeWidth="2" style={{ display: 'inline-block' }}>
                {i % 4 === 0 && <><rect x="5" y="10" width="90" height="40" rx="3" fill="#0B5394" fillOpacity="0.2"/><rect x="12" y="16" width="28" height="8" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="12" y="30" width="28" height="8" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="48" y="16" width="28" height="8" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="48" y="30" width="28" height="8" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="0" y="20" width="6" height="6" rx="1" fill="#0B5394" fillOpacity="0.45"/><rect x="0" y="34" width="6" height="6" rx="1" fill="#0B5394" fillOpacity="0.45"/><rect x="94" y="20" width="6" height="6" rx="1" fill="#0B5394" fillOpacity="0.45"/><rect x="94" y="34" width="6" height="6" rx="1" fill="#0B5394" fillOpacity="0.45"/><line x1="8" y1="50" x2="50" y2="50" stroke="#0B5394"/><line x1="50" y1="50" x2="92" y2="50" stroke="#0B5394"/></>}
                {i % 4 === 1 && <><rect x="5" y="8" width="90" height="44" rx="4" fill="#0B5394" fillOpacity="0.2"/><circle cx="50" cy="30" r="14" fill="#0B5394" fillOpacity="0.2"/><circle cx="50" cy="30" r="6" fill="#0B5394" fillOpacity="0.3"/><circle cx="50" cy="30" r="2" fill="#0B5394" fillOpacity="0.45"/><rect x="76" y="18" width="12" height="4" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="76" y="26" width="12" height="4" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="10" y="46" width="30" height="3" rx="1" fill="#0B5394" fillOpacity="0.35"/></>}
                {i % 4 === 2 && <><rect x="4" y="4" width="72" height="46" rx="3" fill="#0B5394" fillOpacity="0.12"/><rect x="8" y="8" width="64" height="38" rx="2" fill="#0B5394" fillOpacity="0.2"/><rect x="36" y="50" width="8" height="6" fill="#0B5394" fillOpacity="0.35"/><rect x="28" y="56" width="24" height="4" rx="2" fill="#0B5394" fillOpacity="0.35"/><rect x="22" y="60" width="36" height="3" rx="1" fill="#0B5394" fillOpacity="0.35"/></>}
                {i % 4 === 3 && <><rect x="4" y="14" width="14" height="22" rx="3" fill="#0B5394" fillOpacity="0.2"/><rect x="8" y="8" width="6" height="10" rx="1" fill="#0B5394" fillOpacity="0.3"/><path d="M18 18 Q35 8 50 18 Q65 28 82 18" fill="none" stroke="#0B5394" strokeOpacity="0.35" strokeWidth="2.5"/><rect x="82" y="10" width="14" height="16" rx="2" fill="#0B5394" fillOpacity="0.2"/><rect x="86" y="14" width="3" height="8" rx="1" fill="#0B5394" fillOpacity="0.35"/><rect x="92" y="14" width="3" height="8" rx="1" fill="#0B5394" fillOpacity="0.35"/></>}
              </svg>
            ))}`;

const reactReplacement = `            {[...Array(36)].map((_, i) => (
              <svg key={i} viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                {i % 4 === 0 && <><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M8 11V9"/><path d="M16 11V9"/><path d="M12 11V9"/><path d="M2 15h20"/><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1.063a2 2 0 0 0 0-3.837Z"/></>}
                {i % 4 === 1 && <><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></>}
                {i % 4 === 2 && <><path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1"/><path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"/><path d="M21 21v-2h-4"/><path d="M3 5h4V3"/><path d="M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3"/></>}
                {i % 4 === 3 && <><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></>}
              </svg>
            ))}`;

billingContent = billingContent.replace(reactTarget, reactReplacement);

// We should also replace the email target in AdminPanel but it's defined slightly differently there!
// Wait, AdminPanel's email svg is slightly different? Let me just write a regex or use exactly the AdminPanel's content.

// Add the watermark HTML snippet to AdminPanel.tsx inside printJobSheet before the first table
const adminHtmlInjectionTarget = `        <!-- Header -->`;
// We will generate the watermark html block.
const adminWatermarkHtml = Array(40).fill(0).map((_, i) => {
  const svgs = [
    '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M8 11V9"/><path d="M16 11V9"/><path d="M12 11V9"/><path d="M2 15h20"/><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1.063a2 2 0 0 0 0-3.837Z"/></svg>',
    '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>',
    '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1"/><path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"/><path d="M21 21v-2h-4"/><path d="M3 5h4V3"/><path d="M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3"/></svg>',
    '<svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#0B5394" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>'
  ];
  return \`<span style="display:inline-block;margin:40px 50px;">\${svgs[i % 4]}</span>\`;
}).join('');

const adminHtmlInjection = \`        <div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;transform:rotate(-15deg);opacity:0.18;padding:60px 20px;">
          \${adminWatermarkHtml}
        </div>
        <!-- Header -->\`;

adminContent = adminContent.replace(adminHtmlInjectionTarget, adminHtmlInjection);

// In AdminPanel.tsx, let's also fix the email watermark for Tickets if there is one.
const adminEmailTarget = \`    const emailHwSvg = [
      '<svg viewBox="0 0 100 60" width="70" height="42" fill="none" stroke="#0B5394" stroke-width="2"><rect x="5" y="10" width="90" height="40" rx="3" fill="#0B5394" fill-opacity="0.15"/><rect x="12" y="16" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="12" y="30" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="48" y="16" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="48" y="30" width="28" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="0" y="20" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><rect x="0" y="34" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><rect x="94" y="20" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><rect x="94" y="34" width="6" height="6" rx="1" fill="#0B5394" fill-opacity="0.4"/><line x1="8" y1="50" x2="50" y2="50"/><line x1="50" y1="50" x2="92" y2="50"/></svg>',
      '<svg viewBox="0 0 100 60" width="70" height="42" fill="none" stroke="#0B5394" stroke-width="2"><rect x="5" y="8" width="90" height="44" rx="4" fill="#0B5394" fill-opacity="0.15"/><circle cx="50" cy="30" r="14" fill="#0B5394" fill-opacity="0.15"/><circle cx="50" cy="30" r="6" fill="#0B5394" fill-opacity="0.25"/><circle cx="50" cy="30" r="2" fill="#0B5394" fill-opacity="0.4"/><rect x="76" y="18" width="12" height="4" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="76" y="26" width="12" height="4" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="10" y="46" width="30" height="3" rx="1" fill="#0B5394" fill-opacity="0.3"/></svg>',
      '<svg viewBox="0 0 80 70" width="56" height="49" fill="none" stroke="#0B5394" stroke-width="2"><rect x="4" y="4" width="72" height="46" rx="3" fill="#0B5394" fill-opacity="0.08"/><rect x="8" y="8" width="64" height="38" rx="2" fill="#0B5394" fill-opacity="0.15"/><rect x="36" y="50" width="8" height="6" fill="#0B5394" fill-opacity="0.3"/><rect x="28" y="56" width="24" height="4" rx="2" fill="#0B5394" fill-opacity="0.3"/><rect x="22" y="60" width="36" height="3" rx="1" fill="#0B5394" fill-opacity="0.3"/></svg>',
      '<svg viewBox="0 0 100 50" width="70" height="35" fill="none" stroke="#0B5394" stroke-width="2"><rect x="4" y="14" width="14" height="22" rx="3" fill="#0B5394" fill-opacity="0.15"/><rect x="8" y="8" width="6" height="10" rx="1" fill="#0B5394" fill-opacity="0.25"/><path d="M18 18 Q35 8 50 18 Q65 28 82 18" fill="none" stroke="#0B5394" stroke-opacity="0.3" stroke-width="2.5"/><rect x="82" y="10" width="14" height="16" rx="2" fill="#0B5394" fill-opacity="0.15"/><rect x="86" y="14" width="3" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/><rect x="92" y="14" width="3" height="8" rx="1" fill="#0B5394" fill-opacity="0.3"/></svg>',
    ];\`
adminContent = adminContent.replace(adminEmailTarget, emailReplacement);

// Also handle the edge case where \`rx="1"\` is missing from the 2nd one.
// Let's just use regex for safety:
adminContent = adminContent.replace(/const emailHwSvg = \[[\s\S]*?\];/, emailReplacement);
billingContent = billingContent.replace(/const emailHwSvg = \[[\s\S]*?\];/, emailReplacement);

fs.writeFileSync(billingPath, billingContent, 'utf8');
fs.writeFileSync(adminPanelPath, adminContent, 'utf8');
console.log('Watermarks updated successfully.');
