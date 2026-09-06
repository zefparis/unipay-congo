import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES = [
  'app/api/wallet/kyc/route.ts',
  'app/api/wallet/kyc/[id]/approve/route.ts',
  'app/api/wallet/kyc/[id]/reject/route.ts',
];

describe('legacy wallet KYC proxy protection', () => {
  for (const route of ROUTES) {
    it(`${route} requires an admin session`, () => {
      const source = fs.readFileSync(path.resolve(__dirname, '..', route), 'utf8');
      expect(source).toContain('requireAdminSession');
      expect(source).toContain('adminProxyFetch');
    });
  }

  for (const route of ROUTES.slice(1)) {
    it(`${route} verifies the request origin`, () => {
      const source = fs.readFileSync(path.resolve(__dirname, '..', route), 'utf8');
      expect(source).toContain('verifyAdminOrigin');
      expect(source).toContain('isValidUUID');
    });
  }
});
