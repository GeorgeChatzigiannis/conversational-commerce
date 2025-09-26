import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var baseUrl = (_b = env.VITE_CONVAI_API_URL) === null || _b === void 0 ? void 0 : _b.replace('/api/agents/copilotAgent/stream', '');
    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            port: 3000,
            host: true,
            proxy: {
                '/api': {
                    target: baseUrl,
                    changeOrigin: true,
                    secure: true,
                    headers: {
                        'Origin': baseUrl,
                    }
                }
            }
        }
    };
});
