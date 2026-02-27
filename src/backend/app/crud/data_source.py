from sqlalchemy.orm import Session
from datetime import datetime
from app.models.data_source import DataSourceConfig, ETFSourceSymbol
from app.schemas.data_source import DataSourceConfigUpdate


def get_all(db: Session) -> list[DataSourceConfig]:
    return db.query(DataSourceConfig).order_by(DataSourceConfig.priority).all()


def get_all_enabled(db: Session) -> list[DataSourceConfig]:
    return (
        db.query(DataSourceConfig)
        .filter(DataSourceConfig.enabled == True)
        .order_by(DataSourceConfig.priority)
        .all()
    )


def get_by_id(db: Session, source_id: str) -> DataSourceConfig | None:
    return db.query(DataSourceConfig).filter(DataSourceConfig.source_id == source_id).first()


def update(db: Session, source_id: str, obj_in: DataSourceConfigUpdate) -> DataSourceConfig | None:
    db_obj = get_by_id(db, source_id)
    if not db_obj:
        return None
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db_obj.updated_at = datetime.utcnow()
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_priorities(db: Session, priorities: list[dict]) -> list[DataSourceConfig]:
    """Bulk update priorities from a list of {source_id, priority} dicts."""
    updated = []
    for item in priorities:
        db_obj = get_by_id(db, item["source_id"])
        if db_obj:
            db_obj.priority = item["priority"]
            db_obj.updated_at = datetime.utcnow()
            db.add(db_obj)
            updated.append(db_obj)
    db.commit()
    for obj in updated:
        db.refresh(obj)
    return updated


def get_source_symbol(db: Session, etf_id: str, source_id: str) -> ETFSourceSymbol | None:
    return (
        db.query(ETFSourceSymbol)
        .filter(ETFSourceSymbol.etf_id == etf_id, ETFSourceSymbol.source_id == source_id)
        .first()
    )


def upsert_source_symbol(
    db: Session,
    etf_id: str,
    source_id: str,
    symbol: str,
    verified: bool = False,
) -> ETFSourceSymbol:
    existing = get_source_symbol(db, etf_id, source_id)
    if existing:
        existing.symbol = symbol
        existing.verified = verified
        if verified:
            existing.last_verified_at = datetime.utcnow()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    new_entry = ETFSourceSymbol(
        etf_id=etf_id,
        source_id=source_id,
        symbol=symbol,
        verified=verified,
        last_verified_at=datetime.utcnow() if verified else None,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


def get_all_source_symbols_for_etf(db: Session, etf_id: str) -> list[ETFSourceSymbol]:
    return (
        db.query(ETFSourceSymbol)
        .filter(ETFSourceSymbol.etf_id == etf_id)
        .all()
    )
