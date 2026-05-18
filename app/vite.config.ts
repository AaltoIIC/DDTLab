import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/api/v1/catalog': {
				target: 'http://127.0.0.1:8001',
				changeOrigin: true
			},
			'/catalog-api': {
				target: 'http://127.0.0.1:8000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/catalog-api/, '')
			},
			'/oem-api': {
				target: 'http://127.0.0.1:5173',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/oem-api/, '')
			}
		}
	}
});
