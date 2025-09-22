import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');

function shouldSkip(file: string): boolean {
  const skipDirs = [/^dist\//, /^node_modules\//, /^exports\//, /^docs\/assets\//];
  if (skipDirs.some(pattern => pattern.test(file))) {
    return true;
  }

  const ext = path.extname(file).toLowerCase();
  const binaryExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.svg',
    '.ico',
    '.bmp',
    '.pdf',
    '.zip',
    '.gz',
    '.mp4',
    '.mp3',
    '.mov',
    '.avi',
    '.m4a',
    '.woff',
    '.woff2'
  ]);

  if (binaryExtensions.has(ext)) {
    return true;
  }

  // Skip files larger than 1 MB to avoid heavy IO
  const fullPath = path.join(repoRoot, file);
  if (!fs.existsSync(fullPath)) {
    return true;
  }
  const stats = fs.statSync(fullPath);
  return stats.size > 1_000_000;
}

describe('Security safeguards', () => {
  const trackedFiles = execSync('git ls-files -z', {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  })
    .split('\0')
    .filter(Boolean);

  it('does not track environment secret files', () => {
    const secretFiles = trackedFiles.filter(file => {
      const base = path.basename(file);
      if (base === '.env') {
        return true;
      }
      if (base.startsWith('.env.') && base !== '.env.example') {
        return true;
      }
      return false;
    });
    expect(secretFiles).toEqual([]);
  });

  it('contains no Google API keys in tracked sources', () => {
    const googleKeyPattern = /AIza[0-9A-Za-z\-_]{35}/g;
    const offenders: Array<{ file: string; matches: string[] }> = [];

    for (const file of trackedFiles) {
      if (shouldSkip(file)) {
        continue;
      }

      const fullPath = path.join(repoRoot, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(googleKeyPattern);
      if (matches) {
        offenders.push({ file, matches });
      }
    }

    expect(offenders).toEqual([]);
  });
});
