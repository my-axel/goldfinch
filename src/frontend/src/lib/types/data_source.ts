export interface DataSourceConfig {
  source_id: string;
  name: string;
  enabled: boolean;
  api_key?: string | null;
  priority: number;
  requires_api_key: boolean;
  supports_search: boolean;
  extra_config?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DataSourceConfigUpdate {
  enabled?: boolean;
  api_key?: string | null;
  priority?: number;
  extra_config?: Record<string, unknown> | null;
}

export interface DataSourcePriorityItem {
  source_id: string;
  priority: number;
}

export interface DataSourceTestResult {
  source_id: string;
  success: boolean;
  message: string;
  latency_ms?: number | null;
}

/** Extended ETF search result that includes the source annotation */
export interface ETFSearchResultWithSource {
  symbol: string;
  shortName?: string | null;
  longName?: string | null;
  currency?: string | null;
  isin?: string | null;
  exchange?: string | null;
  fund_family?: string | null;
  category?: string | null;
  source: string;
  source_name: string;
  symbol_derived?: boolean;
}
