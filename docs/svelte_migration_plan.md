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

## Migrations-Mapping (React → Svelte 5)

| React | Svelte 5 | Kommentar |
|-------|----------|-----------|
| `useState(0)` | `let x = $state(0)` | Viel einfacher |
| `useMemo(() => x * 2, [x])` | `let y = $derived(x * 2)` | Kein Dependency-Array |
| `useEffect(() => {...}, [x])` | `$effect(() => {...})` | Auto-Tracking |
| `useContext(MyCtx)` | `$settings` (Store) | Store importieren |
| `useQuery({...})` | `createQuery({...})` | TanStack Svelte Query |
| `react-hook-form` | `bind:value` + custom validation | Kein Form-Framework nötig |
| `export let prop` (Svelte 4) | `let { prop } = $props()` | Svelte 5 Runes |
| `<div onClick={}>` | `<div onclick={}>` | Lowercase |
| `className` | `class` | HTML-Standard |
| `{children}` | `{@render children()}` | Snippets statt Slots |

---

## Architektur-Entscheidungen

### Kein shadcn-svelte

Bewusste Entscheidung gegen shadcn-svelte. Stattdessen: Custom Components + Tailwind CSS + native HTML-Elemente.

**Begründung:**
- Eigenes Design-Token-System (CSS-Variablen in `app.css`) deckt Farben, Radien, Theming ab
- Native `<dialog>` funktioniert hervorragend für Modals
- Weniger Dependencies = weniger Wartung, kleineres Bundle
- Svelte 5 + native HTML + Tailwind ergibt saubere, verständliche Komponenten

### Kein Formsnap/Superforms

Formulare nutzen `bind:value` + custom validation direkt in den Komponenten. Household-Migration hat gezeigt, dass das für unsere Formularkomplexität ausreicht.

### UI-Komponenten

Geteilte Basis-Komponenten in `$lib/components/ui/`:
- **Card.svelte** — Wiederverwendbare Card mit optionalem `title` und `description`
- **PageHeader.svelte** — Einheitlicher Seiten-Header (`title` + `description`)

Weitere werden bei Bedarf ergänzt (nicht vorausgebaut).

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

---

## Parallele Entwicklung (SvelteKit neben Next.js)

### Setup

```
goldfinch-dev/
├── app/                     # Next.js Routes (bleibt bis Cutover)
├── src/
│   ├── backend/             # Python Backend (unverändert)
│   ├── frontend/            # React/Next.js Frontend (bleibt bis Cutover)
│   └── svelte-frontend/     # SvelteKit-Projekt (eigenes package.json)
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

### Cutover wenn alles fertig

- SvelteKit auf Port 3000 umstellen
- Next.js-Code + Root package.json entfernen
- SvelteKit-Projekt ins Root verschieben (oder `src/svelte-frontend/` → `src/frontend/`)

---

## Migrations-Roadmap

### Phase 1: Setup & Grundlagen — ERLEDIGT

- [x] SvelteKit-Projekt initialisieren
- [x] TypeScript + ESLint + Prettier konfigurieren
- [x] Tailwind CSS v4 integrieren
- [x] ~~shadcn-svelte~~ → Entscheidung: Custom Components statt shadcn
- [x] API-Client aufsetzen (native fetch in `$lib/api/client.ts`)
- [x] CORS mit Backend getestet
- [x] Layout: Sidebar + Navigation mit allen Routes
- [x] ThemeToggle (Light/Dark Mode)
- [x] Routing: Dashboard `/`, Household `/household`, Compass `/compass`, Payout Strategy `/payout-strategy`
- [x] UI-Komponenten: Card.svelte, PageHeader.svelte
- [x] Household-Types kopiert und angepasst (`$lib/types/household.ts`)

### Phase 2: Household — ERLEDIGT

- [x] Household CRUD komplett migriert (List, Create, Edit, Delete)
- [x] MemberCard, MemberForm, MemberModal, DeleteConfirm
- [x] API-Integration mit Backend (`$lib/api/household.ts`)
- [x] Toast-Notifications (custom, inline)
- [x] Loading-States und Error-Handling

### Phase 3: Statische Platzhalter-Seiten — ERLEDIGT

- [x] Dashboard (Platzhalter mit Feature-Beschreibungen)
- [x] Compass (Platzhalter mit Feature-Beschreibungen)
- [x] Payout Strategy (Platzhalter mit Feature-Beschreibungen)

### Phase 4: Pension Plans — OFFEN

**Geteilte Bausteine zuerst:**
- [ ] Types kopieren (alle Pension-Types, Enums, Interfaces)
- [ ] API-Services für Pensionen aufsetzen
- [ ] ContributionPlanCard
- [ ] PensionStatusActions
- [ ] FormattedCurrency/Date/Percent
- [ ] CurrencyInput/PercentInput/NumberInput
- [ ] ConfirmDeleteDialog (generisch, Household hat bereits DeleteConfirm)
- [ ] ContributionHistoryTable
- [ ] Pension-Store-Basis (`createPensionStore`)

**Dann typ-spezifisch:**
- [ ] ETF Pension (BasicInformation, ContributionPlan, History, ETF-Suche, Kurs-Anzeige)
- [ ] Company Pension (BasicInformation, Statements, Retirement-Projections)
- [ ] Insurance Pension (BasicInformation, Statements, Projections, Benefits)
- [ ] State Pension (BasicInformation, Statements, Szenario-Viewer)
- [ ] Savings Pension (BasicInformation, InterestRates, Statements)

### Phase 5: Dashboard & Settings — OFFEN

- [ ] Settings-Page (Locale, Currency)
- [ ] Dashboard mit echten Daten (Aggregationen, Übersicht)
- [ ] Projektions-Charts (LayerChart evaluieren)

### Phase 6: Testing & Polish — OFFEN

- [ ] Vitest Setup
- [ ] Component-Tests für kritische Komponenten
- [ ] Performance-Optimierung
- [ ] Accessibility (a11y)

### Phase 7: Cutover — OFFEN

- [ ] Side-by-Side Vergleich mit React-App
- [ ] SvelteKit als Standard
- [ ] React-Code entfernen

---

## Projektstruktur (aktueller Stand)

```
src/svelte-frontend/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # Fetch-basierter API-Client
│   │   │   └── household.ts           # Household API-Service
│   │   ├── components/
│   │   │   ├── ui/                    # Geteilte UI-Primitives
│   │   │   │   ├── Card.svelte
│   │   │   │   └── PageHeader.svelte
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.svelte
│   │   │   │   └── ThemeToggle.svelte
│   │   │   └── household/
│   │   │       ├── MemberCard.svelte
│   │   │       ├── MemberForm.svelte
│   │   │       ├── MemberModal.svelte
│   │   │       └── DeleteConfirm.svelte
│   │   ├── stores/
│   │   │   └── theme.svelte.ts
│   │   └── types/
│   │       └── household.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte               # Dashboard
│   │   ├── household/+page.svelte
│   │   ├── compass/+page.svelte
│   │   ├── payout-strategy/+page.svelte
│   │   └── health/+page.svelte        # Health-Check Endpoint
│   └── app.css                        # Design Tokens + Tailwind
├── static/
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Tech Stack (aktuell)

| Bereich | Library | Version |
|---------|---------|---------|
| Framework | SvelteKit | 2.x |
| UI | Svelte 5 | 5.x (Runes) |
| Styling | Tailwind CSS | v4 |
| UI-Komponenten | Custom (Card, PageHeader, etc.) | — |
| HTTP | Native fetch | — |
| Theming | CSS Custom Properties + class-basiert | — |
| Testing | Vitest + Svelte Testing Library | (noch nicht eingerichtet) |

### Noch zu evaluieren (wenn benötigt)

| Bereich | Kandidat | Wann |
|---------|----------|------|
| Data Fetching | TanStack Svelte Query | Bei Pension-Migration |
| Charts | LayerChart | Bei Dashboard mit echten Daten |
| Toasts | svelte-sonner (oder custom beibehalten) | Bei Pension-Migration |

---

## Was 1:1 übernommen wird

Diese Dateien können **ohne oder mit minimalen Änderungen** kopiert werden:

1. **Types** (`src/frontend/types/`) — alle TypeScript-Interfaces und Enums
2. **Validierungen** (`src/frontend/lib/validations/`) — Zod-Schemas sind framework-agnostic
3. **Utilities** (`src/frontend/lib/utils/`) — dateUtils, transforms, contribution-plan
4. **Tailwind-Konfiguration** — Farben, Themes, Custom-Utilities (bereits als CSS-Variablen in app.css)

API-Services werden **nicht** 1:1 kopiert — stattdessen neue Services mit native fetch statt Axios.

---

## Acceptance Criteria

- Alle Features aus der React-App funktionieren
- Geteilte Bausteine (ContributionPlanCard, StatusActions, Formatting, Inputs) werden von allen Typen genutzt
- Typ-spezifische Komponenten bleiben eigenständig (kein erzwungener Generic)
- Code ist wartbarer (weniger Hooks, einfachere Stores, Svelte-Reaktivität)
- Performance mindestens gleich gut (besser erwartet)
- TypeScript strict mode, keine Errors
