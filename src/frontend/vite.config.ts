/**
 * @file vite.config.ts
 * @kind config
 * @purpose Konfiguriert Vite-Plugins, Paraglide-Generierung und SSR-Einstellungen fuer das Svelte-Frontend.
 */

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'globalVariable', 'baseLocale']
		})
	],
	ssr: {
		noExternal: ['@lucide/svelte']
	}
});
