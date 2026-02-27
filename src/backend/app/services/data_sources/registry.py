from sqlalchemy.orm import Session
from .base import DataSourceBase
from .yfinance_source import YFinanceDataSource
from .stooq_source import StooqDataSource

import logging

logger = logging.getLogger(__name__)


class DataSourceRegistry:
    """
    Manages available data sources. Sources are registered at startup and
    activated/deactivated based on the data_source_configs table.
    """

    def __init__(self):
        self._sources: dict[str, DataSourceBase] = {}
        self._register_builtins()

    def _register_builtins(self):
        self.register(YFinanceDataSource())
        self.register(StooqDataSource())

    def register(self, source: DataSourceBase):
        self._sources[source.source_id] = source
        logger.debug(f"Registered data source: {source.source_id}")

    def get_active_sources(self, db: Session) -> list[DataSourceBase]:
        """Return all enabled sources, ordered by priority (lowest number = highest priority)."""
        from app.crud.data_source import get_all_enabled
        configs = get_all_enabled(db)
        result = []
        for config in configs:
            if config.source_id in self._sources:
                source = self._sources[config.source_id]
                # Pass API key if configured
                if config.api_key and hasattr(source, "configure"):
                    source.configure(api_key=config.api_key)
                result.append(source)
            else:
                logger.warning(f"Configured source '{config.source_id}' has no registered adapter")
        return result

    def get_source(self, source_id: str) -> DataSourceBase | None:
        return self._sources.get(source_id)

    def get_all_registered(self) -> list[DataSourceBase]:
        return list(self._sources.values())

    def configure_source(self, source_id: str, api_key: str):
        """Pass an API key to a registered source (for Tier-2 sources like Tiingo)."""
        source = self._sources.get(source_id)
        if source and hasattr(source, "configure"):
            source.configure(api_key=api_key)


# --- Singleton ---

_registry: DataSourceRegistry | None = None


def get_registry() -> DataSourceRegistry:
    global _registry
    if _registry is None:
        _registry = DataSourceRegistry()
    return _registry
