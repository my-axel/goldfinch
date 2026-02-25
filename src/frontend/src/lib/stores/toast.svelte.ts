/**
 * @file src/lib/stores/toast.svelte.ts
 * @kind store
 * @purpose Verwaltet Toast-Nachrichten inkl. Queue, TTL-Ablauf und Entfernen einzelner Eintraege.
 */

type ToastType = 'success' | 'error';

interface ToastItem {
	id: number;
	message: string;
	type: ToastType;
}

class ToastStore {
	items = $state<ToastItem[]>([]);
	private nextId = 1;

	push(message: string, type: ToastType, ttlMs = 3000) {
		const id = this.nextId++;
		this.items = [...this.items, { id, message, type }];

		if (ttlMs > 0) {
			setTimeout(() => {
				this.remove(id);
			}, ttlMs);
		}
	}

	success(message: string, ttlMs?: number) {
		this.push(message, 'success', ttlMs);
	}

	error(message: string, ttlMs?: number) {
		this.push(message, 'error', ttlMs);
	}

	remove(id: number) {
		this.items = this.items.filter((toast) => toast.id !== id);
	}
}

export const toastStore = new ToastStore();
