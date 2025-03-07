// src/api/socket.ts
import io from 'socket.io-client';

// 创建 Socket.IO 实例
const socket = io('http://localhost:5000', {
    transports: [ 'polling'] // 强制使用 WebSocket 协议
});

export default socket;
// export * from './types';
