from typing import Optional
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.update_tracking import DailyUpdateTracking

def get_or_create_tracking(
    db: Session,
    update_date: date,
    update_type: str,
) -> DailyUpdateTracking:
    """Get or create a tracking record for the given date and type."""
    tracking = db.query(DailyUpdateTracking).filter(
        DailyUpdateTracking.date == update_date,
        DailyUpdateTracking.update_type == update_type
    ).first()
    
    if not tracking:
        tracking = DailyUpdateTracking(
            date=update_date,
            update_type=update_type,
            attempted=False,
            data_found=False
        )
        db.add(tracking)
        db.commit()
        db.refresh(tracking)
    
    return tracking

def mark_update_attempted(
    db: Session,
    tracking: DailyUpdateTracking,
    data_found: bool = False,
    notes: Optional[str] = None
) -> DailyUpdateTracking:
    """Mark an update as attempted and optionally successful."""
    tracking.attempted = True
    tracking.data_found = data_found
    if notes:
        tracking.notes = notes
    db.commit()
    db.refresh(tracking)
    return tracking

def should_attempt_update(
    db: Session,
    update_type: str,
    latest_data_date: date,
) -> bool:
    """
    Determine if we should attempt an update based on:
    1. Whether we've already attempted today
    2. Whether it's a weekend
    3. The gap between latest data and today
    """
    today = date.today()
    
    # Check if we already attempted today
    today_tracking = db.query(DailyUpdateTracking).filter(
        DailyUpdateTracking.date == today,
        DailyUpdateTracking.update_type == update_type
    ).first()
    
    if today_tracking and today_tracking.attempted:
        return False
    
    # If it's a weekend, only update if data is more than 3 days old
    if today.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
        days_old = (today - latest_data_date).days
        return days_old > 3
    
    # On weekdays, update if data is not from today
    return latest_data_date < today

def cleanup_old_tracking(db: Session, days_to_keep: int = 30) -> None:
    """Clean up tracking records older than the specified number of days."""
    cutoff_date = date.today() - timedelta(days=days_to_keep)
    db.query(DailyUpdateTracking).filter(
        DailyUpdateTracking.date < cutoff_date
    ).delete()
    db.commit() 