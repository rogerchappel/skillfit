import { access, mkdir, writeFile } from 'node:fs/promises';

await access('bin/skillfit.js');
await access('src/cli.js');
await mkdir('dist', { recursive: true });
await writeFile('dist/package-manifest.txt', 'skillfit build artifact\n');
console.log('build ok');
