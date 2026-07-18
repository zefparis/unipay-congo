import { describe, it, expect } from 'vitest';
import { isValidUUID } from '@/lib/validate-uuid';

describe('isValidUUID', () => {
  it('accepts a valid UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects partial UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4')).toBe(false);
  });

  it('rejects SQL injection attempt', () => {
    expect(isValidUUID("'; DROP TABLE--")).toBe(false);
  });
});
