# DEV_EXPENSES_REFACTOR_BLUEPRINT.md

> **Task DEV-EXPENSES-01** — Investigation complète et blueprint de refonte
> Date: 2026-07-18 | Statut: Investigation terminée, aucun fichier applicatif modifié.

---

## 1. Executive Summary

La fonctionnalité **Dev Expenses** est un tracker de factures mensuelles conçu à l'origine pour 5 services cloud fixes, puis étendu en v2 (créanciers génériques) et v3 (archivage + devis).

**État actuel:** 3 migrations SQL, 3 tables + 1 vue + 1 table reports, 3 fichiers de routes backend (1476 lignes total), 1 page frontend monolithique de 1530 lignes, 12 routes proxy Next.js, 2 cron jobs Render, génération PDF via pdfkit.

**Risques majeurs:**
1. **Sécurité critique**: Routes proxy `/api/admin/**` sans vérification de session (middleware exclut `/api/*`)
2. **Workflow inadéquat**: 3 statuts vs 11 cibles, pas de soumission/validation/remboursement/audit
3. **Monolithe frontend**: 1530 lignes dans un seul fichier
4. **Pas d'audit trail**: Aucune table d'historique
5. **Acceptation devis non transactionnelle**: Risque de dépense orpheline

**Stratégie:** Migration progressive en 7 tasks (DEV-EXPENSES-02 à 08), ajout colonnes sans supprimer l'existant, mapping des statuts en DB, nouveau frontend en parallèle.

---

## 2. Architecture Actuelle

### Flux réseau

```
Browser → Next.js proxy /api/admin/dev-expenses/** → Backend Fastify /v1/admin/dev-expenses/** → Supabase

Render Cron (monthly) → scripts/cron-pull-dev-expenses.js → POST /v1/admin/dev-expenses/pull-automated → Anthropic/Vercel APIs → Supabase

Render Cron (daily) → scripts/cron-due-date-check.js → GET /v1/admin/dev-expenses/upcoming → logs only

Public report (dev-expenses.netlify.app) → GET /dev-expenses/report/:token (no /v1, no admin auth) → Supabase + signed URL PDF (30-day)
```

### Authentification

- **Middleware** (`middleware.ts:38`): matcher `'/((?!api|_next|_vercel|.*\\..*).*)'` exclut `/api/*` → **routes proxy non protégées**
- **Proxy Next.js**: vérifie seulement `ADMIN_SECRET` non-vide, transmet au backend
- **Backend HMAC** (`hmac.ts:33`): compare `x-admin-secret === env.ADMIN_SECRET` (non constant-time)
- **Session admin** (`admin-session.ts`): token HMAC signé, TTL 8h, cookie httpOnly/secure/lax

### Stockage

- Bucket Supabase `dev-expenses-invoices` (privé), MIME: PDF/PNG/JPEG, max 10MB
- Factures: `{billing_month}/{category}-{timestamp}-{filename}`
- Devis: `quotes/{timestamp}-{filename}`
- Rapports: `reports/{billing_month}.pdf`

---

## 3. Inventaire des fichiers

### Frontend (`unipay-congo`)

| Fichier | Lignes | Responsabilité | Problèmes | Décision |
|---------|--------|----------------|-----------|----------|
| `app/[locale]/dashboard/admin/dev-expenses/page.tsx` | 1530 | Page monolithique 6 onglets | Monolithe, types inline | Découper |
| `app/api/admin/dev-expenses/route.ts` | 28 | Proxy GET+POST | Pas de vérif session | Sécuriser |
| `app/api/admin/dev-expenses/upcoming/route.ts` | 15 | Proxy GET | Idem | Idem |
| `app/api/admin/dev-expenses/history/route.ts` | 16 | Proxy GET | Idem | Idem |
| `app/api/admin/dev-expenses/generate-report/route.ts` | 17 | Proxy POST | Idem | Idem |
| `app/api/admin/dev-expenses/pull-automated/route.ts` | 17 | Proxy POST | Idem, exposé publiquement | Idem |
| `app/api/admin/dev-expenses/[id]/mark-paid/route.ts` | 17 | Proxy PATCH | Idem | Idem |
| `app/api/admin/dev-expenses/[id]/archive/route.ts` | 16 | Proxy PATCH | Idem | Idem |
| `app/api/admin/dev-expenses/[id]/unarchive/route.ts` | 16 | Proxy PATCH | Idem | Idem |
| `app/api/admin/creditors/route.ts` | 29 | Proxy GET+POST | Idem | Idem |
| `app/api/admin/creditors/[id]/route.ts` | 35 | Proxy PATCH+DELETE | Idem | Idem |
| `app/api/admin/quotes/route.ts` | 27 | Proxy GET+POST | Idem | Idem |
| `app/api/admin/quotes/[id]/route.ts` | 17 | Proxy PATCH | Idem | Idem |
| `app/api/admin/quotes/[id]/accept/route.ts` | 17 | Proxy POST | Idem | Idem |
| `app/api/admin/quotes/[id]/reject/route.ts` | 16 | Proxy POST | Idem | Idem |
| `components/dashboard/DashboardSidebar.tsx` | 147 | Sidebar avec lien Dev Expenses | OK | Conserver |
| `middleware.ts` | 40 | Protection pages admin | Exclut `/api/*` — **faille** | Corriger |
| `lib/admin-session.ts` | 92 | HMAC session token | Non utilisé pour API | Étendre |

### Backend (`unipay-api`)

| Fichier | Lignes | Responsabilité | Problèmes | Décision |
|---------|--------|----------------|-----------|----------|
| `src/routes/admin/dev-expenses.ts` | 935 | Routes dev-expenses complet | Monolithe, pas de transaction, pas d'audit | Refondre |
| `src/routes/admin/creditors.ts` | 161 | CRUD creditors | `getOrCreateCreditor` dupliqué | Factoriser |
| `src/routes/admin/quotes.ts` | 380 | CRUD quotes + accept/reject | Accept non-transactionnel | RPC |
| `src/plugins/hmac.ts` | 118 | Auth plugin | Comparaison non constant-time | Corriger |
| `src/server.ts` | 228 | Registration routes | Double registration dev-expenses | Documenter |
| `scripts/cron-pull-dev-expenses.js` | 59 | Cron mensuel pull | OK, idempotent | Conserver |
| `scripts/cron-due-date-check.js` | 75 | Cron quotidien logs | OK | Conserver |
| `render.yaml` | 68 | Config Render + crons | OK | Conserver |

### Base de données

| Migration | Lignes | Contenu | Décision |
|-----------|--------|---------|----------|
| `20260706090000_dev_expenses.sql` | 115 | Table dev_expenses + reports + bucket | Conserver |
| `20260706120000_dev_expenses_v2.sql` | 134 | Table creditors + ALTER dev_expenses + vue | Conserver |
| `20260706150000_dev_expenses_v3.sql` | 87 | Archivage + table quotes | Conserver, ajouter trigger |

---

## 4. Modèle de données actuel

### Table `dev_expenses`

| Colonne | Type | Contraintes | Default | Nullable |
|---------|------|-------------|---------|----------|
| id | UUID | PK | gen_random_uuid() | NO |
| category | TEXT | — | — | NO |
| creditor_id | UUID | FK→creditors | — | YES |
| billing_month | DATE | — | — | NO |
| amount_usd | NUMERIC(10,2) | — | — | NO |
| source | TEXT | CHECK in ('api_pull','manual') | 'manual' | NO |
| invoice_url | TEXT | — | — | YES |
| status | TEXT | CHECK in ('pending','paid','reconciled') | 'pending' | NO |
| paid_at | TIMESTAMPTZ | — | — | YES |
| payment_ref | TEXT | — | — | YES |
| notes | TEXT | — | — | YES |
| project_ref | TEXT | ≤200 | — | YES |
| due_date | DATE | — | — | YES |
| invoice_number | TEXT | ≤100 | — | YES |
| funded_by | TEXT | — | 'tekkbridge' | NO |
| paid_by | TEXT | — | 'benoit' | NO |
| archived | BOOLEAN | — | false | NO |
| archived_at | TIMESTAMPTZ | — | — | YES |
| created_at | TIMESTAMPTZ | — | now() | NO |
| updated_at | TIMESTAMPTZ | — | now() (trigger) | NO |

**Index:** billing_month DESC, status, due_date (WHERE status!='paid'), creditor_id, (status,due_date) WHERE archived=false, UNIQUE(creditor_id,billing_month) WHERE source='api_pull'

### Table `creditors`

| Colonne | Type | Contraintes | Default | Nullable |
|---------|------|-------------|---------|----------|
| id | UUID | PK | gen_random_uuid() | NO |
| name | TEXT | — | — | NO |
| entity_type | TEXT | CHECK 5 valeurs | — | NO |
| contact_email | TEXT | — | — | YES |
| payment_method | TEXT | CHECK 4 valeurs | — | YES |
| payment_details | JSONB | — | — | YES |
| default_category | TEXT | — | — | YES |
| notes | TEXT | — | — | YES |
| active | BOOLEAN | — | true | NO |
| created_at | TIMESTAMPTZ | — | now() | NO |

### Table `quotes`

| Colonne | Type | Contraintes | Default | Nullable |
|---------|------|-------------|---------|----------|
| id | UUID | PK | gen_random_uuid() | NO |
| creditor_id | UUID | FK→creditors ON DELETE SET NULL | — | YES |
| creditor_name | TEXT | — | — | YES |
| project_ref | TEXT | — | — | NO |
| category | TEXT | — | — | YES |
| amount_usd | NUMERIC(10,2) | CHECK≥0 | — | NO |
| description | TEXT | — | — | YES |
| status | TEXT | CHECK 5 valeurs | 'draft' | NO |
| valid_until | DATE | — | — | YES |
| quote_file_url | TEXT | — | — | YES |
| converted_expense_id | UUID | FK→dev_expenses ON DELETE SET NULL | — | YES |
| notes | TEXT | — | — | YES |
| created_at | TIMESTAMPTZ | — | now() | YES |
| updated_at | TIMESTAMPTZ | — | now() | YES (pas de trigger) |

### Table `dev_expenses_reports`

| Colonne | Type | Contraintes | Default | Nullable |
|---------|------|-------------|---------|----------|
| id | UUID | PK | gen_random_uuid() | NO |
| billing_month | DATE | UNIQUE | — | NO |
| total_usd | NUMERIC(10,2) | — | — | NO |
| report_pdf_url | TEXT | — | — | YES |
| share_token | TEXT | UNIQUE, 48-char hex | encode(gen_random_bytes(24),'hex') | NO |
| generated_at | TIMESTAMPTZ | — | now() | NO |

### Vue `dev_expenses_with_status`

Jointure dev_expenses + creditors avec calcul dynamique `is_overdue` (due_date < today AND status != 'paid').

### Relations

```
creditors 1──∞ dev_expenses
creditors 1──∞ quotes
quotes 1──1 dev_expenses (via converted_expense_id)
dev_expenses_reports (standalone, lié par billing_month)
```

---

## 5. Workflow actuel

### Dev Expenses

```
pending → paid → archived
```

- `pending→paid`: PATCH mark-paid (dev-expenses.ts:430-457)
- `paid→archived`: PATCH archive (dev-expenses.ts:681-716)
- `archived→active`: PATCH unarchive (dev-expenses.ts:721-753)
- `reconciled`: dans le CHECK mais jamais utilisé par le code

### Quotes

```
draft → sent → accepted/rejected
```

- `draft→sent`: PATCH status='sent' (quotes.ts:217-257)
- `sent→accepted`: POST accept → crée dev_expense + marque quote (quotes.ts:259-338)
- `sent→rejected`: POST reject (quotes.ts:341-376)
- **Expiration**: calculée côté client uniquement (`page.tsx:1162-1165`), non persistée en DB

---

## 6. Écarts avec le besoin métier

| Besoin | État actuel | Écart |
|--------|-------------|-------|
| Qui engage la dépense | `funded_by` texte libre | Pas d'enum structuré |
| Qui prend en charge | Non implémenté | Champ inexistant |
| Soumission pour validation | Non | Pas de statut `submitted` |
| Validation partielle | Non | Pas de `approvedAmount` |
| Paiement programmé | Non | Pas de statut `payment_scheduled` |
| Remboursement | Non | Pas d'entité remboursement |
| Confirmation réception | Non | Pas de `confirmedAt` |
| Audit trail | Non | Aucune table d'audit |
| Moyens de paiement | 4 valeurs sur creditor | Pas sur la dépense |
| Multi-devises | Tout en USD | Pas de champ `currency` |
| Motif de rejet/dispute | Non | Champs inexistants |

---

## 7. Architecture cible recommandée

### Frontend

```
app/[locale]/dashboard/admin/dev-expenses/
├── layout.tsx                    → Tab nav secondaire (5 onglets)
├── overview/page.tsx             → KPIs
├── invoices/
│   ├── page.tsx                  → Liste avec filtres + pagination
│   └── [id]/page.tsx             → Fiche détail
├── quotes/
│   ├── page.tsx                  → Liste devis
│   └── [id]/page.tsx             → Fiche détail
├── suppliers/
│   ├── page.tsx                  → Liste fournisseurs
│   └── [id]/page.tsx             → Fiche fournisseur
└── reports/page.tsx              → Rapports mensuels

components/admin/dev-expenses/    → Composants réutilisables
lib/
├── dev-expenses-types.ts         → Types partagés
├── dev-expenses-api.ts           → Client API
└── admin-proxy.ts                → Helper proxy avec auth
```

### Backend

```
src/routes/admin/
├── dev-expenses.ts               → Refondre: CRUD + transitions
├── dev-expenses-reimbursements.ts → Nouveau
├── dev-expenses-audit.ts         → Nouveau
├── creditors.ts                  → Conserver, factoriser
└── quotes.ts                     → Refondre: accept transactionnel
src/services/
├── dev-expenses.ts               → Nouveau: logique métier
├── dev-expenses-audit.ts         → Nouveau: audit events
└── dev-expenses-pdf.ts           → Extraire de dev-expenses.ts
```

---

## 8. Modèle de données cible

### Nouveaux enums

```sql
CREATE TYPE expense_status AS ENUM ('draft','submitted','under_review','approved','partially_approved','rejected','payment_scheduled','reimbursed','disputed','cancelled','archived');
CREATE TYPE expense_incurred_by AS ENUM ('benjamin','ia_solution','congo_gaming','unipay','other');
CREATE TYPE initial_payment_status AS ENUM ('unpaid','paid_by_benjamin','paid_by_entity','paid_directly_by_group');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer','card','usdt','usdc','binance','unipay_wallet','mobile_money','direct_supplier_payment','internal_offset','cash','other');
CREATE TYPE reimbursement_status AS ENUM ('requested','approved','scheduled','partially_paid','paid','cancelled','failed');
```

### Modifications `dev_expenses`

Nouvelles colonnes (additive, nullable/default):
- `title`, `description`, `supplier_id` (alias creditor_id), `quote_id`, `project`
- `incurred_by` (enum, default 'other'), `covered_by`, `currency` (default 'USD')
- `invoice_date`, `initial_payment_status`, `initial_payment_method`
- `requested_amount`, `approved_amount`, `reimbursed_amount` (default 0)
- `expected_reimbursement_method`, `actual_reimbursement_method`
- `submitted_at`, `reviewed_at`, `approved_at`, `payment_scheduled_at`, `reimbursed_at`
- `rejection_reason`, `dispute_reason`, `internal_notes`
- `new_status` (expense_status, default 'draft') → mapper anciens statuts puis renommer

### Nouvelle table `dev_expense_reimbursements`

```sql
CREATE TABLE dev_expense_reimbursements (
  id UUID PK DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL FK→dev_expenses ON DELETE CASCADE,
  requested_amount NUMERIC(12,2) NOT NULL CHECK≥0,
  approved_amount NUMERIC(12,2), paid_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD', payment_method payment_method_enum,
  transaction_reference TEXT, status reimbursement_status DEFAULT 'requested',
  scheduled_at TIMESTAMPTZ, paid_at TIMESTAMPTZ, confirmed_at TIMESTAMPTZ,
  proof_file_id TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Nouvelle table `dev_expense_audit_events`

```sql
CREATE TABLE dev_expense_audit_events (
  id UUID PK DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL FK→dev_expenses ON DELETE CASCADE,
  action TEXT NOT NULL, previous_status TEXT, new_status TEXT,
  actor_id TEXT, actor_name TEXT, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- IMMUTABLE: pas d'UPDATE/DELETE
```

### Modifications `quotes`

- `final_amount` NUMERIC(12,2), `accepted_at` TIMESTAMPTZ, `rejected_at` TIMESTAMPTZ
- Ajouter trigger `updated_at` (manquant actuellement)

---

## 9. Workflow cible

### Machine à états

```
draft → submitted → under_review
  → approved | partially_approved | rejected
  → payment_scheduled
  → reimbursed
  → archived

Branches: approved/partially_approved → disputed
          payment_scheduled → failed (retour approved)
          rejected → draft ou archived
```

### Transitions autorisées

| From | To | Note requise | Preuve requise | Audit | Notif |
|------|----|-------------|----------------|-------|-------|
| draft→submitted | Non | Non | Oui | Oui |
| submitted→under_review | Non | Non | Oui | Non |
| under_review→approved | Non | Non | Oui | Oui |
| under_review→partially_approved | Oui (approvedAmount) | Non | Oui | Oui |
| under_review→rejected | Oui (rejectionReason) | Non | Oui | Oui |
| approved→payment_scheduled | Non | Non | Oui | Oui |
| partially_approved→payment_scheduled | Non | Non | Oui | Oui |
| payment_scheduled→reimbursed | Non | Oui (proof) | Oui | Oui |
| payment_scheduled→approved | Oui (reason) | Non | Oui | Non |
| approved→disputed | Oui (disputeReason) | Non | Oui | Oui |
| rejected→draft | Non | Non | Oui | Non |
| reimbursed→archived | Non | Non | Oui | Non |

### Transitions interdites

- `archived→*` (sauf unarchive manuel)
- `cancelled→*` (terminal)
- `reimbursed→*` (sauf archived)
- `rejected→approved` (doit passer par draft→submitted→under_review)
- `disputed→payment_scheduled` (doit résoudre la dispute)

---

## 10. Sécurité

### Vulnérabilités confirmées

| # | Vulnérabilité | Sévérité | Localisation | Correction |
|---|---------------|----------|--------------|------------|
| 1 | **Routes API admin sans auth** — middleware exclut `/api/*`, proxies sans vérif session | **CRITIQUE** | `middleware.ts:38` + tous `app/api/admin/**/route.ts` | Helper `withAdminAuth()` vérifiant `admin_session` |
| 2 | Comparaison admin secret non constant-time | FAIBLE | `hmac.ts:33` | `crypto.timingSafeEqual()` |
| 3 | Pas de protection CSRF sur mutations | MOYENNE | Tous les proxies | `sameSite=lax` partiel, ajouter token CSRF |
| 4 | Liens de partage sans expiration (token permanent) | MOYENNE | `dev-expenses.ts:846-931` | Ajouter `expires_at` à reports |
| 5 | Logs exposent données financières | FAIBLE | Plusieurs `fastify.log.error` | Sanitiser |
| 6 | Upload sans vérif nombre de fichiers | FAIBLE | `dev-expenses.ts:336-343` | Compteur de fichiers |

### Vérifications spécifiques

1. Routes `/api/admin/**` accessibles sans `admin_session`? **OUI** — confirmé par matcher middleware
2. Middleware exclut toutes les routes API? **OUI** — pattern `(?!api)`
3. Backend accepte uniquement `x-admin-secret`? **OUI** — HMAC plugin
4. Appel public vers proxy atteint le backend? **OUI** — proxy vérifie seulement env var non-vide
5. D'autres routes admin utilisent un helper sécurisé? **NON** — toutes suivent le même pattern
6. Protection centralisée possible? **OUI** — créer `withAdminAuth()` wrapper
7. Cookies HttpOnly/Secure/SameSite? **OUI** — `httpOnly:true, secure:production, sameSite:lax`
8. Protection CSRF nécessaire? **OUI** — `sameSite=lax` partiel
9. Uploads limités? **OUI** — PDF/PNG/JPEG, 10MB, 3 fichiers max
10. Fichiers privés? **OUI** — bucket `public:false`, signed URLs
11. Liens expirent? **NON** — token permanent, signed URL 30 jours
12. Infos financières dans logs? **OUI** — montants et noms dans erreurs

---

## 11. Plan de migration

### Mapping des statuts

| Ancien | Nouveau | Notes |
|--------|---------|-------|
| pending | draft | En attente non payée → brouillon |
| paid | reimbursed | Payé → remboursé |
| reconciled | archived | Non utilisé, sécurité |
| archived=true | archived | Cohérent |

### Mapping des champs

| Ancien | Nouveau | Notes |
|--------|---------|-------|
| creditor_id | supplier_id (alias) | Conserver creditor_id pour compat |
| funded_by | incurred_by | 'tekkbridge'→'other', 'benoit'→'benjamin' |
| paid_by | initial_payment_status | Mapper selon valeur |
| amount_usd | amount + currency='USD' | Conserver amount_usd |
| notes | internal_notes | Renommer |

### Stratégie

1. **Phase 1**: Ajout colonnes (additive, nullable/default)
2. **Phase 2**: Migration des données (UPDATE mapping)
3. **Phase 3**: Double écriture backend (ancien + nouveau)
4. **Phase 4**: Bascule frontend (nouvelle UI)
5. **Phase 5**: Nettoyage (suppression anciennes colonnes, optionnel)

### Rollback

- Migrations additive sûres: anciennes colonnes restent
- Frontend peut revenir à l'ancienne page
- Nouvelles tables peuvent être droppées sans impact
- Anciennes routes backend restent fonctionnelles

### Valeurs inconnues

- `incurred_by`: default 'other'
- `currency`: default 'USD'
- `initial_payment_status`: default 'unpaid'
- `requested_amount`/`approved_amount`: copier `amount_usd` pour dépenses payées

---

## 12. Plan de découpage frontend

```
app/[locale]/dashboard/admin/dev-expenses/
├── layout.tsx                    → Tab nav (5 onglets: Vue d'ensemble, Factures, Devis, Fournisseurs, Rapports)
├── overview/page.tsx             → 7 KPIs + graphiques
├── invoices/
│   ├── page.tsx                  → Liste: recherche, filtres (statut, entité, fournisseur, devise, période, archives), pagination, tri
│   └── [id]/page.tsx             → Fiche: résumé, montants, dates, fournisseur, entités, pièces jointes, paiement initial, remboursement, historique, notes, actions
├── quotes/
│   ├── page.tsx                  → Liste devis avec filtres
│   └── [id]/page.tsx             → Fiche détail
├── suppliers/
│   ├── page.tsx                  → Liste (actifs/inactifs)
│   └── [id]/page.tsx             → Fiche + factures liées
└── reports/page.tsx              → Génération + historique

components/admin/dev-expenses/
├── ExpenseStatusBadge.tsx, ExpenseFilters.tsx, ExpenseTable.tsx
├── ExpenseDetail.tsx, ExpenseForm.tsx, ExpenseActions.tsx
├── ExpenseTimeline.tsx, ReimbursementPanel.tsx
├── QuoteStatusBadge.tsx, QuoteForm.tsx, QuoteActions.tsx
├── SupplierForm.tsx, SupplierCard.tsx
├── FileUpload.tsx, ConfirmModal.tsx, AmountInput.tsx, OverviewKPIs.tsx

lib/
├── dev-expenses-types.ts, dev-expenses-api.ts, admin-proxy.ts
```

---

## 13. Plan API

### Endpoints à conserver (modifiés)

| Endpoint | Méthode | Modifications |
|----------|---------|---------------|
| `/v1/admin/dev-expenses` | GET | Ajouter filtres: incurred_by, currency, date_from/to, search. Pagination server-side. |
| `/v1/admin/dev-expenses` | POST | Ajouter champs: title, incurred_by, currency, initial_payment_status, requested_amount |
| `/v1/admin/dev-expenses/:id/mark-paid` | PATCH | Compat: rediriger vers /transition |
| `/v1/admin/dev-expenses/upcoming` | GET | Adapter aux nouveaux statuts |
| `/v1/admin/dev-expenses/history` | GET | Conserver |
| `/v1/admin/dev-expenses/generate-report` | POST | Enrichir PDF |
| `/v1/admin/creditors` | GET/POST | Conserver |
| `/v1/admin/creditors/:id` | PATCH/DELETE | Conserver |
| `/v1/admin/quotes` | GET/POST | Conserver |
| `/v1/admin/quotes/:id` | PATCH | Conserver |
| `/v1/admin/quotes/:id/accept` | POST | Rendre transactionnel |
| `/v1/admin/quotes/:id/reject` | POST | Ajouter reason |
| `/dev-expenses/report/:token` | GET | Ajouter expiration |

### Endpoints à ajouter

| Endpoint | Méthode | Usage |
|----------|---------|-------|
| `/v1/admin/dev-expenses/:id` | GET | Détail avec remboursements + audit |
| `/v1/admin/dev-expenses/:id` | PATCH | Édition générale |
| `/v1/admin/dev-expenses/:id/transition` | POST | Transition de statut générique |
| `/v1/admin/dev-expenses/:id/reimbursements` | GET/POST | Liste + création remboursements |
| `/v1/admin/dev-expenses/:id/reimbursements/:rid` | PATCH | Modifier remboursement |
| `/v1/admin/dev-expenses/:id/audit` | GET | Historique audit |
| `/v1/admin/dev-expenses/:id/attachments` | POST | Ajouter pièce jointe |
| `/v1/admin/dev-expenses/stats` | GET | KPIs vue d'ensemble |

### Endpoints à supprimer ultérieurement

| Endpoint | Raison |
|----------|--------|
| `/v1/admin/dev-expenses/:id/archive` | Remplacé par /transition |
| `/v1/admin/dev-expenses/:id/unarchive` | Remplacé par /transition |

---

## 14. Plan d'implémentation

### DEV-EXPENSES-02 — Sécurisation des routes API admin

**Objectif:** Corriger la vulnérabilité critique d'accès non authentifié aux proxies admin.

**Fichiers:** `lib/admin-session.ts`, `lib/admin-proxy.ts` (nouveau), tous les `app/api/admin/**/route.ts` (~44 fichiers)

**Risques:** Casser des appels existants si session invalide.

**Critères d'acceptation:**
- Toutes les routes `/api/admin/**` vérifient `admin_session`
- Retour 401 si session manquante/expirée
- Routes existantes fonctionnent après login

**Tests:** Appel sans cookie→401, avec cookie valide→200, cookie expiré→401

---

### DEV-EXPENSES-03 — Migration DB: nouvelles colonnes + tables

**Objectif:** Ajouter colonnes et tables cibles sans casser l'existant.

**Fichiers:** `supabase/migrations/2026XXXXXXXXXX_dev_expenses_v4.sql` (nouveau)

**Risques:** Migration sur données de production.

**Critères d'acceptation:**
- Nouvelles colonnes nullable ou avec default
- Anciennes colonnes et contraintes intactes
- Données existantes mappées vers nouveaux statuts
- Vue `dev_expenses_with_status` recréée

**Tests:** SELECT dev_expenses retourne anciennes+nouvelles colonnes, vue fonctionne, anciennes routes identiques

---

### DEV-EXPENSES-04 — Backend: service layer + transitions

**Objectif:** Implémenter machine à états, audit events, remboursements.

**Fichiers:** `src/services/dev-expenses.ts`, `src/services/dev-expenses-audit.ts`, `src/routes/admin/dev-expenses.ts` (refonte), `src/routes/admin/dev-expenses-reimbursements.ts`, `src/routes/admin/dev-expenses-audit.ts`

**Risques:** Régressions sur routes existantes.

**Critères d'acceptation:**
- Toutes les transitions autorisées implémentées
- Transitions interdites→400
- Audit event créé à chaque transition
- Anciennes routes (mark-paid, archive, unarchive) restent fonctionnelles

**Tests:** Unitaires par transition, transitions interdites→400, audit créé, idempotence mark-paid

---

### DEV-EXPENSES-05 — Backend: acceptation transactionnelle des devis

**Objectif:** Rendre l'acceptation de devis transactionnelle.

**Fichiers:** `src/routes/admin/quotes.ts` (refonte accept), migration quotes v2

**Risques:** Données orphelines si transaction échoue.

**Critères d'acceptation:**
- Acceptation atomique (RPC Supabase)
- Montant final peut différer du devis
- `accepted_at` renseigné
- Pièces jointes du devis liées à la dépense

**Tests:** Accept réussit→devis+depense, échec dépense→devis unchanged, double accept→400

---

### DEV-EXPENSES-06 — Frontend: découpage + nouvelles pages

**Objectif:** Découper la page monolithique en composants et pages.

**Fichiers:** Nouvelles pages `app/[locale]/dashboard/admin/dev-expenses/*/page.tsx`, `components/admin/dev-expenses/*.tsx`, `lib/dev-expenses-types.ts`, `lib/dev-expenses-api.ts`

**Risques:** Régressions UI, perte de fonctionnalités.

**Critères d'acceptation:**
- Ancienne page reste accessible
- Nouvelle UI couvre tous les onglets
- Filtres, recherche, pagination fonctionnent
- Fiche détail affiche toutes les infos

**Tests:** E2E création facture, transition statut, acceptation devis, comparaison visuelle

---

### DEV-EXPENSES-07 — Frontend: vue d'ensemble + remboursements

**Objectif:** Implémenter KPIs et panel de remboursement.

**Fichiers:** `overview/page.tsx`, `OverviewKPIs.tsx`, `ReimbursementPanel.tsx`, `app/api/admin/dev-expenses/stats/route.ts`

**Risques:** Performances des requêtes d'agrégation.

**Critères d'acceptation:**
- 7 KPIs affichés correctement
- Panel remboursement: créer, modifier, confirmer
- Indicateur "prochaine action attendue"

**Tests:** KPIs corrects après création/modification, flux remboursement complet

---

### DEV-EXPENSES-08 — Nettoyage + dépréciation

**Objectif:** Supprimer anciennes routes/colonnes devenues inutiles.

**Fichiers:** Routes backend dépréciées, colonnes DB obsolètes, ancienne page frontend

**Risques:** Perte de données si migration mal exécutée.

**Critères d'acceptation:**
- Anciennes colonnes supprimées après validation complète
- Backup DB avant
- Cron jobs adaptés au nouveau schéma

---

## 15. Analyse de `pull-automated`

### Utilisation

**Route active, utilisée par un cron Render.**
- Appelant: cron `dev-expenses-monthly-pull` (`render.yaml:40-52`)
- Schedule: `0 6 1 * *` (1er du mois, 06:00 UTC)
- Script: `scripts/cron-pull-dev-expenses.js`
- Auth: `x-admin-secret`

### Ce qu'elle importe

- **Anthropic**: `fetchAnthropicCost()` → API usage_costs (`dev-expenses.ts:78-103`)
- **Vercel**: `fetchVercelCost()` → API billing/usage (`dev-expenses.ts:105-120`)

### Idempotence

**Oui.** Pour chaque provider: recherche ligne existante `(creditor_id, billing_month, source='api_pull')`, UPDATE si existe, INSERT sinon. Index unique partiel `dev_expenses_creditor_month_auto_uq` garantit l'unicité.

### Doublons

**Non.** Index unique partiel. Race condition théorique entre `maybeSingle()` et `insert()` mais cron ne tourne qu'une fois.

### Décision

**Conserver dans la refonte.** Route fonctionnelle, idempotente, cron actif. Adapter: `incurred_by='unipay'` ou `'ia_solution'`, statut initial `draft` au lieu de `pending`.

---

## 16. Analyse du module Devis

### Workflow actuel

```
draft → sent → accepted (crée dev_expense) / rejected
```

### Expiration

- **Calculée côté client uniquement** (`page.tsx:1162-1165`): `if status==='sent' && valid_until < today → 'expired'`
- **Non persistée en DB** — le statut reste `sent`
- L'index `idx_quotes_sent_valid_until` existe mais n'est pas utilisé pour auto-expirer

### Acceptation

- Vérifie `status !== 'accepted'` et `!== 'rejected'` (`quotes.ts:286-291`)
- **Non transactionnel**: insert expense + update quote en 2 requêtes séparées
- Si update quote échoue après insert expense: **dépense orpheline** (`quotes.ts:331-333`)
- **Pas de lock concurrentiel**: deux appels simultanés → deux dépenses possibles

### Montant

- Dépense = montant du devis (`quotes.ts:303`), pas de différence possible
- Pas de champ `final_amount`

### Pièces jointes

- `quote_file_url` existe mais **non copié vers la dépense** créée

### Modèle cible

```
Devis (draft) → Autorisation (sent) → Acceptation (accepted)
  → Dépense engagée (dev_expense, draft)
  → Facture finale (invoice_url copié ou uploadé)
  → Paiement → Remboursement
```

**Corrections:**
1. Acceptation transactionnelle (RPC)
2. Persister expiration (cron ou trigger)
3. Permettre montant final différent (`final_amount`)
4. Copier `quote_file_url` vers `dev_expense.invoice_url`
5. Ajouter `accepted_at`, `rejected_at`

---

## 17. Points techniques obligatoires

| Point | État actuel | Recommandation |
|-------|-------------|----------------|
| Compatibilité Next.js | 14.2.4 App Router | OK pour découpage |
| Format `params` routes dynamiques | `{ params: { id: string } }` sync | OK pour Next 14 |
| Duplication du proxy | Chaque route répète 8-15 lignes | Créer `lib/admin-proxy.ts` |
| Stratégie de timeout | Aucun timeout sur fetch proxy | Ajouter AbortController 30s |
| Parsing JSON/non-JSON | `await up.json()` sans try/catch | Wrapper avec fallback |
| Propagation erreurs | `NextResponse.json(data, {status})` | Acceptable |
| Validation Zod | Backend complet, frontend aucune | Ajouter Zod frontend |
| Validation UUID | Backend: UUID_RE sur tous :id | OK |
| Gestion FormData | POST dev-expenses et quotes | OK |
| Limites upload | 10MB, PDF/PNG/JPEG, 3 fichiers | OK |
| Pagination backend | History: paginé. List: pas paginé | Ajouter pagination list |
| Pagination frontend | Archives: filtre client-side | Migrer vers server-side |
| Stratégie de cache | `cache: 'no-store'` | OK pour données financières |
| Gestion devises | Tout en USD | Ajouter champ `currency` |
| Arrondis monétaires | NUMERIC(10,2) DB, Number() JS | Acceptable < $100k, utiliser toFixed(2) |
| Nombres flottants | parseFloat() | Acceptable pour montants < $100k |
| Fuseaux horaires | DATE (sans heure) + TIMESTAMPTZ | OK, comparaison UTC |
| Dates sans heure | billing_month, due_date en DATE | OK |
| Suppression logique | archived boolean + archived_at | OK |
| Archivage | Seulement si paid/reconciled | Conserver, étendre aux nouveaux statuts terminaux |
| Idempotence actions paiement | mark-paid sans idempotence | Ajouter check status avant update |
| Génération rapports | pdfkit + upsert reports | OK, enrichir avec nouveaux champs |
| Accès pièces jointes | Signed URLs 30 jours | Réduire à 7 jours ou à la demande |
| Audit logs | Non implémenté | Créer table `dev_expense_audit_events` |
| Notifications | Cron logs seulement | Ajouter notifications email/webhook |

---

## 18. Questions bloquantes

1. **Entités `incurred_by`**: La liste `benjamin | ia_solution | congo_gaming | unipay | other` est-elle exhaustive? Faut-il une entité configurable plutôt qu'un enum fixe?

2. **`covered_by`**: S'agit-il d'une entité libre (texte) ou d'une référence vers une structure existante (groupe partenaire de Benoît)? Y a-t-il plusieurs groupes possibles?

3. **Multi-devises**: Faut-il supporter des devises autres que USD? Si oui, faut-il un taux de change historique ou juste un champ `currency` informatif?

4. **Notifications**: Le cron `due-date-check` ne fait que logger. Faut-il envoyer des notifications (email, webhook, Slack) lors des transitions de statut ou des échéances?

5. **Rapports publics**: Le site `dev-expenses.netlify.app` est-il toujours d'actualité? Faut-il intégrer la page de rapport dans `unipay-congo` ou conserver un site séparé?

6. **`pull-automated`**: Faut-il conserver uniquement Anthropic + Vercel, ou prévoir d'ajouter d'autres providers (Supabase, Cloudflare, Render) dans la refonte?

7. **Audit trail acteur**: Les actions sont effectuées via un seul `ADMIN_SECRET` partagé. Faut-il différencier les acteurs (Benjamin vs Benoît vs admin système)? Si oui, comment (utilisateurs admin séparés)?

8. **Suppression physique**: Les fichiers uploadés (factures, devis, rapports PDF) doivent-ils être supprimés du storage lors d'une suppression logique, ou conservés indéfiniment?
