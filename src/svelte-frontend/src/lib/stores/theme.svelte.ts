import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
	let theme = $state<Theme>('system');

	// Read from localStorage on init
	if (browser) {
		const stored = localStorage.getItem('theme') as Theme | null;
		if (stored && ['light', 'dark', 'system'].includes(stored)) {
			theme = stored;
		}
		// Apply initial theme (use stored value directly to avoid $state warning)
		applyTheme(stored ?? 'system');
	}

	function applyTheme(t: Theme) {
		if (!browser) return;
		const root = document.documentElement;

		if (t === 'system') {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			root.classList.toggle('dark', prefersDark);
		} else {
			root.classList.toggle('dark', t === 'dark');
		}
	}

	// Listen for system theme changes
	if (browser) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (theme === 'system') applyTheme('system');
		});
	}

	return {
		get current() {
			return theme;
		},
		set(t: Theme) {
			theme = t;
			if (browser) {
				localStorage.setItem('theme', t);
			}
			applyTheme(t);
		}
	};
}

export const themeStore = createThemeStore();
