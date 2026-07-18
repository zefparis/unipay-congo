import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ADMIN_API_DIR = path.resolve(__dirname, '..', 'app', 'api', 'admin');

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
      results.push(fullPath);
    }
  }
  return results;
}

const PROTECTED_MARKERS = ['requireAdminSession', 'adminProxyFetch'];
const SKIP_DIRS = ['auth', 'legacy-auth'];

describe('project-wide admin route protection guard', () => {
  const routeFiles = findRouteFiles(ADMIN_API_DIR);

  it('found admin route files', () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  for (const file of routeFiles) {
    const relative = path.relative(ADMIN_API_DIR, file);

    it.skipIf(
      SKIP_DIRS.some(d => relative.startsWith(d + path.sep) || relative.startsWith(d + '/')),
    )(`${relative} uses requireAdminSession and adminProxyFetch`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      for (const marker of PROTECTED_MARKERS) {
        expect(content, `${relative} should import ${marker}`).toContain(marker);
      }
    });
  }
});
