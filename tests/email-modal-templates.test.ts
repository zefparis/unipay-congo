import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Regression test for the email modal template dropdown bug.
 *
 * Bug: the <select> was wrapped in {templates.length > 0 && (...)} which
 * meant the entire selector (including the "— Sélectionner un template —"
 * placeholder) was hidden until the fetch completed. If the fetch failed
 * silently (catch swallowed the error), the user saw NO selector at all,
 * or saw only the placeholder if templates arrived but were empty.
 *
 * Fix: the <select> is now ALWAYS rendered (with a loading state while
 * templates are being fetched), and fetch errors are logged to console
 * instead of being silently swallowed.
 */
const PAGE_PATH = path.resolve(
  __dirname,
  '../app/[locale]/dashboard/admin/merchants/[id]/page.tsx',
);
const SOURCE = fs.readFileSync(PAGE_PATH, 'utf-8');

describe('email modal — template dropdown regression', () => {
  it('the <select> is NOT gated behind templates.length > 0', () => {
    // The old bug: {templates.length > 0 && (<select>...</select>)}
    // This would hide the entire selector when templates haven't loaded yet.
    // The fix removes this condition so the select is always visible.
    expect(SOURCE).not.toContain('templates.length > 0 && (');
  });

  it('the <select> is always rendered (no conditional wrapper)', () => {
    // The select should be directly inside the modal body, not inside a
    // conditional block that depends on templates being loaded.
    const selectMatch = SOURCE.match(/<select[\s\S]*?<\/select>/);
    expect(selectMatch).not.toBeNull();
    // Verify the select is not wrapped in a templates.length condition
    const selectBlock = selectMatch![0];
    const surroundingCode = SOURCE.substring(
      SOURCE.indexOf(selectBlock) - 200,
      SOURCE.indexOf(selectBlock),
    );
    expect(surroundingCode).not.toContain('templates.length');
  });

  it('templates fetch uses cache: no-store to avoid stale responses', () => {
    expect(SOURCE).toMatch(/support-templates[\s\S]*?cache:\s*['"]no-store['"]/);
  });

  it('templates fetch errors are logged, not silently swallowed', () => {
    // The old code had: catch { /* templates optional */ }
    // The new code logs the error to console.error
    expect(SOURCE).toMatch(/console\.error\(['"]\[email-modal\]/);
    expect(SOURCE).not.toContain('/* templates optional */');
  });

  it('templatesLoading state exists for UX feedback', () => {
    expect(SOURCE).toContain('templatesLoading');
    expect(SOURCE).toMatch(/setTemplatesLoading\(true\)/);
    expect(SOURCE).toMatch(/setTemplatesLoading\(false\)/);
  });

  it('the select shows a loading indicator while templates are being fetched', () => {
    expect(SOURCE).toMatch(/Chargement des templates/);
  });

  it('the select is disabled during loading', () => {
    expect(SOURCE).toMatch(/disabled=\{templatesLoading\}/);
  });

  it('templates are reset to empty when modal opens (no stale state)', () => {
    // Before fetching, templates should be cleared so old data doesn't linger
    expect(SOURCE).toMatch(/setTemplates\(\[\]\)/);
  });

  it('the API path matches the proxy route exactly', () => {
    // The fetch must call the correct proxy path
    expect(SOURCE).toContain(
      '/api/admin/wallet/merchants/${id}/support-templates',
    );
  });

  it('templates are read from data.templates (matching backend response shape)', () => {
    // Backend returns: { templates: [...] }
    // Frontend must read: data.templates
    expect(SOURCE).toContain('data.templates');
  });

  it('the generic template option is rendered via templates.map', () => {
    // The <option> elements come from templates.map, not hardcoded
    expect(SOURCE).toMatch(/templates\.map\(\(t\) =>/);
    expect(SOURCE).toMatch(/<option key=\{t\.label\} value=\{t\.label\}>/);
  });
});
