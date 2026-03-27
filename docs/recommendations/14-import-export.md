# 14 — Import / Export (CSV, PDF)

**Priorität:** P3
**Bereich:** Global
**Betroffene Dateien:**
- `src/backend/app/api/v1/endpoints/` (neue Import/Export-Endpunkte)
- `src/frontend/src/routes/settings/+page.svelte` (Import/Export-Section)
- `src/frontend/src/lib/components/settings/` (neue Komponenten)
- `messages/en.json`, `messages/de.json`

---

## Problem

1. **Kein Import:** Beim initialen Setup müssen alle historischen Beiträge manuell eingegeben werden. Wer 5 Jahre ETF-Sparplan hat, braucht ~60 Einträge.
2. **Kein Export:** Keine Möglichkeit, einen Überblick als PDF zu drucken oder Daten zu sichern.

## Lösung

### Phase 1: CSV-Import für Contribution History

**Use Case:** User hat eine CSV-Datei vom Broker (Export aus Portfolio Performance, Scalable, Trade Republic, etc.) mit historischen Käufen.

**Format:**
```csv
date,amount,note
2024-01-15,150.00,Sparplan
2024-02-15,150.00,Sparplan
2024-03-15,150.00,Sparplan
2024-04-01,500.00,Einmalanlage
```

**Flow:**
1. User geht auf Edit-Seite einer Pension
2. In der Contribution History Section: "CSV importieren" Button
3. Datei-Upload → Preview der erkannten Einträge
4. User bestätigt → Einträge werden erstellt

**Backend:**
```python
@router.post("/pension/{type}/{id}/contributions/import")
async def import_contributions(
    type: str, id: int,
    file: UploadFile,
    db: Session = Depends(get_db)
):
    # Parse CSV
    # Validate (date format, amounts)
    # Preview: return parsed entries
    # On confirm: bulk create
```

### Phase 2: PDF-Export / Druckansicht

**Use Case:** User will eine Zusammenfassung ausdrucken oder als PDF speichern.

**Implementierung:**
- Eigene Route `/report` mit druckoptimiertem Layout
- `@media print` CSS für sauberen Druck
- Oder: Backend-generiertes PDF (z.B. mit `weasyprint`)

**Inhalt:**
- Haushalt-Übersicht (Members)
- Alle Pensionen mit aktuellem Wert
- Renten-Check-Ergebnis
- Projektions-Zusammenfassung
- Datum des Reports

### Phase 3: Daten-Backup/Restore

**Use Case:** User will alle Daten sichern (z.B. vor Docker-Update).

```python
@router.get("/export/full")
async def export_all_data(db: Session = Depends(get_db)):
    """Exportiert alle Daten als JSON."""
    return {
        "version": "1.0",
        "exported_at": datetime.now().isoformat(),
        "household": [...],
        "pensions": {...},
        "settings": {...},
        "gap_configs": [...]
    }

@router.post("/import/full")
async def import_all_data(data: FullExportSchema, db: Session = Depends(get_db)):
    """Importiert einen vollständigen Export. Überschreibt bestehende Daten."""
```

---

## Akzeptanzkriterien

### Phase 1 (CSV-Import)
- [ ] CSV-Import für Contribution History auf jeder Pension-Edit-Seite
- [ ] Unterstützte Formate: Datum + Betrag (+ optionale Notiz)
- [ ] Preview vor dem Import
- [ ] Fehlerbehandlung bei ungültigen Zeilen
- [ ] Alle Texte in EN und DE

### Phase 2 (PDF-Export)
- [ ] Druckbare Übersichtsseite
- [ ] Sauberes Print-Layout
- [ ] Enthält alle wesentlichen Informationen

### Phase 3 (Backup/Restore)
- [ ] JSON-Export aller Daten
- [ ] JSON-Import mit Überschreibung
- [ ] Versionierung des Export-Formats
