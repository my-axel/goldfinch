# Goldfinch — Product Review (27.03.2026)

Umfassendes Product Review der gesamten App. Detaillierte, umsetzbare Pläne für jede Empfehlung liegen unter [docs/recommendations/](recommendations/).

---

## Was bereits richtig gut ist

1. **Datenmodell & Domain-Abdeckung** — Die 5 Pension-Typen (State, Company, Insurance, ETF, Savings) decken die reale Altersvorsorge-Landschaft in Deutschland sehr gut ab. Jeder Typ hat sein eigenes Schema mit den passenden Feldern — kein generisches One-Size-Fits-All, sondern fachlich durchdacht.

2. **3-Szenario-Modell** — Pessimistisch/Realistisch/Optimistisch durch die gesamte App hindurch — von den Projektionen über die Gap-Analyse bis zum Dashboard. Das gibt dem Nutzer ein ehrliches Bild statt einer einzigen "Wunschzahl".

3. **Per-Pension Rate Overrides** — Jede Pension kann eigene Raten haben, die auf die globalen Settings zurückfallen. Feature, das die meisten Konkurrenz-Tools nicht haben.

4. **Lokalisierung** — Vollständig zweisprachig (EN/DE), locale-aware Zahlen-/Währungsformatierung, sauber durchgezogen bis in die kleinsten Komponenten.

5. **ETF-Integration** — Suche nach ISIN/Symbol/Name, automatischer Preisabruf über mehrere Quellen (yFinance, Stooq), historische Performance-Charts — echtes Differenzierungsmerkmal gegenüber Excel-Tabellen.

6. **UI-Konsistenz** — Eigene Komponentenbibliothek (Cards, Inputs, Formatted-Komponenten), einheitliches Farbschema für Szenarien, Dark/Light Mode — alles aus einem Guss.

---

## Empfehlungen — Übersicht

Alle Empfehlungen mit detaillierten Umsetzungsplänen: **[docs/recommendations/README.md](recommendations/README.md)**

### P1 — Hoher Impact
| # | Plan | Thema |
|---|------|-------|
| 01 | [Dashboard Hero](recommendations/01-dashboard-emotional-home.md) | Dashboard als emotionales Zuhause stärken |
| 02 | [Inflation-Toggle](recommendations/02-inflation-toggle.md) | "In heutigen Euros anzeigen" |
| 03 | [Renten-Check](recommendations/03-plan-als-rentencheck.md) | Plan-Seite als Renten-Check repositionieren |
| 04 | [Progressive Disclosure](recommendations/04-progressive-disclosure-pensions.md) | Pension-Formulare vereinfachen |
| 05 | [Haushalt-Analyse](recommendations/05-gemeinsame-haushalt-analyse.md) | Gemeinsame Paar-Ebene für Gap-Analyse |

### P2 — Mittlerer Impact
| # | Plan | Thema |
|---|------|-------|
| 06 | [Statements UX](recommendations/06-statements-ux.md) | Statements verständlicher machen |
| 07 | [Contributions](recommendations/07-contribution-plan-vs-history.md) | Sparplan vs. Historie klarer trennen |
| 08 | [Dashboard→Plan](recommendations/08-dashboard-plan-verknuepfung.md) | Verknüpfung verbessern |
| 09 | [Settings Kontext](recommendations/09-settings-szenario-kontext.md) | Szenario-Raten erklären |
| 10 | [Onboarding](recommendations/10-onboarding-wizard.md) | Geführter Einstieg |
| 11 | [Simulation](recommendations/11-was-waere-wenn.md) | Was-wäre-wenn Modus |

### P3 — Nice-to-have / Langfristig
| # | Plan | Thema |
|---|------|-------|
| 12 | [Steuern](recommendations/12-steuer-beruecksichtigung.md) | Pauschale Steuer-Berücksichtigung |
| 13 | [Notifications](recommendations/13-notifications-reminders.md) | In-App Hinweise & Erinnerungen |
| 14 | [Import/Export](recommendations/14-import-export.md) | CSV-Import, PDF-Export, Backup |
| 15 | [Kinder](recommendations/15-kinder-junior-depot.md) | Junior-Depot Support |
| 16 | [Immobilien](recommendations/16-immobilien-asset.md) | Immobilien als Asset-Typ |
