import { pensionApi } from '$lib/api/pension';
import type { PensionListItem, PensionStatusUpdate } from '$lib/types/pension';
import { type PensionType } from '$lib/types/pension';

class PensionStore {
	pensions = $state<PensionListItem[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async load(memberId?: number) {
		this.loading = true;
		this.error = null;
		try {
			this.pensions = await pensionApi.listAll(memberId);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load pensions';
			this.pensions = [];
		} finally {
			this.loading = false;
		}
	}

	async deletePension(type: PensionType, id: number) {
		await pensionApi.delete(type, id);
		this.pensions = this.pensions.filter((p) => !(p.id === id && p.type === type));
	}

	async updateStatus(type: PensionType, id: number, data: PensionStatusUpdate) {
		await pensionApi.updateStatus(type, id, data);
		await this.load();
	}
}

export const pensionStore = new PensionStore();
