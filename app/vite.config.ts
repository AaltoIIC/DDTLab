import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const oemInterfaceTarget = env.OEM_INTERFACE_PROXY_TARGET || 'http://127.0.0.1:5174';

	return {
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
					target: oemInterfaceTarget,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/oem-api/, '')
				}
			}
		}
	};
});
