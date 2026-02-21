# Abschlussdokument Simplification Playbook

## Zweck
Dieses Dokument bleibt bestehen, wenn die Phasen-Dateien `01` bis `04` geloescht werden.
Es ist das dauerhafte Protokoll fuer:
1. umgesetzte Ergebnisse,
2. finale Entscheidungen,
3. verbleibende Risiken und Tech Debt,
4. Nachfolge-Milestones.

## Umsetzungsprotokoll
| Phase | Status | Startdatum | Enddatum | Ergebnis kurz | Commit-Referenz |
|---|---|---|---|---|---|
| 0 Freeze/Guardrails | offen | - | - | - | - |
| 1 MVP-Seiten (Dashboard/Compass/Payout) | offen | - | - | - | - |
| 2 ETF-Flow vereinfachen | offen | - | - | - | - |
| 3 Legacy-Inventur und Cleanup | offen | - | - | - | - |

## Finale Entscheidungen
1. Vereinfachungsmodus: MVP zuerst.
2. Kompatibilitaet: ohne Breaking Changes.
3. Background-Strategie: Minimalbetrieb.
4. Fokus: Svelte-Frontend zuerst, Backend gezielt.
5. Svelte Tech Slim (alt Phase 1): gestrichen — Code bereits gut strukturiert, kein konkreter Schmerz.
6. Backend Tasks Konsistenz (alt Phase 4): gestrichen — Endpoints bereits hochkonsistent ueber alle 5 Typen.

Weitere Entscheidungen (laufend eintragen):
- [offen]

## M2/M3-Backlog (Nicht-MVP-Ideen)
Ideen die bewusst nicht in den MVP-Schnitt kommen:
| Idee | Bereich | Milestone |
|---|---|---|
| [hier eintragen nach Phase 1] | | M2 |

## Verbleibende Tech Debt
| Bereich | Beschreibung | Prioritaet | Geplanter Milestone |
|---|---|---|---|
| Tests | Ausbau automatisierter End-to-End-Abdeckung | hoch | M2 |
| Frontend | Restliche Duplikate ausserhalb MVP-Kern | niedrig | M2 |
| Doku | Historische Plaene konsolidieren/archivieren | niedrig | M3 |

## Offene Risiken
1. Testumgebung Backend kann lokal unvollstaendig sein (fehlende Python-Pakete).
2. Legacy-Entfernung kann unterschwellige Import- oder Script-Abhaengigkeiten offenlegen.

## Nachfolge-Milestones
M1:
1. Playbook-Phasen 0 bis 3 abgeschlossen.

M2:
1. Post-MVP Qualitaetsstabilisierung.
2. Testabdeckung und Performance-Baselines.

M3:
1. Optionale Feature-Erweiterungen aus ausgelagertem Backlog.

## Geloescht am (Phasen-Dateien)
| Datei | Geloescht am (YYYY-MM-DD) | Commit-Referenz | Hinweis |
|---|---|---|---|
| `01_phase0_freeze_guardrails.md` | - | - | - |
| `02_phase1_mvp_pages.md` | - | - | - |
| `03_phase2_etf_simplification.md` | - | - | - |
| `04_phase3_legacy_cleanup.md` | - | - | - |

## Abschluss-Checklist
1. [ ] Alle Phasen umgesetzt oder bewusst verworfen mit Begruendung.
2. [ ] Alle Akzeptanzkriterien je Phase bewertet.
3. [ ] Testresultate je Phase vermerkt.
4. [ ] Loeschprotokoll gepflegt.
5. [ ] Nachfolge-Milestones priorisiert.
