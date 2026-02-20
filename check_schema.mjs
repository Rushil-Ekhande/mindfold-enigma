import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
let url = '';
let key = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"\r]/g, '');
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) if (!url) url = line.split('=')[1].trim().replace(/['"\r]/g, '');
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim().replace(/['"\r]/g, '');
    if (line.startsWith('SUPABASE_ANON_KEY=')) if (!key) key = line.split('=')[1].trim().replace(/['"\r]/g, '');
});

async function check() {
    const res = await fetch(`${url}/rest/v1/journal_entries?select=*&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

check();
