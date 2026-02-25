# Frontend File Map

Diese Datei mappt jede handgepflegte Code-Datei im Svelte-Frontend auf eine kurze Verantwortungsbeschreibung aus `@purpose`.
Ausgeschlossen: generierte Paraglide-Dateien, `node_modules`, `.svelte-kit`.

## Routes
- `src/frontend/src/routes/+layout.svelte` - Definiert die globale App-Shell mit Sidebar, Dokument-Sprache und gerendertem Seiteninhalt.
- `src/frontend/src/routes/+page.svelte` - Rendert die Route 'dashboard' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/compass/+page.svelte` - Rendert die Route 'compass' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/household/+page.svelte` - Rendert die Route 'household' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/household/+page.ts` - Laedt Initialdaten fuer die Route 'household', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/payout-strategy/+page.svelte` - Rendert die Route 'payout-strategy' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/+page.svelte` - Rendert die Route 'pension' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/+page.ts` - Laedt Initialdaten fuer die Route 'pension', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/company/[id]/edit/+page.svelte` - Rendert die Route 'pension/company/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/company/[id]/edit/+page.ts` - Laedt Initialdaten fuer die Route 'pension/company/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/company/new/+page.svelte` - Rendert die Route 'pension/company/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/company/new/+page.ts` - Laedt Initialdaten fuer die Route 'pension/company/new', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/etf/[id]/edit/+page.svelte` - Rendert die Route 'pension/etf/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/etf/[id]/edit/+page.ts` - Laedt Initialdaten fuer die Route 'pension/etf/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/etf/new/+page.svelte` - Rendert die Route 'pension/etf/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/etf/new/+page.ts` - Laedt Initialdaten fuer die Route 'pension/etf/new', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/insurance/[id]/edit/+page.svelte` - Rendert die Route 'pension/insurance/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/insurance/[id]/edit/+page.ts` - Laedt Initialdaten fuer die Route 'pension/insurance/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/insurance/new/+page.svelte` - Rendert die Route 'pension/insurance/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/insurance/new/+page.ts` - Laedt Initialdaten fuer die Route 'pension/insurance/new', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/savings/[id]/edit/+page.svelte` - Rendert die Route 'pension/savings/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/savings/[id]/edit/+page.ts` - Laedt Initialdaten fuer die Route 'pension/savings/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/savings/new/+page.svelte` - Rendert die Route 'pension/savings/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/savings/new/+page.ts` - Laedt Initialdaten fuer die Route 'pension/savings/new', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/state/[id]/edit/+page.svelte` - Rendert die Route 'pension/state/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/state/[id]/edit/+page.ts` - Laedt Initialdaten fuer die Route 'pension/state/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/pension/state/new/+page.svelte` - Rendert die Route 'pension/state/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
- `src/frontend/src/routes/pension/state/new/+page.ts` - Laedt Initialdaten fuer die Route 'pension/state/new', verarbeitet Parameter und liefert fehlertolerantes PageData.
- `src/frontend/src/routes/settings/+page.svelte` - Rendert die Route 'settings' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.

## Components
- `src/frontend/src/lib/components/household/MemberCard.svelte` - Kapselt den UI-Abschnitt 'MemberCard' im Bereich 'household' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/household/MemberForm.svelte` - Kapselt Eingabe- und Validierungslogik fuer Household-Mitgliederdaten in Erstell- und Bearbeitungsfaellen.
- `src/frontend/src/lib/components/household/MemberModal.svelte` - Steuert den Dialog 'MemberModal' im Bereich 'household' inklusive Eingaben und Abschlussaktionen.
- `src/frontend/src/lib/components/layout/Sidebar.svelte` - Rendert die Hauptnavigation mit aktiver Route, Collapse-Zustand und Zugriff auf globale Layout-Aktionen.
- `src/frontend/src/lib/components/layout/ThemeToggle.svelte` - Ermoeglicht den Wechsel zwischen Light, Dark und System-Theme innerhalb der Seitenleiste.
- `src/frontend/src/lib/components/pension/ContributionHistoryTable.svelte` - Rendert die tabellarische Historie von Einzahlungen inklusive Datum, Betrag und Zusatzinformationen.
- `src/frontend/src/lib/components/pension/ContributionPlanCard.svelte` - Kapselt den UI-Abschnitt 'ContributionPlanCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/PensionCard.svelte` - Kapselt den UI-Abschnitt 'PensionCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/PensionStatusActions.svelte` - Bietet Statusaktionen zum Pausieren und Fortsetzen von Pensionen inklusive Datumsauswahl und Dialogsteuerung.
- `src/frontend/src/lib/components/pension/PensionTypeSelectionModal.svelte` - Steuert den Dialog 'PensionTypeSelectionModal' im Bereich 'pension' inklusive Eingaben und Abschlussaktionen.
- `src/frontend/src/lib/components/pension/company/BasicInformationCard.svelte` - Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/company/StatementsCard.svelte` - Kapselt den UI-Abschnitt 'StatementsCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/etf/BasicInformationCard.svelte` - Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/etf/ETFSearchInput.svelte` - Kapselt den Eingabebaustein 'ETFSearchInput' im Bereich 'pension' mit Formatierungs- und Interaktionslogik.
- `src/frontend/src/lib/components/pension/etf/HistoricalPerformanceChart.svelte` - Visualisiert Kennzahlen und Verlaeufe im Baustein 'HistoricalPerformanceChart' fuer den Bereich 'pension'.
- `src/frontend/src/lib/components/pension/etf/OneTimeInvestmentModal.svelte` - Steuert den Dialog 'OneTimeInvestmentModal' im Bereich 'pension' inklusive Eingaben und Abschlussaktionen.
- `src/frontend/src/lib/components/pension/etf/ProjectionChart.svelte` - Visualisiert Kennzahlen und Verlaeufe im Baustein 'ProjectionChart' fuer den Bereich 'pension'.
- `src/frontend/src/lib/components/pension/insurance/BasicInformationCard.svelte` - Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/insurance/StatementsCard.svelte` - Kapselt den UI-Abschnitt 'StatementsCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/savings/BasicInformationCard.svelte` - Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/savings/InterestRatesCard.svelte` - Kapselt den UI-Abschnitt 'InterestRatesCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/savings/StatementsCard.svelte` - Kapselt den UI-Abschnitt 'StatementsCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/state/BasicInformationCard.svelte` - Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/pension/state/ScenarioViewer.svelte` - Visualisiert mehrere Projektionsergebnisse nebeneinander und erlaeutert deren Szenario-Unterschiede.
- `src/frontend/src/lib/components/pension/state/StatementsCard.svelte` - Kapselt den UI-Abschnitt 'StatementsCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/settings/NumberFormatPreview.svelte` - Zeigt eine Live-Vorschau fuer Zahlen-, Datums- und Waehrungsformat entsprechend der Settings-Auswahl.
- `src/frontend/src/lib/components/settings/ProjectionPreview.svelte` - Visualisiert die Auswirkung der konfigurierten Projektraten in einer kompakten Vorschau.
- `src/frontend/src/lib/components/settings/RateInput.svelte` - Kapselt den Eingabebaustein 'RateInput' im Bereich 'settings' mit Formatierungs- und Interaktionslogik.
- `src/frontend/src/lib/components/settings/ScenarioRatesGrid.svelte` - Rendert das Eingaberaster fuer pessimistische, realistische und optimistische Renditeannahmen.
- `src/frontend/src/lib/components/ui/Card.svelte` - Kapselt den UI-Abschnitt 'Card' im Bereich 'ui' mit Darstellung, Eingaben und Aktionen.
- `src/frontend/src/lib/components/ui/ConfirmDeleteDialog.svelte` - Rendert einen wiederverwendbaren Bestaetigungsdialog fuer Loeschaktionen mit konfigurierbaren Texten.
- `src/frontend/src/lib/components/ui/ContentSection.svelte` - Strukturiert Seiteninhalte in wiederverwendbare Haupt- und Aside-Bereiche.
- `src/frontend/src/lib/components/ui/CurrencyInput.svelte` - Kapselt den Eingabebaustein 'CurrencyInput' im Bereich 'ui' mit Formatierungs- und Interaktionslogik.
- `src/frontend/src/lib/components/ui/Explanation.svelte` - Rendert den Hilfs- und Erklaerungsbaustein 'Explanation' fuer kontextbezogene Seitenerlaeuterungen.
- `src/frontend/src/lib/components/ui/ExplanationAlert.svelte` - Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationAlert' fuer kontextbezogene Seitenerlaeuterungen.
- `src/frontend/src/lib/components/ui/ExplanationList.svelte` - Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationList' fuer kontextbezogene Seitenerlaeuterungen.
- `src/frontend/src/lib/components/ui/ExplanationListItem.svelte` - Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationListItem' fuer kontextbezogene Seitenerlaeuterungen.
- `src/frontend/src/lib/components/ui/ExplanationStat.svelte` - Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationStat' fuer kontextbezogene Seitenerlaeuterungen.
- `src/frontend/src/lib/components/ui/ExplanationStats.svelte` - Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationStats' fuer kontextbezogene Seitenerlaeuterungen.
- `src/frontend/src/lib/components/ui/FormattedCurrency.svelte` - Rendert formatierte Werte im Baustein 'FormattedCurrency' auf Basis der aktiven Locale- und Waehrungseinstellungen.
- `src/frontend/src/lib/components/ui/FormattedDate.svelte` - Rendert formatierte Werte im Baustein 'FormattedDate' auf Basis der aktiven Locale- und Waehrungseinstellungen.
- `src/frontend/src/lib/components/ui/FormattedPercent.svelte` - Rendert formatierte Werte im Baustein 'FormattedPercent' auf Basis der aktiven Locale- und Waehrungseinstellungen.
- `src/frontend/src/lib/components/ui/NumberInput.svelte` - Kapselt den Eingabebaustein 'NumberInput' im Bereich 'ui' mit Formatierungs- und Interaktionslogik.
- `src/frontend/src/lib/components/ui/PageHeader.svelte` - Rendert einen einheitlichen Seitenkopf mit Titel und optionaler Beschreibung.
- `src/frontend/src/lib/components/ui/PercentInput.svelte` - Kapselt den Eingabebaustein 'PercentInput' im Bereich 'ui' mit Formatierungs- und Interaktionslogik.
- `src/frontend/src/lib/components/ui/ToastViewport.svelte` - Rendert die aktive Toast-Liste und koppelt deren Darstellung an den globalen Toast-Store.

## API
- `src/frontend/src/lib/api/client.ts` - Kapselt den generischen HTTP-Client fuer API-Aufrufe inklusive Fehlerbehandlung und JSON-Handling.
- `src/frontend/src/lib/api/etf.ts` - Stellt API-Zugriffe fuer ETF-Suche und ETF-Details bereit.
- `src/frontend/src/lib/api/household.ts` - Stellt API-Zugriffe fuer Household-Mitglieder bereit und mappt Formdaten in Backend-kompatible Payloads.
- `src/frontend/src/lib/api/pension.ts` - Stellt API-Zugriffe fuer alle Pension-Typen, Statuswechsel und pensionspezifische Spezialendpunkte bereit.
- `src/frontend/src/lib/api/settings.ts` - Stellt API-Zugriffe fuer Einstellungen bereit und normalisiert Backend-Werte fuer das Frontend.

## Stores
- `src/frontend/src/lib/stores/pension.svelte.ts` - Verwaltet den globalen Pensionslisten-Status inklusive Laden, Loeschen und Statuswechsel.
- `src/frontend/src/lib/stores/settings.svelte.ts` - Verwaltet globale Frontend-Einstellungen inkl. Laden, Persistenz und Locale-Synchronisierung.
- `src/frontend/src/lib/stores/theme.svelte.ts` - Verwaltet Theme-Auswahl inkl. LocalStorage und Synchronisierung mit Systempraeferenz.
- `src/frontend/src/lib/stores/toast.svelte.ts` - Verwaltet Toast-Nachrichten inkl. Queue, TTL-Ablauf und Entfernen einzelner Eintraege.

## Types
- `src/frontend/src/lib/types/etf.ts` - Definiert Typen fuer ETF-Suche und ETF-Metadaten aus den ETF-Endpunkten.
- `src/frontend/src/lib/types/household.ts` - Definiert Household-Domainmodelle sowie Validierungs- und Berechnungshilfen fuer Mitgliederdaten.
- `src/frontend/src/lib/types/pension.ts` - Definiert zentrale Domainmodelle, Enums und Projektionstypen fuer alle Pension-Typen.
- `src/frontend/src/lib/types/settings.ts` - Definiert Einstellungsmodelle, Update-Typen und Enum-Labels fuer Sprache, Format und Waehrung.

## Utils
- `src/frontend/src/lib/utils/date-only.ts` - Bietet Date-only-Helfer fuer ISO-Datumsstrings ohne Zeitzonen-Nebeneffekte.
- `src/frontend/src/lib/utils/format.ts` - Bietet locale-sensitive Formatierungs- und Parse-Helfer fuer Zahlen, Waehrungen, Prozent und Datum.
- `src/frontend/src/lib/utils/projection.ts` - Berechnet projektionale Szenarien ueber Beitragsplaene, Renditen und Zeitraeume.

## App Core
- `src/frontend/src/app.d.ts` - Deklariert projektweite SvelteKit-Typerweiterungen fuer globale App-Kontexte.
- `src/frontend/src/lib/index.ts` - Definiert den Einstiegspunkt fuer zentrale Exporte ueber das Alias '$lib'.

## Tooling Config
- `src/frontend/svelte.config.js` - Konfiguriert SvelteKit-Buildverhalten und den verwendeten Deployment-Adapter.
- `src/frontend/vite.config.ts` - Konfiguriert Vite-Plugins, Paraglide-Generierung und SSR-Einstellungen fuer das Svelte-Frontend.

