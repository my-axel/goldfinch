# Goldfinch: React → Svelte Migration Plan

## Context

Goldfinch nutzt aktuell Next.js 16 + React 19, aber React ist zu komplex für KI-gestützte Solo-Entwicklung:
- 5 React Contexts für UI-State
- 20 Custom Hooks
- useState (30+), useEffect (32+), useMemo (12+) überall
- React Query + Context + Hook Form = mentale Überlastung

**Ziel:** Migration zu Svelte für maximale Einfachheit

**Entscheidung:** Svelte (statt Vue.js) - Priorität auf Einfachheit, bereit UI-Komponenten selbst zu bauen

---

## Warum Svelte?

### Svelte ist am einfachsten

✅ **Reaktivität ist magisch:**
```svelte
<!-- SVELTE: Am einfachsten -->
<script>
  let count = 0
  $: doubled = count * 2  // Reactive statement (statt useMemo)
</script>

<p>{count}</p>
<p>Doubled: {doubled}</p>
<button on:click={() => count++}>Increment</button>
```

✅ **Stores statt Context API:**
```typescript
// Svelte Store (viel einfacher als React Context)
import { writable } from 'svelte/store'

export const settings = writable({ locale: 'de-DE', currency: 'EUR' })

// Komponente
import { settings } from '$lib/stores/settings'
$: locale = $settings.locale  // Reaktiv subscribed!
```

✅ **Formulare mit Two-Way Binding:**
```svelte
<script>
  let name = ''
  $: isValid = name.length > 0  // Reactive validation
</script>

<input bind:value={name} />  <!-- Two-way binding! -->
<p>Valid: {isValid}</p>
```

✅ **Kleinste Bundle-Size, beste Performance**
✅ **Keine Hooks, kein useEffect-Chaos**

---

## Svelte-Migrations-Roadmap (14-15 Wochen)

### Phase 1: Setup & Grundlagen (Woche 1-2)

**Woche 1: Projekt-Setup**
- ✅ SvelteKit-Projekt initialisieren (`npm create svelte@latest goldfinch-svelte`)
- ✅ Vite + TypeScript + ESLint konfigurieren
- ✅ Tailwind CSS integrieren
- ✅ Zod für Validierung (funktioniert mit Svelte)
- ✅ Axios-Service-Layer übernehmen (bleibt identisch)
- ✅ API-Client testen (CORS, Transformers)

**Woche 2: Erste Komponenten**
- ✅ Layout-Komponenten (Header, Sidebar, Footer)
- ✅ Erste Shadcn-Svelte UI-Komponenten (Button, Card, Input)
- ✅ Routing mit SvelteKit (1:1 von Next.js App-Router)
- ✅ Erste simple Page (z.B. Settings)

**Ergebnis:** Lauffähiges Svelte-Projekt mit Basis-Setup

---

### Phase 2: State Management & API-Integration (Woche 3-4)

**Woche 3: Svelte Stores**
- ✅ React Context → Svelte Writable Stores Migration
- ✅ Settings-Store (statt SettingsContext)
- ✅ UI-State-Stores (HouseholdUI, ETFPensionUI, etc.)
- ✅ TanStack Query für Svelte (oder Svelte Query alternative)

**Woche 4: Service Integration**
- ✅ API-Service-Layer Integration testen
- ✅ Erste Fetch-Logik in Stores
- ✅ Error-Handling mit Toasts (svelte-sonner)
- ✅ Loading-States

**Ergebnis:** Funktionierendes State Management + API-Integration

---

### Phase 3: UI-Komponenten-Bibliothek (Woche 5-7)

**Woche 5-6: Shadcn-Svelte Komponenten**
- ✅ Dialog/Modal
- ✅ Form-Komponenten (Input, Select, Checkbox, Radio)
- ✅ Table
- ✅ Dropdown/Select
- ✅ DatePicker (svelte-calendar oder custom)
- ✅ Toast/Notifications (svelte-sonner)
- ✅ Tabs
- ✅ Accordion
- ✅ Badge, Alert
- **Quelle:** https://www.shadcn-svelte.com (Svelte-Port von Shadcn)

**Woche 7: Chart-Integration**
- ✅ Recharts → Layerchart (Svelte-native) oder Chart.js
- ✅ CombinedProjectionChart migrieren (518 Zeilen)
- ✅ Andere Chart-Komponenten

**Ergebnis:** Vollständige UI-Komponenten-Bibliothek

---

### Phase 4: Feature-Komponenten Migration (Woche 8-11)

**Woche 8: Household Management**
- ✅ HouseholdMembersList
- ✅ HouseholdMemberForm (mit Svelte bind:value)
- ✅ HouseholdMemberCard
- **Aufwand:** React Hooks → Svelte Stores + Reactive Statements

**Woche 9: Pension-Type-Komponenten (ETF)**
- ✅ ETFPensionList
- ✅ ETFPensionCard
- ✅ ETFPensionForm (komplexeste Form)
- ✅ ETFPensionDetails
- ✅ ETFContributionPlanner

**Woche 10: Weitere Pension-Types**
- ✅ Company Pension (Form + List + Card)
- ✅ Insurance Pension (Form + List + Card)
- ✅ State Pension (Form + List + Card)
- ✅ Savings Pension (Form + List + Card)

**Woche 11: Dashboard & Projektionen**
- ✅ Dashboard-Komponenten
- ✅ Payout-Strategy-Komponenten
- ✅ Compass-Komponenten
- ✅ Settings-Page

**Ergebnis:** Alle Feature-Komponenten migriert

---

### Phase 5: Testing & Polish (Woche 12-13)

**Woche 12: Testing**
- ✅ Vitest Setup
- ✅ Svelte Testing Library
- ✅ Component-Tests (kritische Komponenten)
- ✅ Integration-Tests (API-Calls)

**Woche 13: Polish & Optimierung**
- ✅ Performance-Optimierung
- ✅ Bundle-Size überprüfen
- ✅ Accessibility-Checks
- ✅ Edge-Cases fixen
- ✅ Deployment-Setup

**Ergebnis:** Produktionsreifes Svelte-Frontend

---

### Phase 6: Cutover (Woche 14-15)

**Woche 14: Parallel-Testing**
- ✅ Side-by-Side Testing (Svelte vs React)
- ✅ Regression-Tests
- ✅ User-Acceptance-Testing

**Woche 15: Go-Live**
- ✅ Svelte-App als Standard
- ✅ React-App archivieren
- ✅ Dokumentation aktualisieren

**Ergebnis:** Svelte-App live, React-App abgeschaltet

---

## Neue Svelte-Projektstruktur

```
goldfinch-svelte/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn-Svelte Komponenten
│   │   │   ├── household/        # Feature-Komponenten
│   │   │   ├── pension/
│   │   │   │   ├── etf/
│   │   │   │   ├── company/
│   │   │   │   ├── insurance/
│   │   │   │   ├── state/
│   │   │   │   └── savings/
│   │   │   ├── charts/
│   │   │   └── layout/
│   │   ├── stores/               # Svelte Stores (statt Context)
│   │   │   ├── settings.ts
│   │   │   ├── household.ts
│   │   │   └── pensions.ts
│   │   ├── services/             # API-Services (1:1 übernommen)
│   │   │   ├── api-client.ts
│   │   │   ├── pensionService.ts
│   │   │   └── householdService.ts
│   │   ├── utils/                # Utilities (1:1 übernommen)
│   │   │   ├── dateUtils.ts
│   │   │   ├── projection-utils.ts
│   │   │   └── validations/
│   │   └── types/                # TypeScript Types (1:1 übernommen)
│   └── routes/                   # SvelteKit Routes
│       ├── +layout.svelte
│       ├── +page.svelte
│       ├── household/
│       ├── pension/
│       ├── compass/
│       └── settings/
├── static/                       # Static Assets
├── package.json
├── vite.config.ts
├── svelte.config.js
└── tsconfig.json
```

---

## Migrations-Mapping (React → Svelte)

| React | Svelte | Kommentar |
|-------|--------|-----------|
| `useState` | `let variable` | Viel einfacher! |
| `useEffect` | `$:` reactive statement | Automatisch |
| `useMemo` | `$:` reactive statement | Automatisch |
| `useContext` | Svelte Store (`writable`) | Store importieren |
| `useQuery` | TanStack Svelte Query oder Custom Store | Ähnlich |
| `react-hook-form` | `bind:value` + Formsnap | Viel einfacher |
| `<div onClick={}>` | `<div on:click={}>` | Ähnlich |
| `{value}` | `{value}` | Identisch |
| `className` | `class` | Einfacher |

---

## Code-Beispiele

### Beispiel 1: ETF Pension Card

**React (komplex):**
```jsx
import { useState, useMemo } from 'react'
import { useETFPensionContext } from '@/context/ETFUIContext'
import { Button } from '@/components/ui/button'

export function ETFPensionCard({ pension }) {
  const { setEditingPension, deletePension } = useETFPensionContext()

  const currentValue = useMemo(() => pension.current_value || 0, [pension])
  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: pension.currency || 'EUR'
    }).format(currentValue)
  }, [currentValue, pension.currency])

  return (
    <div className="card">
      <h3>{pension.name}</h3>
      <p className="value">{formattedValue}</p>
      <div className="actions">
        <Button onClick={() => setEditingPension(pension)}>Edit</Button>
        <Button variant="destructive" onClick={() => deletePension(pension.id)}>
          Delete
        </Button>
      </div>
    </div>
  )
}
```

**Svelte (einfacher):**
```svelte
<!-- src/lib/components/pension/etf/ETFPensionCard.svelte -->
<script lang="ts">
  import { etfPensionStore } from '$lib/stores/pensions'
  import { Button } from '$lib/components/ui/button'
  import type { PensionETF } from '$lib/types/pension'

  export let pension: PensionETF

  // Reactive computations (automatisch, kein useMemo)
  $: currentValue = pension.current_value || 0
  $: formattedValue = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: pension.currency || 'EUR'
  }).format(currentValue)
</script>

<div class="card">
  <h3>{pension.name}</h3>
  <p class="value">{formattedValue}</p>
  <div class="actions">
    <Button on:click={() => etfPensionStore.setEditingPension(pension)}>
      Edit
    </Button>
    <Button variant="destructive" on:click={() => etfPensionStore.deletePension(pension.id)}>
      Delete
    </Button>
  </div>
</div>

<style>
  .card {
    padding: 1rem;
    border-radius: 0.5rem;
    background: white;
  }
  .value {
    font-size: 1.5rem;
    font-weight: bold;
  }
</style>
```

### Beispiel 2: Store (statt React Context)

**React Context (komplex):**
```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const ETFPensionContext = createContext()

export function ETFPensionProvider({ children }) {
  const [editingPension, setEditingPension] = useState(null)
  const queryClient = useQueryClient()

  const { data: pensions = [], isLoading } = useQuery({
    queryKey: ['etf-pensions'],
    queryFn: () => pensionService.getETFPensions()
  })

  const deleteMutation = useMutation({
    mutationFn: pensionService.deletePension,
    onSuccess: () => {
      queryClient.invalidateQueries(['etf-pensions'])
    }
  })

  return (
    <ETFPensionContext.Provider value={{
      pensions,
      isLoading,
      editingPension,
      setEditingPension,
      deletePension: deleteMutation.mutate
    }}>
      {children}
    </ETFPensionContext.Provider>
  )
}

export const useETFPensionContext = () => useContext(ETFPensionContext)
```

**Svelte Store (einfacher):**
```typescript
// src/lib/stores/pensions.ts
import { writable, derived } from 'svelte/store'
import type { PensionETF } from '$lib/types/pension'
import { pensionService } from '$lib/services/pensionService'

function createETFPensionStore() {
  const { subscribe, set, update } = writable<PensionETF[]>([])
  const loading = writable(false)
  const editingPension = writable<PensionETF | null>(null)

  return {
    subscribe,
    loading,
    editingPension,

    async fetchPensions(memberId: number) {
      loading.set(true)
      try {
        const data = await pensionService.getETFPensions(memberId)
        set(data)
      } finally {
        loading.set(false)
      }
    },

    setEditingPension(pension: PensionETF | null) {
      editingPension.set(pension)
    },

    async deletePension(id: number) {
      await pensionService.deletePension(id)
      update(pensions => pensions.filter(p => p.id !== id))
    }
  }
}

export const etfPensionStore = createETFPensionStore()

// Derived store (computed values)
export const totalValue = derived(
  etfPensionStore,
  $pensions => $pensions.reduce((sum, p) => sum + (p.current_value || 0), 0)
)
```

**Verwendung in Komponente:**
```svelte
<script>
  import { etfPensionStore, totalValue } from '$lib/stores/pensions'
  import { onMount } from 'svelte'

  onMount(() => {
    etfPensionStore.fetchPensions(1)
  })
</script>

<!-- Automatisch reaktiv! -->
{#if $etfPensionStore.loading}
  <p>Loading...</p>
{:else}
  <p>Total: {$totalValue}</p>
  {#each $etfPensionStore as pension}
    <PensionCard {pension} />
  {/each}
{/if}
```

---

## Was bleibt identisch (1:1 übernehmen)

Diese Files können **ohne Änderungen** übernommen werden:

1. ✅ **[src/frontend/services/](../../../src/frontend/services/)** - Alle API-Service-Files
   - `api-client.ts` - Axios-Client
   - `pensionService.ts`
   - `householdService.ts`
   - `etfService.ts`
   - etc.

2. ✅ **[src/frontend/types/](../../../src/frontend/types/)** - Alle TypeScript-Types
   - `pension.ts`
   - `household.ts`
   - `etf.ts`
   - `enums.ts`
   - etc.

3. ✅ **[src/frontend/lib/utils/](../../../src/frontend/lib/utils/)** - Utilities
   - `dateUtils.ts`
   - `projection-utils.ts`
   - `contribution-plan.ts`
   - `validations/` (Zod-Schemas)

4. ✅ **[src/backend/](../../../src/backend/)** - Komplettes Backend
   - Keine Änderung nötig
   - API bleibt identisch

5. ✅ **Tailwind CSS Config** - Kann übernommen werden

---

## Verifikation

### Phase 2 (Woche 4) - State Management
1. ✅ `npm run dev` startet SvelteKit Dev-Server
2. ✅ Settings-Store funktioniert (Locale, Currency ändern)
3. ✅ API-Client kommuniziert mit Backend (GET /api/v1/settings)
4. ✅ CORS korrekt konfiguriert
5. ✅ Error-Toasts erscheinen bei Fehlern

### Phase 3 (Woche 7) - UI-Komponenten
1. ✅ Alle Shadcn-Svelte Komponenten funktionieren (Button, Dialog, Form)
2. ✅ DatePicker funktioniert
3. ✅ Charts rendern korrekt (CombinedProjectionChart)
4. ✅ Responsive Design funktioniert (Mobile, Tablet, Desktop)

### Phase 4 (Woche 11) - Feature-Komponenten
1. ✅ Household-Management: Create, Edit, Delete funktioniert
2. ✅ ETF-Pension: Vollständiger CRUD-Zyklus
3. ✅ Alle 5 Pension-Types funktionieren
4. ✅ Statement-Management funktioniert
5. ✅ Dashboard zeigt korrekte Aggregationen
6. ✅ Payout-Strategy berechnet korrekt
7. ✅ Compass-Analyse funktioniert

### Phase 5 (Woche 13) - Testing & Polish
1. ✅ Vitest-Tests laufen (`npm test`)
2. ✅ Component-Tests für kritische Komponenten (min. 80% Coverage)
3. ✅ Integration-Tests für API-Calls
4. ✅ Bundle-Size < 500KB (gzipped)
5. ✅ Lighthouse Score > 90 (Performance, Accessibility)
6. ✅ Keine TypeScript-Errors (`npm run check`)

### Phase 6 (Woche 15) - Go-Live
1. ✅ Build läuft (`npm run build`)
2. ✅ Production-Preview startet (`npm run preview`)
3. ✅ Alle Features funktionieren in Production
4. ✅ Performance-Metriken besser als React-Version
5. ✅ Keine Regression-Bugs

---

## Acceptance Criteria

- ✅ Alle Features aus React-App funktionieren
- ✅ Keine kritischen Bugs
- ✅ Performance mindestens gleich gut (besser erwartet)
- ✅ Bundle-Size kleiner als React-Version
- ✅ Developer Experience einfacher (weniger Konzepte)
- ✅ Code ist wartbarer (weniger Hooks, einfachere Stores)
- ✅ Lighthouse Score > 90
- ✅ TypeScript Coverage 100%

---

## Ressourcen

**Dokumentation:**
- https://svelte.dev - Offizielle Svelte Docs
- https://kit.svelte.dev - SvelteKit Docs
- https://www.shadcn-svelte.com - Shadcn-Svelte UI-Komponenten

**Libraries:**
- https://tanstack.com/query/latest/docs/svelte/overview - TanStack Query für Svelte
- https://layerchart.com - Svelte-native Charting
- https://svelte-sonner.vercel.app - Toast Notifications
- https://github.com/probablykasper/svelte-time - Date Formatting

**Migration Guides:**
- https://svelte.dev/blog/svelte-for-new-developers
- https://learn.svelte.dev/tutorial/welcome-to-svelte

---

## Nächste Schritte

1. ✅ RabbitMQ → Redis Migration abschließen (separater Plan)
2. ✅ SvelteKit-Projekt initialisieren (Woche 1)
3. ✅ Erste Komponenten migrieren (Woche 2)
4. ✅ Iterativ Feature für Feature migrieren

**Wichtig:** Dieser Plan kann **nach** der Redis-Migration gestartet werden.
