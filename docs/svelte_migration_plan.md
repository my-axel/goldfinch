# Goldfinch: React → SvelteKit Migration Plan

## Context

Goldfinch nutzt aktuell Next.js 16 + React 19, aber React ist zu komplex für KI-gestützte Solo-Entwicklung:
- 5 React Contexts für UI-State (fast identisch, 95% Duplikation)
- 20+ Custom Hooks
- useState (30+), useEffect (32+), useMemo (12+) überall
- React Query + Context + Hook Form = mentale Überlastung
- 30-40% des Frontend-Codes ist Duplikation über 5 Pension-Typen

**Ziel:** Migration zu SvelteKit + Svelte 5 für maximale Einfachheit.

**Strategie:** Parallele Entwicklung — SvelteKit läuft neben Next.js, Feature für Feature migrieren, React erst entfernen wenn Svelte komplett ist.

---

## Warum Svelte 5?

### Runes machen Reaktivität explizit und einfach

```svelte
<script lang="ts">
  // State (statt useState)
  let count = $state(0)

  // Derived (statt useMemo)
  let doubled = $derived(count * 2)

  // Effect (statt useEffect)
  $effect(() => {
    console.log('Count changed:', count)
  })
</script>

<p>{count}</p>
<p>Doubled: {doubled}</p>
<button onclick={() => count++}>Increment</button>
```

### Stores statt Context API

```typescript
// Svelte Store — viel einfacher als React Context
import { writable } from 'svelte/store'

export const settings = writable({ locale: 'de-DE', currency: 'EUR' })
```

```svelte
<script lang="ts">
  import { settings } from '$lib/stores/settings'
  // $settings ist automatisch reaktiv subscribed
</script>

<p>Locale: {$settings.locale}</p>
```

### Formulare mit Two-Way Binding

```svelte
<script lang="ts">
  let name = $state('')
  let isValid = $derived(name.length > 0)
</script>

<input bind:value={name} />
<p>Valid: {isValid}</p>
```

### Weitere Vorteile
- Kleinste Bundle-Size, beste Performance
- Keine Hooks, kein useEffect-Chaos
- Scoped CSS eingebaut
- Kein Virtual DOM Overhead

---

## Migrations-Mapping (React → Svelte 5)

| React | Svelte 5 | Kommentar |
|-------|----------|-----------|
| `useState(0)` | `let x = $state(0)` | Viel einfacher |
| `useMemo(() => x * 2, [x])` | `let y = $derived(x * 2)` | Kein Dependency-Array |
| `useEffect(() => {...}, [x])` | `$effect(() => {...})` | Auto-Tracking |
| `useContext(MyCtx)` | `$settings` (Store) | Store importieren |
| `useQuery({...})` | `createQuery({...})` | TanStack Svelte Query |
| `react-hook-form` | Formsnap + Superforms | Oder `bind:value` |
| `export let prop` (Svelte 4) | `let { prop } = $props()` | Svelte 5 Runes |
| `<div onClick={}>` | `<div onclick={}>` | Lowercase |
| `className` | `class` | HTML-Standard |
| `{children}` | `{@render children()}` | Snippets statt Slots |

---

## Architektur-Prinzip: Geteilte Bausteine, typ-spezifische Komponenten

Die 5 Pension-Typen (ETF, Company, Insurance, State, Savings) sind **grundlegend verschieden** — verschiedene Felder, verschiedene Statements, verschiedene Business-Logik. Generische Pension-Komponenten erzwingen wäre über-abstrakt. Stattdessen: geteilte Bausteine für das, was wirklich gleich ist.

### Geteilte Bausteine (1x bauen, überall nutzen)

| Baustein | Beschreibung | Geteilt von |
|----------|-------------|-------------|
| **ContributionPlanCard** | Beitragsplan-Schritte (Amount, Frequency, Dates) — zu 95% identisch | ETF, Company, Insurance, Savings |
| **PensionStatusActions** | Pause/Resume-Buttons + Dialoge | Alle 5 Typen |
| **FormattedCurrency/Date/Percent** | Locale-aware Formatierung | Alle 5 Typen |
| **CurrencyInput/PercentInput/NumberInput** | Custom Inputs mit Locale-Support | Alle 5 Typen |
| **ConfirmDeleteDialog** | Lösch-Bestätigung | Alle 5 Typen |
| **ContributionHistoryTable** | Tabellarische Beitragshistorie | ETF, Company, Insurance |
| **Pension-Store-Basis** | `createPensionStore(type)` für Loading, Selection, CRUD | Alle 5 Typen |

### Was typ-spezifisch bleibt (und warum)

| Komponente | Warum nicht geteilt |
|------------|-------------------|
| **BasicInformationCard** | ETF hat ETF-Suche + Units, Insurance hat Provider + Vertragsnummer + Zinsen, Company hat Arbeitgeber, Savings hat Zinsszenarien, State ist minimal — 5 komplett verschiedene Feldsets |
| **StatementsCard** | ETF hat keine Statements, Insurance hat Projektionen + Benefits, Company hat Retirement-Projections, State/Savings haben einfache Wert-Statements |
| **Typ-spezifische Views** | ETF: ScenarioViewer, Kurs-Anzeige. Savings: InterestRatesCard. State: Szenario-Vergleich |

### Store-Beispiel: Gemeinsame Basis + typ-spezifische Erweiterung

```typescript
// src/lib/stores/pension.ts
import { writable } from 'svelte/store'

// Gemeinsame Basis: Loading, Selection, einfaches CRUD
function createPensionStore<T>(fetchFn: () => Promise<T[]>) {
  const items = writable<T[]>([])
  const loading = writable(false)
  const selectedId = writable<number | null>(null)

  return {
    subscribe: items.subscribe,
    loading,
    selectedId,

    async fetch() {
      loading.set(true)
      try {
        items.set(await fetchFn())
      } finally {
        loading.set(false)
      }
    }
  }
}

// Typ-spezifische Stores — jeder mit eigener Fetch-Logik
export const etfPensions = createPensionStore(
  () => etfPensionService.list()
)

export const companyPensions = createPensionStore(
  () => companyPensionService.list()
)
// ... etc.
```

---

## Parallele Entwicklung (SvelteKit neben Next.js)

Das SvelteKit-Projekt wird **parallel** zum bestehenden Next.js-Frontend aufgebaut. So kannst du Feature für Feature migrieren, ohne das funktionierende React-Frontend zu verlieren.

### Setup

```
goldfinch-dev/
├── app/                     # Next.js Routes (bleibt bis Cutover)
├── src/
│   ├── backend/             # Python Backend (unverändert)
│   ├── frontend/            # React/Next.js Frontend (bleibt bis Cutover)
│   └── svelte-frontend/     # NEU: SvelteKit-Projekt (eigenes package.json)
│       ├── src/
│       ├── package.json
│       ├── svelte.config.js
│       └── vite.config.ts
├── package.json             # Root: Next.js (bleibt bis Cutover)
└── docker-compose.yml
```

### Ports & CORS

| Service | Port | Status |
|---------|------|--------|
| Next.js (React) | 3000 | Besteht weiter |
| SvelteKit | 5173 | Neu (Vite default) |
| Backend API | 8000 | Unverändert |
| PostgreSQL | 5432 | Unverändert |
| Redis | 6379 | Unverändert |

CORS in `.env` erweitern:
```
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Entwicklungs-Workflow

1. **Beide Apps gleichzeitig starten:**
   - Terminal 1: `npm run dev` (Next.js auf :3000)
   - Terminal 2: `cd src/svelte-frontend && npm run dev` (SvelteKit auf :5173)
   - Beide sprechen mit demselben Backend

2. **Feature für Feature migrieren:**
   - Neues Feature in SvelteKit bauen
   - Im Browser auf :5173 testen
   - Mit React-Version auf :3000 vergleichen

3. **Cutover wenn alles fertig:**
   - SvelteKit auf Port 3000 umstellen
   - Next.js-Code + Root package.json entfernen
   - SvelteKit-Projekt ins Root verschieben (oder `src/svelte-frontend/` → `src/frontend/`)

### Was geteilt wird während der Parallelphase

Types, Utils und Zod-Validierungen werden initial in das SvelteKit-Projekt **kopiert**. API-Services werden angepasst (SvelteKit hat eigene Fetch-Patterns). Nach dem Cutover gibt es nur noch eine Kopie.

---

## Svelte-Migrations-Roadmap (12-14 Wochen)

### Phase 1: Setup & Grundlagen (Woche 1-2)

**Woche 1: Projekt-Setup**
- SvelteKit-Projekt initialisieren (`npx sv create`)
- TypeScript + ESLint + Prettier konfigurieren
- Tailwind CSS v4 integrieren
- shadcn-svelte installieren und konfigurieren
- Bestehende Files kopieren: Types, Services, Utils, Validierungen (Zod)
- API-Client anpassen (Axios → ggf. native fetch mit SvelteKit)
- CORS mit Backend testen

**Woche 2: Basis-Komponenten**
- Layout: Header, Sidebar, Navigation
- Erste shadcn-svelte UI-Komponenten (Button, Card, Input, Dialog)
- SvelteKit Routing aufsetzen
- Settings-Page als erste Feature-Page

**Ergebnis:** Lauffähiges SvelteKit-Projekt mit Basis-UI

---

### Phase 2: State Management & API-Integration (Woche 3-4)

**Woche 3: Stores & Queries**
- Settings-Store (writable)
- Generischen Pension-Store aufbauen
- TanStack Svelte Query einrichten
- Household-Store

**Woche 4: Integration**
- API-Service-Layer Integration testen
- Error-Handling mit svelte-sonner (Toasts)
- Loading-States
- Formsnap + Superforms + Zod evaluieren

**Ergebnis:** State Management + API-Integration funktioniert

---

### Phase 3: UI-Komponenten & Charts (Woche 5-6)

**Woche 5: shadcn-svelte Komponenten**
- Form-Komponenten (Input, Select, Checkbox, DatePicker)
- Table, Tabs, Accordion
- Dialog/Modal, Badge, Alert
- CurrencyInput, PercentInput (custom, mit `bind:value`)

**Woche 6: Charts**
- LayerChart (Svelte-native) für Projektionen
- CombinedProjectionChart migrieren
- Responsive Chart-Layouts

**Ergebnis:** Vollständige UI-Komponenten-Bibliothek

---

### Phase 4: Feature-Migration (Woche 7-10)

**Woche 7: Household**
- HouseholdMembersList, HouseholdMemberForm, HouseholdMemberCard

**Woche 8: Geteilte Bausteine + erster Pension-Typ (ETF)**
- Geteilte Bausteine: ContributionPlanCard, PensionStatusActions, Formatting, Custom Inputs
- ETF Pension komplett: BasicInformation, ContributionPlan, History, ETF-Suche, Kurs-Anzeige
- Pension-Store-Basis aufbauen

**Woche 9: Weitere Pension-Typen**
- Company Pension (BasicInformation, Statements, Retirement-Projections)
- Insurance Pension (BasicInformation, Statements, Projections, Benefits)
- State Pension (BasicInformation, Statements, Szenario-Viewer)
- Savings Pension (BasicInformation, InterestRates, Statements)

**Woche 10: Dashboard & Settings**
- Dashboard-Komponenten (Aggregationen, Übersicht)
- Settings-Page (Locale, Currency)
- Projektions-Charts pro Pension

**Ergebnis:** Alle Features migriert

---

### Phase 5: Testing & Polish (Woche 11-12)

**Woche 11: Testing**
- Vitest Setup
- Svelte Testing Library
- Component-Tests für kritische Komponenten
- Integration-Tests (API-Calls)

**Woche 12: Polish**
- Performance-Optimierung
- Bundle-Size prüfen
- Accessibility (a11y)
- Edge-Cases und Bugfixes

**Ergebnis:** Produktionsreifes Frontend

---

### Phase 6: Cutover (Woche 13-14)

**Woche 13: Parallel-Testing**
- Side-by-Side Vergleich mit React-App
- Regressions-Tests
- Alle CRUD-Flows durchspielen

**Woche 14: Go-Live**
- SvelteKit-App als Standard
- React-Code archivieren/entfernen
- Dokumentation aktualisieren

**Ergebnis:** Svelte-App live

---

## Projektstruktur (während Parallelphase)

```
goldfinch-dev/
├── app/                           # Next.js Routes (bleibt bis Cutover)
├── src/
│   ├── backend/                   # Python Backend (unverändert)
│   ├── frontend/                  # React/Next.js (bleibt bis Cutover)
│   └── svelte-frontend/           # SvelteKit-Projekt
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   ├── ui/                # shadcn-svelte Primitives
│       │   │   │   ├── layout/            # Header, Sidebar, Footer
│       │   │   │   ├── shared/            # Geteilte Bausteine:
│       │   │   │   │   ├── ContributionPlanCard.svelte
│       │   │   │   │   ├── PensionStatusActions.svelte
│       │   │   │   │   ├── ContributionHistoryTable.svelte
│       │   │   │   │   ├── ConfirmDeleteDialog.svelte
│       │   │   │   │   ├── FormattedCurrency.svelte
│       │   │   │   │   ├── CurrencyInput.svelte
│       │   │   │   │   └── ...
│       │   │   │   ├── household/         # Household-Komponenten
│       │   │   │   ├── pension/
│       │   │   │   │   ├── etf/           # ETF: komplett eigene Card, Form, List
│       │   │   │   │   ├── company/       # Company: komplett eigene Card, Form, List
│       │   │   │   │   ├── insurance/     # Insurance: komplett eigene Card, Form, List
│       │   │   │   │   ├── state/         # State: komplett eigene Card, Form, List
│       │   │   │   │   └── savings/       # Savings: komplett eigene Card, Form, List
│       │   │   │   └── charts/
│       │   │   ├── stores/
│       │   │   │   ├── settings.ts
│       │   │   │   ├── household.ts
│       │   │   │   └── pension.ts         # Store-Factory + typ-spezifische Stores
│       │   │   ├── services/              # Kopiert + angepasst
│       │   │   ├── utils/                 # Kopiert
│       │   │   ├── types/                 # Kopiert
│       │   │   └── validations/           # Zod-Schemas, kopiert
│       │   ├── routes/                    # SvelteKit Routing
│       │   │   ├── +layout.svelte
│       │   │   ├── +page.svelte
│       │   │   ├── household/
│       │   │   ├── pension/
│       │   │   │   ├── +page.svelte
│       │   │   │   ├── [type]/new/
│       │   │   │   └── [type]/[id]/edit/
│       │   │   └── settings/
│       │   └── app.html
│       ├── static/
│       ├── package.json
│       ├── svelte.config.js
│       ├── vite.config.ts
│       └── tsconfig.json
├── package.json                   # Root: Next.js (bis Cutover)
└── docker-compose.yml
```

---

## Was 1:1 übernommen wird

Diese Dateien können **ohne oder mit minimalen Änderungen** kopiert werden:

1. **Types** (`src/frontend/types/`) — alle TypeScript-Interfaces und Enums
2. **Validierungen** (`src/frontend/lib/validations/`) — Zod-Schemas sind framework-agnostic
3. **Utilities** (`src/frontend/lib/utils/`) — dateUtils, transforms, contribution-plan
4. **API-Services** (`src/frontend/services/`) — Axios-Client und Service-Module
5. **Tailwind-Konfiguration** — Farben, Themes, Custom-Utilities

---

## Tech Stack

| Bereich | Library | Version |
|---------|---------|---------|
| Framework | SvelteKit | 2.x |
| UI | Svelte 5 | 5.x (Runes) |
| Styling | Tailwind CSS | v4 |
| UI-Komponenten | shadcn-svelte | latest (Svelte 5) |
| Data Fetching | TanStack Svelte Query | v5/v6 |
| Forms | Formsnap + Superforms | v2 (Svelte 5) |
| Validation | Zod | 3.x |
| Charts | LayerChart | latest |
| Toasts | svelte-sonner | latest |
| HTTP | Axios (bestehend) | 1.x |
| Testing | Vitest + Svelte Testing Library | latest |

---

## Verifikation

### Nach Phase 2 (Woche 4)
- `npm run dev` startet SvelteKit Dev-Server
- Settings-Store funktioniert (Locale, Currency ändern)
- API-Client kommuniziert mit Backend (GET /api/v1/settings)
- Error-Toasts erscheinen bei Fehlern

### Nach Phase 4 (Woche 10)
- Household CRUD funktioniert
- Alle 5 Pension-Types: Erstellen, Bearbeiten, Löschen
- Statement-Management funktioniert
- Geteilte Bausteine (ContributionPlanCard, StatusActions, Inputs) funktionieren in allen Typen

### Nach Phase 5 (Woche 12)
- Vitest-Tests laufen (`npm test`)
- Keine TypeScript-Errors (`npm run check`)
- Bundle-Size < 500KB (gzipped)

### Nach Phase 6 (Woche 14)
- Build läuft (`npm run build`)
- Alle Features funktionieren
- Performance besser als React-Version

---

## Acceptance Criteria

- Alle Features aus der React-App funktionieren
- Geteilte Bausteine (ContributionPlanCard, StatusActions, Formatting, Inputs) werden von allen Typen genutzt
- Typ-spezifische Komponenten bleiben eigenständig (kein erzwungener Generic)
- Code ist wartbarer (weniger Hooks, einfachere Stores, Svelte-Reaktivität)
- Performance mindestens gleich gut (besser erwartet)
- TypeScript strict mode, keine Errors
- Lighthouse Score > 90

---

## Ressourcen

**Dokumentation:**
- https://svelte.dev/docs — Svelte 5 Docs (Runes)
- https://svelte.dev/docs/kit — SvelteKit Docs
- https://www.shadcn-svelte.com — UI-Komponenten
- https://www.formsnap.dev — Form-Handling

**Libraries:**
- https://tanstack.com/query/latest/docs/svelte/overview — TanStack Query
- https://www.layerchart.com — Charts
- https://svelte-sonner.vercel.app — Toast Notifications
- https://superforms.rocks — Form-Validierung mit Zod

**Tutorials:**
- https://learn.svelte.dev — Interaktives Svelte-Tutorial
- https://svelte.dev/docs/svelte/v5-migration-guide — Svelte 5 Migration Guide
