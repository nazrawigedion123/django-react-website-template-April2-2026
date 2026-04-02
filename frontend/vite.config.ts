import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../public_html', // Build directly to public_html
        emptyOutDir: true,
    },
    base: '/', // important for Django routing
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8001',
                changeOrigin: true,
            },
        },
    },
})