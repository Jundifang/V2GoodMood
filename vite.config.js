import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import vue from '@vitejs/plugin-vue'


// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            // '@': '/src' // 将 @ 指向 src 目录
        }
    },

    devServer: {
        port: 5000,
        allowedHosts: 'all',

        proxy: {
            '/': {
                ws: true, // 这里把ws代理给关闭
                target: 'ws://127.0.0.1:5000',
                changeOrigin: true
            },
            'api':{
                target: 'http://127.0.0.1:5000',
                changeOrigin: true
            }
        },

        // webSocketServer: false,  // !!!!! 关键
    }
});