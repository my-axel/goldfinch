import { api } from './client';
import type {
  DataSourceConfig,
  DataSourceConfigUpdate,
  DataSourcePriorityItem,
  DataSourceTestResult,
} from '$lib/types/data_source';

const BASE = '/api/v1/data-sources';

export const dataSourcesApi = {
  getAll: (): Promise<DataSourceConfig[]> =>
    api.get<DataSourceConfig[]>(BASE),

  update: (sourceId: string, data: DataSourceConfigUpdate): Promise<DataSourceConfig> =>
    api.put<DataSourceConfig>(`${BASE}/${sourceId}`, data),

  updatePriorities: (priorities: DataSourcePriorityItem[]): Promise<DataSourceConfig[]> =>
    api.put<DataSourceConfig[]>(`${BASE}/priorities/bulk`, { priorities }),

  test: (sourceId: string): Promise<DataSourceTestResult> =>
    api.get<DataSourceTestResult>(`${BASE}/${sourceId}/test`),
};
