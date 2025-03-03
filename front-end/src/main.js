import {createApp} from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import store from './store';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
// import { io } from 'socket.io-client';
// import { VueSocketIO } from 'vue-3-socket.io';

const pinia = createPinia();
// 创建应用实例
const app = createApp(App);
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

// 创建 socket.io 连接
// const socketConnection = io('http://localhost:5000');

// 使用 VueSocketIO


// 使用其他插件
app.use(store);
app.use(router);
app.use(ElementPlus);
app.use(pinia);
// app.use(
//     new VueSocketIO({
//         debug: true,
//         connection: socketConnection,
//     })
// );
// 挂载应用
app.mount('#app');
