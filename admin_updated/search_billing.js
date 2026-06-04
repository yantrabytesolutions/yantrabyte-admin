import fs from 'fs';
const content = fs.readFileSync('d:\\Antigravity\\admin\\yantrabyte-admin-main\\src\\admin\\BillingSoftware.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('pdf') || line.toLowerCase().includes('supabase.from') || line.toLowerCase().includes('fetch') || line.toLowerCase().includes('save')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
