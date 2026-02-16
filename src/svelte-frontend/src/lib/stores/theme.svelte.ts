import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

class ThemeStore {
	current = $state<Theme>('system');

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('theme') as Theme | null;
			if (stored && ['light', 'dark', 'system'].includes(stored)) {
				this.current = stored;
			}
			this.applyTheme(this.current);

			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (this.current === 'system') this.applyTheme('system');
			});
		}
	}

	applyTheme(t: Theme) {
		if (!browser) return;
		const root = document.documentElement;
		if (t === 'system') {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			root.classList.toggle('dark', prefersDark);
		} else {
			root.classList.toggle('dark', t === 'dark');
		}
	}

	set(t: Theme) {
		this.current = t;
		if (browser) {
			localStorage.setItem('theme', t);
		}
		this.applyTheme(t);
	}
}

export const themeStore = new ThemeStore();
