import { describe, it, expect } from 'vitest';
import { toEntityCode } from '@/lib/dev-expenses/utils';

describe('toEntityCode', () => {
  it('converts a simple name to lowercase slug', () => {
    expect(toEntityCode('IA-Solution')).toBe('ia_solution');
  });

  it('handles spaces and hyphens', () => {
    expect(toEntityCode('TekkBridge SARL')).toBe('tekkbridge_sarl');
    expect(toEntityCode('Benoît et Associés')).toBe('benoit_et_associes');
  });

  it('removes accents', () => {
    expect(toEntityCode('Café Résumé')).toBe('cafe_resume');
    expect(toEntityCode('Müller GmbH')).toBe('muller_gmbh');
  });

  it('removes special characters', () => {
    expect(toEntityCode('Benoît & Associés')).toBe('benoit_associes');
    expect(toEntityCode('Co. Ltd. (DRC)')).toBe('co_ltd_drc');
  });

  it('collapses consecutive underscores', () => {
    expect(toEntityCode('A   B---C')).toBe('a_b_c');
  });

  it('trims leading/trailing underscores', () => {
    expect(toEntityCode('  Hello  ')).toBe('hello');
    expect(toEntityCode('--Test--')).toBe('test');
  });

  it('handles empty string', () => {
    expect(toEntityCode('')).toBe('');
  });

  it('handles numbers', () => {
    expect(toEntityCode('Entity 001')).toBe('entity_001');
  });

  it('handles only special characters', () => {
    expect(toEntityCode('!!! &')).toBe('');
  });
});
