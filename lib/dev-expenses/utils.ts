/**
 * Convert a display name into a technical entity code (slug).
 *
 * Rules:
 *   - lowercase
 *   - accents removed
 *   - spaces and hyphens → underscores
 *   - non-alphanumeric chars (except _) removed
 *   - consecutive underscores collapsed to one
 *   - leading/trailing underscores trimmed
 *
 * Examples:
 *   toEntityCode('IA-Solution')        → 'ia_solution'
 *   toEntityCode('TekkBridge SARL')    → 'tekkbridge_sarl'
 *   toEntityCode('Benoît & Associés')  → 'benoit_associes'
 */
export function toEntityCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')          // strip accents
    .toLowerCase()
    .replace(/[\s-]+/g, '_')                  // spaces & hyphens → underscore
    .replace(/[^a-z0-9_]/g, '')               // remove non-alphanumeric (except _)
    .replace(/_+/g, '_')                      // collapse consecutive underscores
    .replace(/^_+|_+$/g, '');                 // trim leading/trailing underscores
}
