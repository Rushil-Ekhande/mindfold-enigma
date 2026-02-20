import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('app');
let count = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('"use client"')) continue;

    // Find fetch calls with only 1 argument and append { cache: 'no-store' }
    let newContent = content.replace(/fetch\s*\(\s*([`'"][^,]+?[`'"])\s*\)/g, 'fetch($1, { cache: "no-store" })');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
        console.log('Updated', file);
    }
}
console.log(`Updated ${count} files.`);
