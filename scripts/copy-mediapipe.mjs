import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'node_modules', '@mediapipe', 'hands');
const destDir = path.join(rootDir, 'public', 'mediapipe', 'hands');

if (!fs.existsSync(srcDir)) {
  console.log('[copy-mediapipe] @mediapipe/hands not yet present, skipping.');
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

const extensions = ['.js', '.wasm', '.data', '.tflite', '.binarypb'];
let copiedCount = 0;

for (const file of fs.readdirSync(srcDir)) {
  if (extensions.some((ext) => file.endsWith(ext))) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    fs.copyFileSync(srcFile, destFile);
    copiedCount++;
  }
}

console.log(`[copy-mediapipe] Synced ${copiedCount} MediaPipe Hands runtime assets to public/mediapipe/hands/`);
