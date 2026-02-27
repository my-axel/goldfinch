# Modulare Datenquellen — Implementierungsplan

> Erstellt: 2026-02-27
> Status: Entwurf — zur Überprüfung vor Umsetzung

## 1. Ziel & Motivation

Goldfinch nutzt aktuell ausschließlich **yFinance** als Datenquelle für ETF-Kurse und Metadaten. yFinance basiert auf einer inoffiziellen Yahoo Finance API, die unzuverlässig ist (Rate Limits, gelegentliche IP-Sperren, Breaking Changes ohne Vorankündigung).

**Ziele:**
- Mehrere Datenquellen parallel betreiben (Redundanz, bessere Abdeckung)
- yFinance + Stooq als Standard aktiv
- Quellen modular ergänzbar (mit oder ohne API-Key)
- ETF-Suche durchsucht alle aktiven Quellen und zeigt Ergebnisse mit Quell-Label
- Tägliche Kurse und historische Tagespreise als hartes Kriterium

**Entschiedene Eckpunkte (Nutzer-Input):**
- Preise pro Quelle separat speichern (parallele Speicherung, `source`-Attribut)
- Suchergebnisse getrennt mit Quell-Label anzeigen
- API-Keys über die App-Einstellungen-UI konfigurieren (in der DB gespeichert)
- Quell-Metadaten (adjusted/unadjusted, Quelle) bei jedem Preis festhalten

---

## 2. Verfügbare Datenquellen

### 2.1 Quellen ohne API-Key (Tier 1 — Standard aktiv)

#### yFinance
| Eigenschaft | Details |
|---|---|
| Library | `pip install yfinance` |
| Ticker-Format | Yahoo Finance Standard: `VWRL.L`, `EXS1.DE`, `AAPL` |
| Tägliche OHLCV-Daten | ✅ Ja |
| Historische Tiefe | 20+ Jahre (bis ~1993) |
| Adjusted Prices | ⚠️ Close-Preis (nicht vollständig dividend-adjusted) |
| ETF-Metadaten | ✅ TER, ISIN, Fondsgröße, Auflagedatum, Asset-Klasse |
| Suche | ✅ `yf.Search(query)` |
| Zuverlässigkeit | ⚠️ Inoffizielle API, gelegentliche Rate Limits |
| Status | Bereits implementiert |

#### Stooq (via pandas-datareader)
| Eigenschaft | Details |
|---|---|
| Library | `pip install pandas-datareader` |
| Ticker-Format | `VWRL.UK` (LSE), `EXS1.DE` (XETRA), `CW8.FR` (Paris), `AAPL.US` |
| Tägliche OHLCV-Daten | ✅ Ja |
| Historische Tiefe | 20+ Jahre (teilweise bis 1990er) |
| Adjusted Prices | ❌ Nicht bereinigt |
| ETF-Metadaten | ❌ Nur Kursdaten |
| Suche | ❌ Keine Search-API — Symbol muss bekannt sein |
| Zuverlässigkeit | ✅ Generell stabil, aber manchmal tickers offline |
| Status | Neu zu implementieren |

**Stooq Ticker-Mapping (Yahoo → Stooq):**
```
Yahoo .L   → Stooq .UK  (London Stock Exchange)
Yahoo .DE  → Stooq .DE  (Frankfurt/XETRA — gleich!)
Yahoo .PA  → Stooq .FR  (Euronext Paris)
Yahoo .AS  → Stooq .NL  (Amsterdam)
Yahoo .MI  → Stooq (nicht unterstützt)
Yahoo      → Stooq .US  (US-Märkte ohne Suffix)
Yahoo .F   → Stooq .DE  (Frankfurt, oft gleiche Ticker)
Yahoo .SW  → Stooq .CH  (Schweiz, zu prüfen)
Yahoo .BE  → Stooq .BE  (Belgien)
Yahoo .JP  → Stooq .JP  (Japan)
```

### 2.2 Quellen mit API-Key (Tier 2 — für spätere Erweiterung)

| Quelle | Library | Free Tier | Besonderheit |
|---|---|---|---|
| **Tiingo** | `pandas-datareader` | Unbegrenzt historisch | Adjusted Prices, solide Doku |
| **Alpha Vantage** | `alpha_vantage` | 25 req/Tag (kostenlos) | Technische Indikatoren |
| **Finnhub** | `finnhub-python` | 60 req/min (kostenlos) | Echtzeitkurse, Fundamentaldaten |
| **EODHD** | `eodhd` | Begrenzt kostenlos | Beste globale Abdeckung |
| **Financial Modeling Prep** | REST API | Begrenzt kostenlos | Fundamentalanalyse |

> **Hinweis zu Adjusted Prices:** Weder yFinance noch Stooq liefern korrekt dividend-adjusted Preise für ausschüttende ETFs. Dies ist ein bekanntes Problem und wird durch das `source`-Metadatum dokumentiert. Eine zukünftige Quelle (z.B. Tiingo) könnte echte adjusted prices liefern.

---

## 3. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    ETF Service                          │
│            (orchestriert Quellen-Zugriffe)              │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   DataSourceRegistry │
              │  (aktive Quellen,    │
              │   Priorität, Config) │
              └──┬────────┬─────────┘
                 │        │
    ┌────────────▼─┐  ┌───▼──────────────┐  ┌─────────────┐
    │  yFinance    │  │     Stooq         │  │  (Tiingo,   │
    │  DataSource  │  │   DataSource      │  │  EODHD, …)  │
    └──────────────┘  └───────────────────┘  └─────────────┘

DataSource-Interface:
  - source_id: str
  - name: str
  - requires_api_key: bool
  - supports_search: bool
  - supports_metadata: bool
  - supports_adjusted_prices: bool
  - search(query) → list[SearchResult]
  - fetch_info(symbol) → ETFInfo | None
  - fetch_prices(symbol, start, end) → list[PriceData]
  - validate_symbol(symbol) → bool
```

**Schlüsselprinzipien:**
- Jede Quelle ist ein eigenständiges Modul mit einheitlichem Interface
- Der `DataSourceRegistry` verwaltet aktive Quellen und liefert konfigurierte Instanzen
- Preise werden mit `source`-Attribut gespeichert — gleicher ETF, gleicher Tag, verschiedene Quellen können parallel existieren
- Symbol-Mapping zwischen Quellen in eigener Tabelle (`etf_source_symbols`)

---

## 4. Datenbankschema-Änderungen

### 4.1 Neue Tabelle: `data_source_configs`

```sql
CREATE TABLE data_source_configs (
    source_id     VARCHAR PRIMARY KEY,     -- "yfinance", "stooq", "tiingo"
    name          VARCHAR NOT NULL,        -- "Yahoo Finance (yFinance)", "Stooq"
    enabled       BOOLEAN DEFAULT TRUE,
    api_key       VARCHAR,                 -- NULL wenn kein Key nötig
    priority      INTEGER DEFAULT 100,     -- Niedrigere Zahl = höhere Priorität
    extra_config  JSONB,                   -- z.B. {"max_retries": 3}
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP
);

-- Initiale Daten (werden beim Start befüllt):
-- ('yfinance', 'Yahoo Finance (yFinance)', TRUE, NULL, 10, NULL, ...)
-- ('stooq',    'Stooq',                    TRUE, NULL, 20, NULL, ...)
```

### 4.2 Neue Tabelle: `etf_source_symbols`

Mappt ETF → quell-spezifische Ticker-Symbole. Wichtig weil Stooq andere
Konventionen verwendet als Yahoo Finance.

```sql
CREATE TABLE etf_source_symbols (
    id               SERIAL PRIMARY KEY,
    etf_id           VARCHAR REFERENCES etfs(id) ON DELETE CASCADE,
    source_id        VARCHAR REFERENCES data_source_configs(source_id),
    symbol           VARCHAR NOT NULL,      -- z.B. "VWRL.UK" für Stooq
    verified         BOOLEAN DEFAULT FALSE, -- Wurde erfolgreich abgerufen?
    last_verified_at TIMESTAMP,
    created_at       TIMESTAMP,
    UNIQUE(etf_id, source_id)
);
```

### 4.3 Änderungen an `etf_prices`

```sql
-- Neue Spalte: Quelle des Preises
ALTER TABLE etf_prices ADD COLUMN source VARCHAR DEFAULT 'yfinance';

-- Unique Constraint ändern: (etf_id, date) → (etf_id, date, source)
-- Damit können Kurse mehrerer Quellen für denselben Tag gespeichert werden
ALTER TABLE etf_prices DROP CONSTRAINT uix_etf_price_date;
ALTER TABLE etf_prices ADD CONSTRAINT uix_etf_price_date_source
    UNIQUE (etf_id, date, source);

-- Optional: is_adjusted Flag
ALTER TABLE etf_prices ADD COLUMN is_adjusted BOOLEAN DEFAULT FALSE;
```

### 4.4 Auswirkungen auf bestehende Daten

Bei der Migration werden alle bestehenden `etf_prices`-Einträge mit `source = 'yfinance'` markiert. Keine Datenverlust, der Constraint-Wechsel ist rückwärtskompatibel.

---

## 5. Backend-Implementierung

### 5.1 Neue Verzeichnisstruktur

```
app/services/
  data_sources/
    __init__.py          # Exportiert: get_registry()
    base.py              # Abstract Base Class + Interfaces (Pydantic-Models)
    registry.py          # DataSourceRegistry (Singleton)
    yfinance_source.py   # Migrated von services/yfinance.py
    stooq_source.py      # Neu: Stooq via pandas-datareader
  etf_service.py         # Angepasst: nutzt DataSourceRegistry
  exchange_rate.py       # Unverändert
  ...
app/models/
  data_source.py         # DataSourceConfig + ETFSourceSymbol
app/schemas/
  data_source.py         # Pydantic Request/Response-Schemas
app/crud/
  data_source.py         # CRUD für DataSourceConfig
app/api/v1/endpoints/
  data_sources.py        # Neue API-Endpoints
```

### 5.2 base.py — DataSource Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional

@dataclass
class SearchResult:
    symbol: str           # Quell-spezifisches Symbol
    name: str
    currency: Optional[str]
    source_id: str        # z.B. "yfinance"
    source_name: str      # z.B. "Yahoo Finance (yFinance)"
    isin: Optional[str] = None
    exchange: Optional[str] = None

@dataclass
class PriceData:
    date: date
    price: float          # Close (in Originalwährung)
    currency: str
    source: str
    is_adjusted: bool = False
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[float] = None
    dividends: Optional[float] = None
    stock_splits: Optional[float] = None

@dataclass
class ETFInfo:
    symbol: str
    name: str
    currency: str
    source: str
    isin: Optional[str] = None
    # ... weitere Felder, alle Optional

class DataSourceBase(ABC):
    source_id: str            # Eindeutiger Bezeichner
    name: str                 # Anzeigename
    requires_api_key: bool = False
    supports_search: bool = False
    supports_metadata: bool = False   # Liefert TER, Fondsgröße etc.
    supports_adjusted_prices: bool = False

    @abstractmethod
    def search(self, query: str) -> list[SearchResult]:
        """Ticker-Suche. Darf leere Liste zurückgeben wenn nicht unterstützt."""
        ...

    @abstractmethod
    def fetch_info(self, symbol: str) -> Optional[ETFInfo]:
        """ETF-Metadaten abrufen. Darf None zurückgeben wenn nicht unterstützt."""
        ...

    @abstractmethod
    def fetch_prices(
        self, symbol: str, start: date, end: date
    ) -> list[PriceData]:
        """Historische Tagespreise. Muss OHLCV liefern wenn verfügbar."""
        ...

    def validate_symbol(self, symbol: str) -> bool:
        """Prüft ob ein Symbol bei dieser Quelle existiert."""
        try:
            prices = self.fetch_prices(symbol, date.today(), date.today())
            return len(prices) >= 0  # Keine Exception = valide
        except Exception:
            return False
```

### 5.3 registry.py — DataSourceRegistry

```python
class DataSourceRegistry:
    def __init__(self):
        self._sources: dict[str, DataSourceBase] = {}
        self._register_builtins()

    def _register_builtins(self):
        """Alle built-in Quellen registrieren."""
        self.register(YFinanceDataSource())
        self.register(StooqDataSource())

    def register(self, source: DataSourceBase):
        self._sources[source.source_id] = source

    def get_active_sources(self, db) -> list[DataSourceBase]:
        """Gibt alle enabled Quellen zurück, sortiert nach Priorität."""
        configs = crud_data_source.get_all_enabled(db)
        return [
            self._sources[c.source_id]
            for c in sorted(configs, key=lambda c: c.priority)
            if c.source_id in self._sources
        ]

    def get_source(self, source_id: str) -> DataSourceBase:
        return self._sources[source_id]

    def configure_source(self, source_id: str, api_key: str):
        """API-Key an Quelle übergeben (nach Settings-Update)."""
        if source_id in self._sources:
            self._sources[source_id].configure(api_key=api_key)

# Singleton
_registry: DataSourceRegistry | None = None

def get_registry() -> DataSourceRegistry:
    global _registry
    if _registry is None:
        _registry = DataSourceRegistry()
    return _registry
```

### 5.4 stooq_source.py — Stooq Adapter

**Besonderheit:** Stooq hat keine Search-API. Der Adapter implementiert eine
Heuristik, die aus einem Yahoo-Finance-Symbol ein Stooq-Symbol ableitet.

```python
YAHOO_TO_STOOQ_SUFFIX = {
    ".L":  ".UK",   # London Stock Exchange
    ".PA": ".FR",   # Euronext Paris
    ".AS": ".NL",   # Amsterdam
    ".BE": ".BE",   # Brussels
    ".DE": ".DE",   # Frankfurt/XETRA (gleich)
    ".F":  ".DE",   # Frankfurt (alternative Yahoo-Notation)
    ".SW": ".CH",   # Schweiz (zu prüfen)
    ".JP": ".JP",   # Japan
}

class StooqDataSource(DataSourceBase):
    source_id = "stooq"
    name = "Stooq"
    supports_search = False       # Keine Search-API
    supports_metadata = False     # Nur Kursdaten
    supports_adjusted_prices = False

    def yahoo_to_stooq_symbol(self, yahoo_symbol: str) -> str:
        """Konvertiert Yahoo Finance Ticker in Stooq-Format."""
        for suffix, stooq_suffix in YAHOO_TO_STOOQ_SUFFIX.items():
            if yahoo_symbol.endswith(suffix):
                base = yahoo_symbol[:-len(suffix)]
                return f"{base}{stooq_suffix}"
        # US-Stocks ohne Suffix
        if "." not in yahoo_symbol:
            return f"{yahoo_symbol}.US"
        return yahoo_symbol  # Unbekanntes Suffix — unverändert übergeben

    def fetch_prices(self, symbol: str, start: date, end: date) -> list[PriceData]:
        import pandas_datareader.data as web
        df = web.DataReader(symbol, "stooq", start.isoformat(), end.isoformat())
        if df.empty:
            return []
        # Stooq gibt Spalten: Open, High, Low, Close, Volume
        result = []
        for idx, row in df.iterrows():
            result.append(PriceData(
                date=idx.date(),
                price=float(row["Close"]),
                currency="?",    # Stooq liefert keine Währung — aus ETF-Metadaten holen
                source=self.source_id,
                is_adjusted=False,
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                volume=float(row["Volume"]) if row["Volume"] else None,
            ))
        return result
```

**Wichtig:** Stooq liefert keine Währungsinformation. Das ETF-Modell speichert
die Währung — der Adapter liest sie vom ETF-Datensatz wenn nötig.

### 5.5 Anpassungen etf_service.py

Die bestehenden Funktionen werden auf das neue Interface umgestellt:

```python
# Vorher:
from app.services.yfinance import get_etf_data

# Nachher:
from app.services.data_sources import get_registry

def update_latest_prices(db, etf_id: str):
    registry = get_registry()
    active_sources = registry.get_active_sources(db)

    for source in active_sources:
        # Symbol für diese Quelle bestimmen
        symbol = etf_crud.get_source_symbol(db, etf_id, source.source_id)
        if not symbol:
            # Auto-Mapping versuchen (z.B. Yahoo→Stooq Konvertierung)
            symbol = _auto_detect_symbol(db, etf_id, source)
        if not symbol:
            continue  # Quelle überspringen wenn kein Symbol gefunden

        prices = source.fetch_prices(symbol, start_date, end_date)
        process_price_chunk(db, etf_id, prices, source=source.source_id)
```

### 5.6 Neue API-Endpoints

```
GET    /api/v1/data-sources          # Alle Quellen (mit Status)
PUT    /api/v1/data-sources/{id}     # Aktivieren/Deaktivieren, API-Key setzen
GET    /api/v1/data-sources/{id}/test # Verbindungstest für eine Quelle

# ETF-spezifische Source-Symbole
GET    /api/v1/etf/{etf_id}/sources              # Symbole pro Quelle
PUT    /api/v1/etf/{etf_id}/sources/{source_id}  # Symbol manuell korrigieren
```

**Erweiterung am bestehenden Search-Endpoint:**

```
GET /api/v1/etf/search?query=VWRL
→ [
    { "symbol": "VWRL.L", "name": "Vanguard FTSE...", "source": "yfinance", "source_name": "Yahoo Finance" },
    { "symbol": "VWRL.UK", "name": "Vanguard FTSE...", "source": "stooq",   "source_name": "Stooq" }
  ]
```

Quellen ohne Search-Support (Stooq) versuchen eine **Symbol-Validierung**:
Falls yFinance das Ergebnis `VWRL.L` liefert, prüft der Service im Hintergrund
ob `VWRL.UK` bei Stooq existiert und fügt es ggf. zum Ergebnis hinzu.

---

## 6. Frontend-Implementierung

### 6.1 Settings: Datenquellen-Sektion

Neue Sektion in der bestehenden Settings-Seite (zwischen den Projektionsraten-
Einstellungen und dem Endes der Seite):

```
┌─────────────────────────────────────────────────────────┐
│ Datenquellen                                             │
├─────────────────────────────────────────────────────────┤
│ [✓] Yahoo Finance (yFinance)  Priorität: 1  Kein Key nötig  [Testen] │
│ [✓] Stooq                    Priorität: 2  Kein Key nötig  [Testen] │
│ [ ] Tiingo                   Priorität: 3  API-Key: [________]  [Testen] │
│ [ ] Alpha Vantage            Priorität: 4  API-Key: [________]  [Testen] │
│                                                          │
│ ⚠ Quellen ohne Search-Support (Stooq) werden automatisch│
│   als Fallback für bekannte ETFs genutzt.                │
└─────────────────────────────────────────────────────────┘
```

**Neue Komponente:** `src/lib/components/settings/DataSourceSettings.svelte`

### 6.2 ETF-Suche: Multi-Quellen-Anzeige

Die bestehende ETF-Suchkomponente zeigt Ergebnisse mit Quell-Badge:

```
VWRL   Vanguard FTSE All World     GBP   [yFinance]
VWRL   Vanguard FTSE All World     GBP   [Stooq]
VWCE   Vanguard FTSE All World ACC EUR   [yFinance]
```

Bei Auswahl eines Stooq-Ergebnisses: ETF wird mit Stooq als primäre Quelle angelegt
(oder als zusätzliche Quelle falls der ETF schon besteht).

**Anpassung:** `src/lib/components/pension/ETFSearchInput.svelte`

### 6.3 ETF-Detailseite: Quell-Anzeige

In der ETF-Detail-Ansicht (wenn vorhanden) könnte eine neue Sektion zeigen,
welche Quellen Daten für diesen ETF liefern und was der letzte Abruf-Zeitpunkt war.

### 6.4 i18n-Keys (messages/de.json + en.json)

Neue Schlüssel:
```json
{
  "settings_data_sources_title": "Datenquellen",
  "settings_data_sources_description": "Verwalte Quellen für Kurs- und ETF-Daten",
  "data_source_enabled": "Aktiviert",
  "data_source_disabled": "Deaktiviert",
  "data_source_api_key": "API-Key",
  "data_source_priority": "Priorität",
  "data_source_test": "Verbindung testen",
  "data_source_test_success": "Verbindung erfolgreich",
  "data_source_test_failed": "Verbindung fehlgeschlagen",
  "data_source_no_key_required": "Kein API-Key erforderlich",
  "data_source_search_not_supported": "Keine Suche (Symbol wird automatisch abgeleitet)",
  "etf_search_source": "Quelle",
  "etf_source_symbol": "Symbol bei {source}"
}
```

---

## 7. Implementierungsreihenfolge

### Phase 1: Fundament (Backend)

1. **Alembic-Migration erstellen**
   - `source`-Spalte zu `etf_prices`
   - `data_source_configs`-Tabelle
   - `etf_source_symbols`-Tabelle
   - Bestehende `etf_prices` → `source = 'yfinance'`
   - Unique Constraint ändern

2. **SQLAlchemy-Models** (`app/models/data_source.py`)
   - `DataSourceConfig`
   - `ETFSourceSymbol`

3. **Pydantic-Schemas** (`app/schemas/data_source.py`)

4. **CRUD-Operationen** (`app/crud/data_source.py`)
   - `get_all_enabled()`, `get_by_id()`, `update()`
   - `get_source_symbol()`, `upsert_source_symbol()`

5. **DB-Base aktualisieren** (`app/db/base.py` — neues Model importieren)

6. **Initial-Daten beim App-Start** — yfinance + stooq als defaults in `startup.py`

### Phase 2: DataSource-Abstraktionsschicht

7. **DataSource-Interface** (`app/services/data_sources/base.py`)

8. **YFinanceDataSource** (`app/services/data_sources/yfinance_source.py`)
   - Bestehenden Code aus `services/yfinance.py` in neue Klasse migrieren

9. **StooqDataSource** (`app/services/data_sources/stooq_source.py`)
   - `pandas-datareader` installieren
   - Yahoo→Stooq Symbol-Mapping implementieren
   - Validierungslogik

10. **DataSourceRegistry** (`app/services/data_sources/registry.py`)

### Phase 3: ETF-Service Refactoring

11. **`etf_service.py` anpassen**
    - `update_etf_data()` / `update_latest_prices()` nutzen Registry
    - Symbol-Auflösung über `etf_source_symbols`
    - Multi-Quellen-Preis-Speicherung

12. **Such-Logik erweitern** (`endpoints/etf.py`)
    - Alle aktiven Quellen befragen
    - Symbol-Validierung für Such-unsupported Quellen
    - Response mit `source`-Attribut

13. **Neue API-Endpoints** (`endpoints/data_sources.py`)
    - CRUD für DataSourceConfig
    - Test-Endpoint

### Phase 4: Frontend

14. **API-Service** (`src/lib/api/data_sources.ts`)
    - TypeScript-Types für DataSourceConfig
    - API-Methoden

15. **Settings-Komponente** (`src/lib/components/settings/DataSourceSettings.svelte`)

16. **ETF-Suche aktualisieren** (`ETFSearchInput.svelte`)
    - Quell-Badge in Ergebnissen
    - Multi-Quellen-Handling

17. **i18n-Keys** + Paraglide kompilieren

18. **Settings-Seite** (`src/routes/settings/+page.svelte`) — neue Sektion einbinden

### Phase 5: Qualitätssicherung

19. **Backend-Tests** — DataSource-Adapter und Registry
20. **Manuelle Tests** — Stooq-Daten für bekannte ETFs prüfen
21. **Alembic Migration** auf Production-Schema anwenden

---

## 8. Offene Punkte & spätere Erweiterungen

### Jetzt offen
- **Stooq-Coverage prüfen:** Nicht alle europäischen ETFs sind auf Stooq verfügbar.
  Für ETFs ohne Stooq-Entsprechung: Quelle still überspringen, kein Fehler.
- **Konflikt-Strategie für Preise:** Wenn yFinance und Stooq am gleichen Tag
  verschiedene Close-Preise liefern — welcher wird für Projektionsberechnungen genutzt?
  Vorschlag: Priorität-basiert (konfiguriert über `priority`-Feld).
- **`pandas-datareader` Aktualität:** Die Library ist nicht sehr aktiv gepflegt.
  Stooq direkt via HTTP zu fetchen (ohne pandas-datareader) wäre robuster.

### Für später (nicht jetzt)
- **Tiingo-Adapter:** Hätte echte adjusted prices — wertvoll für ausschüttende ETFs
- **Symbol-Konflikt-UI:** In der ETF-Detailseite das Stooq-Symbol manuell
  korrigieren können
- **Quell-Gesundheits-Dashboard:** Anzeige welche Quellen gerade verfügbar sind
- **Preis-Divergenz-Warnungen:** Alert wenn yFinance und Stooq > 1% abweichen
- **Bulk-Import über Stooq:** Stooq bietet CSV-Bulk-Downloads — könnte als
  Alternative zu API-Calls für initiale Historien-Befüllung genutzt werden

---

## 9. Abhängigkeiten & Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| yFinance API bricht (Yahoo ändert Backend) | Mittel | Hoch | Stooq als Fallback aktiv |
| Stooq-Symbol für ETF nicht verfügbar | Mittel | Gering | Quelle wird still übersprungen |
| `pandas-datareader` veraltet | Niedrig | Mittel | Direkter HTTP-Call als Alternative |
| Rate Limits bei Stooq | Niedrig | Mittel | Retry-Logik, Backoff |
| Datenbank-Migration bricht bestehende Queries | Niedrig | Hoch | Unique-Constraint-Änderung sorgfältig testen |

**Neue Dependency:** `pandas-datareader` (+ `pandas` bereits vorhanden)

```bash
pip install pandas-datareader
```

---

## 10. Neue Datei-Map (nach Implementierung)

```
app/services/
  data_sources/
    __init__.py           # get_registry() exportieren
    base.py               # DataSourceBase, SearchResult, PriceData, ETFInfo
    registry.py           # DataSourceRegistry
    yfinance_source.py    # YFinanceDataSource
    stooq_source.py       # StooqDataSource
  etf_service.py          # Angepasst (nutzt Registry)
  yfinance.py             # Kann nach Migration entfernt werden

app/models/
  data_source.py          # DataSourceConfig, ETFSourceSymbol

app/schemas/
  data_source.py          # DataSourceConfigResponse, DataSourceUpdate

app/crud/
  data_source.py          # CRUD für Quellen + Source-Symbole

app/api/v1/endpoints/
  data_sources.py         # REST-Endpoints

src/frontend/src/
  lib/
    api/
      data_sources.ts     # API-Client für Datenquellen
    types/
      data_source.ts      # TypeScript-Typen
    components/
      settings/
        DataSourceSettings.svelte
      pension/
        ETFSearchInput.svelte  # Angepasst
```

---

*Quellen: [pandas-datareader Stooq Docs](https://pandas-datareader.readthedocs.io/en/latest/readers/stooq.html) | [QuantStart: Stooq Data](https://www.quantstart.com/articles/an-introduction-to-stooq-pricing-data/) | [yFinance alternatives 2025](https://medium.com/@craakash/how-to-get-stock-data-without-yfinance-code-examples-2025-edition-data-pipeline-b51f1ecc906d)*
