# Savings Pension – Contribution History nachrüsten

## Problem

Die Savings Pension hat einen Beitragsplan (`contribution_plan_steps`), aber **keine Beitragshistorie**. Im Vergleich:

| Pension-Typ | Beitragsplan | Beitragshistorie |
|---|---|---|
| Company | ✅ | ✅ |
| Insurance | ✅ | ✅ |
| ETF | ✅ | ✅ |
| **Savings** | **✅** | **❌ fehlt** |
| State | ❌ | ❌ |

Die `pension_savings_contribution_history`-Tabelle fehlt in der Datenbank – ein Versehen bei der Erstimplementierung der Savings-Modelle (Migration `7b8787db1216`). Das `ContributionHistoryCard`-Frontend-Component ist bereits vorhanden und muss nur eingebunden werden.

---

## Implementierung

### 1. Backend – Model (`src/backend/app/models/pension_savings.py`)

Neue Klasse `PensionSavingsContributionHistory` analog zu `PensionCompanyContributionHistory` in `pension_company.py:49`:

```python
from sqlalchemy import Boolean  # zu bestehenden Imports hinzufügen

class PensionSavingsContributionHistory(Base):
    __tablename__ = "pension_savings_contribution_history"

    id = Column(Integer, primary_key=True, index=True)
    pension_savings_id = Column(Integer, ForeignKey("pension_savings.id", ondelete="CASCADE"), nullable=False, index=True)
    contribution_date = Column(Date, nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    is_manual = Column(Boolean, nullable=False, default=False)
    note = Column(String, nullable=True)

    pension = relationship("PensionSavings", back_populates="contribution_history")
```

In `PensionSavings` neue Relationship:
```python
contribution_history = relationship(
    "PensionSavingsContributionHistory",
    back_populates="pension",
    cascade="all, delete-orphan"
)
```

### 2. Backend – Schema (`src/backend/app/schemas/pension_savings.py`)

Neue Schemas (nach dem Import-Block einfügen):
```python
class ContributionHistoryCreate(BaseModel):
    contribution_date: date
    amount: Decimal = Field(ge=0)
    is_manual: bool = False
    note: Optional[str] = None

class ContributionHistoryResponse(ContributionHistoryCreate):
    id: int
    pension_savings_id: int
    model_config = ConfigDict(from_attributes=True)
```

`PensionSavingsResponse` erweitern:
```python
class PensionSavingsResponse(PensionSavingsBase):
    id: int
    contribution_plan_steps: List[ContributionPlanStepResponse]
    statements: List[PensionSavingsStatementResponse]
    contribution_history: List[ContributionHistoryResponse] = []  # NEU
    model_config = ConfigDict(from_attributes=True)
```

### 3. Backend – CRUD (`src/backend/app/crud/pension_savings.py`)

Imports erweitern:
```python
from app.models.pension_savings import (
    PensionSavings, PensionSavingsStatement,
    PensionSavingsContributionPlanStep,
    PensionSavingsContributionHistory  # NEU
)
from app.schemas.pension_savings import (
    ...,
    ContributionHistoryCreate  # NEU
)
```

Neue Methode in `CRUDPensionSavings`:
```python
def create_contribution_history(
    self,
    db: Session,
    *,
    pension_id: int,
    obj_in: ContributionHistoryCreate
) -> PensionSavingsContributionHistory:
    db_obj = PensionSavingsContributionHistory(
        **obj_in.model_dump(),
        pension_savings_id=pension_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
```

> **Hinweis**: Kein `current_value`-Update nötig – Savings Pension hat dieses Feld nicht.

### 4. Backend – Endpoint (`src/backend/app/api/v1/endpoints/pension/savings.py`)

Import ergänzen:
```python
from app.schemas.pension_savings import (
    ...,
    ContributionHistoryCreate,
    ContributionHistoryResponse
)
```

Neuer Endpoint (z.B. nach dem `delete`-Endpoint):
```python
@router.post(
    "/{id}/contribution-history",
    response_model=ContributionHistoryResponse,
    status_code=status.HTTP_201_CREATED
)
def create_savings_contribution_history(
    contribution_in: ContributionHistoryCreate,
    id: int = Path(...),
    db: Session = Depends(get_db)
):
    """Record a contribution history entry for a savings pension."""
    pension = pension_savings.get(db=db, id=id)
    if not pension:
        raise HTTPException(status_code=404, detail=f"Savings pension {id} not found")
    return pension_savings.create_contribution_history(
        db=db, pension_id=id, obj_in=contribution_in
    )
```

### 5. Alembic Migration

```bash
cd src/backend
source venv/bin/activate
alembic revision --autogenerate -m "add pension savings contribution history"
# Generierte Datei in alembic/versions/ prüfen, dann:
alembic upgrade head
```

Die autogenerierte Migration sollte eine `CREATE TABLE pension_savings_contribution_history`-Operation enthalten.

### 6. Frontend – TypeScript-Typ (`src/svelte-frontend/src/lib/types/pension.ts`)

`SavingsPension`-Interface erweitern:
```typescript
export interface SavingsPension {
    // ... bestehende Felder ...
    contribution_plan_steps: ContributionStep[];
    contribution_history?: ExtraContribution[];  // NEU
    statements?: SavingsPensionStatement[];
}
```

### 7. Frontend – Edit-Page (`src/svelte-frontend/src/routes/pension/savings/[id]/edit/+page.svelte`)

Import hinzufügen:
```typescript
import ContributionHistoryCard from '$lib/components/pension/ContributionHistoryCard.svelte';
```

Neue Section nach `</form>`, vor `{/if}`:
```svelte
<!-- Contribution History Section (read-only, outside form) -->
<ContentSection>
    {#snippet aside()}
        <Explanation>
            <p>{m.contribution_history_explanation()}</p>
        </Explanation>
    {/snippet}
    <ContributionHistoryCard contributions={pension.contribution_history ?? []} />
</ContentSection>
```

---

## Verifikation

1. Migration ausführen, Backend starten
2. `GET /api/v1/pension/savings/{id}` → Response enthält `"contribution_history": []`
3. `POST /api/v1/pension/savings/{id}/contribution-history` mit Body:
   ```json
   { "contribution_date": "2025-01-01", "amount": 100.00, "note": "Test" }
   ```
   → 201 Created
4. Erneuter `GET` → `contribution_history` enthält den neuen Eintrag
5. Svelte-Frontend: Savings-Pension öffnen → `ContributionHistoryCard` erscheint
