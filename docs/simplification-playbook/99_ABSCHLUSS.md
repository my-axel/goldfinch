# Abschlussdokument Simplification Playbook

## Zweck
Dieses Dokument bleibt bestehen, wenn die Phasen-Dateien `01` bis `06` geloescht werden.
Es ist das dauerhafte Protokoll fuer:
1. umgesetzte Ergebnisse,
2. finale Entscheidungen,
3. verbleibende Risiken und Tech Debt,
4. Nachfolge-Milestones.

## Umsetzungsprotokoll
| Phase | Status | Startdatum | Enddatum | Ergebnis kurz | Commit-Referenz |
|---|---|---|---|---|---|
| 0 Freeze/Guardrails | offen | - | - | - | - |
| 1 Svelte Tech Slim | offen | - | - | - | - |
| 2 ETF Simplification | offen | - | - | - | - |
| 3 MVP Pages | offen | - | - | - | - |
| 4 Backend Tasks Consistency | offen | - | - | - | - |
| 5 Cutover/Cleanup | offen | - | - | - | - |

## Finale Entscheidungen
Bereits gesetzte Defaults:
1. Vereinfachungsmodus: MVP zuerst.
2. Kompatibilitaet: ohne Breaking Changes.
3. Background-Strategie: Minimalbetrieb.
4. Fokus: Svelte-Frontend zuerst, Backend/Fachlichkeit gezielt entschlackt.
5. Sprache der Dossier-Dateien: Deutsch.

Weitere Entscheidungen (laufend eintragen):
1. [offen]
2. [offen]

## API-Endzustand (Soll)
`stabil`:
1. bestehende Kern-CRUD-Endpunkte je Pension-Typ.
2. harmonisierte Status- und Statement-Pfade nach Abschluss.

`harmonisiert`:
1. additive Vereinheitlichungen aus Phase 1 bis 4.

`deprecated-intern`:
1. interne Altpfade, die nicht mehr aktiv genutzt werden, aber noch kompatibel bestehen.

## Verbleibende Tech Debt
| Bereich | Beschreibung | Prioritaet | Geplanter Milestone |
|---|---|---|---|
| Frontend | Restliche Duplikate ausserhalb MVP-Kern | mittel | M2 |
| Backend | tiefere Service-Refactors ausserhalb Minimalbetrieb | mittel | M2 |
| Tests | Ausbau automatisierter End-to-End-Abdeckung | hoch | M2 |
| Doku | Historische Plaene konsolidieren/archivieren | niedrig | M3 |

## Offene Risiken
1. Testumgebung Backend kann lokal unvollstaendig sein (fehlende Python-Pakete).
2. Legacy-Entfernung kann unterschwellige Import- oder Script-Abhaengigkeiten offenlegen.
3. Additive API-Harmonisierung muss sauber gegen Altclients getestet werden.

## Nachfolge-Milestones
M1:
1. Playbook-Phasen 0 bis 5 abgeschlossen.

M2:
1. Post-MVP Qualitaetsstabilisierung.
2. Testabdeckung und Performance-Baselines.

M3:
1. Optionale Feature-Erweiterungen aus ausgelagertem Backlog.

## Geloescht am (Phasen-Dateien)
Trage die Loeschung jeder Phase nach Abschluss ein.

| Datei | Geloescht am (YYYY-MM-DD) | Commit-Referenz | Hinweis |
|---|---|---|---|
| `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/01_phase0_freeze_guardrails.md` | - | - | - |
| `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/02_phase1_svelte_tech_slim.md` | - | - | - |
| `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/03_phase2_etf_simplification.md` | - | - | - |
| `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/04_phase3_mvp_pages.md` | - | - | - |
| `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/05_phase4_backend_tasks_consistency.md` | - | - | - |
| `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/06_phase5_cutover_cleanup.md` | - | - | - |

## Abschluss-Checklist
1. [ ] Alle Phasen umgesetzt oder bewusst verworfen mit Begruendung.
2. [ ] Alle Akzeptanzkriterien je Phase bewertet.
3. [ ] Testresultate je Phase vermerkt.
4. [ ] Loeschprotokoll gepflegt.
5. [ ] Nachfolge-Milestones priorisiert.
