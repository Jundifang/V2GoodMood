import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Camera from '../views/Camera.vue';
import Database from '../views/Database.vue';
import test from '../views/test_socketio.vue';
import {defineComponent} from "vue";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/camera',
    name: 'Camera',
    component: Camera
  },
  {
    path: '/test',
    name: 'test1',
    component: test
  },
  {
    path: '/database',
    name: 'Database',
    component: Database
  }

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;