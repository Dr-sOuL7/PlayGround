import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));
const outputDir = join(projectDir, 'dist');
const files = ['index.html', 'styles.css', 'app.js', 'engine.js', 'favicon.svg'];

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
for (const file of files) copyFileSync(join(projectDir, file), join(outputDir, file));
console.log(`Built ${files.length} static files in ${outputDir}`);
